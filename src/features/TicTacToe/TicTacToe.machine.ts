import { createMachine, assign, spawn, Interpreter, State } from 'xstate';

import { createTicTacToeActor } from './TicTacToe.actor';
import {
  TTT_ACTOR_EVENT_TYPE as Msg,
  PLAYER_TYPE,
  PlayerContext,
  FieldContext,
  FIELD_INITIAL,
  PLAYER_SYMBOL,
  TicTacToeEvents,
  TTT_EVENT_TYPE as E,
  PLAYER_NUM,
  TicTacToeContext,
  FIELD,
  TTT_DELAY_OPTIONS,
} from './TicTacToe.common';

import { TicTacToeState, TTT_STATE as S, TTT_ACTION as A, TTT_GUARD as G } from './TicTacToe.machine.types';

const initialContext: TicTacToeContext = {
  actorTransitionDelay: TTT_DELAY_OPTIONS.default,
  opponents: {
    [PLAYER_NUM.player1]: { type: PLAYER_TYPE.user, symbol: PLAYER_SYMBOL.x },
    [PLAYER_NUM.player2]: { type: PLAYER_TYPE.user, symbol: PLAYER_SYMBOL.o },
  },
  turnOrder: {
    current: PLAYER_NUM.player1,
    turnsMade: 0,
  },
  field: FIELD_INITIAL,
  winCombo: null,
  surrendered: null,
};

export type TicTacToeMachineSend = Interpreter<TicTacToeContext, never, TicTacToeEvents, TicTacToeState>['send'];

export type TicTacToeMachineState = State<TicTacToeContext, TicTacToeEvents, never, TicTacToeState>;

/**
 * This machine defines major states of the game
 */
export const TicTacToeMachine = createMachine<TicTacToeContext, TicTacToeEvents, TicTacToeState>(
  {
    context: initialContext,
    initial: S.settingUp,
    states: {
      /**
       * We need to setup the game: set players; decide turn-order
       */
      [S.settingUp]: {
        on: {
          [E.changePlayerReq]: { actions: [A.setPlayer] },
          [E.changeTurnOrderReq]: { actions: [A.setTurnOrder] },
          [E.changeTransitionDelayReq]: { actions: [A.setTransitionDelay] },
          [E.continueReq]: {
            target: S.playing,
          },
        },
      },
      /**
       * While playing we will:
       */
      [S.playing]: {
        initial: S.playingTakingTurn,
        states: {
          /**
           * - wait for their turn
           * - accept or force to turn again
           */
          [S.playingTakingTurn]: {
            entry: A.awaitTurn,
            on: {
              [E.acceptTurnReq]: [
                {
                  target: S.playingCheckingGameState,
                  actions: [A.saveTurn, A.switchTurn],
                  cond: G.verifyTurn,
                },
                {
                  target: S.playingCheckingGameState,
                },
              ],
              [E.giveUpReq]: {
                target: `#${S.showingGameEndResults}`,
                actions: [A.saveSurrender],
              },
            },
          },
          /**
           * - decide if the game has ended
           * - or ask other player to move
           */
          [S.playingCheckingGameState]: {
            entry: A.tryGameEnd,
            always: [
              {
                target: `#${S.showingGameEndResults}`,
                cond: G.verifyGameEnd,
              },
              {
                target: S.playingTakingTurn,
              },
            ],
          },
        },
      },
      /**
       * We need to show the results
       * - we should ask if players want to retry
       */
      [S.showingGameEndResults]: {
        id: S.showingGameEndResults,
        on: {
          [E.retryReq]: {
            target: S.playing,
            actions: [A.revertContextButOpponents],
          },
          [E.setUpNewGame]: {
            target: S.settingUp,
            actions: [A.revertContextToInitial],
          },
        },
      },
    },
  },
  {
    guards: {
      [G.verifyTurn]: ({ field }, event) => {
        if (event.type === E.acceptTurnReq) {
          return field[event.index] === null;
        }
        return false;
      },
      [G.verifyGameEnd]: ({ winCombo, surrendered, turnOrder }) => {
        return Boolean(winCombo || surrendered) || turnOrder.turnsMade === 9;
      },
    },
    actions: {
      /**
       * Reverting context to initial
       */
      [A.revertContextToInitial]: assign({ ...initialContext }),
      [A.revertContextButOpponents]: assign((ctx) => ({
        ...initialContext,
        opponents: ctx.opponents,
        actorTransitionDelay: ctx.actorTransitionDelay,
      })),

      /**
       * Setting a player to be controlled by a user or an agent
       */
      [A.setPlayer]: assign({
        opponents: (ctx, event) => {
          if (event.type === E.changePlayerReq) {
            // stop old agent if exists
            const currentPlayerInfo: PlayerContext = ctx.opponents[event.kind];
            if (currentPlayerInfo.type === PLAYER_TYPE.agent) {
              currentPlayerInfo.ref.stop?.();
            }

            // spawn a new one if needed
            const newPlayerSymbol = (() => {
              if (event.kind === PLAYER_NUM.player1) {
                const player1Symbol: TicTacToeContext['opponents']['player1']['symbol'] = PLAYER_SYMBOL.x;
                return player1Symbol;
              }

              const player2Symbol: TicTacToeContext['opponents']['player2']['symbol'] = PLAYER_SYMBOL.o;
              return player2Symbol;
            })();

            const newPlayerInfo: TicTacToeContext['opponents']['player1'] | TicTacToeContext['opponents']['player2'] =
              event.value === PLAYER_TYPE.user
                ? {
                    type: PLAYER_TYPE.user,
                    symbol: newPlayerSymbol,
                  }
                : {
                    type: PLAYER_TYPE.agent,
                    ref: spawn(createTicTacToeActor(newPlayerSymbol), { name: event.kind }),
                    symbol: newPlayerSymbol,
                  };

            return {
              ...ctx.opponents,
              [event.kind]: newPlayerInfo,
            };
          }

          return ctx.opponents;
        },
      }),

      /**
       * Setting who plays on the current turn
       */
      [A.setTurnOrder]: assign({
        turnOrder: (ctx, event) => {
          if (event.type === E.changeTurnOrderReq) {
            return {
              ...ctx.turnOrder,
              current: event.first,
            };
          }

          return ctx.turnOrder;
        },
      }),

      /**
       * Setting a transition delay for actors
       */
      [A.setTransitionDelay]: assign({
        actorTransitionDelay: (ctx, event) => {
          if (event.type === E.changeTransitionDelayReq) {
            return event.delay;
          }

          return ctx.actorTransitionDelay;
        },
      }),

      /**
       * Sending a message to an agent or waiting for a user to move
       */
      [A.awaitTurn]: (ctx) => {
        const player = ctx.opponents[ctx.turnOrder.current];
        if (player.type === PLAYER_TYPE.agent) {
          player.ref.send({
            type: Msg.makeTurnReq,
            field: ctx.field,
            player: ctx.turnOrder.current,
            transitionDelay: ctx.actorTransitionDelay,
          });
        } else {
          // just waiting for a user to make their move
        }
      },

      /**
       * Saving current turn to context
       */
      [A.saveTurn]: assign({
        field: (ctx, event) => {
          if (event.type === E.acceptTurnReq) {
            const newField: FieldContext = [...ctx.field];
            const newSymbol = ctx.opponents[event.sender].symbol;
            newField[event.index] = newSymbol;
            return newField;
          }

          return ctx.field;
        },
      }),

      /**
       * Saving surrender signal when player throws a game
       */
      [A.saveSurrender]: assign({
        surrendered: (ctx) => {
          return ctx.turnOrder.current;
        },
      }),

      [A.tryGameEnd]: assign({
        winCombo: ({ field, winCombo }) => {
          const someCombo = FIELD.combinations.find((combination) => {
            const [a, b, c] = combination;
            if (field[a] && field[a] === field[b] && field[a] === field[c]) {
              return true;
            }
            return false;
          });

          const hasFreeSpace = field.some((cellValue) => cellValue === null);
          if (someCombo || !hasFreeSpace) {
            return someCombo as TicTacToeContext['winCombo'];
          }
          return winCombo;
        },
      }),

      /**
       * Switch to other player
       */
      [A.switchTurn]: assign({
        turnOrder: (ctx) => ({
          ...ctx.turnOrder,
          current: ctx.turnOrder.current === PLAYER_NUM.player1 ? PLAYER_NUM.player2 : PLAYER_NUM.player1,
          turnsMade: ctx.turnOrder.turnsMade + 1,
        }),
      }),
    },
  },
);

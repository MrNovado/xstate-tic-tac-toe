import { createMachine, assign, spawn } from 'xstate';

import { createTicTacToeActor } from './TicTacToe.actor';
import {
  TicTacToeActorEventTypes as Msg,
  PLAYER_TYPE,
  PlayerContext,
  FieldContext,
  FIELD_INITIAL,
  PLAYER_SYMBOL,
  TicTacToeEvents,
  TicTacToeEventTypes as E,
  PLAYER_NUM,
  TicTacToeContext,
  FIELD,
} from './TicTacToe.common';

import {
  TicTacToeState,
  TicTacToeStateNodes as S,
  TicTacToeMachineActions as A,
  TicTacToeMachineConditions as C,
} from './TicTacToe.machine.types';

const initialContext: TicTacToeContext = {
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
          [E.CHANGE_PLAYER_REQ]: { actions: [A.setPlayer] },
          [E.CHANGE_TURN_ORDER_REQ]: { actions: [A.setTurnOrder] },
          [E.CONTINUE_REQ]: {
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
              [E.ACCEPT_TURN_REQ]: [
                {
                  target: S.playingCheckingGameState,
                  actions: [A.saveTurn, A.switchTurn],
                  cond: C.verifyTurn,
                },
                {
                  target: S.playingCheckingGameState,
                },
              ],
              [E.GIVE_UP_TURN_REQ]: {
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
            always: [
              {
                target: `#${S.showingGameEndResults}`,
                cond: C.verifyGameEnd,
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
        entry: A.saveGameResults,
        on: {
          [E.RETRY_REQ]: {
            target: S.settingUp,
            actions: [A.revertContextToInitial],
          },
        },
      },
    },
  },
  {
    guards: {
      [C.verifyTurn]: ({ field }, event) => {
        if (event.type === E.ACCEPT_TURN_REQ) {
          return field[event.index] === null;
        }
        return false;
      },
      [C.verifyGameEnd]: ({ field }) => {
        const someCombo = FIELD.COMBINATIONS.find((combination) => {
          const [a, b, c] = combination;
          if (field[a] && field[a] === field[b] && field[a] === field[c]) {
            return true;
          }
          return false;
        });

        const hasFreeSpace = field.some((cellValue) => cellValue === null);
        if (someCombo || !hasFreeSpace) {
          return true;
        }
        return false;
      },
    },
    actions: {
      /**
       * Reverting context to initial
       */
      [A.revertContextToInitial]: assign({ ...initialContext }),

      /**
       * Setting a player to be controlled by a user or an agent
       */
      [A.setPlayer]: assign({
        opponents: (ctx, event) => {
          if (event.type === E.CHANGE_PLAYER_REQ) {
            // stop old agent if exists
            const currentPlayerInfo: PlayerContext = ctx.opponents[event.kind];
            if (currentPlayerInfo.type === PLAYER_TYPE.agent) {
              currentPlayerInfo.ref.stop?.();
            }

            // spawn a new one if needed
            const newPlayerSymbol = event.kind === PLAYER_NUM.player1 ? PLAYER_SYMBOL.x : PLAYER_SYMBOL.o;
            // TODO: simplify and incap this logic
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
          if (event.type === E.CHANGE_TURN_ORDER_REQ) {
            return {
              ...ctx.turnOrder,
              current: event.first,
            };
          }

          return ctx.turnOrder;
        },
      }),

      /**
       * Sending a message to an agent or waiting for a user to move
       */
      [A.awaitTurn]: (ctx) => {
        const player = ctx.opponents[ctx.turnOrder.current];
        if (player.type === PLAYER_TYPE.agent) {
          player.ref.send({
            type: Msg.MAKE_TURN_REQ,
            field: ctx.field,
            player: ctx.turnOrder.current,
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
          if (event.type === E.ACCEPT_TURN_REQ) {
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

      [A.saveGameResults]: assign({
        winCombo: ({ field, winCombo }) => {
          const someCombo = FIELD.COMBINATIONS.find((combination) => {
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

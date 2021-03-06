import { createMachine, assign, spawn } from 'xstate';

import { createTicTacToeActor, TicTacToeActorEventTypes as Msg } from './TicTacToe.actor';

import {
  PlayerContext,
  FieldContext,
  TicTacToeContext,
  TicTacToeEvents,
  TicTacToeState,
  TicTacToeEventTypes as E,
  TicTacToeStateNodes as S,
  TicTacToeMachineActions as A,
  TicTacToeMachineConditions as C,
} from './TicTacToe.machine.types';

const initialContext: TicTacToeContext = {
  opponents: {
    player1: { type: 'user' },
    player2: { type: 'user' },
  },
  turnOrder: {
    X: 'player1',
    current: 'player1',
    turnsMade: 0,
  },
  field: [null, null, null, null, null, null, null, null, null],
  winCombo: null,
};

/**
 * This machine defines major states of the game
 */
export const TicTacToeMachine = createMachine<TicTacToeContext, TicTacToeEvents, TicTacToeState>(
  {
    context: initialContext,
    initial: S.selectingOpponents,
    states: {
      /**
       * We need to select whos going to play: agents or users
       */
      [S.selectingOpponents]: {
        on: {
          [E.CHANGE_PLAYER_REQ]: A.setPlayer,
          [E.CONTINUE_REQ]: {
            target: S.decidingWhosGoingFirst,
          },
        },
      },
      /**
       * We need to decide whos going to move first
       */
      [S.decidingWhosGoingFirst]: {
        on: {
          [E.CHANGE_TURN_ORDER_REQ]: A.setTurnOrder,
          [E.CONTINUE_REQ]: {
            target: S.playing,
          },
        },
      },
      /**
       * While playing we will:
       */
      [S.playing]: {
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
            },
          },
          /**
           * - decide if the game has ended
           * - or ask other player to move
           */
          [S.playingCheckingGameState]: {
            on: {
              '': [
                {
                  target: S.showingGameEndResults,
                  cond: C.verifyGameEnd,
                },
                {
                  target: S.playingTakingTurn,
                },
              ],
            },
          },
        },
      },
      /**
       * We need to show the results
       * - we should ask if players want to retry
       */
      [S.showingGameEndResults]: {
        on: {
          [E.RETRY_REQ]: {
            target: S.selectingOpponents,
            actions: [A.revertContextToInitial],
          },
        },
      },
    },
  },
  {
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
            if (currentPlayerInfo.type === 'agent') {
              currentPlayerInfo.ref.stop?.();
            }

            // spawn a new one if needed
            const newPlayerSymbol = ctx.turnOrder.X === event.kind ? 'x' : '0';
            const newPlayerInfo: PlayerContext =
              event.value === 'user'
                ? {
                    type: 'user',
                  }
                : {
                    type: 'agent',
                    ref: spawn(createTicTacToeActor(newPlayerSymbol), { name: event.kind }),
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
        if (player.type === 'agent') {
          player.ref.send({
            // TODO: pass field state
            type: Msg.MAKE_TURN_REQ,
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
            const symbol = ctx.turnOrder.X === ctx.turnOrder.current ? 'x' : '0';
            newField[event.index] = symbol;
            return newField;
          }

          return ctx.field;
        },
      }),

      /**
       * Switch to other player
       */
      [A.switchTurn]: assign({
        turnOrder: (ctx) => ({
          ...ctx.turnOrder,
          current: ctx.turnOrder.current === 'player1' ? 'player2' : 'player1',
          turnsMade: ctx.turnOrder.turnsMade + 1,
        }),
      }),
    },
  },
);

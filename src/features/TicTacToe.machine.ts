import { createMachine, assign, spawn } from 'xstate';

import { TicTacToeActor } from './TicTacToe.actor';

import {
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
      [S.selectingOpponents]: {
        on: {
          [E.CHANGE_PLAYER_REQ]: A.setPlayer,
          [E.CONTINUE_REQ]: {
            target: S.decidingWhosGoingFirst,
          },
        },
      },
      [S.decidingWhosGoingFirst]: {
        on: {
          [E.CHANGE_TURN_ORDER_REQ]: A.setTurnOrder,
          [E.CONTINUE_REQ]: {
            target: S.playing,
          },
        },
      },
      [S.playing]: {
        states: {
          [S.playingTakingTurn]: {
            entry: A.giveTurn,
            on: {
              [E.ACCEPT_TURN_REQ]: [
                {
                  target: S.playingCheckingGameState,
                  actions: [A.saveTurn],
                  cond: C.verifyTurn,
                },
                {
                  target: S.playingCheckingGameState,
                },
              ],
            },
          },
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
      [S.showingGameEndResults]: {
        on: {
          [E.RETRY_REQ]: {
            target: S.selectingOpponents,
            actions: [A.revertContextToInitial],
          },
        },
      },
      [S.somethingWentWrong]: {
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
      [A.revertContextToInitial]: assign({ ...initialContext }),
      [A.setPlayer]: assign({
        opponents: (ctx, event) => {
          if (event.type === E.CHANGE_PLAYER_REQ) {
            return {
              ...ctx.opponents,
              [event.kind]:
                event.value === 'user'
                  ? {
                      type: 'user',
                    }
                  : {
                      type: 'agent',
                      // TODO: despawn!
                      ref: spawn(TicTacToeActor, { name: event.kind }),
                    },
            };
          }

          return ctx.opponents;
        },
      }),
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
      [A.giveTurn]: assign({}),
      [A.saveTurn]: assign({}),
    },
  },
);

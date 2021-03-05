import { createMachine } from 'xstate';

import {
  TicTacToeContext,
  TicTacToeEvents,
  TicTacToeState,
  TicTacToeEventTypes as E,
  TicTacToeStateNodes as S,
  TicTacToeMachineActions as A,
  TicTacToeMachineConditions as C,
} from './TicTacToe.machine.types';

/**
 * This machine defines major states of the game
 */
export const TicTacToeMachine = createMachine<TicTacToeContext, TicTacToeEvents, TicTacToeState>({
  context: {
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
  },
  initial: S.selectingOpponents,
  states: {
    [S.selectingOpponents]: {
      on: {
        [E.SELECT_PLAYER_1]: A.setPlayer1,
        [E.SELECT_PLAYER_2]: A.setPlayer2,
        [E.NEXT]: {
          target: S.decidingWhosGoingFirst,
          actions: [A.createPlayers],
        },
      },
    },
    [S.decidingWhosGoingFirst]: {
      on: {
        [E.SET_TURN_PLAYER_1]: A.setTurnPlayer1,
        [E.SET_TURN_PLAYER_2]: A.setTurnPlayer2,
        [E.NEXT]: {
          target: S.playing,
        },
      },
    },
    [S.playing]: {
      states: {
        [S.playingTakingTurn]: {
          entry: A.giveTurn,
          on: {
            [E.MAKE_TURN]: [
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
        [E.RETRY]: {
          target: S.selectingOpponents,
          actions: [A.initContext],
        },
      },
    },
    [S.somethingWentWrong]: {
      on: {
        [E.RETRY]: {
          target: S.selectingOpponents,
          actions: [A.initContext],
        },
      },
    },
  },
});

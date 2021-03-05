import { createMachine, ActorRef } from 'xstate';

import { TicTacToeActorEvents, TicTacToeActorMessages } from './TicTacToe.actor';

type PlayerContext = { type: 'user' } | { type: 'agent'; ref: ActorRef<TicTacToeActorEvents, TicTacToeActorMessages> };
type PlayerTurnContext = 'player1' | 'player2';

type FieldCellValue = 'x' | '0' | null;
type FieldCellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// strictly 9 cells
type FieldContext = [
  FieldCellValue,
  FieldCellValue,
  FieldCellValue,
  FieldCellValue,
  FieldCellValue,
  FieldCellValue,
  FieldCellValue,
  FieldCellValue,
  FieldCellValue,
];

type TicTacToeContext = {
  opponents: {
    player1: PlayerContext;
    player2: PlayerContext;
  };

  turnOrder: {
    X: PlayerTurnContext;
    current: PlayerTurnContext;
    turnsMade: number;
  };

  field: FieldContext;

  // strictly 3 unique indexes;
  // we cannot enforce this with types,
  // because uniqueness is decided at runtime,
  // but we can signal our intent
  winCombo: Set<[FieldCellIndex, FieldCellIndex, FieldCellIndex]> | null;
};

const TicTacToeEventTypes = {
  SELECT_PLAYER_1: 'SELECT_PLAYER_1',
  SELECT_PLAYER_2: 'SELECT_PLAYER_2',

  NEXT: 'NEXT',

  SET_TURN_PLAYER_1: 'SET_TURN_PLAYER_1',
  SET_TURN_PLAYER_2: 'SET_TURN_PLAYER_2',

  MAKE_TURN: 'MAKE_TURN',

  RETRY: 'RETRY',
} as const;

// short-hand helper
const E = TicTacToeEventTypes;

type TicTacToeEvents =
  | { type: typeof E.SELECT_PLAYER_1 }
  | { type: typeof E.SELECT_PLAYER_2 }
  | { type: typeof E.NEXT }
  | { type: typeof E.SET_TURN_PLAYER_1 }
  | { type: typeof E.SET_TURN_PLAYER_2 }
  | { type: typeof E.MAKE_TURN; index: FieldCellIndex }
  | { type: typeof E.RETRY };

const TicTacToeStateNodes = {
  selectingOpponents: '@/selectingOpponents',
  decidingWhosGoingFirst: '@/decidingWhosGoingFirst',
  playing: '@/playing',
  playingTakingTurn: '@/playing/takingTurn',
  playingCheckingGameState: '@/playing/checkingGameState',
  showingGameEndResults: '@/showingGameEndResults',
  somethingWentWrong: '@/somethingWentWrong',
} as const;

// short-hand helper
const S = TicTacToeStateNodes;

type TicTacToeState = {
  context: TicTacToeContext;
  value:
    | typeof S.selectingOpponents
    | typeof S.decidingWhosGoingFirst
    | typeof S.playing
    | { playing: typeof S.playingTakingTurn }
    | { playing: typeof S.playingCheckingGameState }
    | typeof S.showingGameEndResults;
};

const TicTacToeMachineActions = {
  setPlayer1: 'setPlayer1',
  setPlayer2: 'setPlayer2',
  createPlayers: 'createPlayers',
  setTurnPlayer1: 'setTurnPlayer1',
  setTurnPlayer2: 'setTurnPlayer2',
  giveTurn: 'giveTurn',
  saveTurn: 'saveTurn',
  initContext: 'initContext',
} as const;

// short-hand helper
const A = TicTacToeMachineActions;

const TicTacToeMachineConditions = {
  verifyTurn: 'verifyTurn',
  verifyGameEnd: 'verifyGameEnd',
} as const;

// short-hand helper
const C = TicTacToeMachineConditions;

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

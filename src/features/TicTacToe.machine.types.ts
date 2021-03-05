import { ActorRef } from 'xstate';

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

export type TicTacToeContext = {
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

export const TicTacToeEventTypes = {
  SELECT_PLAYER_1: 'SELECT_PLAYER_1',
  SELECT_PLAYER_2: 'SELECT_PLAYER_2',

  NEXT: 'NEXT',

  SET_TURN_PLAYER_1: 'SET_TURN_PLAYER_1',
  SET_TURN_PLAYER_2: 'SET_TURN_PLAYER_2',

  MAKE_TURN: 'MAKE_TURN',

  RETRY: 'RETRY',
} as const;

export type TicTacToeEvents =
  | { type: typeof TicTacToeEventTypes.SELECT_PLAYER_1 }
  | { type: typeof TicTacToeEventTypes.SELECT_PLAYER_2 }
  | { type: typeof TicTacToeEventTypes.NEXT }
  | { type: typeof TicTacToeEventTypes.SET_TURN_PLAYER_1 }
  | { type: typeof TicTacToeEventTypes.SET_TURN_PLAYER_2 }
  | { type: typeof TicTacToeEventTypes.MAKE_TURN; index: FieldCellIndex }
  | { type: typeof TicTacToeEventTypes.RETRY };

export const TicTacToeStateNodes = {
  selectingOpponents: '@/selectingOpponents',
  decidingWhosGoingFirst: '@/decidingWhosGoingFirst',
  playing: '@/playing',
  playingTakingTurn: '@/playing/takingTurn',
  playingCheckingGameState: '@/playing/checkingGameState',
  showingGameEndResults: '@/showingGameEndResults',
  somethingWentWrong: '@/somethingWentWrong',
} as const;

export type TicTacToeState = {
  context: TicTacToeContext;
  value:
    | typeof TicTacToeStateNodes.selectingOpponents
    | typeof TicTacToeStateNodes.decidingWhosGoingFirst
    | typeof TicTacToeStateNodes.playing
    | { playing: typeof TicTacToeStateNodes.playingTakingTurn }
    | { playing: typeof TicTacToeStateNodes.playingCheckingGameState }
    | typeof TicTacToeStateNodes.showingGameEndResults;
};

export const TicTacToeMachineActions = {
  setPlayer1: 'setPlayer1',
  setPlayer2: 'setPlayer2',
  createPlayers: 'createPlayers',
  setTurnPlayer1: 'setTurnPlayer1',
  setTurnPlayer2: 'setTurnPlayer2',
  giveTurn: 'giveTurn',
  saveTurn: 'saveTurn',
  initContext: 'initContext',
} as const;

export const TicTacToeMachineConditions = {
  verifyTurn: 'verifyTurn',
  verifyGameEnd: 'verifyGameEnd',
} as const;

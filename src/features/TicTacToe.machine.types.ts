import { SpawnedActorRef, State } from 'xstate';

import { TicTacToeActorEvents, TicTacToeActorContext, TicTacToeActorState } from './TicTacToe.actor';

type PlayerContext =
  | { type: 'user' }
  | {
      type: 'agent';
      ref: SpawnedActorRef<
        TicTacToeActorEvents,
        State<TicTacToeActorContext, TicTacToeActorEvents, Record<string, unknown>, TicTacToeActorState>
      >;
    };

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
  CHANGE_PLAYER_REQ: 'CHANGE_PLAYER_REQ',
  CONTINUE_REQ: 'CONTINUE_REQ',
  CHANGE_TURN_ORDER_REQ: 'CHANGE_TURN_ORDER_REQ',
  ACCEPT_TURN_REQ: 'ACCEPT_TURN_REQ',
  RETRY_REQ: 'RETRY_REQ',
} as const;

export type TicTacToeEvents =
  | { type: typeof TicTacToeEventTypes.CHANGE_PLAYER_REQ; kind: PlayerTurnContext; value: PlayerContext['type'] }
  | { type: typeof TicTacToeEventTypes.CONTINUE_REQ }
  | { type: typeof TicTacToeEventTypes.CHANGE_TURN_ORDER_REQ; first: PlayerTurnContext }
  | { type: typeof TicTacToeEventTypes.ACCEPT_TURN_REQ; index: FieldCellIndex }
  | { type: typeof TicTacToeEventTypes.RETRY_REQ };

export const TicTacToeStateNodes = {
  selectingOpponents: '@/selectingOpponents',
  decidingWhosGoingFirst: '@/decidingWhosGoingFirst',
  playing: '@/playing',
  playingTakingTurn: '@/playing/takingTurn',
  playingCheckingGameState: '@/playing/checkingGameState',
  showingGameEndResults: '@/showingGameEndResults',
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
  setPlayer: 'setPlayer',
  setTurnOrder: 'setTurnOrder',
  giveTurn: 'giveTurn',
  saveTurn: 'saveTurn',
  revertContextToInitial: 'revertContextToInitial',
} as const;

export const TicTacToeMachineConditions = {
  verifyTurn: 'verifyTurn',
  verifyGameEnd: 'verifyGameEnd',
} as const;

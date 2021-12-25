import {
  PlayerFieldSymbol,
  FieldCellIndex,
  TicTacToeContext,
  PlayerTurnContext,
  TicTacToeTransitionDelay,
} from './TicTacToe.common';

export type TicTacToeActorContext = {
  field: TicTacToeContext['field'];
  player: PlayerTurnContext;
  symbol: PlayerFieldSymbol;
  moveReady: { type: 'commit'; turnTo: FieldCellIndex } | { type: 'tryOtherMove' } | null;
  transitionDelay: TicTacToeTransitionDelay;
};

export const TTT_ACTOR_STATE = {
  awaitingTurn: '@/awaitingTurn',
  makingTurn: '@/makingTurn',
  tryingToWin: '@/tryingToWin',
  tryingToBlockWin: '@/tryingToBlockWin',
  tryingToFork: '@/tryingToFork',
  tryingToBlockFork: '@/tryingToBlockFork',
  tryingToTakeCenter: '@/tryingToTakeCenter',
  tryingToTakeOppositeCorner: '@/tryingToTakeOppositeCorner',
  tryingToTakeCorner: '@/tryingToTakeCorner',
  tryingToTakeEmptySide: '@/tryingToTakeEmptySide',
  givingUp: '@/givingUp',
} as const;

export type TicTacToeActorState = {
  context: TicTacToeActorContext;
  value:
    | typeof TTT_ACTOR_STATE.awaitingTurn
    | typeof TTT_ACTOR_STATE.makingTurn
    | typeof TTT_ACTOR_STATE.tryingToWin
    | typeof TTT_ACTOR_STATE.tryingToBlockWin
    | typeof TTT_ACTOR_STATE.tryingToFork
    | typeof TTT_ACTOR_STATE.tryingToBlockFork
    | typeof TTT_ACTOR_STATE.tryingToTakeCenter
    | typeof TTT_ACTOR_STATE.tryingToTakeOppositeCorner
    | typeof TTT_ACTOR_STATE.tryingToTakeCorner
    | typeof TTT_ACTOR_STATE.tryingToTakeEmptySide
    | typeof TTT_ACTOR_STATE.givingUp;
};

export const TTT_ACTOR_GUARD = {
  verifyTurnReady: 'verifyTurnReady',
} as const;

export const TTT_ACTOR_ACTION = {
  saveField: 'saveField',
  makeTurn: 'makeTurn',
  tryWinning: 'tryWinning',
  tryBlockingWin: 'tryBlockingWin',
  tryForking: 'tryForking',
  tryBlockingFork: 'tryBlockingFork',
  tryTakingCenter: 'tryTakingCenter',
  tryTakingOppositeCorner: 'tryTakingOppositeCorner',
  tryTakingCorner: 'tryTakingCorner',
  tryTakingSide: 'tryTakingSide',
  giveUp: 'giveUp',
} as const;

import { PlayerFieldSymbol, FieldCellIndex, TicTacToeContext } from './TicTacToe.common';

export type TicTacToeActorContext = {
  field: TicTacToeContext['field'];
  symbol: PlayerFieldSymbol;
  moveReady: { type: 'commit'; turnTo: FieldCellIndex } | { type: 'tryOtherMove' } | null;
};

export const TicTacToeActorStateNodes = {
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
    | typeof TicTacToeActorStateNodes.awaitingTurn
    | typeof TicTacToeActorStateNodes.makingTurn
    | typeof TicTacToeActorStateNodes.tryingToWin
    | typeof TicTacToeActorStateNodes.tryingToBlockWin
    | typeof TicTacToeActorStateNodes.tryingToFork
    | typeof TicTacToeActorStateNodes.tryingToBlockFork
    | typeof TicTacToeActorStateNodes.tryingToTakeCenter
    | typeof TicTacToeActorStateNodes.tryingToTakeOppositeCorner
    | typeof TicTacToeActorStateNodes.tryingToTakeCorner
    | typeof TicTacToeActorStateNodes.tryingToTakeEmptySide
    | typeof TicTacToeActorStateNodes.givingUp;
};

export const TicTacToeActorConditions = {
  verifyTurnReady: 'verifyTurnReady',
} as const;

export const TicTacToeActorActions = {
  saveField: 'saveField',
  makeTurn: 'makeTurn',
  assesWinning: 'assesWinning',
  assesBlockingWin: 'assesBlockingWin',
  assesForking: 'assesForking',
  assesBlockingFork: 'assesBlockingFork',
  assesTakingCenter: 'assesTakingCenter',
  assesTakingOppositeCorner: 'assesTakingOppositeCorner',
  assesTakingCorner: 'assesTakingCorner',
  assesTakingEmptySide: 'assesTakingEmptySide',
  giveUp: 'giveUp',
} as const;

export const MAKING_TURN_ACTION = {
  target: TicTacToeActorStateNodes.makingTurn,
  cond: TicTacToeActorConditions.verifyTurnReady,
} as const;

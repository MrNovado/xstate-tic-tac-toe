import { createMachine, StateMachine } from 'xstate';

import { PlayerFieldSymbol } from './TicTacToe.machine.types';

export type TicTacToeActorContext = {
  symbol: PlayerFieldSymbol;
};

export const TicTacToeActorEventTypes = {
  MAKE_TURN_REQ: 'MAKE_TURN_REQ',
} as const;

// input
export type TicTacToeActorEvents = { type: typeof TicTacToeActorEventTypes.MAKE_TURN_REQ };

const TicTacToeActorStateNodes = {
  awaitingTurn: '@/awaitingTurn',
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

// short-hand helper
const S = TicTacToeActorStateNodes;

export type TicTacToeActorState = {
  context: TicTacToeActorContext;
  value:
    | typeof S.awaitingTurn
    | typeof S.tryingToWin
    | typeof S.tryingToBlockWin
    | typeof S.tryingToFork
    | typeof S.tryingToBlockFork
    | typeof S.tryingToTakeCenter
    | typeof S.tryingToTakeOppositeCorner
    | typeof S.tryingToTakeCorner
    | typeof S.tryingToTakeEmptySide
    | typeof S.givingUp;
};

/**
 * This machine defines actor' states using
 * Newell and Simon's expert model with rule ordering:
 *
 * - https://en.wikipedia.org/wiki/Tic-tac-toe#Combinatorics
 * - https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy
 * - https://doi.org/10.1016%2F0364-0213%2893%2990003-Q
 */
export const createTicTacToeActor = (
  symbol: PlayerFieldSymbol,
): StateMachine<TicTacToeActorContext, Record<string, unknown>, TicTacToeActorEvents, TicTacToeActorState> =>
  createMachine<TicTacToeActorContext, TicTacToeActorEvents, TicTacToeActorState>({
    context: {
      symbol,
    },
    initial: S.awaitingTurn,
    states: {
      [S.awaitingTurn]: {},
      [S.tryingToWin]: {},
      [S.tryingToBlockWin]: {},
      [S.tryingToFork]: {},
      [S.tryingToBlockFork]: {},
      [S.tryingToTakeCenter]: {},
      [S.tryingToTakeOppositeCorner]: {},
      [S.tryingToTakeCorner]: {},
      [S.tryingToTakeEmptySide]: {},
      [S.givingUp]: {},
    },
  });

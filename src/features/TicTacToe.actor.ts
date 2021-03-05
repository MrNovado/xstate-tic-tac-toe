import { createMachine, DefaultContext } from 'xstate';

type TicTacToeActorContext = DefaultContext;

// input
export type TicTacToeActorEvents = { type: 'something' };

// output
export type TicTacToeActorMessages = { type: 'something' };

const TicTacToeActorStateNodes = {
  awaitingTurn: '@/awaitingTurn',
  tryingToWin: '@/tryingToWin',
  tryingToBlockWin: '@/tryingToBlockWin',
  tryingToFork: '@/tryingToFork',
  tryingToBlockFork: '@/tryingToBlockFork',
  tryingToTakeCenter: '@/tryingToTakeCenter',
  tryingToTakeOppositeCornter: '@/tryingToTakeOppositeCornter',
  tryingToTakeCorner: '@/tryingToTakeCorner',
  tryingToTakeEmptySide: '@/tryingToTakeEmptySide',
  givingUp: '@/givingUp',
} as const;

// short-hand helper
const S = TicTacToeActorStateNodes;

type TicTacToeActorState = {
  context: TicTacToeActorContext;
  value:
    | typeof S.awaitingTurn
    | typeof S.tryingToWin
    | typeof S.tryingToBlockWin
    | typeof S.tryingToFork
    | typeof S.tryingToBlockFork
    | typeof S.tryingToTakeCenter
    | typeof S.tryingToTakeOppositeCornter
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
export const TicTacToeActor = createMachine<TicTacToeActorContext, TicTacToeActorEvents, TicTacToeActorState>({
  context: undefined,
  initial: S.awaitingTurn,
  states: {
    [S.awaitingTurn]: {},
    [S.tryingToWin]: {},
    [S.tryingToBlockWin]: {},
    [S.tryingToFork]: {},
    [S.tryingToBlockFork]: {},
    [S.tryingToTakeCenter]: {},
    [S.tryingToTakeOppositeCornter]: {},
    [S.tryingToTakeCorner]: {},
    [S.tryingToTakeEmptySide]: {},
    [S.givingUp]: {},
  },
});

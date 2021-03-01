import { createMachine, DefaultContext } from 'xstate';

type TicTacToeContext = DefaultContext;

type TicTacToeEvents = { type: 'something' };

const TicTacToeStateNodes = {
  selectingOpponent: '@/selectingOpponent',
  decidingWhosGoingFirst: '@/decidingWhosGoingFirst',
  playing: '@/playing',
  playingTakingTurn: '@/playing/takingTurn',
  playingCheckingGameEnd: '@/playing/checkingGameEnd',
  showingGameEndResults: '@/showingGameEndResults',
} as const;

// short-hand helper
const S = TicTacToeStateNodes;

type TicTacToeState = {
  context: TicTacToeContext;
  value:
    | typeof S.selectingOpponent
    | typeof S.decidingWhosGoingFirst
    | typeof S.playing
    | { playing: typeof S.playingTakingTurn }
    | { playing: typeof S.playingCheckingGameEnd }
    | typeof S.showingGameEndResults;
};

/**
 * This machine defines major states of the game
 */
export const TicTacToeMachine = createMachine<TicTacToeContext, TicTacToeEvents, TicTacToeState>({
  context: undefined,
  initial: S.selectingOpponent,
  states: {
    [S.selectingOpponent]: {},
    [S.decidingWhosGoingFirst]: {},
    [S.playing]: {
      states: {
        [S.playingTakingTurn]: {},
        [S.playingCheckingGameEnd]: {},
      },
    },
    [S.showingGameEndResults]: {},
  },
});

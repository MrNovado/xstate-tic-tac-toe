import { TicTacToeContext } from './TicTacToe.common';

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
  awaitTurn: 'awaitTurn',
  saveTurn: 'saveTurn',
  switchTurn: 'switchTurn',
  revertContextToInitial: 'revertContextToInitial',
} as const;

export const TicTacToeMachineConditions = {
  verifyTurn: 'verifyTurn',
  verifyGameEnd: 'verifyGameEnd',
} as const;

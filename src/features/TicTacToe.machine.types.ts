import { TicTacToeContext } from './TicTacToe.common';

export const TicTacToeStateNodes = {
  settingUp: '@/settingUp',
  playing: '@/playing',
  playingTakingTurn: '@/playing/takingTurn',
  playingCheckingGameState: '@/playing/checkingGameState',
  showingGameEndResults: '@/showingGameEndResults',
} as const;

export type TicTacToeState = {
  context: TicTacToeContext;
  value:
    | typeof TicTacToeStateNodes.settingUp
    | typeof TicTacToeStateNodes.playing
    | { playing: typeof TicTacToeStateNodes.playingTakingTurn }
    | { playing: typeof TicTacToeStateNodes.playingCheckingGameState }
    | typeof TicTacToeStateNodes.showingGameEndResults;
};

export const TicTacToeMachineActions = {
  setPlayer: 'setPlayer',
  setTurnOrder: 'setTurnOrder',
  awaitTurn: 'awaitTurn',
  tryGameEnd: 'tryGameEnd',
  saveTurn: 'saveTurn',
  saveSurrender: 'saveSurrender',
  switchTurn: 'switchTurn',
  revertContextToInitial: 'revertContextToInitial',
  revertContextButOpponents: 'revertContextButOpponents',
} as const;

export const TicTacToeMachineConditions = {
  verifyTurn: 'verifyTurn',
  verifyGameEnd: 'verifyGameEnd',
} as const;

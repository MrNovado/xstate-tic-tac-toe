import { TicTacToeContext } from './TicTacToe.common';

export const TTT_STATE = {
  settingUp: '@/settingUp',
  playing: '@/playing',
  playingTakingTurn: '@/playing/takingTurn',
  playingCheckingGameState: '@/playing/checkingGameState',
  showingGameEndResults: '@/showingGameEndResults',
} as const;

export type TicTacToeState = {
  context: TicTacToeContext;
  value:
    | typeof TTT_STATE.settingUp
    | typeof TTT_STATE.playing
    | { playing: typeof TTT_STATE.playingTakingTurn }
    | { playing: typeof TTT_STATE.playingCheckingGameState }
    | typeof TTT_STATE.showingGameEndResults;
};

export const TTT_ACTION = {
  setPlayer: 'setPlayer',
  setTurnOrder: 'setTurnOrder',
  setTransitionDelay: 'setTransitionDelay',
  awaitTurn: 'awaitTurn',
  tryGameEnd: 'tryGameEnd',
  saveTurn: 'saveTurn',
  saveSurrender: 'saveSurrender',
  switchTurn: 'switchTurn',
  revertContextToInitial: 'revertContextToInitial',
  revertContextButOpponents: 'revertContextButOpponents',
} as const;

export const TTT_GUARD = {
  verifyTurn: 'verifyTurn',
  verifyGameEnd: 'verifyGameEnd',
} as const;

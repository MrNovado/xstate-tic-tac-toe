import { ActorRef } from 'xstate';

export const PLAYER_TYPE = {
  user: 'user',
  agent: 'agent',
} as const;

export type PlayerContext =
  | { type: typeof PLAYER_TYPE.user }
  | {
      type: typeof PLAYER_TYPE.agent;
      ref: ActorRef<TicTacToeActorEvents>;
    };

export const PLAYER_NUM = {
  player1: 'player1',
  player2: 'player2',
} as const;

export type PlayerTurnContext = typeof PLAYER_NUM[keyof typeof PLAYER_NUM];

export const PLAYER_SYMBOL = {
  x: 'x',
  o: '0',
} as const;

export type PlayerFieldSymbol = typeof PLAYER_SYMBOL[keyof typeof PLAYER_SYMBOL];

type FieldCellValue = PlayerFieldSymbol | null;
export type FieldCellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// strictly 9 cells
export type FieldContext = [
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

export const ROWS: FieldCellIndex[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
];

export const COLUMNS: FieldCellIndex[][] = [
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
];

export const DIAGONALS: FieldCellIndex[][] = [
  [0, 4, 8],
  [2, 4, 6],
];

export const FIELD = {
  corners: {
    topLeft: 0 as FieldCellIndex,
    topRight: 2 as FieldCellIndex,
    botLeft: 6 as FieldCellIndex,
    botRight: 8 as FieldCellIndex,
  },
  edges: {
    top: 1 as FieldCellIndex,
    left: 3 as FieldCellIndex,
    right: 5 as FieldCellIndex,
    bot: 7 as FieldCellIndex,
  },
  center: 4 as FieldCellIndex,
  combinations: [...ROWS, ...COLUMNS, ...DIAGONALS],
  rows: ROWS,
  columns: COLUMNS,
  diagonals: DIAGONALS,
};

export const FIELD_INITIAL: FieldContext = [null, null, null, null, null, null, null, null, null];

export const TTT_EVENT_TYPE = {
  changePlayerReq: 'changePlayerReq',
  continueReq: 'continueReq',
  changeTurnOrderReq: 'changeTurnOrderReq',
  changeTransitionDelayReq: 'changeTransitionDelayReq',
  acceptTurnReq: 'acceptTurnReq',
  giveUpReq: 'giveUpReq',
  retryReq: 'retryReq',
  setUpNewGame: 'setUpNewGame',
} as const;

export type TicTacToeEvents =
  | { type: typeof TTT_EVENT_TYPE.changePlayerReq; kind: PlayerTurnContext; value: PlayerContext['type'] }
  | { type: typeof TTT_EVENT_TYPE.continueReq }
  | { type: typeof TTT_EVENT_TYPE.changeTurnOrderReq; first: PlayerTurnContext }
  | { type: typeof TTT_EVENT_TYPE.changeTransitionDelayReq; delay: TicTacToeTransitionDelay }
  | { type: typeof TTT_EVENT_TYPE.acceptTurnReq; index: FieldCellIndex; sender: PlayerTurnContext }
  | { type: typeof TTT_EVENT_TYPE.giveUpReq }
  | { type: typeof TTT_EVENT_TYPE.retryReq }
  | { type: typeof TTT_EVENT_TYPE.setUpNewGame };

export const TTT_DELAY_OPTIONS = {
  0: 0,
  default: 300,
  500: 500,
  700: 700,
  1000: 1000,
} as const;

export type TicTacToeTransitionDelay = typeof TTT_DELAY_OPTIONS[keyof typeof TTT_DELAY_OPTIONS];

export type TicTacToeContext = {
  actorTransitionDelay: TicTacToeTransitionDelay;

  opponents: {
    [PLAYER_NUM.player1]: PlayerContext & { symbol: Extract<PlayerFieldSymbol, typeof PLAYER_SYMBOL.x> };
    [PLAYER_NUM.player2]: PlayerContext & { symbol: Extract<PlayerFieldSymbol, typeof PLAYER_SYMBOL.o> };
  };

  turnOrder: {
    current: PlayerTurnContext;
    turnsMade: number;
  };

  field: FieldContext;

  winCombo: [FieldCellIndex, FieldCellIndex, FieldCellIndex] | null;
  surrendered: PlayerTurnContext | null;
};

export const TTT_ACTOR_EVENT_TYPE = {
  makeTurnReq: 'makeTurnReq',
} as const;

// Machine to Actor -- Msg
export type TicTacToeActorEvents = {
  type: typeof TTT_ACTOR_EVENT_TYPE.makeTurnReq;
  field: FieldContext;
  player: PlayerTurnContext;
  transitionDelay: TicTacToeTransitionDelay;
};

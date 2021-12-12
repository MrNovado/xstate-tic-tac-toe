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
  CORNERS: {
    TOP_LEFT: 0 as FieldCellIndex,
    TOP_RIGHT: 2 as FieldCellIndex,
    BOT_LEFT: 6 as FieldCellIndex,
    BOT_RIGHT: 8 as FieldCellIndex,
  },
  EDGES: {
    TOP: 1 as FieldCellIndex,
    LEFT: 3 as FieldCellIndex,
    RIGHT: 5 as FieldCellIndex,
    BOT: 7 as FieldCellIndex,
  },
  CENTER: 4 as FieldCellIndex,
  COMBINATIONS: [...ROWS, ...COLUMNS, ...DIAGONALS],
  ROWS,
  COLUMNS,
  DIAGONALS,
};

export const FIELD_INITIAL: FieldContext = [null, null, null, null, null, null, null, null, null];

export const TicTacToeEventTypes = {
  CHANGE_PLAYER_REQ: 'CHANGE_PLAYER_REQ',
  CONTINUE_REQ: 'CONTINUE_REQ',
  CHANGE_TURN_ORDER_REQ: 'CHANGE_TURN_ORDER_REQ',
  ACCEPT_TURN_REQ: 'ACCEPT_TURN_REQ',
  GIVE_UP_TURN_REQ: 'GIVE_UP_TURN_REQ',
  RETRY_REQ: 'RETRY_REQ',
  SET_UP_NEW_GAME: 'SET_UP_NEW_GAME',
} as const;

export type TicTacToeEvents =
  | { type: typeof TicTacToeEventTypes.CHANGE_PLAYER_REQ; kind: PlayerTurnContext; value: PlayerContext['type'] }
  | { type: typeof TicTacToeEventTypes.CONTINUE_REQ }
  | { type: typeof TicTacToeEventTypes.CHANGE_TURN_ORDER_REQ; first: PlayerTurnContext }
  | { type: typeof TicTacToeEventTypes.ACCEPT_TURN_REQ; index: FieldCellIndex; sender: PlayerTurnContext }
  | { type: typeof TicTacToeEventTypes.GIVE_UP_TURN_REQ }
  | { type: typeof TicTacToeEventTypes.RETRY_REQ }
  | { type: typeof TicTacToeEventTypes.SET_UP_NEW_GAME };

export type TicTacToeContext = {
  opponents: {
    [PLAYER_NUM.player1]: PlayerContext & { symbol: Extract<PlayerFieldSymbol, typeof PLAYER_SYMBOL.x> };
    [PLAYER_NUM.player2]: PlayerContext & { symbol: Extract<PlayerFieldSymbol, typeof PLAYER_SYMBOL.o> };
  };

  turnOrder: {
    current: PlayerTurnContext;
    turnsMade: number;
  };

  field: FieldContext;

  // TODO: strictly 3 unique indexes?
  winCombo: [FieldCellIndex, FieldCellIndex, FieldCellIndex] | null;
  surrendered: PlayerTurnContext | null;
};

export const TicTacToeActorEventTypes = {
  MAKE_TURN_REQ: 'MAKE_TURN_REQ',
} as const;

// Machine to Actor -- Msg
export type TicTacToeActorEvents = {
  type: typeof TicTacToeActorEventTypes.MAKE_TURN_REQ;
  field: FieldContext;
  player: PlayerTurnContext;
};

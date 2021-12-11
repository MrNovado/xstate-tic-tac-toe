import { createMachine, StateMachine, assign, sendParent } from 'xstate';

import {
  TicTacToeActorEvents,
  TicTacToeActorEventTypes as E,
  TicTacToeEventTypes as Msg,
  TicTacToeEvents,
  FIELD_INITIAL,
  PlayerFieldSymbol,
  TicTacToeEventTypes,
  FIELD,
  FieldContext,
  PLAYER_SYMBOL,
  COLUMNS,
  DIAGONALS,
  ROWS,
  FieldCellIndex,
  PLAYER_NUM,
} from './TicTacToe.common';
import {
  TicTacToeActorContext,
  TicTacToeActorState,
  TicTacToeActorActions as A,
  TicTacToeActorConditions as C,
  TicTacToeActorStateNodes as S,
} from './TicTacToe.actor.types';

const MAKING_TURN_ACTION = {
  target: S.makingTurn,
  cond: C.verifyTurnReady,
} as const;

/**
 * This machine defines actor' states using
 * Newell and Simon's expert model with rule ordering:
 *
 * - https://en.wikipedia.org/wiki/Tic-tac-toe#Combinatorics
 * - https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy
 * - https://doi.org/10.1016%2F0364-0213%2893%2990003-Q
 */
export const createTicTacToeActor = (
  givenSymbol: PlayerFieldSymbol,
): StateMachine<TicTacToeActorContext, Record<string, unknown>, TicTacToeActorEvents, TicTacToeActorState> =>
  createMachine<TicTacToeActorContext, TicTacToeActorEvents, TicTacToeActorState>(
    {
      context: {
        field: FIELD_INITIAL,
        player: PLAYER_NUM.player2,
        symbol: givenSymbol,
        moveReady: null,
      },
      initial: S.awaitingTurn,
      states: {
        [S.awaitingTurn]: {
          on: {
            [E.MAKE_TURN_REQ]: {
              target: S.tryingToWin,
              actions: [A.saveField],
            },
          },
        },

        [S.makingTurn]: {
          always: [
            {
              target: S.awaitingTurn,
              actions: A.makeTurn,
            },
          ],
        },

        [S.tryingToWin]: {
          entry: A.assesWinning,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToBlockWin,
            },
          ],
        },
        [S.tryingToBlockWin]: {
          entry: A.assesBlockingWin,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToFork,
            },
          ],
        },
        [S.tryingToFork]: {
          entry: A.assesForking,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToBlockFork,
            },
          ],
        },
        [S.tryingToBlockFork]: {
          entry: A.assesBlockingFork,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeCenter,
            },
          ],
        },
        [S.tryingToTakeCenter]: {
          entry: A.assesTakingCenter,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeOppositeCorner,
            },
          ],
        },
        [S.tryingToTakeOppositeCorner]: {
          entry: A.assesTakingOppositeCorner,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeCorner,
            },
          ],
        },
        [S.tryingToTakeCorner]: {
          entry: A.assesTakingCorner,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeEmptySide,
            },
          ],
        },
        [S.tryingToTakeEmptySide]: {
          entry: A.assesTakingSide,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.givingUp,
            },
          ],
        },

        [S.givingUp]: {
          always: [
            {
              target: S.awaitingTurn,
              actions: A.giveUp,
            },
          ],
        },
      },
    },
    {
      guards: {
        [C.verifyTurnReady]: ({ moveReady }: TicTacToeActorContext) => moveReady?.type === 'commit',
      },
      actions: {
        /**
         * CHILD-PARENT Msg ===================================================
         */

        [A.saveField]: assign({
          player: (_, event) => event.player,
          field: (_, event) => event.field,
        }),

        [A.makeTurn]: sendParent(
          ({
            player,
            moveReady,
          }): Extract<
            TicTacToeEvents,
            { type: typeof TicTacToeEventTypes.ACCEPT_TURN_REQ | typeof TicTacToeEventTypes.GIVE_UP_TURN_REQ }
          > => {
            if (moveReady?.type === 'commit') {
              return { type: Msg.ACCEPT_TURN_REQ, index: moveReady.turnTo, sender: player };
            }

            return { type: Msg.GIVE_UP_TURN_REQ };
          },
        ),

        [A.giveUp]: sendParent((): Extract<TicTacToeEvents, { type: typeof TicTacToeEventTypes.GIVE_UP_TURN_REQ }> => {
          return { type: Msg.GIVE_UP_TURN_REQ };
        }),

        /**
         * ACTOR BUSINESS =====================================================
         */

        [A.assesWinning]: assign({
          moveReady: ({ field, symbol }) => {
            return assesWinning(field, symbol);
          },
        }),
        [A.assesBlockingWin]: assign({
          moveReady: ({ field, symbol }) => {
            const opponentSymbol = getOpponent(symbol);
            return assesWinning(field, opponentSymbol);
          },
        }),
        [A.assesForking]: assign({
          moveReady: ({ field, symbol }) => {
            return assesForking(field, symbol);
          },
        }),
        [A.assesBlockingFork]: assign({
          moveReady: ({ field, symbol }) => {
            const opponentSymbol = getOpponent(symbol);
            return assesForking(field, opponentSymbol);
          },
        }),
        [A.assesTakingCenter]: assign({
          moveReady: ({ field }) => {
            if (field[FIELD.CENTER] === null) {
              return { type: 'commit', turnTo: FIELD.CENTER };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.assesTakingOppositeCorner]: assign({
          moveReady: ({ field, symbol }) => {
            const opponent = getOpponent(symbol);
            // if my opponent is in a corner, and
            // if the opposite corner is empty
            const corners = [
              {
                is: field[FIELD.CORNERS.TOP_LEFT] === opponent && field[FIELD.CORNERS.BOT_RIGHT] === null,
                index: FIELD.CORNERS.BOT_RIGHT,
              },
              {
                is: field[FIELD.CORNERS.TOP_RIGHT] === opponent && field[FIELD.CORNERS.BOT_LEFT] === null,
                index: FIELD.CORNERS.BOT_LEFT,
              },
              {
                is: field[FIELD.CORNERS.BOT_LEFT] === opponent && field[FIELD.CORNERS.TOP_RIGHT] === null,
                index: FIELD.CORNERS.TOP_RIGHT,
              },
              {
                is: field[FIELD.CORNERS.BOT_RIGHT] === opponent && field[FIELD.CORNERS.TOP_LEFT] === null,
                index: FIELD.CORNERS.TOP_LEFT,
              },
            ];

            // TODO: introduce randomness when several variants are possible
            const oppositeCorner = corners.find((inv) => inv.is);
            if (oppositeCorner) {
              return { type: 'commit', turnTo: oppositeCorner.index };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.assesTakingCorner]: assign({
          moveReady: ({ field }) => {
            const corners = [
              { value: field[FIELD.CORNERS.TOP_LEFT], index: FIELD.CORNERS.TOP_LEFT },
              { value: field[FIELD.CORNERS.TOP_RIGHT], index: FIELD.CORNERS.TOP_RIGHT },
              { value: field[FIELD.CORNERS.BOT_LEFT], index: FIELD.CORNERS.BOT_LEFT },
              { value: field[FIELD.CORNERS.BOT_RIGHT], index: FIELD.CORNERS.BOT_RIGHT },
            ];

            // TODO: introduce randomness when several variants are possible
            const freeCorner = corners.find((corner) => corner.value === null);
            if (freeCorner) {
              return { type: 'commit', turnTo: freeCorner.index };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.assesTakingSide]: assign({
          moveReady: ({ field }) => {
            const sides = [
              { value: field[FIELD.EDGES.TOP], index: FIELD.EDGES.TOP },
              { value: field[FIELD.EDGES.LEFT], index: FIELD.EDGES.LEFT },
              { value: field[FIELD.EDGES.RIGHT], index: FIELD.EDGES.RIGHT },
              { value: field[FIELD.EDGES.BOT], index: FIELD.EDGES.BOT },
            ];

            // TODO: introduce randomness when several variants are possible
            const freeSide = sides.find((side) => side.value === null);
            if (freeSide) {
              return { type: 'commit', turnTo: freeSide.index };
            }

            return { type: 'tryOtherMove' };
          },
        }),
      },
    },
  );

/*
 * COMMON ACTIONS =============================================================
 */

function assesWinning(field: FieldContext, symbol: PlayerFieldSymbol): TicTacToeActorContext['moveReady'] {
  const combination = find2InARowWith1Free(field, symbol);
  const turnTo = combination?.find((index) => field[index] === null);
  if (turnTo) {
    return { type: 'commit', turnTo };
  }

  return { type: 'tryOtherMove' };
}

function assesForking(field: FieldContext, symbol: PlayerFieldSymbol): TicTacToeActorContext['moveReady'] {
  const fork = findAFork(field, symbol);
  if (fork) {
    return { type: 'commit', turnTo: fork.intersectionIndex };
  }

  return { type: 'tryOtherMove' };
}

/*
 * COMMON UTILS ===============================================================
 */

function getOpponent(symbol: PlayerFieldSymbol) {
  return symbol === PLAYER_SYMBOL.x ? PLAYER_SYMBOL.o : PLAYER_SYMBOL.x;
}

function find2InARowWith1Free(field: FieldContext, symbol: PlayerFieldSymbol) {
  const opponent = getOpponent(symbol);
  return FIELD.COMBINATIONS.find((row) => {
    const actorSymbolsInARow = row.reduce<number>((acc, index) => {
      if (field[index] === symbol) {
        return acc + 1;
      }

      if (field[index] === opponent) {
        return acc - 1;
      }

      return acc;
    }, 0);

    return actorSymbolsInARow === 2;
  });
}

function findAFork(field: FieldContext, symbol: PlayerFieldSymbol): { intersectionIndex: FieldCellIndex } | null {
  // if there are two intersecting rows, columns, or diagonals
  // with one of my pieces and two blanks,
  // =====================================
  //  [*,X,*]
  //  [X,_,_] <- 2 blanks on row 2
  //  [*,_,*]
  //     ^- 2 blanks on col 2
  //  cell 4 (center) is an intersection
  // =====================================
  // and if the intersecting space is empty
  const oneTakenAnd2Blanks = (line: FieldCellIndex[]) => {
    const howManyTaken = line.reduce<number>((acc, index) => {
      if (field[index] === symbol) {
        return acc + 1;
      }

      if (field[index] === null) {
        return acc;
      }

      return acc - 1;
    }, 0);

    return howManyTaken === 1;
  };

  const rows = ROWS.filter(oneTakenAnd2Blanks);
  const columns = COLUMNS.filter(oneTakenAnd2Blanks);
  const diagonals = DIAGONALS.filter(oneTakenAnd2Blanks);

  // scanning rows-first
  if (rows.length) {
    for (const row of rows) {
      for (const index of row) {
        // against columns
        for (const column of columns) {
          const intersection = index in column;
          const intersectionEmpty = field[index] === null;
          if (intersection && intersectionEmpty) {
            return {
              intersectionIndex: index,
            };
          }
        }

        // against diagonals
        for (const diag of diagonals) {
          const intersection = index in diag;
          const intersectionEmpty = field[index] === null;
          if (intersection && intersectionEmpty) {
            return {
              intersectionIndex: index,
            };
          }
        }
      }
    }
  }

  // scanning columns-first
  if (columns.length) {
    for (const column of columns) {
      for (const index of column) {
        // against diagonals
        // (already scanned against rows if they were available)
        for (const diag of diagonals) {
          const intersection = index in diag;
          const intersectionEmpty = field[index] === null;
          if (intersection && intersectionEmpty) {
            return {
              intersectionIndex: index,
            };
          }
        }
      }
    }
  }

  // 2 diagonals can only intersect in the center
  if (diagonals.length === 2 && field[FIELD.CENTER] === null) {
    return { intersectionIndex: FIELD.CENTER };
  }

  return null;
}

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
} from './TicTacToe.common';
import {
  MAKING_TURN_ACTION,
  TicTacToeActorContext,
  TicTacToeActorState,
  TicTacToeActorActions as A,
  TicTacToeActorConditions as C,
  TicTacToeActorStateNodes as S,
} from './TicTacToe.actor.types';

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
          on: {
            '': {
              target: S.awaitingTurn,
              actions: A.makeTurn,
            },
          },
        },

        [S.tryingToWin]: {
          entry: A.assesWinning,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToBlockWin,
              },
            ],
          },
        },
        [S.tryingToBlockWin]: {
          entry: A.assesBlockingWin,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToFork,
              },
            ],
          },
        },
        [S.tryingToFork]: {
          entry: A.assesForking,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToBlockFork,
              },
            ],
          },
        },
        [S.tryingToBlockFork]: {
          entry: A.assesBlockingFork,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToTakeCenter,
              },
            ],
          },
        },
        [S.tryingToTakeCenter]: {
          entry: A.assesTakingCenter,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToTakeOppositeCorner,
              },
            ],
          },
        },
        [S.tryingToTakeOppositeCorner]: {
          entry: A.assesTakingOppositeCorner,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToTakeCorner,
              },
            ],
          },
        },
        [S.tryingToTakeCorner]: {
          entry: A.assesTakingCorner,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToTakeEmptySide,
              },
            ],
          },
        },
        [S.tryingToTakeEmptySide]: {
          entry: A.assesTakingEmptySide,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.givingUp,
              },
            ],
          },
        },

        [S.givingUp]: {
          on: {
            '': {
              target: S.awaitingTurn,
              actions: A.giveUp,
            },
          },
        },
      },
    },
    {
      // TODO:
      guards: {
        [C.verifyTurnReady]: ({ moveReady }: TicTacToeActorContext) => moveReady?.type === 'commit',
      },
      // TODO:
      actions: {
        [A.saveField]: assign({ field: (_, event) => event.field }),
        [A.makeTurn]: sendParent(
          ({
            moveReady,
          }): Extract<
            TicTacToeEvents,
            { type: typeof TicTacToeEventTypes.ACCEPT_TURN_REQ | typeof TicTacToeEventTypes.GIVE_UP_TURN_REQ }
          > => {
            if (moveReady?.type === 'commit') {
              return { type: Msg.ACCEPT_TURN_REQ, index: moveReady.turnTo };
            }

            return { type: Msg.GIVE_UP_TURN_REQ };
          },
        ),

        [A.assesWinning]: assign({
          moveReady: ({ field, symbol }) => {
            const combination = find2InARowWith1Free(field, symbol);
            const turnTo = combination?.find((index) => field[index] === null);
            if (turnTo) {
              return { type: 'commit', turnTo };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.assesBlockingWin]: assign({
          moveReady: ({ field, symbol }) => {
            const opponentSymbol = getOpponent(symbol);
            const combination = find2InARowWith1Free(field, opponentSymbol);
            const turnTo = combination?.find((index) => field[index] === null);
            if (turnTo) {
              return { type: 'commit', turnTo };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.assesForking]: assign({
          moveReady: ({ field, symbol }) => {
            const fork = findAFork(field, symbol);
            if (fork) {
              return { type: 'commit', turnTo: fork.forkIndex };
            }

            return { type: 'tryOtherMove' };
          },
        }),
      },
    },
  );

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

function findAFork(field: FieldContext, symbol: PlayerFieldSymbol): { forkIndex: FieldCellIndex } | null {
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
              forkIndex: index,
            };
          }
        }

        // against diagonals
        for (const diag of diagonals) {
          const intersection = index in diag;
          const intersectionEmpty = field[index] === null;
          if (intersection && intersectionEmpty) {
            return {
              forkIndex: index,
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
              forkIndex: index,
            };
          }
        }
      }
    }
  }

  if (diagonals.length === 2 && field[FIELD.CENTER] === null) {
    return { forkIndex: FIELD.CENTER };
  }

  return null;
}

import {
  PlayerFieldSymbol,
  PLAYER_SYMBOL,
  FieldContext,
  FIELD,
  FieldCellIndex,
  ROWS,
  COLUMNS,
  DIAGONALS,
} from './TicTacToe.common';

export function getOpponent(symbol: PlayerFieldSymbol): PlayerFieldSymbol {
  return symbol === PLAYER_SYMBOL.x ? PLAYER_SYMBOL.o : PLAYER_SYMBOL.x;
}

export function find2InARowWith1Free(field: FieldContext, symbol: PlayerFieldSymbol): FieldCellIndex[] | undefined {
  const opponent = getOpponent(symbol);
  const twoInARow = FIELD.COMBINATIONS.find((row) => {
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

  return twoInARow;
}

export function findAFork(
  field: FieldContext,
  symbol: PlayerFieldSymbol,
): { intersectionIndex: FieldCellIndex } | null {
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

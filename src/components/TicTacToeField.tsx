import styled from '@emotion/styled';
import React from 'react';
import { noop } from '../common/noop';
import { FIELD, FieldCellIndex, FieldCellValue, FieldContext } from '../features/TicTacToe';

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 100px 100px 100px;
  grid-template-rows: 100px 100px 100px;
  gap: 8px;
`;

type FieldCellProps = Pick<TicTacToeFieldProps, 'isFirstTurn' | 'isPlayersTurn' | 'winCombo'> & {
  cellIndex: FieldCellIndex;
  cellValue: FieldCellValue;
};

const FieldCell = styled.div<FieldCellProps>`
  outline: 1px solid gray;
  cursor: pointer;
  font-size: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ isFirstTurn, isPlayersTurn, winCombo, cellValue, cellIndex }) => {
    // if we have `winCombo`, then game has ended
    if (winCombo) {
      return winCombo.includes(cellIndex) ? 'green' : undefined;
    }

    // if game continues and cell is free
    const isPlayerAndFirstTurnCenterIsFree = isPlayersTurn && cellIndex === FIELD.center && cellValue === null;
    const isPlayerAndTheCellIsFree = isPlayersTurn && !isFirstTurn && cellValue === null;
    if (isPlayerAndFirstTurnCenterIsFree || isPlayerAndTheCellIsFree) {
      return '#cbffb6';
    }

    // nothing to highlight regardless of game-state
    return undefined;
  }};
  transition: background 0.5s ease;
`;

type TicTacToeFieldProps = {
  field: FieldContext;
  // eslint-disable-next-line no-unused-vars
  onCellClick?: (index: FieldCellIndex) => () => void;
  isFirstTurn?: boolean;
  isPlayersTurn?: boolean;
  winCombo?: [FieldCellIndex, FieldCellIndex, FieldCellIndex] | null;
};

/**
 * TicTacToe basic game-field
 */
export const TicTacToeField: React.FC<TicTacToeFieldProps> = React.memo(
  ({ field, onCellClick, isFirstTurn, isPlayersTurn, winCombo }) => {
    return (
      <FieldGrid>
        {field.map((cellValue, index) => {
          const cellIndex = index as FieldCellIndex;
          return (
            <FieldCell
              // this time it's gonna be alright, don`t worry :)
              // eslint-disable-next-line react/no-array-index-key
              key={cellIndex}
              role="button"
              tabIndex={cellIndex}
              onKeyDown={noop}
              isFirstTurn={isFirstTurn}
              isPlayersTurn={isPlayersTurn}
              winCombo={winCombo}
              cellIndex={cellIndex}
              cellValue={cellValue}
              onClick={onCellClick?.(cellIndex)}
            >
              {cellValue}
            </FieldCell>
          );
        })}
      </FieldGrid>
    );
  },
);

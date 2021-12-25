import React from 'react';
import { noop } from '../../common/noop';
import { MenuButton } from '../../components/MenuButton';
import { TicTacToeField } from '../../components/TicTacToeField';
import {
  TicTacToeMachineSend,
  PLAYER_TYPE,
  FieldCellIndex,
  TicTacToeMachineState,
  TTT_EVENT_TYPE as E,
} from '../../features/TicTacToe';
import { GameContainer, TurnStateComment } from './common';

type TicTacToePagePlayingProps = {
  send: TicTacToeMachineSend;
  machineState: TicTacToeMachineState;
};

/**
 * Represents `playing` part of the game, by showing the field, x|0 symbols, highlighting steps and turns.
 */
export const TicTacToePagePlaying: React.FC<TicTacToePagePlayingProps> = ({ send, machineState }) => {
  const currentPlayer = machineState.context.turnOrder.current;
  const { symbol: currentPlayerSymbol } = machineState.context.opponents[currentPlayer];
  const isPlayersTurn = machineState.context.opponents[currentPlayer].type === PLAYER_TYPE.user;
  const isFirstTurn = machineState.context.turnOrder.turnsMade === 0;

  const makeTurn = React.useMemo(() => {
    return isPlayersTurn
      ? (index: FieldCellIndex) => () => {
          send({
            type: E.acceptTurnReq,
            index,
            sender: currentPlayer,
          });
        }
      : () => noop;
  }, [isPlayersTurn]);

  return (
    <GameContainer>
      <TurnStateComment>{`${currentPlayer} (${currentPlayerSymbol}) to make turn`}</TurnStateComment>
      <TicTacToeField
        field={machineState.context.field}
        onCellClick={makeTurn}
        isFirstTurn={isFirstTurn}
        isPlayersTurn={isPlayersTurn}
      />
      {isPlayersTurn ? (
        <MenuButton type="button" onClick={() => send({ type: E.giveUpReq })}>
          Give up
        </MenuButton>
      ) : (
        <MenuButton type="button" disabled>
          ---
        </MenuButton>
      )}
    </GameContainer>
  );
};

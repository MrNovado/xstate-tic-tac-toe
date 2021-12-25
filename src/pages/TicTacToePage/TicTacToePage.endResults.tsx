import styled from '@emotion/styled';
import React from 'react';
import { MenuButton } from '../../components/MenuButton';
import { TicTacToeField } from '../../components/TicTacToeField';
import { TTT_EVENT_TYPE as E, TicTacToeMachineSend, TicTacToeMachineState } from '../../features/TicTacToe';
import { GameContainer, TurnStateComment } from './common';

const EndResultComment = styled.div``;

type TicTacToePageEndResultsProps = {
  send: TicTacToeMachineSend;
  machineState: TicTacToeMachineState;
};

export const TicTacToePageEndResults: React.FC<TicTacToePageEndResultsProps> = ({ send, machineState }) => {
  const { winCombo, surrendered } = machineState.context;

  return (
    <GameContainer>
      <TurnStateComment>Game ended</TurnStateComment>
      <TicTacToeField field={machineState.context.field} winCombo={machineState.context.winCombo} />
      <MenuButton type="button" onClick={() => send({ type: E.retryReq })}>
        Retry
      </MenuButton>
      <MenuButton type="button" onClick={() => send({ type: E.setUpNewGame })}>
        New game
      </MenuButton>

      {winCombo && <EndResultComment>{`Win combination ${winCombo}`}</EndResultComment>}
      {surrendered && <EndResultComment>{`${surrendered} surrendered!`}</EndResultComment>}
      {!winCombo && !surrendered && <EndResultComment>It`s a draw</EndResultComment>}
    </GameContainer>
  );
};

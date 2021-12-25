import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import { inspect } from '@xstate/inspect';
import styled from '@emotion/styled';
import { TicTacToeMachine, TTT_STATE as S } from '../../features/TicTacToe';
import { TicTacToePageSettingUp } from './TicTacToePage.settingUp';
import { TicTacToePagePlaying } from './TicTacToePage.playing';
import { TicTacToePageEndResults } from './TicTacToePage.endResults';

inspect({ iframe: () => document.getElementById('stately-frame') as HTMLIFrameElement });

const TicTacToePageContainer = styled.div`
  margin: 10% auto auto auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const TicTacToePage: React.FC = () => {
  const [machineState, send] = useMachine(TicTacToeMachine, { devTools: true });
  const renderMachineState = () => {
    switch (true) {
      case machineState.matches(S.settingUp): {
        return <TicTacToePageSettingUp send={send} />;
      }

      case machineState.matches(S.playing): {
        return <TicTacToePagePlaying send={send} machineState={machineState} />;
      }

      case machineState.matches(S.showingGameEndResults): {
        return <TicTacToePageEndResults send={send} machineState={machineState} />;
      }

      default:
        return <div>UNKNOWN STATE</div>;
    }
  };

  useEffect(() => {
    // so you could also sneak into console to check what's going on
    // eslint-disable-next-line no-console
    console.log({
      turn: machineState.context.turnOrder.turnsMade,
      context: machineState.context,
      events: machineState.events,
      value: machineState.value,
    });
  });

  return <TicTacToePageContainer>{renderMachineState()}</TicTacToePageContainer>;
};

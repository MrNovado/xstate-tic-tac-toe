import { useMachine } from '@xstate/react';
import { FieldCellIndex, PLAYER_TYPE, TicTacToeEventTypes } from '../features/TicTacToe.common';
import { TicTacToeMachine } from '../features/TicTacToe.machine';
import { TicTacToeStateNodes as S } from '../features/TicTacToe.machine.types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export const TicTacToePage: React.FC = () => {
  const [machineState, send] = useMachine(TicTacToeMachine);
  const renderMachineState = () => {
    switch (true) {
      case machineState.matches(S.settingUp): {
        return (
          <button type="button" onClick={() => send({ type: TicTacToeEventTypes.CONTINUE_REQ })}>
            Start
          </button>
        );
      }

      case machineState.matches(S.playing): {
        const currentPlayer = machineState.context.turnOrder.current;
        const isPlayersTurn = machineState.context.opponents[currentPlayer].type === PLAYER_TYPE.user;
        const makeTurn = isPlayersTurn
          ? (index: FieldCellIndex) => () =>
              send({
                type: TicTacToeEventTypes.ACCEPT_TURN_REQ,
                index,
                sender: machineState.context.turnOrder.current,
              })
          : () => noop;

        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 100px 100px',
              gridTemplateRows: '100px 100px 100px',
              gap: 8,
            }}
          >
            {machineState.context.field.map((cell, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                style={{
                  outline: '1px solid gray',
                  cursor: 'pointer',
                  fontSize: 50,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                role="button"
                tabIndex={index}
                onKeyDown={noop}
                onClick={makeTurn(index as FieldCellIndex)}
              >
                {cell}
              </div>
            ))}
          </div>
        );
      }

      case machineState.matches(S.showingGameEndResults): {
        return (
          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 100px 100px',
                gridTemplateRows: '100px 100px 100px',
                gap: 8,
              }}
            >
              {machineState.context.field.map((cell, index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  style={{
                    outline: '1px solid gray',
                    cursor: 'pointer',
                    fontSize: 50,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: machineState.context.winCombo?.[index] && 'green',
                  }}
                >
                  {cell}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => send({ type: TicTacToeEventTypes.RETRY_REQ })}>
              Retry
            </button>
          </div>
        );
      }

      default:
        return <div>UNKNOWN STATE</div>;
    }
  };

  return (
    <div
      style={{
        width: '50%',
        margin: '10% auto auto auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {renderMachineState()}
    </div>
  );
};

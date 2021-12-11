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
        const { symbol: currentPlayerSymbol } = machineState.context.opponents[currentPlayer];
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
          <div style={{ display: 'grid', gap: 16 }}>
            <h3>{`Waiting for [${currentPlayer} ${currentPlayerSymbol}] to make turn`}</h3>
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
            <button type="button" onClick={() => send({ type: TicTacToeEventTypes.GIVE_UP_TURN_REQ })}>
              Give up
            </button>
          </div>
        );
      }

      case machineState.matches(S.showingGameEndResults): {
        return (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3>Game ended</h3>
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
                  title={`${index}`}
                  style={{
                    outline: '1px solid gray',
                    cursor: 'pointer',
                    fontSize: 50,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: machineState.context.winCombo?.includes(index as FieldCellIndex) ? 'green' : undefined,
                  }}
                >
                  {cell}
                </div>
              ))}
            </div>
            {machineState.context.winCombo && <div>{`Win combination ${machineState.context.winCombo}`}</div>}
            {machineState.context.surrendered && <div>{`${machineState.context.surrendered} surrendered!`}</div>}
            {!machineState.context.winCombo && !machineState.context.surrendered && <div>It`s a draw</div>}
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

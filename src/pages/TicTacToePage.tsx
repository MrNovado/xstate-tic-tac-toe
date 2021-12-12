import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import { inspect } from '@xstate/inspect';
import { FieldCellIndex, PLAYER_NUM, PLAYER_TYPE, TicTacToeEventTypes } from '../features/TicTacToe.common';
import { TicTacToeMachine } from '../features/TicTacToe.machine';
import { TicTacToeStateNodes as S } from '../features/TicTacToe.machine.types';

inspect({ iframe: () => document.getElementById('stately-frame') as HTMLIFrameElement });

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export const TicTacToePage: React.FC = () => {
  const [machineState, send] = useMachine(TicTacToeMachine, { devTools: true });
  const renderMachineState = () => {
    switch (true) {
      case machineState.matches(S.settingUp): {
        return (
          <div style={{ display: 'grid', gap: 8 }}>
            <button
              style={{ minWidth: 150, height: 50 }}
              type="button"
              onClick={() => send({ type: TicTacToeEventTypes.CONTINUE_REQ })}
            >
              Player vs Player
            </button>
            <button
              style={{ minWidth: 150, height: 50 }}
              type="button"
              onClick={() => {
                send({
                  type: TicTacToeEventTypes.CHANGE_PLAYER_REQ,
                  kind: PLAYER_NUM.player2,
                  value: PLAYER_TYPE.agent,
                });
                send({ type: TicTacToeEventTypes.CONTINUE_REQ });
              }}
            >
              Player vs AI
            </button>
            <button
              style={{ minWidth: 150, height: 50 }}
              type="button"
              onClick={() => {
                send({
                  type: TicTacToeEventTypes.CHANGE_PLAYER_REQ,
                  kind: PLAYER_NUM.player1,
                  value: PLAYER_TYPE.agent,
                });
                send({
                  type: TicTacToeEventTypes.CHANGE_PLAYER_REQ,
                  kind: PLAYER_NUM.player2,
                  value: PLAYER_TYPE.agent,
                });
                send({ type: TicTacToeEventTypes.CONTINUE_REQ });
              }}
            >
              AI vs AI
            </button>
          </div>
        );
      }

      case machineState.matches(S.playing): {
        const currentPlayer = machineState.context.turnOrder.current;
        const { symbol: currentPlayerSymbol } = machineState.context.opponents[currentPlayer];
        const isPlayersTurn = machineState.context.opponents[currentPlayer].type === PLAYER_TYPE.user;
        const makeTurn = isPlayersTurn
          ? (index: FieldCellIndex) => () => {
              send({
                type: TicTacToeEventTypes.ACCEPT_TURN_REQ,
                index,
                sender: currentPlayer,
              });
            }
          : () => noop;

        return (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3>{`${currentPlayer} (${currentPlayerSymbol}) to make turn`}</h3>
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
            {isPlayersTurn ? (
              <button type="button" onClick={() => send({ type: TicTacToeEventTypes.GIVE_UP_TURN_REQ })}>
                Give up
              </button>
            ) : (
              <button type="button" disabled>
                ---
              </button>
            )}
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
            <button type="button" onClick={() => send({ type: TicTacToeEventTypes.RETRY_REQ })}>
              Retry
            </button>
            <button type="button" onClick={() => send({ type: TicTacToeEventTypes.SET_UP_NEW_GAME })}>
              New game
            </button>
            {machineState.context.winCombo && <div>{`Win combination ${machineState.context.winCombo}`}</div>}
            {machineState.context.surrendered && <div>{`${machineState.context.surrendered} surrendered!`}</div>}
            {!machineState.context.winCombo && !machineState.context.surrendered && <div>It`s a draw</div>}
          </div>
        );
      }

      default:
        return <div>UNKNOWN STATE</div>;
    }
  };

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log({
      turn: machineState.context.turnOrder.turnsMade,
      context: machineState.context,
      events: machineState.events,
      value: machineState.value,
    });
  });

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

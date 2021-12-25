import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import { inspect } from '@xstate/inspect';
import {
  FIELD,
  FieldCellIndex,
  PLAYER_NUM,
  PLAYER_TYPE,
  TTT_EVENT_TYPE as E,
  TicTacToeTransitionDelay,
  TTT_DELAY_OPTIONS,
} from '../features/TicTacToe.common';
import { TicTacToeMachine } from '../features/TicTacToe.machine';
import { TTT_STATE as S } from '../features/TicTacToe.machine.types';

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
            <button style={{ minWidth: 150, height: 50 }} type="button" onClick={() => send({ type: E.continueReq })}>
              Player vs Player
            </button>
            <button
              style={{ minWidth: 150, height: 50 }}
              type="button"
              onClick={() => {
                send({
                  type: E.changePlayerReq,
                  kind: PLAYER_NUM.player2,
                  value: PLAYER_TYPE.agent,
                });
                send({ type: E.continueReq });
              }}
            >
              Player vs AI
            </button>
            <button
              style={{ minWidth: 150, height: 50 }}
              type="button"
              onClick={() => {
                send({
                  type: E.changePlayerReq,
                  kind: PLAYER_NUM.player1,
                  value: PLAYER_TYPE.agent,
                });
                send({
                  type: E.changePlayerReq,
                  kind: PLAYER_NUM.player2,
                  value: PLAYER_TYPE.agent,
                });
                send({ type: E.continueReq });
              }}
            >
              AI vs AI
            </button>
            <span>
              delay (ms) transitions <br /> to see them in inspector frame:
            </span>
            <select
              defaultValue={TTT_DELAY_OPTIONS.default}
              onChange={(e) =>
                send({ type: E.changeTransitionDelayReq, delay: Number(e.target.value) as TicTacToeTransitionDelay })
              }
            >
              {Object.values(TTT_DELAY_OPTIONS)
                .sort((a, b) => (a > b ? 1 : -1))
                .map((delay) => (
                  <option key={delay} value={delay}>
                    {delay}
                  </option>
                ))}
            </select>
            <span>
              switch from machine(x:n) <br /> to a player in inspector frame <br /> when game starts
            </span>
          </div>
        );
      }

      case machineState.matches(S.playing): {
        const currentPlayer = machineState.context.turnOrder.current;
        const { symbol: currentPlayerSymbol } = machineState.context.opponents[currentPlayer];
        const isPlayersTurn = machineState.context.opponents[currentPlayer].type === PLAYER_TYPE.user;
        const isFirstTurn = machineState.context.turnOrder.turnsMade === 0;
        const makeTurn = isPlayersTurn
          ? (index: FieldCellIndex) => () => {
              send({
                type: E.acceptTurnReq,
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
                    backgroundColor:
                      ((isPlayersTurn && index === FIELD.center) || (isPlayersTurn && !isFirstTurn)) && cell === null
                        ? '#cbffb6'
                        : '#ffffff',
                    transition: 'background .5s ease',
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
              <button type="button" onClick={() => send({ type: E.giveUpReq })}>
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
            <button type="button" onClick={() => send({ type: E.retryReq })}>
              Retry
            </button>
            <button type="button" onClick={() => send({ type: E.setUpNewGame })}>
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

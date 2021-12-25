import styled from '@emotion/styled';
import { MenuButton } from '../../components/MenuButton';

import {
  PLAYER_NUM,
  PLAYER_TYPE,
  TTT_EVENT_TYPE as E,
  TicTacToeTransitionDelay,
  TTT_DELAY_OPTIONS,
  TicTacToeMachineSend,
} from '../../features/TicTacToe';

const MenuContainer = styled.div`
  display: grid;
  gap: 8px;
`;

const TransitionDelaySelect = styled.select`
  cursor: pointer;
`;

const RENDER_DELAY_OPTIONS = Object.values(TTT_DELAY_OPTIONS)
  .sort((a, b) => (a > b ? 1 : -1))
  .map((delay) => (
    <option key={delay} value={delay}>
      {delay}ms
    </option>
  ));

type TicTacToePageSettingUpProps = {
  send: TicTacToeMachineSend;
};

/**
 * Represents first phase of the game, by showing starting options and configuration.
 */
export const TicTacToePageSettingUp: React.FC<TicTacToePageSettingUpProps> = ({ send }) => {
  // the ttt machine configured to play pvp by default
  // , so we only need to send continueReq
  const startPvPGame = () => send({ type: E.continueReq });

  // to set a PvA game, we need to send changePlayerReq to set second player to be agent
  // , and continueReq to start playing
  const startPvAGame = () => {
    send({
      type: E.changePlayerReq,
      kind: PLAYER_NUM.player2,
      value: PLAYER_TYPE.agent,
    });
    send({ type: E.continueReq });
  };

  // to set a AvA, we need to set both players to be agents
  // , and then send continueReq
  const startAvAGame = () => {
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
  };

  // to update transition delay we should not forget to cast target.value to Number
  const updateDelay = (e: React.ChangeEvent<HTMLSelectElement>) => {
    send({
      type: E.changeTransitionDelayReq,
      delay: Number(e.target.value) as TicTacToeTransitionDelay,
    });
  };

  return (
    <MenuContainer>
      <MenuButton type="button" onClick={startPvPGame}>
        Player vs Player
      </MenuButton>
      <MenuButton type="button" onClick={startPvAGame}>
        Player vs AI
      </MenuButton>
      <MenuButton type="button" onClick={startAvAGame}>
        AI vs AI
      </MenuButton>
      <span>
        delay transitions <br /> to see them in inspector frame:
      </span>
      <TransitionDelaySelect defaultValue={TTT_DELAY_OPTIONS.default} onChange={updateDelay}>
        {RENDER_DELAY_OPTIONS}
      </TransitionDelaySelect>
      <span>
        switch from machine(x:n) <br /> to a player in inspector frame <br /> when game starts
      </span>
    </MenuContainer>
  );
};

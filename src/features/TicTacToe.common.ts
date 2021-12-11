import { ActorRef } from 'xstate';

export const TicTacToeActorEventTypes = {
  MAKE_TURN_REQ: 'MAKE_TURN_REQ',
} as const;

// Machine to Actor -- Msg
export type TicTacToeActorEvents = { type: typeof TicTacToeActorEventTypes.MAKE_TURN_REQ };

export const PLAYER_TYPE = {
  user: 'user',
  agent: 'agent',
} as const;

export type PlayerContext =
  | { type: typeof PLAYER_TYPE.user }
  | {
      type: typeof PLAYER_TYPE.agent;
      ref: ActorRef<TicTacToeActorEvents>;
    };

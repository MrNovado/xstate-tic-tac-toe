import { createMachine, StateMachine } from 'xstate';

import { FIELD_INITIAL, PlayerFieldSymbol } from './TicTacToe.machine.types';
import { TicTacToeActorEvents, TicTacToeActorEventTypes as E } from './TicTacToe.common';
import {
  MAKING_TURN_ACTION,
  TicTacToeActorContext,
  TicTacToeActorState,
  TicTacToeActorActions as A,
  TicTacToeActorConditions as C,
  TicTacToeActorStateNodes as S,
} from './TicTacToe.actor.types';

/**
 * This machine defines actor' states using
 * Newell and Simon's expert model with rule ordering:
 *
 * - https://en.wikipedia.org/wiki/Tic-tac-toe#Combinatorics
 * - https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy
 * - https://doi.org/10.1016%2F0364-0213%2893%2990003-Q
 */
export const createTicTacToeActor = (
  symbol: PlayerFieldSymbol,
): StateMachine<TicTacToeActorContext, Record<string, unknown>, TicTacToeActorEvents, TicTacToeActorState> =>
  createMachine<TicTacToeActorContext, TicTacToeActorEvents, TicTacToeActorState>(
    {
      context: {
        filed: FIELD_INITIAL,
        symbol,
        moveReady: null,
      },
      initial: S.awaitingTurn,
      states: {
        [S.awaitingTurn]: {
          on: {
            [E.MAKE_TURN_REQ]: {
              target: S.tryingToWin,
              actions: [A.saveField],
            },
          },
        },

        [S.makingTurn]: {
          on: {
            '': {
              target: S.awaitingTurn,
              actions: A.makeTurn,
            },
          },
        },

        [S.tryingToWin]: {
          entry: A.assesWinning,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToBlockWin,
              },
            ],
          },
        },
        [S.tryingToBlockWin]: {
          entry: A.assesBlockingWin,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToFork,
              },
            ],
          },
        },
        [S.tryingToFork]: {
          entry: A.assesForking,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToBlockFork,
              },
            ],
          },
        },
        [S.tryingToBlockFork]: {
          entry: A.assesBlockingFork,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToTakeCenter,
              },
            ],
          },
        },
        [S.tryingToTakeCenter]: {
          entry: A.assesTakingCenter,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToTakeOppositeCorner,
              },
            ],
          },
        },
        [S.tryingToTakeOppositeCorner]: {
          entry: A.assesTakingOppositeCorner,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToTakeCorner,
              },
            ],
          },
        },
        [S.tryingToTakeCorner]: {
          entry: A.assesTakingCorner,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.tryingToTakeEmptySide,
              },
            ],
          },
        },
        [S.tryingToTakeEmptySide]: {
          entry: A.assesTakingEmptySide,
          on: {
            '': [
              MAKING_TURN_ACTION,
              {
                target: S.givingUp,
              },
            ],
          },
        },

        [S.givingUp]: {
          on: {
            '': {
              target: S.awaitingTurn,
              actions: A.giveUp,
            },
          },
        },
      },
    },
    {
      // TODO:
      guards: {
        [C.verifyTurnReady]: ({ moveReady }: TicTacToeActorContext) => moveReady?.type === 'commit',
      },
      // TODO:
      actions: {},
    },
  );

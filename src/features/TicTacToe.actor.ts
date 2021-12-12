import { createMachine, StateMachine, assign, sendParent } from 'xstate';

import sample from 'lodash.sample';

import {
  TicTacToeActorEvents,
  TicTacToeActorEventTypes as E,
  TicTacToeEventTypes as Msg,
  TicTacToeEvents,
  FIELD_INITIAL,
  PlayerFieldSymbol,
  TicTacToeEventTypes,
  FIELD,
  FieldContext,
  PLAYER_NUM,
} from './TicTacToe.common';
import {
  TicTacToeActorContext,
  TicTacToeActorState,
  TicTacToeActorActions as A,
  TicTacToeActorConditions as C,
  TicTacToeActorStateNodes as S,
} from './TicTacToe.actor.types';
import { getOpponent, find2InARowWith1Free, findAFork } from './TicTacToe.actor.business';

const MAKING_TURN_ACTION = {
  target: S.makingTurn,
  cond: C.verifyTurnReady,
} as const;

const MSG_DELAY = 300;

/**
 * This machine defines actor' states using
 * Newell and Simon's expert model with rule ordering:
 *
 * - https://en.wikipedia.org/wiki/Tic-tac-toe#Combinatorics
 * - https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy
 * - https://doi.org/10.1016%2F0364-0213%2893%2990003-Q
 */
export const createTicTacToeActor = (
  givenSymbol: PlayerFieldSymbol,
): StateMachine<TicTacToeActorContext, Record<string, unknown>, TicTacToeActorEvents, TicTacToeActorState> =>
  createMachine<TicTacToeActorContext, TicTacToeActorEvents, TicTacToeActorState>(
    {
      context: {
        field: FIELD_INITIAL,
        player: PLAYER_NUM.player2,
        symbol: givenSymbol,
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
          always: [
            {
              target: S.awaitingTurn,
              actions: A.makeTurn,
            },
          ],
        },

        [S.tryingToWin]: {
          entry: A.assesWinning,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToBlockWin,
            },
          ],
        },
        [S.tryingToBlockWin]: {
          entry: A.assesBlockingWin,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToFork,
            },
          ],
        },
        [S.tryingToFork]: {
          entry: A.assesForking,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToBlockFork,
            },
          ],
        },
        [S.tryingToBlockFork]: {
          entry: A.assesBlockingFork,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeCenter,
            },
          ],
        },
        [S.tryingToTakeCenter]: {
          entry: A.assesTakingCenter,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeOppositeCorner,
            },
          ],
        },
        [S.tryingToTakeOppositeCorner]: {
          entry: A.assesTakingOppositeCorner,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeCorner,
            },
          ],
        },
        [S.tryingToTakeCorner]: {
          entry: A.assesTakingCorner,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeEmptySide,
            },
          ],
        },
        [S.tryingToTakeEmptySide]: {
          entry: A.assesTakingSide,
          always: [
            MAKING_TURN_ACTION,
            {
              target: S.givingUp,
            },
          ],
        },

        [S.givingUp]: {
          always: [
            {
              target: S.awaitingTurn,
              actions: A.giveUp,
            },
          ],
        },
      },
    },
    {
      guards: {
        [C.verifyTurnReady]: ({ moveReady }: TicTacToeActorContext) => moveReady?.type === 'commit',
      },
      actions: {
        /**
         * CHILD-PARENT Msg ===================================================
         */

        [A.saveField]: assign({
          player: (_, event) => event.player,
          field: (_, event) => event.field,
        }),

        [A.makeTurn]: sendParent(
          ({
            player,
            moveReady,
          }): Extract<
            TicTacToeEvents,
            { type: typeof TicTacToeEventTypes.ACCEPT_TURN_REQ | typeof TicTacToeEventTypes.GIVE_UP_TURN_REQ }
          > => {
            if (moveReady?.type === 'commit') {
              return { type: Msg.ACCEPT_TURN_REQ, index: moveReady.turnTo, sender: player };
            }

            return { type: Msg.GIVE_UP_TURN_REQ };
          },
          { delay: MSG_DELAY },
        ),

        [A.giveUp]: sendParent(
          (): Extract<TicTacToeEvents, { type: typeof TicTacToeEventTypes.GIVE_UP_TURN_REQ }> => {
            return { type: Msg.GIVE_UP_TURN_REQ };
          },
          { delay: MSG_DELAY },
        ),

        /**
         * ACTOR BUSINESS =====================================================
         */

        [A.assesWinning]: assign({
          moveReady: ({ field, symbol }) => {
            return assesWinning(field, symbol);
          },
        }),
        [A.assesBlockingWin]: assign({
          moveReady: ({ field, symbol }) => {
            const opponentSymbol = getOpponent(symbol);
            return assesWinning(field, opponentSymbol);
          },
        }),
        [A.assesForking]: assign({
          moveReady: ({ field, symbol }) => {
            return assesForking(field, symbol);
          },
        }),
        [A.assesBlockingFork]: assign({
          moveReady: ({ field, symbol }) => {
            const opponentSymbol = getOpponent(symbol);
            return assesForking(field, opponentSymbol);
          },
        }),
        [A.assesTakingCenter]: assign({
          moveReady: ({ field }) => {
            if (field[FIELD.CENTER] === null) {
              return { type: 'commit', turnTo: FIELD.CENTER };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.assesTakingOppositeCorner]: assign({
          moveReady: ({ field, symbol }) => {
            const opponent = getOpponent(symbol);
            // if my opponent is in a corner, and
            // if the opposite corner is empty
            const corners = [
              {
                is: field[FIELD.CORNERS.TOP_LEFT] === opponent && field[FIELD.CORNERS.BOT_RIGHT] === null,
                index: FIELD.CORNERS.BOT_RIGHT,
              },
              {
                is: field[FIELD.CORNERS.TOP_RIGHT] === opponent && field[FIELD.CORNERS.BOT_LEFT] === null,
                index: FIELD.CORNERS.BOT_LEFT,
              },
              {
                is: field[FIELD.CORNERS.BOT_LEFT] === opponent && field[FIELD.CORNERS.TOP_RIGHT] === null,
                index: FIELD.CORNERS.TOP_RIGHT,
              },
              {
                is: field[FIELD.CORNERS.BOT_RIGHT] === opponent && field[FIELD.CORNERS.TOP_LEFT] === null,
                index: FIELD.CORNERS.TOP_LEFT,
              },
            ];

            const possibleOppositeCorners = corners.filter((inv) => inv.is);
            const oppositeCorner = sample(possibleOppositeCorners);
            if (oppositeCorner) {
              return { type: 'commit', turnTo: oppositeCorner.index };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.assesTakingCorner]: assign({
          moveReady: ({ field }) => {
            const corners = [
              { value: field[FIELD.CORNERS.TOP_LEFT], index: FIELD.CORNERS.TOP_LEFT },
              { value: field[FIELD.CORNERS.TOP_RIGHT], index: FIELD.CORNERS.TOP_RIGHT },
              { value: field[FIELD.CORNERS.BOT_LEFT], index: FIELD.CORNERS.BOT_LEFT },
              { value: field[FIELD.CORNERS.BOT_RIGHT], index: FIELD.CORNERS.BOT_RIGHT },
            ];

            const possibleFreeCorners = corners.filter((corner) => corner.value === null);
            const freeCorner = sample(possibleFreeCorners);
            if (freeCorner) {
              return { type: 'commit', turnTo: freeCorner.index };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.assesTakingSide]: assign({
          moveReady: ({ field }) => {
            const sides = [
              { value: field[FIELD.EDGES.TOP], index: FIELD.EDGES.TOP },
              { value: field[FIELD.EDGES.LEFT], index: FIELD.EDGES.LEFT },
              { value: field[FIELD.EDGES.RIGHT], index: FIELD.EDGES.RIGHT },
              { value: field[FIELD.EDGES.BOT], index: FIELD.EDGES.BOT },
            ];

            const possibleFreeSides = sides.filter((side) => side.value === null);
            const freeSide = sample(possibleFreeSides);
            if (freeSide) {
              return { type: 'commit', turnTo: freeSide.index };
            }

            return { type: 'tryOtherMove' };
          },
        }),
      },
    },
  );

/*
 * COMMON ACTIONS =============================================================
 */

function assesWinning(field: FieldContext, symbol: PlayerFieldSymbol): TicTacToeActorContext['moveReady'] {
  const combination = find2InARowWith1Free(field, symbol);
  const turnTo = combination?.find((index) => field[index] === null);
  if (turnTo !== undefined) {
    return { type: 'commit', turnTo };
  }

  return { type: 'tryOtherMove' };
}

function assesForking(field: FieldContext, symbol: PlayerFieldSymbol): TicTacToeActorContext['moveReady'] {
  const fork = findAFork(field, symbol);
  if (fork) {
    return { type: 'commit', turnTo: fork.intersectionIndex };
  }

  return { type: 'tryOtherMove' };
}

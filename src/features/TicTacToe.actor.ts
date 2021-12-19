import { createMachine, StateMachine, assign, sendParent, Expr } from 'xstate';

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
  TIC_TAC_TOE_DELAY_OPTIONS,
} from './TicTacToe.common';
import {
  TicTacToeActorContext,
  TicTacToeActorState,
  TicTacToeActorActions as A,
  TicTacToeActorConditions as C,
  TicTacToeActorStateNodes as S,
} from './TicTacToe.actor.types';
import { getOpponent, find2InARowWith1Free, findAFork } from './TicTacToe.actor.business';

const MSG_DELAY = 300;

const MAKING_TURN_ACTION = {
  target: S.makingTurn,
  cond: C.verifyTurnReady,
  delay: ((ctx) => ctx.transitionDelay) as Expr<TicTacToeActorContext, TicTacToeActorEvents, number>,
} as const;

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
        transitionDelay: TIC_TAC_TOE_DELAY_OPTIONS.default,
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
          /**
           * NOTE: I'm only adding transition delay for educational purposes
           *       so we could clearly see in inspector what's happening with the actor.
           *
           * Otherwise, I'd be using `always` instead of `after`.
           */
          after: [
            {
              target: S.awaitingTurn,
              actions: A.makeTurn,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },

        [S.tryingToWin]: {
          entry: A.tryWinning,
          after: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToBlockWin,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },
        [S.tryingToBlockWin]: {
          entry: A.tryBlockingWin,
          after: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToFork,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },
        [S.tryingToFork]: {
          entry: A.tryForking,
          after: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToBlockFork,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },
        [S.tryingToBlockFork]: {
          entry: A.tryBlockingFork,
          after: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeCenter,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },
        [S.tryingToTakeCenter]: {
          entry: A.tryTakingCenter,
          after: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeOppositeCorner,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },
        [S.tryingToTakeOppositeCorner]: {
          entry: A.tryTakingOppositeCorner,
          after: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeCorner,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },
        [S.tryingToTakeCorner]: {
          entry: A.tryTakingCorner,
          after: [
            MAKING_TURN_ACTION,
            {
              target: S.tryingToTakeEmptySide,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },
        [S.tryingToTakeEmptySide]: {
          entry: A.tryTakingSide,
          after: [
            MAKING_TURN_ACTION,
            {
              target: S.givingUp,
              delay: (ctx) => ctx.transitionDelay,
            },
          ],
        },

        [S.givingUp]: {
          after: [
            {
              target: S.awaitingTurn,
              actions: A.giveUp,
              delay: (ctx) => ctx.transitionDelay,
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
          transitionDelay: (_, event) => event.transitionDelay,
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

        [A.tryWinning]: assign({
          moveReady: ({ field, symbol }) => {
            return tryWinning(field, symbol);
          },
        }),
        [A.tryBlockingWin]: assign({
          moveReady: ({ field, symbol }) => {
            const opponentSymbol = getOpponent(symbol);
            return tryWinning(field, opponentSymbol);
          },
        }),
        [A.tryForking]: assign({
          moveReady: ({ field, symbol }) => {
            return tryForking(field, symbol);
          },
        }),
        [A.tryBlockingFork]: assign({
          moveReady: ({ field, symbol }) => {
            const opponentSymbol = getOpponent(symbol);
            return tryForking(field, opponentSymbol);
          },
        }),
        [A.tryTakingCenter]: assign({
          moveReady: ({ field }) => {
            if (field[FIELD.CENTER] === null) {
              return { type: 'commit', turnTo: FIELD.CENTER };
            }

            return { type: 'tryOtherMove' };
          },
        }),
        [A.tryTakingOppositeCorner]: assign({
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
        [A.tryTakingCorner]: assign({
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
        [A.tryTakingSide]: assign({
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

function tryWinning(field: FieldContext, symbol: PlayerFieldSymbol): TicTacToeActorContext['moveReady'] {
  const combination = find2InARowWith1Free(field, symbol);
  const turnTo = combination?.find((index) => field[index] === null);
  if (turnTo !== undefined) {
    return { type: 'commit', turnTo };
  }

  return { type: 'tryOtherMove' };
}

function tryForking(field: FieldContext, symbol: PlayerFieldSymbol): TicTacToeActorContext['moveReady'] {
  const fork = findAFork(field, symbol);
  if (fork) {
    return { type: 'commit', turnTo: fork.intersectionIndex };
  }

  return { type: 'tryOtherMove' };
}

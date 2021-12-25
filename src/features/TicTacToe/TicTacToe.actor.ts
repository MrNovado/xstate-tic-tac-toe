import { createMachine, StateMachine, assign, sendParent, Expr } from 'xstate';

import sample from 'lodash.sample';

import {
  TicTacToeActorEvents,
  TTT_ACTOR_EVENT_TYPE as E,
  TTT_EVENT_TYPE as Msg,
  TicTacToeEvents,
  FIELD_INITIAL,
  PlayerFieldSymbol,
  TTT_EVENT_TYPE,
  FIELD,
  FieldContext,
  PLAYER_NUM,
  TTT_DELAY_OPTIONS,
} from './TicTacToe.common';
import {
  TicTacToeActorContext,
  TicTacToeActorState,
  TTT_ACTOR_ACTION as A,
  TTT_ACTOR_GUARD as G,
  TTT_ACTOR_STATE as S,
} from './TicTacToe.actor.types';
import { getOpponent, find2InARowWith1Free, findAFork } from './TicTacToe.actor.business';

const MSG_DELAY = 300;

const MAKING_TURN_ACTION = {
  target: S.makingTurn,
  cond: G.verifyTurnReady,
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
        transitionDelay: TTT_DELAY_OPTIONS.default,
      },
      initial: S.awaitingTurn,
      states: {
        [S.awaitingTurn]: {
          on: {
            [E.makeTurnReq]: {
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
        [G.verifyTurnReady]: ({ moveReady }: TicTacToeActorContext) => moveReady?.type === 'commit',
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
            { type: typeof TTT_EVENT_TYPE.acceptTurnReq | typeof TTT_EVENT_TYPE.giveUpReq }
          > => {
            if (moveReady?.type === 'commit') {
              return { type: Msg.acceptTurnReq, index: moveReady.turnTo, sender: player };
            }

            return { type: Msg.giveUpReq };
          },
          { delay: MSG_DELAY },
        ),

        [A.giveUp]: sendParent(
          (): Extract<TicTacToeEvents, { type: typeof TTT_EVENT_TYPE.giveUpReq }> => {
            return { type: Msg.giveUpReq };
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
            if (field[FIELD.center] === null) {
              return { type: 'commit', turnTo: FIELD.center };
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
                is: field[FIELD.corners.topLeft] === opponent && field[FIELD.corners.botRight] === null,
                index: FIELD.corners.botRight,
              },
              {
                is: field[FIELD.corners.topRight] === opponent && field[FIELD.corners.botLeft] === null,
                index: FIELD.corners.botLeft,
              },
              {
                is: field[FIELD.corners.botLeft] === opponent && field[FIELD.corners.topRight] === null,
                index: FIELD.corners.topRight,
              },
              {
                is: field[FIELD.corners.botRight] === opponent && field[FIELD.corners.topLeft] === null,
                index: FIELD.corners.topLeft,
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
              { value: field[FIELD.corners.topLeft], index: FIELD.corners.topLeft },
              { value: field[FIELD.corners.topRight], index: FIELD.corners.topRight },
              { value: field[FIELD.corners.botLeft], index: FIELD.corners.botLeft },
              { value: field[FIELD.corners.botRight], index: FIELD.corners.botRight },
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
              { value: field[FIELD.edges.top], index: FIELD.edges.top },
              { value: field[FIELD.edges.left], index: FIELD.edges.left },
              { value: field[FIELD.edges.right], index: FIELD.edges.right },
              { value: field[FIELD.edges.bot], index: FIELD.edges.bot },
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

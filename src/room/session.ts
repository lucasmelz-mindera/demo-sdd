import type { Game, Profile, Seat } from '../games/types'
import type { Message } from '../net/protocol'

/** The host's view of a room. Seat 0 is the host. */
export type Session<S> = {
  gameId: string
  players: [Profile, Profile | null]
  state: S
}

export type HostEvent =
  | { kind: 'remote'; msg: Message }
  | { kind: 'localMove'; move: unknown }
  | { kind: 'localRematch' }

export function createSession<S>(game: Game<S, unknown>, gameId: string, host: Profile): Session<S> {
  return { gameId, players: [host, null], state: game.initialState() }
}

/** Host-side reducer: the host is the only one that validates moves. */
export function hostReduce<S>(
  game: Game<S, unknown>,
  session: Session<S>,
  event: HostEvent,
): { session: Session<S>; outgoing: Message[] } {
  const unchanged = { session, outgoing: [] }

  const move = (seat: Seat, m: unknown) => {
    if (!session.players[1]) return unchanged
    const state = game.applyMove(session.state, m, seat)
    if (state === null) return unchanged
    return {
      session: { ...session, state },
      outgoing: [{ type: 'state', gameId: session.gameId, state } satisfies Message],
    }
  }

  // Either player may restart once the game is over; the host (seat 0, X) moves first again.
  const rematch = () => {
    if (game.result(session.state).kind === 'playing') return unchanged
    const state = game.initialState()
    return {
      session: { ...session, state },
      outgoing: [{ type: 'state', gameId: session.gameId, state } satisfies Message],
    }
  }

  if (event.kind === 'localMove') return move(0, event.move)
  if (event.kind === 'localRematch') return rematch()

  const { msg } = event
  switch (msg.type) {
    case 'join': {
      if (session.players[1]) return unchanged
      const [host] = session.players
      return {
        session: { ...session, players: [host, { name: msg.name, emoji: msg.emoji }] },
        outgoing: [
          { type: 'join', name: host.name, emoji: host.emoji },
          { type: 'state', gameId: session.gameId, state: session.state },
        ],
      }
    }
    case 'move':
      return move(1, msg.move)
    case 'rematch':
      return rematch()
    default:
      return unchanged
  }
}

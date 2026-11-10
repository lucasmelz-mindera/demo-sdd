export type Message =
  | { type: 'join'; name: string; emoji: string }
  | { type: 'move'; move: unknown }
  | { type: 'state'; gameId: string; state: unknown }
  | { type: 'rematch' }
  | { type: 'full' }

const NAME_MAX = 20

/** Validates anything received from a peer. Returns `null` for anything that isn't a known message. */
export function parseMessage(data: unknown): Message | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>

  switch (d.type) {
    case 'join': {
      if (typeof d.name !== 'string' || typeof d.emoji !== 'string') return null
      const name = d.name.trim().slice(0, NAME_MAX).trimEnd()
      if (!name) return null
      return { type: 'join', name, emoji: d.emoji }
    }
    case 'move':
      if (!('move' in d)) return null
      return { type: 'move', move: d.move }
    case 'state':
      if (typeof d.gameId !== 'string' || d.state === undefined) return null
      return { type: 'state', gameId: d.gameId, state: d.state }
    case 'rematch':
      return { type: 'rematch' }
    case 'full':
      return { type: 'full' }
    default:
      return null
  }
}

/** Why a joiner couldn't get into a room. */
export type JoinFailure = 'not-found' | 'full' | 'unreachable'

const UNREACHABLE = new Set(['network', 'server-error', 'socket-error', 'socket-closed', 'browser-incompatible', 'webrtc'])

/** Maps a PeerJS `Peer` error type to a join failure, or `null` if it isn't one. */
export function peerErrorToFailure(type: string): JoinFailure | null {
  if (type === 'peer-unavailable') return 'not-found'
  return UNREACHABLE.has(type) ? 'unreachable' : null
}

import type { Peer } from 'peerjs'
import type { Profile } from '../games/types'

export type HostEntry = { gameId: string; roomId: string; peer: Peer; profile: Profile }

// Module-level memory only: a reload forgets it, so a refreshed host becomes a visitor.
let current: HostEntry | undefined

export function setHost(entry: HostEntry): void {
  current = entry
}

export function getHost(gameId: string, roomId: string): HostEntry | undefined {
  if (current && current.gameId === gameId && current.roomId === roomId) return current
  return undefined
}

export function clearHost(): void {
  current?.peer.destroy()
  current = undefined
}

import { Peer, type DataConnection } from 'peerjs'
import type { Profile } from '../games/types'
import { generateRoomId, roomPeerId } from '../room/roomId'
import { parseMessage, type Message } from './protocol'

/** Claims a fresh room's peer ID and resolves once the signalling server has accepted it. */
export function createHostPeer(gameId: string): Promise<{ peer: Peer; roomId: string }> {
  const roomId = generateRoomId()
  const peer = new Peer(roomPeerId(gameId, roomId))
  return new Promise((resolve, reject) => {
    peer.on('open', () => resolve({ peer, roomId }))
    peer.on('error', (err) => {
      peer.destroy()
      reject(err)
    })
  })
}

type HostHandlers = {
  onJoin(profile: Profile): void
  onMessage(msg: Message): void
}

/**
 * Seats the first connection that sends a valid `join`. `stop()` only removes listeners and
 * never destroys the `Peer`, so a StrictMode remount can call `hostRoom` again.
 */
export function hostRoom(peer: Peer, h: HostHandlers): { send(m: Message): void; stop(): void } {
  let seated: DataConnection | null = null
  const conns: DataConnection[] = []

  const onConnection = (conn: DataConnection) => {
    conns.push(conn)
    conn.on('data', (data) => {
      const msg = parseMessage(data)
      if (!msg) return
      if (conn === seated) {
        h.onMessage(msg)
      } else if (!seated && msg.type === 'join') {
        seated = conn
        h.onJoin({ name: msg.name, emoji: msg.emoji })
      }
    })
  }
  peer.on('connection', onConnection)

  return {
    send(m) {
      if (seated?.open) seated.send(m)
    },
    stop() {
      peer.off('connection', onConnection)
      for (const conn of conns) conn.removeAllListeners('data')
    },
  }
}

type JoinHandlers = {
  onMessage(msg: Message): void
}

/** Joins a room as seat 1: connects only after our own `Peer` is open, says hello on `conn.open`. */
export function joinRoom(
  gameId: string,
  roomId: string,
  hello: Profile,
  h: JoinHandlers,
): { send(m: Message): void; cancel(): void } {
  const peer = new Peer()
  let conn: DataConnection | null = null

  peer.on('open', () => {
    conn = peer.connect(roomPeerId(gameId, roomId), { reliable: true })
    conn.on('open', () => conn?.send({ type: 'join', name: hello.name, emoji: hello.emoji } satisfies Message))
    conn.on('data', (data) => {
      const msg = parseMessage(data)
      if (msg) h.onMessage(msg)
    })
  })

  return {
    send(m) {
      if (conn?.open) conn.send(m)
    },
    cancel() {
      peer.destroy()
    },
  }
}

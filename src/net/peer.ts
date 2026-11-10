import { Peer, type DataConnection } from 'peerjs'
import type { Profile } from '../games/types'
import { generateRoomId, roomPeerId } from '../room/roomId'
import { parseMessage, peerErrorToFailure, type JoinFailure, type Message } from './protocol'

const CREATE_ATTEMPTS = 3
const OPEN_TIMEOUT_MS = 15_000
const JOIN_BACKSTOP_MS = 60_000

/**
 * Claims a fresh room's peer ID and resolves once the signalling server has accepted it.
 * A taken ID destroys the `Peer`, so each retry uses a new room ID and a new `Peer`.
 */
export function createHostPeer(gameId: string): Promise<{ peer: Peer; roomId: string }> {
  return new Promise((resolve, reject) => {
    let current: Peer | null = null
    let settled = false
    const timer = setTimeout(() => fail(new Error('Timed out waiting for the signalling server')), OPEN_TIMEOUT_MS)
    const fail = (err: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      current?.destroy()
      reject(err)
    }

    const attempt = (n: number) => {
      const roomId = generateRoomId()
      const peer = new Peer(roomPeerId(gameId, roomId))
      current = peer
      peer.on('open', () => {
        if (current !== peer || settled) return
        settled = true
        clearTimeout(timer)
        keepSignalling(peer)
        resolve({ peer, roomId })
      })
      peer.on('error', (err) => {
        if (current !== peer || settled) return
        if (err.type === 'unavailable-id' && n < CREATE_ATTEMPTS) {
          peer.destroy()
          attempt(n + 1)
        } else {
          fail(err)
        }
      })
    }
    attempt(1)
  })
}

/**
 * Losing the signalling server isn't the opponent leaving: reconnect with no UI change.
 * Deferred because `destroy()` emits `disconnected` before it marks the `Peer` destroyed.
 */
function keepSignalling(peer: Peer) {
  peer.on('disconnected', () => {
    setTimeout(() => {
      if (peer.destroyed || !peer.disconnected) return
      try {
        peer.reconnect()
      } catch (err) {
        console.warn('Could not reconnect to the signalling server', err)
      }
    }, 1000)
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

  const turnAway = (conn: DataConnection) => {
    conn.send({ type: 'full' } satisfies Message)
    conn.close({ flush: true })
  }

  const onConnection = (conn: DataConnection) => {
    conns.push(conn)
    conn.on('open', () => {
      if (seated) turnAway(conn)
    })
    conn.on('data', (data) => {
      const msg = parseMessage(data)
      if (!msg) return
      if (conn === seated) {
        h.onMessage(msg)
      } else if (!seated && msg.type === 'join') {
        seated = conn
        h.onJoin({ name: msg.name, emoji: msg.emoji })
      } else if (seated) {
        turnAway(conn)
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
      for (const conn of conns) {
        conn.removeAllListeners('data')
        conn.removeAllListeners('open')
      }
    },
  }
}

type JoinHandlers = {
  onMessage(msg: Message): void
  onFail(failure: JoinFailure): void
}

/**
 * Joins a room as seat 1: connects only after our own `Peer` is open, says hello on `conn.open`.
 * Reports at most one failure; after that it stays silent.
 */
export function joinRoom(
  gameId: string,
  roomId: string,
  hello: Profile,
  h: JoinHandlers,
): { send(m: Message): void; cancel(): void } {
  const target = roomPeerId(gameId, roomId)
  const peer = new Peer()
  let conn: DataConnection | null = null
  let failed = false
  let backstop: ReturnType<typeof setTimeout> | undefined
  const openTimer = setTimeout(() => fail('unreachable'), OPEN_TIMEOUT_MS)

  const clearTimers = () => {
    clearTimeout(openTimer)
    clearTimeout(backstop)
  }
  const fail = (f: JoinFailure) => {
    if (failed) return
    failed = true
    clearTimers()
    peer.destroy()
    h.onFail(f)
  }

  peer.on('error', (err) => {
    const f = peerErrorToFailure(err.type)
    // `peer-unavailable` carries no structured ID; only its message names the missing peer.
    if (f === 'not-found' && !err.message.includes(target)) return
    if (f) fail(f)
  })

  peer.on('open', () => {
    clearTimeout(openTimer)
    if (failed) return
    conn = peer.connect(target, { reliable: true })
    backstop = setTimeout(() => fail('unreachable'), JOIN_BACKSTOP_MS)
    conn.on('open', () => {
      clearTimeout(backstop)
      conn?.send({ type: 'join', name: hello.name, emoji: hello.emoji } satisfies Message)
    })
    conn.on('data', (data) => {
      const msg = parseMessage(data)
      if (!msg || failed) return
      if (msg.type === 'full') fail('full')
      else h.onMessage(msg)
    })
  })

  return {
    send(m) {
      if (conn?.open) conn.send(m)
    },
    cancel() {
      failed = true
      clearTimers()
      peer.destroy()
    },
  }
}

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { getGame, type GameEntry } from '../games/registry'
import type { Profile, Result, Seat } from '../games/types'
import { getHost, type HostEntry } from '../net/hostStore'
import { hostRoom, joinRoom } from '../net/peer'
import type { Message } from '../net/protocol'
import { createSession, hostReduce, type HostEvent, type Session } from '../room/session'

type Players = [Profile | null, Profile | null]
type Entry = Required<GameEntry>

export function Room() {
  const { gameId = '', roomId = '' } = useParams()
  const entry = getGame(gameId)
  const host = getHost(gameId, roomId)

  if (!entry) {
    return (
      <main className="page">
        <p>Game not found</p>
        <Link to="/">Create a new room</Link>
      </main>
    )
  }
  return host ? (
    <HostRoom key={`${gameId}/${roomId}`} entry={entry} host={host} />
  ) : (
    <JoinerRoom key={`${gameId}/${roomId}`} entry={entry} gameId={gameId} roomId={roomId} />
  )
}

function HostRoom({ entry, host }: { entry: Entry; host: HostEntry }) {
  const [session, setSession] = useState<Session<unknown>>(() =>
    createSession(entry.game, host.gameId, host.profile),
  )
  const sessionRef = useRef(session)
  const localMoveRef = useRef<(move: unknown) => void>(() => {})

  useEffect(() => {
    const dispatch = (event: HostEvent) => {
      const next = hostReduce(entry.game, sessionRef.current, event)
      sessionRef.current = next.session
      setSession(next.session)
      next.outgoing.forEach((m) => room.send(m))
    }
    const room = hostRoom(host.peer, {
      onJoin: (p) => dispatch({ kind: 'remote', msg: { type: 'join', ...p } }),
      onMessage: (msg) => dispatch({ kind: 'remote', msg }),
    })
    localMoveRef.current = (move) => dispatch({ kind: 'localMove', move })
    return () => room.stop()
  }, [entry, host])

  if (!session.players[1]) {
    const link = `${location.origin}${import.meta.env.BASE_URL}#/room/${host.gameId}/${host.roomId}`
    return (
      <main className="page">
        <p className="status">Waiting for opponent…</p>
        <p>Send this link to a friend:</p>
        <p className="link">{link}</p>
      </main>
    )
  }

  return (
    <GameView
      entry={entry}
      players={session.players}
      state={session.state}
      mySeat={0}
      onMove={(move) => localMoveRef.current(move)}
    />
  )
}

function JoinerRoom({ entry, gameId, roomId }: { entry: Entry; gameId: string; roomId: string }) {
  const [name, setName] = useState('')
  const [me, setMe] = useState<Profile | null>(null)
  const [hostProfile, setHostProfile] = useState<Profile | null>(null)
  const [state, setState] = useState<unknown>(null)
  const sendRef = useRef<(m: Message) => void>(() => {})

  useEffect(() => {
    if (!me) return
    const conn = joinRoom(gameId, roomId, me, {
      onMessage(msg) {
        if (msg.type === 'join') setHostProfile({ name: msg.name, emoji: msg.emoji })
        else if (msg.type === 'state' && msg.gameId === gameId) setState(msg.state)
      },
    })
    sendRef.current = conn.send
    return () => conn.cancel()
  }, [me, gameId, roomId])

  function join(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) setMe({ name: trimmed, emoji: '' })
  }

  if (!me) {
    return (
      <main className="page">
        <h1>Join {entry.name}</h1>
        <form onSubmit={join} className="stack">
          <label className="stack">
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} required />
          </label>
          <button type="submit">Join</button>
        </form>
      </main>
    )
  }

  if (state === null || !hostProfile) {
    return (
      <main className="page">
        <p className="status">Connecting…</p>
      </main>
    )
  }

  return (
    <GameView
      entry={entry}
      players={[hostProfile, me]}
      state={state}
      mySeat={1}
      onMove={(move) => sendRef.current({ type: 'move', move })}
    />
  )
}

const MARKS: Record<Seat, string> = { 0: 'X', 1: 'O' }

function GameView(props: {
  entry: Entry
  players: Players
  state: unknown
  mySeat: Seat
  onMove(move: unknown): void
}) {
  const { entry, players, state, mySeat, onMove } = props
  const { game, Board } = entry
  // Both sides derive the result from the state; only the host validates moves.
  const result = useMemo(() => game.result(state), [game, state])
  const turn = game.currentPlayer(state)
  const canMove = result.kind === 'playing' && turn === mySeat

  return (
    <main className="page">
      <ul className="players">
        {players.map((p, seat) => (
          <li key={seat} className={seat === mySeat ? 'me' : undefined}>
            <span className="mark">{MARKS[seat as Seat]}</span> {p?.name}
            {seat === mySeat && ' (you)'}
          </li>
        ))}
      </ul>
      <p className="status">{statusText(result, turn, mySeat, players)}</p>
      <Board state={state} result={result} mySeat={mySeat} canMove={canMove} onMove={onMove} />
    </main>
  )
}

function statusText(result: Result, turn: Seat, mySeat: Seat, players: Players): string {
  const name = (seat: Seat) => players[seat]?.name ?? 'Opponent'
  switch (result.kind) {
    case 'win':
      return result.winner === mySeat ? 'You win' : `${name(result.winner)} wins`
    case 'draw':
      return 'Draw'
    default:
      return turn === mySeat ? 'Your turn' : `${name(turn)}'s turn`
  }
}

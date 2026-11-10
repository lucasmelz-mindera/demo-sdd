import { describe, expect, it } from 'vitest'
import { tictactoe, type TttState } from '../games/tictactoe/logic'
import { createSession, hostReduce, type Session } from './session'

const host = { name: 'Host', emoji: '' }
const guest = { name: 'Guest', emoji: '' }

const reduce = (session: Session<TttState>, event: Parameters<typeof hostReduce<TttState>>[2]) =>
  hostReduce(tictactoe, session, event)

function joined() {
  return reduce(createSession(tictactoe, 'tictactoe', host), {
    kind: 'remote',
    msg: { type: 'join', ...guest },
  }).session
}

describe('createSession', () => {
  it('seats the host and leaves seat 1 empty', () => {
    const s = createSession(tictactoe, 'tictactoe', host)
    expect(s).toEqual({ gameId: 'tictactoe', players: [host, null], state: tictactoe.initialState() })
  })
})

describe('hostReduce', () => {
  it("fills seat 1 on the first join and sends the host's join and the state", () => {
    const { session, outgoing } = reduce(createSession(tictactoe, 'tictactoe', host), {
      kind: 'remote',
      msg: { type: 'join', ...guest },
    })
    expect(session.players).toEqual([host, guest])
    expect(outgoing).toEqual([
      { type: 'join', ...host },
      { type: 'state', gameId: 'tictactoe', state: tictactoe.initialState() },
    ])
  })

  it('ignores a second join', () => {
    const before = joined()
    const { session, outgoing } = reduce(before, { kind: 'remote', msg: { type: 'join', name: 'Eve', emoji: '' } })
    expect(session).toBe(before)
    expect(outgoing).toEqual([])
  })

  it('ignores moves before anyone has joined', () => {
    const before = createSession(tictactoe, 'tictactoe', host)
    const { session, outgoing } = reduce(before, { kind: 'localMove', move: { cell: 0 } })
    expect(session).toBe(before)
    expect(outgoing).toEqual([])
  })

  it('applies a local move as seat 0 and broadcasts the state', () => {
    const { session, outgoing } = reduce(joined(), { kind: 'localMove', move: { cell: 4 } })
    expect(session.state.board[4]).toBe('X')
    expect(outgoing).toEqual([{ type: 'state', gameId: 'tictactoe', state: session.state }])
  })

  it('applies a remote move as seat 1 and broadcasts the state', () => {
    const afterX = reduce(joined(), { kind: 'localMove', move: { cell: 4 } }).session
    const { session, outgoing } = reduce(afterX, { kind: 'remote', msg: { type: 'move', move: { cell: 0 } } })
    expect(session.state.board[0]).toBe('O')
    expect(outgoing).toEqual([{ type: 'state', gameId: 'tictactoe', state: session.state }])
  })

  it("rejects a remote move on seat 0's turn", () => {
    const before = joined()
    const { session, outgoing } = reduce(before, { kind: 'remote', msg: { type: 'move', move: { cell: 0 } } })
    expect(session).toBe(before)
    expect(outgoing).toEqual([])
  })

  it('changes nothing and sends nothing on an illegal move', () => {
    const afterX = reduce(joined(), { kind: 'localMove', move: { cell: 4 } }).session
    for (const move of [{ cell: 4 }, { cell: 12 }, 'garbage']) {
      const { session, outgoing } = reduce(afterX, { kind: 'remote', msg: { type: 'move', move } })
      expect(session).toBe(afterX)
      expect(outgoing).toEqual([])
    }
  })

  it('ignores a state message from the joiner', () => {
    const before = joined()
    const { session, outgoing } = reduce(before, {
      kind: 'remote',
      msg: { type: 'state', gameId: 'tictactoe', state: { board: Array(9).fill('O'), turn: 0 } },
    })
    expect(session).toBe(before)
    expect(outgoing).toEqual([])
  })
})

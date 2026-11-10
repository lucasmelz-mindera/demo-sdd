import { describe, expect, it } from 'vitest'
import { parseMessage } from './protocol'

describe('parseMessage', () => {
  it('accepts join', () => {
    expect(parseMessage({ type: 'join', name: 'Ana', emoji: '🦊' })).toEqual({
      type: 'join', name: 'Ana', emoji: '🦊',
    })
  })

  it('trims and caps the join name at 20 characters', () => {
    expect(parseMessage({ type: 'join', name: '  Ana  ', emoji: '' })).toEqual({
      type: 'join', name: 'Ana', emoji: '',
    })
    const long = parseMessage({ type: 'join', name: ` ${'a'.repeat(30)} `, emoji: '' })
    expect(long).toEqual({ type: 'join', name: 'a'.repeat(20), emoji: '' })
  })

  it('rejects join with a blank or missing name or emoji', () => {
    expect(parseMessage({ type: 'join', name: '   ', emoji: '' })).toBeNull()
    expect(parseMessage({ type: 'join', emoji: '' })).toBeNull()
    expect(parseMessage({ type: 'join', name: 'Ana' })).toBeNull()
    expect(parseMessage({ type: 'join', name: 3, emoji: '' })).toBeNull()
  })

  it('accepts move with any payload and drops extra fields', () => {
    expect(parseMessage({ type: 'move', move: { cell: 4 }, extra: 1 })).toEqual({
      type: 'move', move: { cell: 4 },
    })
  })

  it('rejects move without a move', () => {
    expect(parseMessage({ type: 'move' })).toBeNull()
  })

  it('accepts state', () => {
    const state = { board: Array(9).fill(null), turn: 0 }
    expect(parseMessage({ type: 'state', gameId: 'tictactoe', state })).toEqual({
      type: 'state', gameId: 'tictactoe', state,
    })
  })

  it('rejects state with a missing gameId or state', () => {
    expect(parseMessage({ type: 'state', state: {} })).toBeNull()
    expect(parseMessage({ type: 'state', gameId: 7, state: {} })).toBeNull()
    expect(parseMessage({ type: 'state', gameId: 'tictactoe' })).toBeNull()
  })

  it('accepts rematch and drops extra fields', () => {
    expect(parseMessage({ type: 'rematch' })).toEqual({ type: 'rematch' })
    expect(parseMessage({ type: 'rematch', extra: 1 })).toEqual({ type: 'rematch' })
  })

  it('rejects garbage and unknown types', () => {
    for (const data of [null, undefined, 42, 'join', [], {}, { type: 'nope' }, { type: 7 }]) {
      expect(parseMessage(data)).toBeNull()
    }
  })
})

import { describe, expect, it } from 'vitest'
import { applyMove, checkWinner, isDraw, tictactoe, type Cell, type TttState } from './logic'

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function boardWith(mark: 'X' | 'O', cells: number[]): Cell[] {
  const board: Cell[] = Array(9).fill(null)
  for (const c of cells) board[c] = mark
  return board
}

// X O X / X O O / O X X — full, no line
const DRAW_BOARD: Cell[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']

describe('checkWinner', () => {
  for (const mark of ['X', 'O'] as const) {
    for (const line of LINES) {
      it(`finds ${mark} on ${line.join(',')}`, () => {
        expect(checkWinner(boardWith(mark, line))).toEqual({ mark, line })
      })
    }
  }

  it('returns null with no winner', () => {
    expect(checkWinner(Array(9).fill(null))).toBeNull()
    expect(checkWinner(DRAW_BOARD)).toBeNull()
  })
})

describe('isDraw', () => {
  it('is true for a full board with no winner', () => {
    expect(isDraw(DRAW_BOARD)).toBe(true)
  })

  it('is false for a full board with a winner', () => {
    expect(isDraw(['X', 'X', 'X', 'O', 'O', 'X', 'X', 'O', 'O'])).toBe(false)
  })

  it('is false for a board that is not full', () => {
    expect(isDraw([...DRAW_BOARD.slice(0, 8), null])).toBe(false)
  })
})

describe('applyMove', () => {
  const start = tictactoe.initialState()

  it('places the mark and flips the turn', () => {
    const next = applyMove(start, { cell: 4 }, 0)
    expect(next).toEqual({ board: [null, null, null, null, 'X', null, null, null, null], turn: 1 })
    expect(applyMove(next!, { cell: 0 }, 1)?.board[0]).toBe('O')
  })

  it('rejects a taken cell', () => {
    const next = applyMove(start, { cell: 4 }, 0)!
    expect(applyMove(next, { cell: 4 }, 1)).toBeNull()
  })

  it('rejects out-of-range cells', () => {
    expect(applyMove(start, { cell: -1 }, 0)).toBeNull()
    expect(applyMove(start, { cell: 9 }, 0)).toBeNull()
  })

  it('rejects malformed moves', () => {
    for (const move of [null, undefined, 4, 'x', {}, { cell: '4' }, { cell: 1.5 }, { cell: NaN }]) {
      expect(applyMove(start, move, 0)).toBeNull()
    }
  })

  it('rejects a move out of turn', () => {
    expect(applyMove(start, { cell: 0 }, 1)).toBeNull()
  })

  it('rejects any move after the game is over', () => {
    const won: TttState = { board: boardWith('X', [0, 1, 2]), turn: 1 }
    expect(applyMove(won, { cell: 5 }, 1)).toBeNull()
    const drawn: TttState = { board: DRAW_BOARD, turn: 1 }
    expect(applyMove(drawn, { cell: 0 }, 1)).toBeNull()
  })

  it('does not mutate the input state', () => {
    const state = tictactoe.initialState()
    const copy = structuredClone(state)
    applyMove(state, { cell: 0 }, 0)
    expect(state).toEqual(copy)
  })
})

describe('tictactoe', () => {
  it('starts empty with seat 0 (X) to move', () => {
    const s = tictactoe.initialState()
    expect(s.board).toEqual(Array(9).fill(null))
    expect(tictactoe.currentPlayer(s)).toBe(0)
    expect(tictactoe.result(s)).toEqual({ kind: 'playing' })
  })

  it('reports the current player', () => {
    expect(tictactoe.currentPlayer({ board: Array(9).fill(null), turn: 1 })).toBe(1)
  })

  it('reports a win for the seat owning the mark, with the line', () => {
    expect(tictactoe.result({ board: boardWith('X', [2, 4, 6]), turn: 1 })).toEqual({
      kind: 'win', winner: 0, line: [2, 4, 6],
    })
    expect(tictactoe.result({ board: boardWith('O', [0, 3, 6]), turn: 0 })).toEqual({
      kind: 'win', winner: 1, line: [0, 3, 6],
    })
  })

  it('reports a draw', () => {
    expect(tictactoe.result({ board: DRAW_BOARD, turn: 1 })).toEqual({ kind: 'draw' })
  })
})

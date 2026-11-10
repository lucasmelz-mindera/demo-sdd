import type { Game, Result, Seat } from '../types'

export type Cell = 'X' | 'O' | null
export type TttState = { board: Cell[]; turn: Seat }
export type TttMove = { cell: number }

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

const MARKS: Record<Seat, 'X' | 'O'> = { 0: 'X', 1: 'O' }

export function checkWinner(board: Cell[]): { mark: 'X' | 'O'; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line
    const mark = board[a]
    if (mark && mark === board[b] && mark === board[c]) return { mark, line }
  }
  return null
}

export function isDraw(board: Cell[]): boolean {
  return board.every((cell) => cell !== null) && !checkWinner(board)
}

function isMove(move: unknown): move is TttMove {
  return (
    typeof move === 'object' &&
    move !== null &&
    Number.isInteger((move as { cell?: unknown }).cell)
  )
}

export function applyMove(state: TttState, move: unknown, seat: Seat): TttState | null {
  if (!isMove(move)) return null
  const { cell } = move
  if (cell < 0 || cell > 8) return null
  if (seat !== state.turn) return null
  if (state.board[cell] !== null) return null
  if (checkWinner(state.board) || isDraw(state.board)) return null

  const board = state.board.slice()
  board[cell] = MARKS[seat]
  return { board, turn: seat === 0 ? 1 : 0 }
}

function result(state: TttState): Result {
  const win = checkWinner(state.board)
  if (win) return { kind: 'win', winner: win.mark === 'X' ? 0 : 1, line: win.line }
  if (isDraw(state.board)) return { kind: 'draw' }
  return { kind: 'playing' }
}

export const tictactoe: Game<TttState, TttMove> = {
  initialState: () => ({ board: Array<Cell>(9).fill(null), turn: 0 }),
  applyMove,
  result,
  currentPlayer: (state) => state.turn,
}

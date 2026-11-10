import type { BoardProps } from '../types'
import type { TttMove, TttState } from './logic'

export function Board({ state, result, canMove, onMove }: BoardProps<TttState, TttMove>) {
  const line = result.kind === 'win' ? (result.line ?? []) : []
  return (
    <div className="ttt-board" role="grid" aria-label="Tic-tac-toe board">
      {state.board.map((cell, i) => (
        <button
          key={i}
          type="button"
          className={`ttt-cell${line.includes(i) ? ' ttt-cell--win' : ''}`}
          disabled={!canMove || cell !== null}
          onClick={() => onMove({ cell: i })}
          aria-label={cell ?? `Empty cell ${i + 1}`}
        >
          {cell}
        </button>
      ))}
    </div>
  )
}

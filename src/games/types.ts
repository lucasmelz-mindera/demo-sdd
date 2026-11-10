/** Seat 0 is the host; seat 1 is the joiner. */
export type Seat = 0 | 1

export type Profile = { name: string; emoji: string }

export type Result =
  | { kind: 'playing' }
  | { kind: 'win'; winner: Seat; line?: number[] }
  | { kind: 'draw' }

/**
 * `_Move` names the game's move type for its Board (see `BoardProps`). `applyMove` takes
 * `unknown` because moves arrive from the network and the game validates them itself.
 */
export interface Game<State, _Move> {
  initialState(): State
  /** Returns the new state, or `null` if the move is malformed or illegal. */
  applyMove(state: State, move: unknown, seat: Seat): State | null
  result(state: State): Result
  currentPlayer(state: State): Seat
}

export type BoardProps<State, Move> = {
  state: State
  result: Result
  mySeat: Seat
  canMove: boolean
  onMove(move: Move): void
}

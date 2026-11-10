import type { ComponentType } from 'react'
import { Board as TttBoard, tictactoe } from './tictactoe'
import type { BoardProps, Game } from './types'

export type GameEntry = {
  name: string
  game?: Game<any, any>
  Board?: ComponentType<BoardProps<any, any>>
  enabled: boolean
}

/** Keys match `[a-z0-9]+` because they go into peer IDs. */
export const games: Record<string, GameEntry> = {
  tictactoe: { name: 'Tic-tac-toe', game: tictactoe, Board: TttBoard, enabled: true },
  checkers: { name: 'Checkers', enabled: false },
}

/** The entry for `gameId`, only if it exists and is enabled. */
export function getGame(gameId: string): Required<GameEntry> | undefined {
  const entry = Object.hasOwn(games, gameId) ? games[gameId] : undefined
  if (!entry?.enabled || !entry.game || !entry.Board) return undefined
  return entry as Required<GameEntry>
}

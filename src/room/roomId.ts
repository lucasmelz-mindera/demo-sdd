/** No look-alikes: leaves out 0/o, 1/l/i. */
export const ROOM_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

export function generateRoomId(random: () => number = Math.random): string {
  let id = ''
  for (let i = 0; i < 6; i++) id += ROOM_ALPHABET[Math.floor(random() * ROOM_ALPHABET.length)]
  return id
}

export function roomPeerId(gameId: string, roomId: string): string {
  return `demo-sdd-${gameId}-${roomId}`
}

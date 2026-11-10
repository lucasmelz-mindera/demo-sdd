import { describe, expect, it } from 'vitest'
import { generateRoomId, ROOM_ALPHABET, roomPeerId } from './roomId'

const PEERJS_ID = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/

describe('generateRoomId', () => {
  it('is 6 characters from the room alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const id = generateRoomId()
      expect(id).toHaveLength(6)
      for (const ch of id) expect(ROOM_ALPHABET).toContain(ch)
    }
  })

  it('is deterministic with an injected random', () => {
    expect(generateRoomId(() => 0)).toBe('aaaaaa')
    expect(generateRoomId(() => 0.9999)).toBe('999999')
    const values = [0, 0.1, 0.2, 0.3, 0.4, 0.5]
    let i = 0
    const random = () => values[i++]
    expect(generateRoomId(random)).toBe(
      values.map((v) => ROOM_ALPHABET[Math.floor(v * ROOM_ALPHABET.length)]).join(''),
    )
  })

  it('leaves out look-alike characters', () => {
    for (const ch of '01ilo') expect(ROOM_ALPHABET).not.toContain(ch)
  })
})

describe('roomPeerId', () => {
  it('prefixes the game and room ids', () => {
    expect(roomPeerId('tictactoe', 'k7m2qx')).toBe('demo-sdd-tictactoe-k7m2qx')
  })

  it("matches PeerJS's ID rules", () => {
    for (let i = 0; i < 50; i++) {
      expect(roomPeerId('tictactoe', generateRoomId())).toMatch(PEERJS_ID)
    }
  })
})

import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { games } from '../games/registry'
import { createHostPeer } from '../net/peer'
import { clearHost, setHost } from '../net/hostStore'
import { EMOJIS } from '../profile/emojis'
import { EmojiPicker } from '../profile/EmojiPicker'

export function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [gameId, setGameId] = useState('tictactoe')
  const [pending, setPending] = useState(false)
  const [createFailed, setCreateFailed] = useState(false)

  // Going home ends any room this tab was hosting.
  useEffect(() => clearHost(), [])

  async function create(e: FormEvent) {
    e.preventDefault()
    const profile = { name: name.trim(), emoji }
    if (!profile.name) return
    setPending(true)
    setCreateFailed(false)
    try {
      const { peer, roomId } = await createHostPeer(gameId)
      setHost({ gameId, roomId, peer, profile })
      navigate(`/room/${gameId}/${roomId}`)
    } catch (err) {
      console.error('Could not create room', err)
      setCreateFailed(true)
      setPending(false)
    }
  }

  return (
    <main className="page">
      <h1>Game rooms</h1>
      <form onSubmit={create} className="stack">
        <fieldset className="games">
          <legend>Game</legend>
          {Object.entries(games).map(([id, g]) => (
            <label key={id} className={g.enabled ? 'game' : 'game game--disabled'}>
              <input
                type="radio"
                name="game"
                value={id}
                checked={gameId === id}
                disabled={!g.enabled}
                onChange={() => setGameId(id)}
              />
              {g.name}
              {!g.enabled && <span className="soon">coming soon</span>}
            </label>
          ))}
        </fieldset>
        <label className="stack">
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} required />
        </label>
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create room'}</button>
        {createFailed && <p role="alert">Couldn't create a room. Try again.</p>}
      </form>
    </main>
  )
}

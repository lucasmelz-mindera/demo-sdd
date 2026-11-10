import { EMOJIS } from './emojis'

export function EmojiPicker(props: { value: string; onChange(emoji: string): void; disabled?: boolean }) {
  const { value, onChange, disabled } = props
  return (
    <fieldset className="emojis" disabled={disabled}>
      <legend>Your avatar</legend>
      {EMOJIS.map((emoji) => (
        <label key={emoji} className={emoji === value ? 'emoji emoji--on' : 'emoji'}>
          <input
            type="radio"
            name="emoji"
            value={emoji}
            checked={emoji === value}
            onChange={() => onChange(emoji)}
          />
          {emoji}
        </label>
      ))}
    </fieldset>
  )
}

// TurnBubble.jsx
// One message. Always the full text, never truncated: in a research viewer,
// cutting text can change what a reader concludes.
export function TurnBubble({ role, text }) {
  const label = role === 'user' ? 'User' : 'Assistant'
  const empty = text == null || text === ''
  return (
    <div className={`bubble bubble-${role}`}>
      <div className="bubble-role">{label}</div>
      <div className="bubble-text">
        {empty ? <em>(nothing recorded)</em> : text}
      </div>
    </div>
  )
}
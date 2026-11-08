// TranscriptView.jsx
import { TurnBubble } from './TurnBubble'
import './transcript.css'

// transcript = { unit_id, turns: [{ turn_index, prompt_text, response_text, is_checkpoint }] }
// setupTurn  = the turn_index a dataset declares as its setup turn, or null.
//              Absent is normal, not an error: render nothing extra.
export function TranscriptView({ transcript, setupTurn = null }) {
  // Order by turn_index; never trust array order.
  const turns = [...transcript.turns].sort((a, b) => a.turn_index - b.turn_index)

  return (
    <ol className="transcript">
      {turns.map(t => (
        <li key={t.turn_index} className={t.is_checkpoint ? 'turn turn-checkpoint' : 'turn'}>
          <div className="turn-header">
            <span>Turn {t.turn_index}</span>
            {t.is_checkpoint && <span className="badge badge-checkpoint">Scored checkpoint</span>}
            {t.turn_index === setupTurn && <span className="badge badge-setup">Setup turn</span>}
          </div>
          <TurnBubble role="user" text={t.prompt_text} />
          <TurnBubble role="assistant" text={t.response_text} />
        </li>
      ))}
    </ol>
  )
}
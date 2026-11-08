// L054: the exact packet the judge received, rebuilt with the SAME core function score.js used.
import { buildJudgePacket } from '@core/buildJudgePacket.js';

export default function JudgePacketView({ rubric, conversation, turnIndex, identity }) {
  let packet;
  try {
    // Private notes are never published to the browser, so none is passed here.
    packet = buildJudgePacket({
      rubric, conversationRecord: conversation, turn_index: turnIndex, evaluation_note: null,
    });
  } catch (err) {
    return <div className="packet"><p>Could not rebuild the packet: {err.message}</p></div>;
  }

  const text = JSON.stringify(packet);
  const leaked = identity.filter((v) => v && text.includes(v));

  return (
    <div className="packet">
      <h3>What the judge saw</h3>
      <p className="packet__source">Rebuilt with core buildJudgePacket, the same function scoring used.</p>

      {packet.transcript.length === 0 ? (
        <p>This checkpoint turn was never generated, so there is no packet.</p>
      ) : (
        packet.transcript.map((m, i) => (
          <div key={i} className="packet__msg">
            <strong>{m.role}:</strong>
            <pre>{m.text}</pre>
          </div>
        ))
      )}

      <details>
        <summary>Rubric the judge used ({packet.rubric.rubric_version})</summary>
        {packet.rubric.criteria.map((c) => (
          <div key={c.id} className="packet__criterion">
            <strong>{c.name}</strong> ({c.id}, weight {c.weight}{c.critical ? ', critical' : ''})
            <ul>
              {Object.entries(c.anchors).map(([v, anchor]) => (
                <li key={v}><code>{v}</code>: {anchor}</li>
              ))}
            </ul>
          </div>
        ))}
      </details>

      <p>Private note: not shown. Private notes are never published to the browser.</p>

      <div className="packet__hidden">
        <strong>What the judge could NOT see</strong>
        <ul>
          <li>which model wrote the reply (model id)</li>
          <li>provider and model fingerprint</li>
          <li>unit id and run id</li>
          <li>earlier turns of the conversation</li>
        </ul>
      </div>

      <p className={`packet__scan packet__scan--${leaked.length ? 'bad' : 'ok'}`}>
        {leaked.length
          ? `Identity scan FAILED: found ${leaked.join(', ')} in the packet`
          : 'Identity scan passed: no model id or unit id in the packet'}
      </p>
    </div>
  );
}
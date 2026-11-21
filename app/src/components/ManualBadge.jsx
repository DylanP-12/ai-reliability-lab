// L062: marks a unit collected by hand through a consumer app. Shown only when the DATA says so
// (index entry collection === 'manual'), so no model name is hardcoded anywhere in the app.
export const MANUAL_CONFOUND =
  'Collected by hand in the model\u2019s consumer app, not through the pinned API. ' +
  'The system prompt, memory between chats, and sampling settings were not controlled, ' +
  'so this result is not directly comparable to API results.'

export function ManualBadge() {
  return (
    <span className="badge-manual" title={MANUAL_CONFOUND} aria-label={`Manual collection. ${MANUAL_CONFOUND}`}>
      manual
    </span>
  )
}
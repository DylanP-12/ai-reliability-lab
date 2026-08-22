export class LlmError extends Error {
  constructor(message, classification, { status = null, retryable = false } = {}) {
    super(message);
    this.name = 'LlmError';
    this.classification = classification;
    this.status = status;
    this.retryable = retryable;
  }
}

export function classify(status) {
      if (status === 429) {
    return new LlmError('rate limited', 'rate_limit', { status, retryable: true });
  }
  if (status >= 500 && status <= 599) {
    return new LlmError('server error', 'server_error', { status, retryable: true });
  }
  if (status === 400) {
    return new LlmError('bad request', 'bad_request', { status, retryable: false });
  }
  if (status === 401) {
    return new LlmError('unauthorized', 'auth', { status, retryable: false });
  }
  return new LlmError('unknown error', 'unknown', { status, retryable: false });
}

const statusesToTest = [429, 500, 503, 400, 401, 999];

for (const status of statusesToTest) {
  try {
    throw classify(status);
  } catch (err) {
    console.log(`${err.name} / ${err.classification} / retryable: ${err.retryable}`);
  }
}
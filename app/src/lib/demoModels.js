// Demo-only model list for the Run screen. NOT study data:
// prepare-app-data deliberately keeps routing (or_model, provider_pin) out of /data.
// Copied from config/models.json on 2026-11-11. Re-check prices if you edit this.
export const DEMO_MODELS = Object.freeze([
  {
    model_id: 'deepseek-v3.1', label: 'DeepSeek V3.1 (demo)',
    or_model: 'deepseek/deepseek-chat-v3.1', provider_pin: 'deepinfra',
    reasoning_enabled: false, price_in_per_m: 0.25, price_out_per_m: 0.95,
  },
]);
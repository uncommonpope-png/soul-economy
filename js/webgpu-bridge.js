/* ─── SIP-14 — WEBGPU BROWSER PREVIEW FOUNDATION (ESM) ───
   Loaded lazily from index.html via dynamic import('./js/webgpu-bridge.js')
   so it never costs anything on the main thread. WebGPU = server-free
   model execution foundation for @huggingface/transformers.js. */
export const WebGPUBridge = {
  isSupported: (typeof navigator !== 'undefined') && !!navigator.gpu,
  isInitialized: false,

  async checkAdapter() {
    if (!navigator.gpu) return { supported: false, reason: 'WebGPU not supported' };
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter ? { supported: true, adapter } : { supported: false, reason: 'No adapter found' };
    } catch (e) {
      return { supported: false, reason: e.message };
    }
  },

  /* Lazy dynamic import of transformers.js (WebGPU branch). No-op when unsupported. */
  async loadTransformers() {
    if (this._tf) return this._tf;
    if (!this.isSupported) return null;
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3');
      this._tf = mod;
      this.isInitialized = true;
      return mod;
    } catch (e) {
      console.warn('[WebGPU] transformers.js unavailable:', e);
      return null;
    }
  },

  /* One-shot diagnostic for the card chip. */
  async status() {
    const a = await this.checkAdapter();
    const out = {
      bridge: this.isSupported,
      adapter: a.supported,
      initialized: this.isInitialized,
      reason: a.reason || null
    };
    if (a.supported && a.adapter && a.adapter.info) {
      try { out.vendor = a.adapter.info.vendor || '?'; } catch (e) {}
      try { out.arch = a.adapter.info.architecture || '?'; } catch (e) {}
    }
    return out;
  }
};

if (typeof self !== 'undefined') self.WebGPUBridge = WebGPUBridge;
export default WebGPUBridge;
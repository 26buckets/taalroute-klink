/* Apply the saved colour preference before styles or app content can paint. */
(() => {
  if (window.TaalrouteAppearance) return;
  const script = document.currentScript;
  const key = script?.dataset.preferenceKey || 'taalroute-appearance-v1';
  const legacyKey = script?.dataset.legacyKey;
  const legacyField = script?.dataset.legacyField;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const valid = value => ['light', 'dark', 'system'].includes(value);
  const read = () => {
    try {
      const value = localStorage.getItem(key);
      if (valid(value)) return value;
      const legacy = legacyKey && localStorage.getItem(legacyKey);
      const previous = legacyField ? JSON.parse(legacy || '{}')[legacyField] : legacy;
      if (valid(previous)) return previous;
    } catch { /* Unavailable or invalid storage must not prevent using the app. */ }
    return 'system';
  };
  const api = {preference: read(), theme: 'light', message: '', set};
  function apply() {
    api.theme = api.preference === 'system' ? (media.matches ? 'dark' : 'light') : api.preference;
    document.documentElement.dataset.theme = api.theme;
    document.documentElement.dataset.appearance = api.preference;
    document.documentElement.style.colorScheme = api.theme;
    window.dispatchEvent(new CustomEvent('taalroute:appearance', {detail: {preference: api.preference, theme: api.theme}}));
  }
  function set(value) {
    if (!valid(value)) return;
    api.preference = value;
    api.message = '';
    try { localStorage.setItem(key, value); }
    catch { api.message = 'Je keuze werkt nu. Deze browser kan de instelling niet bewaren.'; }
    apply();
  }
  window.TaalrouteAppearance = api;
  apply();
  media.addEventListener('change', () => { if (api.preference === 'system') apply(); });
  window.addEventListener('storage', event => { if (event.key === key || event.key === legacyKey || event.key === null) { api.preference = read(); apply(); } });
})();

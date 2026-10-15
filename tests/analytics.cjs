const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'analytics.js'), 'utf8');
function load(config) {
  const scripts = [];
  const document = {
    getElementById: id => id === 'site-config' ? { textContent: JSON.stringify(config) } : null,
    createElement: () => ({}), head: { appendChild: script => scripts.push(script) }
  };
  const window = {};
  vm.runInNewContext(source, { window, document, Date, JSON, String, encodeURIComponent });
  return { api: window.ShimiAnalytics, window, scripts };
}
const sample = { ga4Id: 'G-1234567890', metaPixelId: '123456789012345', clarityId: 'abc123def4' };
const demo = load({ demo: true, analytics: sample });
assert.equal(demo.scripts.length, 0, 'demo must never load trackers, even with valid-looking IDs');
demo.api.trackContact('growth', 'en');
assert.deepEqual(JSON.parse(JSON.stringify(demo.api.events)), [{ event: 'whatsapp_click', placement: 'growth', language: 'en' }]);
const placeholder = load({ demo: false, analytics: { ga4Id: 'G-DEMO000000', metaPixelId: '000000000000000', clarityId: 'DEMO000000' } });
assert.equal(placeholder.scripts.length, 0, 'placeholder IDs must not load even if demo mode is switched off');
const production = load({ demo: false, analytics: sample });
assert.equal(production.scripts.length, 3);
production.api.trackContact('presence', 'he');
const gaEvent = production.window.dataLayer.map(args => Array.from(args)).find(args => args[1] === 'whatsapp_click');
assert.equal(gaEvent[2].placement, 'presence');
assert.equal(gaEvent[2].language, 'he');
const metaEvent = production.window.fbq.queue.map(args => Array.from(args)).find(args => args[1] === 'Contact');
assert.equal(metaEvent[2].placement, 'presence');
const clarityEvent = production.window.clarity.q.map(args => Array.from(args)).find(args => args[0] === 'event');
assert.equal(clarityEvent[1], 'whatsapp_click');
for (let i = 0; i < 60; i++) demo.api.trackContact('hero', 'en');
assert.equal(demo.api.events.length, 50);
console.log('Analytics passed: no demo requests, placeholder guards, provider initialization, localized placement events, and bounded QA queue.');

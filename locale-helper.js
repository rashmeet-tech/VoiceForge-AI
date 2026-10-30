const fs = require('fs');
const path = require('path');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/src/i18n/locales/en.json'), 'utf8'));

// Helper to assert all keys are present
function validateKeys(source, target, langName) {
  const missing = [];
  function check(src, tgt, prefix = '') {
    for (const key of Object.keys(src)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (tgt[key] === undefined) {
        missing.push(fullKey);
      } else if (typeof src[key] === 'object' && src[key] !== null) {
        check(src[key], tgt[key], fullKey);
      }
    }
  }
  check(source, target);
  if (missing.length > 0) {
    console.error(`[${langName}] Missing ${missing.length} keys:`, missing.slice(0, 10));
    return false;
  }
  console.log(`[${langName}] 100% keys validated against en.json!`);
  return true;
}

module.exports = { en, validateKeys };


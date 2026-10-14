// Phase 1: protect the deployed Details contract before adding Table behavior.
// This is a source-level contract test; browser interactions get separate tests in Phase 2.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "property_details", "property-details.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "..", "property_details", "property-details.css"), "utf8");

const preserved = [
  /birchstone-property-details-selection/,
  /\[data-property-details-app\]/,
  /\[data-property-selector\]/,
  /\[data-property-record\]/,
  /propertydetails:change/,
  /localStorage\.setItem/,
  /localStorage\.getItem/,
  /URLSearchParams/,
  /params\.set\("property", key\)/,
  /window\.addEventListener\("hashchange"/,
  /propertyDetailsInitialized/,
  /expandPropertyDetails\(app\)/,
];
for (const contract of preserved) {
  assert.match(source, contract, `Existing Details JS contract missing: ${contract}`);
}
for (const selector of [
  ".property-details-app", ".property-details-toolbar",
  ".property-record", ".property-sections", ".property-detail-grid",
  '.property-record[data-property-active="false"]',
]) {
  assert.ok(css.includes(selector), `Existing Details CSS contract missing: ${selector}`);
}
for (const contract of [
  /data-property-column-search/,
  /columnSearch\?\.addEventListener\("input", filterColumnOptions\)/,
  /option\.hidden = !option\.textContent\.toLocaleLowerCase\(\)\.includes\(query\)/,
]) {
  assert.match(source, contract, `Column search JS contract missing: ${contract}`);
}
assert.match(css, /\.property-column-chooser__option\[hidden\]/, "Column search must hide nonmatching options");


// The centered layout must use the Interact document as its anchor while
// bounding the expanded app to the viewport and avoiding resize drift.
assert.match(source, /document\.getElementById\("document"\)/, "Interact document must anchor centering");
assert.match(source, /app\.style\.setProperty\("margin-left", "0px", "important"\)/, "Recompute from unshifted position");
assert.match(source, /const target = Math\.min\(1440,/, "Desktop width must remain capped at 1440px");
assert.match(source, /bounds\.left \+ \(bounds\.width - target\) \/ 2/, "Center on Interact document");
assert.match(source, /window\.innerWidth - gutter - target/, "Respect right viewport gutter");
assert.match(source, /centeredLeft - naturalLeft \+ "px"/, "Apply centered left margin");

// Typography is deterministic in the standalone Portal preview as well as Interact.
assert.match(css, /^@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Montserrat:/, "Montserrat should load in standalone previews");
assert.match(css, /\.property-details-app :is\(h1, h2, h3, p, label, button/, "Interact heading/control font overrides must be covered");
assert.doesNotMatch(css, /font-family: 'Neutraface Text'/, "Do not rely on an Interact-only font family");

// Shared heading typography must override Interact's global NeutraText rules.
for (const [selector, weight] of [
  [".property-details-app .property-details-toolbar h1", "800"],
  [".property-details-app .property-record__hero h2", "700"],
  [".property-details-app .property-section h3", "700"],
]) {
  const escaped = selector.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\console.log("Details presentation and navigation baseline contracts intact.");");
  const rule = css.match(new RegExp(escaped + "\\\\s*\\\\{([^}]+)\\\\}"));
  assert.ok(rule, `Missing typography parity rule: ${selector}`);
  assert.match(rule[1], /font-family:\\s*'Montserrat', Arial, sans-serif !important;/);
  assert.ok(rule[1].includes(`font-weight: ${weight} !important;`));
}

console.log("Details presentation and navigation baseline contracts intact.");

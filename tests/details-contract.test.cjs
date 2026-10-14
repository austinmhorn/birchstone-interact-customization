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

console.log("Details presentation and navigation baseline contracts intact.");

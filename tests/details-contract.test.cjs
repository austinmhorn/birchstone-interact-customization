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
console.log("Details presentation and navigation baseline contracts intact.");

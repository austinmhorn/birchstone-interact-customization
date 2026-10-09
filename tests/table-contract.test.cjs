const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const js = fs.readFileSync(path.join(__dirname, "..", "property_details", "property-details.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "..", "property_details", "property-details.css"), "utf8");
for (const marker of [
  "data-property-table-view", "data-property-details-view",
  "data-property-view-button", "data-property-table-open",
  "data-property-table-search", "data-property-table-state",
  "data-property-table-manager", "data-property-table-reset",
  "data-property-table-sort", "data-property-table-count",
  "params.set(\"view\", activeView)", "propertyFromHash()",
]) assert.ok(js.includes(marker), "Missing Table interaction: " + marker);
for (const selector of [".property-view-switch", ".property-table-view", ".property-portfolio-table", ".property-table-scroll", ".property-details-app [hidden]"])
  assert.ok(css.includes(selector), "Missing Table style: " + selector);
assert.ok(js.includes("if (table && tableView && detailsView && viewButtons.length)"), "Table must be feature detected for legacy HTML");
console.log("Dual-view source contracts intact.");

for (const token of ["COLUMNS_STORAGE_KEY", "VIEW_STORAGE_KEY", "applyColumns", "data-property-column-checkbox", "data-property-columns-reset", "defaultChecked", "requestedView"]) {
  assert.ok(js.includes(token), "Phase 3 behavior missing: " + token);
}
for (const token of [".property-column-chooser", ".property-column-chooser__menu"]) {
  assert.ok(css.includes(token), "Phase 3 style missing: " + token);
}
console.log("Phase 3 column chooser and preference contracts intact.");

for (const token of ["data-property-filter-options", "selectedStates", "selectedManagers", "data-property-columns-all", "data-property-table-export", "URL.createObjectURL", "text/csv"]) {
  assert.ok(js.includes(token), "Phase 4 interaction missing: " + token);
}
assert.ok(css.includes(".property-table-multiselect"), "Multi-select filter styling missing");

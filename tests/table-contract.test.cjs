const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const js = fs.readFileSync(path.join(__dirname, "..", "property_details", "property-details.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "..", "property_details", "property-details.css"), "utf8");

for (const marker of [
  "data-property-table-view", "data-property-details-view",
  "data-property-view-button", "data-property-table-open",
  "data-property-table-search", "data-property-table-reset",
  "data-property-table-menu", "data-property-table-count",
  "params.set(\"view\", activeView)", "propertyFromHash()",
  "columnFilters", "openColumnMenu", "closeColumnMenu",
  "Sort ascending", "Sort descending", "Search values...",
  "Select all", "Clear", "Apply filter", "refreshFilterIndicators",
  "data-property-columns-all", "data-property-columns-reset",
  "data-property-table-export", "URL.createObjectURL", "text/csv",
  "menu.contains(event.target)", 'event.key !== "Escape"',
]) assert.ok(js.includes(marker), "Missing Table interaction: " + marker);
for (const selector of [
  ".property-view-switch", ".property-table-view", ".property-portfolio-table",
  ".property-table-scroll", ".property-details-app [hidden]",
  ".property-column-chooser", ".property-column-filter-menu",
  ".property-column-filter-indicator", ".property-column-menu-trigger",
]) assert.ok(css.includes(selector), "Missing Table style: " + selector);
assert.ok(js.includes("if (table && tableView && detailsView && viewButtons.length)"), "Legacy HTML guard missing");
assert.ok(js.includes("const headerButtons = table ?"), "Legacy Details-only table guard missing");
assert.ok(js.includes("COLUMNS_STORAGE_KEY") && js.includes("VIEW_STORAGE_KEY"), "Preference preservation missing");
assert.ok(!js.includes("activeFilterValues("), "Legacy toolbar filter logic remains");
console.log("v2.1.0 column header menu source contracts intact.");

for (const retired of ['populateFilter(', 'activeFilterValues(', 'filterMenus[', 'data-property-table-sort']) {
  assert.ok(!js.includes(retired), "Old filter initialization remains: " + retired);
}

assert.ok(css.includes(".property-column-filter-indicator { display: none !important; }"), "Extra filter dot must stay hidden");
assert.ok(css.includes(".property-column-menu-trigger.is-filtered"), "Filtered chevron styling missing");

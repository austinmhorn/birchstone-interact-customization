(() => {
  const STORAGE_KEY = "birchstone-property-details-selection";
  const VIEW_STORAGE_KEY = "birchstone-property-details-view-v1";
  const COLUMNS_STORAGE_KEY = "birchstone-property-table-columns-v1";


  function closePageDetailsPane() {
    const directCandidates = [
      ...document.querySelectorAll(
        '[title*="Hide page details" i], [aria-label*="Hide page details" i], [data-original-title*="Hide page details" i]'
      ),
    ];

    if (directCandidates.length) {
      directCandidates[0].click();
      return true;
    }

    const detailsHeading = [...document.querySelectorAll("body *")].find((element) => {
      if (element.children.length) return false;
      return (element.textContent || "").trim().toLowerCase() === "details";
    });

    if (!detailsHeading) return false;

    const detailsRect = detailsHeading.getBoundingClientRect();
    const candidates = [
      ...document.querySelectorAll("button, a, [role='button']"),
    ].filter((element) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      if (rect.top < 55 || rect.top > 190) return false;
      if (rect.left < detailsRect.left) return false;
      if (rect.width > 80 || rect.height > 80) return false;
      return true;
    });

    if (!candidates.length) return false;

    candidates.sort(
      (a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left
    );

    candidates[0].click();
    return true;
  }

  function expandPropertyDetails(app) {
    document.documentElement.classList.add("birchstone-property-details-page");

    const relaxAncestorClipping = () => {
      let node = app.parentElement;
      let depth = 0;

      while (node && node !== document.body && depth < 16) {
        /*
         * Interact's article stack includes a fixed-width ancestor with
         * overflow:hidden. The property component intentionally extends
         * beyond that article width after the details pane is closed, so
         * every ancestor in the local page-content chain must allow that
         * overflow to remain visible.
         */
        node.style.setProperty("overflow", "visible", "important");
        node.style.setProperty("overflow-x", "visible", "important");
        node.style.setProperty("overflow-y", "visible", "important");
        node.style.setProperty("max-width", "none", "important");

        node = node.parentElement;
        depth += 1;
      }
    };

    const applyWidth = () => {
      relaxAncestorClipping();

      const rect = app.getBoundingClientRect();
      const rightGutter = 32;
      const available = Math.max(
        rect.width,
        window.innerWidth - rect.left - rightGutter
      );
      const target = Math.min(1180, available);

      app.style.setProperty("width", target + "px", "important");
      app.style.setProperty("max-width", "none", "important");
    };

    applyWidth();

    let attempts = 0;
    const tryCloseDetails = () => {
      attempts += 1;

      if (closePageDetailsPane()) {
        window.setTimeout(applyWidth, 450);
        return;
      }

      if (attempts < 20) {
        window.setTimeout(tryCloseDetails, 250);
      }
    };

    tryCloseDetails();

    window.addEventListener("resize", () => {
      window.requestAnimationFrame(applyWidth);
    });
  }

  function initPropertyDetails(app) {
    if (app.dataset.propertyDetailsInitialized === "true") return;
    app.dataset.propertyDetailsInitialized = "true";

    const selector = app.querySelector("[data-property-selector]");
    const records = [...app.querySelectorAll("[data-property-record]")];
    if (!selector || records.length === 0) return;

    expandPropertyDetails(app);

    const validKeys = new Set(records.map((record) => record.dataset.propertyRecord));

    const propertyFromHash = () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const key = params.get("property");
      return key && validKeys.has(key) ? key : null;
    };

    const remember = (key) => {
      try {
        localStorage.setItem(STORAGE_KEY, key);
      } catch (_) {
        // Storage can be unavailable in restrictive browser contexts.
      }
    };

    const remembered = () => {
      try {
        const key = localStorage.getItem(STORAGE_KEY);
        return key && validKeys.has(key) ? key : null;
      } catch (_) {
        return null;
      }
    };

    const showProperty = (key, options = {}) => {
      const updateHash = options.updateHash !== false;
      if (!validKeys.has(key)) return;

      records.forEach((record) => {
        record.dataset.propertyActive =
          record.dataset.propertyRecord === key ? "true" : "false";
      });

      selector.value = key;
      remember(key);

      if (updateHash && history.replaceState) {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        params.set("property", key);
        history.replaceState(null, "", "#" + params.toString());
      }

      app.dispatchEvent(
        new CustomEvent("propertydetails:change", {
          bubbles: true,
          detail: { propertyKey: key },
        })
      );
    };

    const initial =
      propertyFromHash() ||
      remembered() ||
      selector.value ||
      records[0].dataset.propertyRecord;

    showProperty(initial, { updateHash: false });

    selector.addEventListener("change", () => {
      showProperty(selector.value);
    });

    // Feature-detect Table markup: the currently published Details-only HTML
    // must continue to work when this script is deployed first.
    const tableView = app.querySelector("[data-property-table-view]");
    const detailsView = app.querySelector("[data-property-details-view]");
    const viewButtons = [...app.querySelectorAll("[data-property-view-button]")];
    const table = app.querySelector("[data-property-table]");
    const rows = table ? [...table.tBodies[0].rows] : [];
    const search = app.querySelector("[data-property-table-search]");
    const filterMenus = {
      state: app.querySelector('[data-property-filter-options="state"]'),
      manager: app.querySelector('[data-property-filter-options="manager"]'),
    };
    const activeFilterValues = name => new Set(
      [...(filterMenus[name]?.querySelectorAll("input:checked") || [])].map(input => input.value)
    );
    const updateFilterSummary = name => {
      const summary = app.querySelector('[data-property-filter-summary="' + name + '"]');
      if (!summary) return;
      const selected = activeFilterValues(name);
      summary.textContent = selected.size ? selected.size + " selected" : (name === "state" ? "All states" : "All managers");
    };
    let activeView = "details";
    let sortIndex = -1;
    let sortDirection = 1;
    const safeRead = key => {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    };
    const safeWrite = (key, value) => {
      try { localStorage.setItem(key, value); } catch (_) {}
    };
    const columns = [...app.querySelectorAll("[data-property-column-checkbox]")];
    const applyColumns = (saved = null) => {
      if (!table || !columns.length) return [];
      const permitted = new Set(columns.map(item => item.dataset.propertyColumnKey));
      const selected = Array.isArray(saved)
        ? new Set(saved.filter(key => permitted.has(key)))
        : new Set(columns.filter(item => item.defaultChecked).map(item => item.dataset.propertyColumnKey));
      selected.add("Property Name");
      columns.forEach(item => {
        const enabled = selected.has(item.dataset.propertyColumnKey);
        item.checked = enabled;
        const index = Number(item.dataset.propertyColumnCheckbox);
        if (table.tHead.rows[0].cells[index]) table.tHead.rows[0].cells[index].hidden = !enabled;
        rows.forEach(row => { if (row.cells[index]) row.cells[index].hidden = !enabled; });
      });
      return [...selected];
    };
    let parsedColumns = null;
    const savedColumns = safeRead(COLUMNS_STORAGE_KEY);
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        if (Array.isArray(parsed)) parsedColumns = parsed.filter(item => typeof item === "string");
      } catch (_) {}
    }

    const switchView = (next, options = {}) => {
      if (!tableView || !detailsView || !table || !viewButtons.length) return;
      activeView = next === "table" ? "table" : "details";
      tableView.hidden = activeView !== "table";
      detailsView.hidden = activeView !== "details";
      app.dataset.propertyView = activeView;
      if (options.remember !== false) safeWrite(VIEW_STORAGE_KEY, activeView);
      viewButtons.forEach(button => {
        const selected = button.dataset.propertyViewButton === activeView;
        button.setAttribute("aria-pressed", String(selected));
      });
      if (options.updateHash !== false && history.replaceState) {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        params.set("view", activeView);
        history.replaceState(null, "", "#" + params.toString());
      }
    };

    const populateFilter = (name, attribute) => {
      const menu = filterMenus[name];
      if (!menu) return;
      const values = [...new Set(rows.map(row => row.getAttribute(attribute) || "").filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      values.forEach(value => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = value;
        input.addEventListener("change", () => {
          updateFilterSummary(name);
          applyTableFilters();
        });
        label.append(input, document.createTextNode(value));
        menu.appendChild(label);
      });
      updateFilterSummary(name);
    };

    const applyTableFilters = () => {
      if (!table || !search) return;
      const query = search.value.trim().toLocaleLowerCase();
      const selectedStates = activeFilterValues("state");
      const selectedManagers = activeFilterValues("manager");
      let count = 0;
      rows.forEach(row => {
        const matches = (!query || row.textContent.toLocaleLowerCase().includes(query)) &&
          (!selectedStates.size || selectedStates.has(row.dataset.propertyTableState)) &&
          (!selectedManagers.size || selectedManagers.has(row.dataset.propertyTableManager));
        row.hidden = !matches;
        if (matches) count++;
      });
      const counter = app.querySelector("[data-property-table-count]");
      const empty = app.querySelector("[data-property-table-empty]");
      if (counter) counter.textContent = count + " of " + rows.length + " properties";
      if (empty) empty.hidden = count !== 0;
    };

    if (table && tableView && detailsView && viewButtons.length) {
      // Treat the three native <details> menus as a coordinated dropdown group.
      // A click outside closes them; Escape closes and restores focus.
      const dropdowns = [...app.querySelectorAll(
        "[data-property-filter], [data-property-column-chooser]"
      )];
      dropdowns.forEach(dropdown => {
        dropdown.addEventListener("toggle", () => {
          if (!dropdown.open) return;
          dropdowns.forEach(other => {
            if (other !== dropdown) other.open = false;
          });
        });
      });
      document.addEventListener("pointerdown", event => {
        dropdowns.forEach(dropdown => {
          if (dropdown.open && !dropdown.contains(event.target)) dropdown.open = false;
        });
      });
      app.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        const opened = dropdowns.filter(dropdown => dropdown.open);
        if (!opened.length) return;
        opened.forEach(dropdown => { dropdown.open = false; });
        opened[opened.length - 1].querySelector("summary")?.focus();
        event.preventDefault();
      });
      applyColumns(parsedColumns);
      columns.forEach(item => item.addEventListener("change", () => {
        const enabled = applyColumns(columns.filter(input => input.checked).map(input => input.dataset.propertyColumnKey));
        safeWrite(COLUMNS_STORAGE_KEY, JSON.stringify(enabled));
      }));
      app.querySelector("[data-property-columns-all]")?.addEventListener("click", () => {
        const all = applyColumns(columns.map(input => input.dataset.propertyColumnKey));
        safeWrite(COLUMNS_STORAGE_KEY, JSON.stringify(all));
      });
      app.querySelector("[data-property-columns-reset]")?.addEventListener("click", () => {
        const defaults = applyColumns();
        safeWrite(COLUMNS_STORAGE_KEY, JSON.stringify(defaults));
      });
      populateFilter("state", "data-property-table-state");
      populateFilter("manager", "data-property-table-manager");
      search?.addEventListener("input", applyTableFilters);
      app.querySelector("[data-property-table-reset]")?.addEventListener("click", () => {
        if (search) search.value = "";
        Object.keys(filterMenus).forEach(name => {
          filterMenus[name]?.querySelectorAll("input").forEach(input => { input.checked = false; });
          updateFilterSummary(name);
        });
        applyTableFilters();
      });
      app.querySelector("[data-property-table-export]")?.addEventListener("click", () => {
        const indexes = columns.filter(input => input.checked)
          .map(input => Number(input.dataset.propertyColumnCheckbox));
        const quote = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';
        const lines = [
          indexes.map(index => quote(table.tHead.rows[0].cells[index].querySelector("button")?.childNodes[0]?.textContent.trim() || "")).join(","),
          ...rows.filter(row => !row.hidden).map(row => indexes.map(index => {
            const cell = row.cells[index];
            const link = cell.querySelector('a[href^="http"]');
            const value = link ? link.href : cell.textContent.trim();
            // Guard against spreadsheet formula execution when opened in Excel.
            return quote(/^\s*[=+@-]/.test(value) ? "'" + value : value);
          }).join(",")),
        ];
        const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const download = document.createElement("a");
        download.href = url;
        download.download = "birchstone-property-portfolio.csv";
        document.body.appendChild(download);
        download.click();
        download.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      viewButtons.forEach(button => button.addEventListener("click", () => {
        switchView(button.dataset.propertyViewButton);
      }));
      app.querySelectorAll("[data-property-table-open]").forEach(button => {
        button.addEventListener("click", () => {
          showProperty(button.dataset.propertyTableOpen);
          switchView("details");
        });
      });
      table.querySelectorAll("[data-property-table-sort]").forEach(button => {
        button.addEventListener("click", () => {
          const index = Number(button.dataset.propertyTableSort);
          if (sortIndex === index) sortDirection *= -1;
          else { sortIndex = index; sortDirection = 1; }
          const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
          rows.sort((a, b) => collator.compare(a.cells[index].textContent.trim(), b.cells[index].textContent.trim()) * sortDirection);
          rows.forEach(row => table.tBodies[0].appendChild(row));
          table.querySelectorAll("th[aria-sort]").forEach(item => item.removeAttribute("aria-sort"));
          button.closest("th").setAttribute("aria-sort", sortDirection === 1 ? "ascending" : "descending");
        });
      });
      applyTableFilters();
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const requestedView = params.get("view");
      const initialView = requestedView === "table" || requestedView === "details"
        ? requestedView
        : safeRead(VIEW_STORAGE_KEY) === "table" ? "table" : "details";
      switchView(initialView, { updateHash: false, remember: false });
    }

    window.addEventListener("hashchange", () => {
      const key = propertyFromHash();
      if (key) showProperty(key, { updateHash: false });
      if (table) {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        switchView(params.get("view") === "table" ? "table" : "details", { updateHash: false });
      }
    });
  }

  function initAll() {
    document
      .querySelectorAll("[data-property-details-app]")
      .forEach(initPropertyDetails);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  } else {
    initAll();
  }
})();

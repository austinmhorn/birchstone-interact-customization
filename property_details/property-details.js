(() => {
  const STORAGE_KEY = "birchstone-property-details-selection";


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
    const state = app.querySelector("[data-property-table-state]");
    const market = app.querySelector("[data-property-table-market]");
    let activeView = "details";
    let sortIndex = -1;
    let sortDirection = 1;

    const switchView = (next, options = {}) => {
      if (!tableView || !detailsView || !table || !viewButtons.length) return;
      activeView = next === "table" ? "table" : "details";
      tableView.hidden = activeView !== "table";
      detailsView.hidden = activeView !== "details";
      app.dataset.propertyView = activeView;
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

    const populateFilter = (element, attribute) => {
      if (!element) return;
      const values = [...new Set(rows.map(row => row.getAttribute(attribute) || "").filter(Boolean))];
      values.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        element.appendChild(option);
      });
    };

    const applyTableFilters = () => {
      if (!table || !search) return;
      const query = search.value.trim().toLocaleLowerCase();
      const selectedState = state?.value || "";
      const selectedMarket = market?.value || "";
      let count = 0;
      rows.forEach(row => {
        const matches = (!query || row.textContent.toLocaleLowerCase().includes(query)) &&
          (!selectedState || row.dataset.propertyTableState === selectedState) &&
          (!selectedMarket || row.dataset.propertyTableMarket === selectedMarket);
        row.hidden = !matches;
        if (matches) count++;
      });
      const counter = app.querySelector("[data-property-table-count]");
      const empty = app.querySelector("[data-property-table-empty]");
      if (counter) counter.textContent = count + " of " + rows.length + " properties";
      if (empty) empty.hidden = count !== 0;
    };

    if (table && tableView && detailsView && viewButtons.length) {
      populateFilter(state, "data-property-table-state");
      populateFilter(market, "data-property-table-market");
      [search, state, market].forEach(control => control?.addEventListener("input", applyTableFilters));
      app.querySelector("[data-property-table-reset]")?.addEventListener("click", () => {
        if (search) search.value = "";
        if (state) state.value = "";
        if (market) market.value = "";
        applyTableFilters();
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
          table.querySelectorAll("[data-property-table-sort]").forEach(item => item.removeAttribute("aria-sort"));
          button.closest("th").setAttribute("aria-sort", sortDirection === 1 ? "ascending" : "descending");
        });
      });
      applyTableFilters();
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      switchView(params.get("view") === "table" ? "table" : "details", { updateHash: false });
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

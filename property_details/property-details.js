(() => {
  const STORAGE_KEY = "birchstone-property-details-selection";


  function closePageDetailsPane() {
    const candidates = [
      ...document.querySelectorAll(
        '[title*="Hide page details" i], [aria-label*="Hide page details" i], button, a, [role="button"]'
      ),
    ];

    const control = candidates.find((element) => {
      const title = (element.getAttribute("title") || "").trim();
      const aria = (element.getAttribute("aria-label") || "").trim();
      const text = (element.textContent || "").trim();
      const label = [title, aria, text].join(" ").toLowerCase();
      return label.includes("hide page details");
    });

    if (control) {
      control.click();
      return true;
    }

    return false;
  }

  function expandPropertyDetails(app) {
    const applyWidth = () => {
      const rect = app.getBoundingClientRect();
      const rightGutter = 32;
      const available = Math.max(
        rect.width,
        window.innerWidth - rect.left - rightGutter
      );
      const target = Math.min(1180, available);
      app.style.setProperty("--pd-runtime-width", target + "px");
    };

    applyWidth();

    let attempts = 0;
    const tryCloseDetails = () => {
      attempts += 1;
      if (closePageDetailsPane()) {
        window.setTimeout(applyWidth, 350);
        return;
      }
      if (attempts < 12) {
        window.setTimeout(tryCloseDetails, 250);
      }
    };

    tryCloseDetails();
    window.addEventListener("resize", applyWidth);
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

    window.addEventListener("hashchange", () => {
      const key = propertyFromHash();
      if (key) showProperty(key, { updateHash: false });
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

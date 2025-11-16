(function () {

  /*********************************
   * 0. FIND MODIFIER KEYS & SLOTS
   *********************************/
  const keys = {
    fn:   document.querySelector('[data-key="Fn"]'),
    alt:  document.querySelector('[data-key="AltLeft"]'),
    meta: document.querySelector('[data-key="MetaLeft"]'),
    ctrl: document.querySelector('[data-key="ControlLeft"]')
  };

  if (Object.values(keys).some(k => !k)) {
    console.warn("Missing one or more modifier keys (Fn/AltLeft/MetaLeft/ControlLeft).");
    return;
  }

  // Helper: parse grid-area "row / col / rowEnd / colEnd"
  function getColStart(el) {
    const area = getComputedStyle(el).gridArea; // e.g. "3 / 4 / 4 / 5"
    const parts = area.split("/").map(s => s.trim());
    const col = parseInt(parts[1], 10);
    return Number.isFinite(col) ? col : 0;
  }

  // Capture original left-to-right order once
  const entries = Object.entries(keys).map(([name, el]) => ({
    name,
    el,
    gridArea: getComputedStyle(el).gridArea,
    colStart: getColStart(el)
  }));

  // Sort by column (left to right)
  entries.sort((a, b) => a.colStart - b.colStart);

  const slotAreas = entries.map(e => e.gridArea);   // fixed physical slots, left→right
  const baselineOrder = entries.map(e => e.name);   // which key started in which slot

  console.log("Baseline modifier order (left→right):", baselineOrder.join(" | "));

  /*********************************
   * ARROW FIX STATE & HELPERS
   *********************************/
  const LS_ARROW_KEY = "crd_arrowFixEnabled";
  let arrowFixEnabled = (localStorage.getItem(LS_ARROW_KEY) ?? "1") === "1";

  const arrowState = {
    captured: false,
    elements: new Map() // Map<HTMLElement, {dataKey, aria, title, gridArea, spanHTML, styleDisplay, styleGridAreaInline}>
  };

  function saveKeyState(el) {
    if (!el || arrowState.elements.has(el)) return;
    const span = el.querySelector(".f8w40e");
    arrowState.elements.set(el, {
      dataKey: el.dataset.key,
      aria: el.getAttribute("aria-label"),
      title: el.getAttribute("title"),
      gridArea: getComputedStyle(el).gridArea,
      spanHTML: span ? span.innerHTML : null,
      styleDisplay: el.style.display || null,
      styleGridAreaInline: el.style.gridArea || ""
    });
  }

  function captureArrowOriginalState() {
    if (arrowState.captured) return;

    const shiftLeft = document.querySelector('.kwQ2Lb[data-key="ShiftLeft"]');
    const intl = document.querySelector('.kwQ2Lb[data-key="IntlBackslash"]');
    const metaRight = document.querySelector('.kwQ2Lb[data-key="MetaRight"]');
    const altRight  = document.querySelector('.kwQ2Lb[data-key="AltRight"]');
    const ctrlRight = document.querySelector('.kwQ2Lb[data-key="ControlRight"]');
    const ctx       = document.querySelector('.kwQ2Lb[data-key="ContextMenu"]');
    const textInput = document.querySelector('.kwQ2Lb[data-key="TextInput"]');
    const ctrlLeft  = document.querySelector('.kwQ2Lb[data-key="ControlLeft"]');

    // All Slash keys (we may alter some)
    const slashKeys = document.querySelectorAll('.kwQ2Lb[data-key="Slash"]');

    [
      shiftLeft,
      intl,
      metaRight,
      altRight,
      ctrlRight,
      ctx,
      textInput,
      ctrlLeft
    ].forEach(saveKeyState);

    slashKeys.forEach(saveKeyState);

    arrowState.captured = true;
    console.log("Arrow cluster original state captured.");
  }

  function restoreArrowClusterOnly() {
    if (!arrowState.captured) {
      console.log("Arrow state was never captured; nothing to restore.");
      return;
    }

    for (const [el, orig] of arrowState.elements.entries()) {
      if (!el) continue;

      if (orig.dataKey !== undefined) {
        el.dataset.key = orig.dataKey;
      }
      if (orig.aria != null) {
        el.setAttribute("aria-label", orig.aria);
      } else {
        el.removeAttribute("aria-label");
      }
      if (orig.title != null) {
        el.setAttribute("title", orig.title);
      } else {
        el.removeAttribute("title");
      }

      const span = el.querySelector(".f8w40e");
      if (span && orig.spanHTML != null) {
        span.innerHTML = orig.spanHTML;
      }

      // Restore original grid-area
      if (orig.gridArea) {
        el.style.gridArea = orig.gridArea;
      } else if (orig.styleGridAreaInline) {
        el.style.gridArea = orig.styleGridAreaInline;
      } else {
        el.style.removeProperty("grid-area");
      }

      if (orig.styleDisplay != null) {
        el.style.display = orig.styleDisplay;
      } else {
        el.style.removeProperty("display");
      }
    }

    console.log("Arrow cluster keys restored to original layout/state.");
  }

  function normalizeGridArea(str) {
    if (!str) return "";
    return str.replace(/\s+/g, "");
  }

  /*********************************
   * ARROW FIX: SVG ICONS
   *********************************/
  const newCtrlSVG = `
<svg class="xW0COb" viewBox="0 0 100 100" version="1.1">
  <path d="M10 70 L50 20 L90 70" 
        fill="none" 
        stroke="currentColor"
        stroke-width="10"
        stroke-linecap="round"
        stroke-linejoin="round" />
</svg>`;

  const cmdSVG = `<svg class="xW0COb" version="1.1" viewBox="0 0 100 100"><path d="m65.434 19.133c-1e-6 -8.5235 6.9097-15.433 15.433-15.433 8.5235 0 15.433 6.9097 15.433 15.433s-6.9097 15.433-15.433 15.433l-61.735 2e-6c-8.5221 1.8e-5 -15.432-6.9097-15.432-15.433-3e-7 -8.5235 6.9097-15.433 15.433-15.433 8.5235-6e-7 15.433 6.9097 15.432 15.433l-0.0014 61.736c-1.5e-5 8.5235-6.9097 15.433-15.433 15.433-8.5235 0-15.433-6.9097-15.433-15.433 6e-7 -8.5235 6.9097-15.433 15.433-15.433l61.736 2e-6c8.5235 0 15.433 6.9097 15.433 15.433 0 8.5235-6.9097 15.433-15.433 15.433-8.5235 2e-6 -15.433-6.9097-15.433-15.433z" fill="none" stroke="currentColor" stroke-width="7.4"></path></svg>`;

  const arrowUpSVG = `
<svg class="xW0COb" version="1.1" viewBox="0 0 100 100">
  <path d="m50 87.34v-73.148m-24.767 24.767 24.767-24.767 24.767 24.767"
        fill="none" stroke="currentColor" stroke-width="7.4"></path>
</svg>`;

  const arrowRightSVG = `
<svg class="xW0COb" version="1.1" viewBox="0 0 100 100">
  <path d="m10.81 50h73.148m-24.767-24.767 24.767 24.767-24.767 24.767"
        fill="none" stroke="currentColor" stroke-width="7.4"></path>
</svg>`;

  const arrowDownSVG = `
<svg class="xW0COb" version="1.1" viewBox="0 0 100 100">
  <path d="m50 10.81v73.148m24.767-24.767-24.767 24.767-24.767-24.767"
        fill="none" stroke="currentColor" stroke-width="7.4"></path>
</svg>`;

  const arrowLeftSVG = `
<svg class="xW0COb" version="1.1" viewBox="0 0 100 100">
  <path d="m89.19 50h-73.148m24.767 24.767-24.767-24.767 24.767-24.767"
        fill="none" stroke="currentColor" stroke-width="7.4"></path>
</svg>`;

  /*********************************
   * CONTROL SVG OVERRIDE HELPER
   *********************************/
  function applyCtrlSVG() {
    document
      .querySelectorAll('[data-key="ControlLeft"], [data-key="ControlRight"]')
      .forEach(key => {
        const svg = key.querySelector("svg");
        if (!svg || svg.outerHTML.trim() !== newCtrlSVG.trim()) {
          if (svg) svg.outerHTML = newCtrlSVG;
          console.log("Updated Control key:", key.dataset.key);
        }
      });
  }

  /*********************************
   * ARROW FIX: APPLY LOGIC (Option A)
   *********************************/
  function applyArrowFixes() {
    console.log("Applying Arrow-Key Fix cluster changes...");

    captureArrowOriginalState();

    // 1) ShiftLeft: if grid-area is 4/1/5/5 change to 4/1/5/3
    (function () {
      const shiftLeft = document.querySelector('.kwQ2Lb[data-key="ShiftLeft"]');
      if (!shiftLeft) {
        console.log("ShiftLeft not found.");
        return;
      }

      const current = normalizeGridArea(getComputedStyle(shiftLeft).gridArea);
      if (current === "4/1/5/5") {
        shiftLeft.style.gridArea = "4 / 1 / 5 / 3";
        console.log("ShiftLeft grid-area updated to 4/1/5/3");
      } else {
        console.log("ShiftLeft grid-area not 4/1/5/5; current:", current);
      }
    })();

    // 2) IntlBackslash → Slash at 4/3/5/5
    (function () {
      const intl = document.querySelector('.kwQ2Lb[data-key="IntlBackslash"]');
      if (!intl) {
        console.log("IntlBackslash not found; skipping that part.");
        return;
      }

      intl.dataset.key = "Slash";
      intl.setAttribute("aria-label", "");
      intl.setAttribute("title", "");

      const span = intl.querySelector(".f8w40e");
      if (span) span.textContent = "/";

      intl.style.gridArea = "4 / 3 / 5 / 5";
      console.log("IntlBackslash converted to Slash at 4/3/5/5");
    })();

    // 3) Replace Slash key (not the one at 4/3/5/5) with ArrowUp at 4/23/5/25
    (function () {
      const slashKeys = document.querySelectorAll('.kwQ2Lb[data-key="Slash"]');
      if (!slashKeys.length) {
        console.log("No Slash keys found for ArrowUp replacement.");
        return;
      }

      slashKeys.forEach(el => {
        const area = normalizeGridArea(getComputedStyle(el).gridArea);
        // Skip the left-side Slash at 4/3/5/5; convert any others
        if (area === "4/3/5/5") return;

        el.dataset.key = "ArrowUp";
        el.setAttribute("aria-label", "Up");
        el.setAttribute("title", "Up");

        const span = el.querySelector(".f8w40e");
        if (span) span.innerHTML = arrowUpSVG;

        el.style.gridArea = "4 / 23 / 5 / 25";
        console.log("Slash key converted to ArrowUp at 4/23/5/25");
      });
    })();

    // 4) MetaRight / AltRight / ControlRight Logic - Left ArrowKey
    function handleMetaAltCtrlSwap() {
      const metaRight = document.querySelector('.kwQ2Lb[data-key="MetaRight"]');
      const altRight  = document.querySelector('.kwQ2Lb[data-key="AltRight"]');
      const ctrlRight = document.querySelector('.kwQ2Lb[data-key="ControlRight"]');
      const textInput = document.querySelector('.kwQ2Lb[data-key="TextInput"]');

      if (textInput) {
        textInput.style.display = "none";
      }

      if (!metaRight || !altRight) {
        console.log("MetaRight or AltRight not found for swap.");
        return;
      }

      const metaTitle = (metaRight.getAttribute("title") || "").trim().toLowerCase();

      const targetAlt  = "5/19/6/21";
      const targetMeta = "5/21/6/23";

      console.log("metaTitle: " + metaTitle);
      if (metaTitle === "command") {
        altRight.dataset.key = "MetaRight";
        altRight.setAttribute("aria-label", "Command");
        altRight.setAttribute("title", "Command");
        const svgCmd = altRight.querySelector("svg");
        if (svgCmd) svgCmd.outerHTML = cmdSVG;
      } else {
        altRight.dataset.key = "ControlRight";
        altRight.setAttribute("aria-label", "Control");
        altRight.setAttribute("title", "Control");
        document
          .querySelectorAll('[data-key="ControlLeft"], [data-key="ControlRight"]')
          .forEach(key => {
            const svgCtrl = key.querySelector("svg");
            if (!svgCtrl || svgCtrl.outerHTML.trim() !== newCtrlSVG.trim()) {
              if (svgCtrl) svgCtrl.outerHTML = newCtrlSVG;
              console.log("Updated Control key:", key.dataset.key);
            }
          });
      }
      altRight.style.gridArea = targetAlt;

      // Update identity of metaRight → ArrowLeft
      metaRight.dataset.key = "ArrowLeft";
      metaRight.setAttribute("aria-label", "Left");
      metaRight.setAttribute("title", "Left");

      const span = metaRight.querySelector(".f8w40e");
      if (span) span.innerHTML = arrowLeftSVG;

      metaRight.style.gridArea = "5 / 21 / 6 / 23";

      console.log("Right modifier updates (MetaRight → ArrowLeft, AltRight → Meta/Control).");
    }

    handleMetaAltCtrlSwap();

    // 5) Replace ControlRight with ArrowRight ONLY if already at 5/25/6/27
    function ctrlRightArwRight() {
      const target = "5/25/6/27";

      const ctrlRights = document.querySelectorAll('.kwQ2Lb[data-key="ControlRight"]');

      if (!ctrlRights.length) {
        console.log("No ControlRight elements found; skipping ArrowRight replacement.");
        return;
      }

      ctrlRights.forEach(ctrlRight => {
        const currentArea = getComputedStyle(ctrlRight).gridArea.replace(/\s+/g, "");

        if (currentArea !== target) {
          console.log(`ControlRight grid-area is ${currentArea}, not ${target}; leaving unchanged.`);
          return;
        }

        ctrlRight.dataset.key = "ArrowRight";
        ctrlRight.setAttribute("aria-label", "Right");
        ctrlRight.setAttribute("title", "Right");

        const span = ctrlRight.querySelector(".f8w40e");
        if (span) span.innerHTML = arrowRightSVG;

        ctrlRight.style.gridArea = "5 / 25 / 6 / 27";

        console.log("ControlRight converted → ArrowRight at 5/25/6/27");
      });
    }

    ctrlRightArwRight();

    // 6) Replace ContextMenu with ArrowDown at 5/23/6/25
    (function () {
      const ctx = document.querySelector('.kwQ2Lb[data-key="ContextMenu"]');
      if (!ctx) {
        console.log("ContextMenu not found; skipping ArrowDown replacement.");
        return;
      }

      ctx.dataset.key = "ArrowDown";
      ctx.setAttribute("aria-label", "Down");
      ctx.setAttribute("title", "Down");

      const span = ctx.querySelector(".f8w40e");
      if (span) span.innerHTML = arrowDownSVG;

      ctx.style.gridArea = "5 / 23 / 6 / 25";
      console.log("ContextMenu converted to ArrowDown at 5/23/6/25");
    })();

    // ensure ctrl SVGs are consistent after arrow fix
    applyCtrlSVG();

    console.log("Arrow cluster + modifier remap script applied (Option A).");
  }

  // /*********************************
  //  * 0. FIND MODIFIER KEYS & SLOTS
  //  *********************************/
  // const keys = {
  //   fn:   document.querySelector('[data-key="Fn"]'),
  //   alt:  document.querySelector('[data-key="AltLeft"]'),
  //   meta: document.querySelector('[data-key="MetaLeft"]'),
  //   ctrl: document.querySelector('[data-key="ControlLeft"]')
  // };

  // if (Object.values(keys).some(k => !k)) {
  //   console.warn("Missing one or more modifier keys (Fn/AltLeft/MetaLeft/ControlLeft).");
  //   return;
  // }

  // // Helper: parse grid-area "row / col / rowEnd / colEnd"
  // function getColStart(el) {
  //   const area = getComputedStyle(el).gridArea; // e.g. "3 / 4 / 4 / 5"
  //   const parts = area.split("/").map(s => s.trim());
  //   const col = parseInt(parts[1], 10);
  //   return Number.isFinite(col) ? col : 0;
  // }

  // // Capture original left-to-right order once
  // const entries = Object.entries(keys).map(([name, el]) => ({
  //   name,
  //   el,
  //   gridArea: getComputedStyle(el).gridArea,
  //   colStart: getColStart(el)
  // }));

  // // Sort by column (left to right)
  // entries.sort((a, b) => a.colStart - b.colStart);

  // const slotAreas = entries.map(e => e.gridArea);   // fixed physical slots, left→right
  // const baselineOrder = entries.map(e => e.name);   // which key started in which slot

  // console.log("Baseline modifier order (left→right):", baselineOrder.join(" | "));

  /*********************************
   * 1. INSERT YIN-YANG BUTTON
   *********************************/
  const toolbar = document.querySelector('div[jsname="c6xFrd"]');
  if (!toolbar) return console.warn("Toolbar not found.");

  const group1 = toolbar.querySelector('[data-group-id="1"]');
  if (!group1) return console.warn("Group 1 not found.");

  const yinWrapper = document.createElement("div");
  yinWrapper.className = "NBPbSe mUbCce";
  yinWrapper.style.display = "flex";
  yinWrapper.style.alignItems = "center";
  yinWrapper.style.justifyContent = "center";
  yinWrapper.style.cursor = "pointer";

  const yin = document.createElement("span");
  yin.id = "yinYangButton";
  yin.textContent = "☯";
  yin.style.fontSize = "26px";
  yin.style.color = "white";
  yin.style.userSelect = "none";
  yinWrapper.appendChild(yin);

  group1.parentNode.insertBefore(yinWrapper, group1);

  /*********************************
   * 2. CREATE TRUSTED-TYPES SAFE MODAL
   *********************************/
  const modal = document.createElement("div");
  modal.id = "modifierModal";
  Object.assign(modal.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    display: "none",
    zIndex: "999999"
  });

  const frame = document.createElement("div");
  Object.assign(frame.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#222",
    padding: "20px",
    borderRadius: "12px",
    width: "330px",
    color: "white",
    fontFamily: "sans-serif",
  });

  const title = document.createElement("h2");
  title.textContent = "Modifier Presets";
  Object.assign(title.style, {
    marginTop: "0",
    textAlign: "center"
  });
  frame.appendChild(title);

  function makeBtn(text, mode) {
    const b = document.createElement("button");
    b.className = "preset";
    b.dataset.mode = mode;
    b.textContent = text;
    Object.assign(b.style, {
      width: "100%",
      margin: "6px 0",
      position: "relative"
    });
    return b;
  }

  frame.appendChild(makeBtn("1. Optimized macOS (⌘ ⌥ ^ Fn)", "optMac"));
  frame.appendChild(makeBtn("2. Optimized Windows (^ ⌥ ❖ Fn)", "optWin"));
  frame.appendChild(makeBtn("3. Actual macOS (^ ⌥ ⌘ Fn)", "realMac"));
  frame.appendChild(makeBtn("4. Actual Windows (^ ❖ ⌥ Fn)", "realWin"));

  const customLabel = document.createElement("div");
  customLabel.textContent = "5. Custom order:";
  Object.assign(customLabel.style, {
    marginTop: "14px",
    marginBottom: "4px"
  });
  frame.appendChild(customLabel);

  const customInput = document.createElement("input");
  customInput.id = "customOrder";
  customInput.value = "meta alt ctrl fn";
  Object.assign(customInput.style, {
    width: "100%",
    padding: "4px",
    marginBottom: "10px"
  });
  frame.appendChild(customInput);

  frame.appendChild(makeBtn("Apply Custom", "custom"));
  frame.appendChild(makeBtn("6. Reset (Fn ^ ❖ ⌥)", "reset"));

  const hr = document.createElement("hr");
  Object.assign(hr.style, {
    margin: "16px 0",
    borderColor: "#444"
  });
  frame.appendChild(hr);

  const closeBtn = document.createElement("button");
  closeBtn.id = "closeModal";
  closeBtn.textContent = "Close";
  Object.assign(closeBtn.style, { width: "100%" });
  frame.appendChild(closeBtn);

  modal.appendChild(frame);
  document.body.appendChild(modal);

  /*********************************
   * 3. ACTIVE PRESET INDICATOR DOT
   *********************************/
  function updateActivePreset(modeName) {
    modal.querySelectorAll(".preset").forEach(btn => {
      const dot = btn.querySelector(".active-dot");
      if (dot) dot.remove();
    });

    if (!modeName || modeName === "reset") return;

    const btn = modal.querySelector(`.preset[data-mode="${modeName}"]`);
    if (!btn) return;

    const dot = document.createElement("div");
    dot.className = "active-dot";
    Object.assign(dot.style, {
      position: "absolute",
      left: "-14px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "10px",
      height: "10px",
      background: "#5eff5e",
      borderRadius: "50%"
    });

    btn.appendChild(dot);
  }

  /*********************************
   * 4. APPLY LAYOUT LOGIC
   *********************************/
  const VALID_KEYS = ["fn", "ctrl", "meta", "alt"];

  function applyLayout(orderNames) {
    orderNames.forEach((name, idx) => {
      const keyEl = keys[name];
      if (keyEl) keyEl.style.gridArea = slotAreas[idx];
    });
  }

  const presetActions = {
    optMac:  () => applyLayout(["meta", "alt", "ctrl", "fn"]),
    optWin:  () => applyLayout(["ctrl", "alt", "meta", "fn"]),
    realMac: () => applyLayout(["ctrl", "alt", "meta", "fn"]),
    realWin: () => applyLayout(["ctrl", "meta", "alt", "fn"]),

    custom: () => {
      const txt = (customInput.value || "").trim().toLowerCase();
      let tokens = txt.split(/[,\s]+/).filter(Boolean);
      const norm = t => t.replace(/control/, "ctrl")
                         .replace(/cmd/, "meta")
                         .replace(/win/, "meta")
                         .replace(/option/, "alt");

      const chosen = [];
      tokens.forEach(t => {
        const k = norm(t);
        if (VALID_KEYS.includes(k) && !chosen.includes(k)) chosen.push(k);
      });

      baselineOrder.forEach(name => {
        if (!chosen.includes(name) && chosen.length < 4) chosen.push(name);
      });

      if (chosen.length === 4) applyLayout(chosen);

      updateActivePreset("custom");
    },

    reset: () => {
      applyLayout(baselineOrder);
      updateActivePreset(null);
    }
  };

  /*********************************
   * 5. WIRING
   *********************************/
  yin.onclick = () => { modal.style.display = "block"; };
  closeBtn.onclick = () => { modal.style.display = "none"; };

  modal.querySelectorAll(".preset").forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      if (presetActions[mode]) presetActions[mode]();
      updateActivePreset(mode);
      modal.style.display = "none";
    };
  });

  const arrowToggle = modal.querySelector("#arrowFixToggle");
  if (arrowToggle) {
    arrowToggle.checked = arrowFixEnabled;
    arrowToggle.addEventListener("change", () => {
      arrowFixEnabled = arrowToggle.checked;
      localStorage.setItem(LS_ARROW_KEY, arrowFixEnabled ? "1" : "0");
      if (arrowFixEnabled) {
        applyArrowFixes();
      } else {
        restoreArrowClusterOnly();
        // after restore, still keep control SVG style if you like it
        applyCtrlSVG();
      }
    });
  }

  /*********************************
   * 6. INITIAL ARROW FIX (BASED ON STORED STATE)
   *********************************/
  if (arrowFixEnabled) {
    applyArrowFixes();
  } else {
    captureArrowOriginalState(); // so we can restore later even if they toggle on/off
    // still apply ctrl SVG styling once
    applyCtrlSVG();
  }

})();

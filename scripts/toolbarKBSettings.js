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
    console.warn("Missing one or more modifier keys.");
    return;
  }

  function getColStart(el) {
    const area = getComputedStyle(el).gridArea;
    const parts = area.split("/").map(s => s.trim());
    const col = parseInt(parts[1], 10);
    return Number.isFinite(col) ? col : 0;
  }

  const entries = Object.entries(keys).map(([name, el]) => ({
    name,
    el,
    gridArea: getComputedStyle(el).gridArea,
    colStart: getColStart(el)
  }));

  entries.sort((a, b) => a.colStart - b.colStart);

  const slotAreas = entries.map(e => e.gridArea);
  const baselineOrder = entries.map(e => e.name);

  console.log("Baseline modifier order:", baselineOrder.join(" | "));

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
   * 2. CREATE MODAL
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

  /*********************************
   * 2A. CHECKBOX: WINDOWS SVG MODE
   *********************************/
  const svgToggleWrap = document.createElement("label");
  svgToggleWrap.style.display = "flex";
  svgToggleWrap.style.alignItems = "center";
  svgToggleWrap.style.gap = "8px";
  svgToggleWrap.style.margin = "10px 0";

  const svgCheckbox = document.createElement("input");
  svgCheckbox.type = "checkbox";
  svgCheckbox.id = "winSvgToggle";

  const svgText = document.createElement("span");
  svgText.textContent = "Use ⌘ for ❖ Windows Meta key";

  svgToggleWrap.appendChild(svgCheckbox);
  svgToggleWrap.appendChild(svgText);
  frame.appendChild(svgToggleWrap);

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
   * 4. PRESET BUTTON UTIL
   *********************************/
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
  customLabel.style.marginTop = "14px";
  customLabel.style.marginBottom = "4px";
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
  hr.style.margin = "16px 0";
  hr.style.borderColor = "#444";
  frame.appendChild(hr);

  const closeBtn = document.createElement("button");
  closeBtn.id = "closeModal";
  closeBtn.textContent = "Close";
  closeBtn.style.width = "100%";
  frame.appendChild(closeBtn);

  modal.appendChild(frame);
  document.body.appendChild(modal);

  /*********************************
   * 5. WINDOWS-STYLE SVG LOGIC
   *********************************/

  // Save original SVGs so we can restore them
  const originalSvgMap = new Map();

  const winSVG = `
<svg class="xW0COb" version="1.1" viewBox="0 0 100 100">
  <path d="m65.434 19.133c-1e-6 -8.5235 6.9097-15.433 15.433-15.433 8.5235 0 15.433 6.9097 15.433 15.433s-6.9097 15.433-15.433 15.433l-61.735 2e-6c-8.5221 1.8e-5 -15.432-6.9097-15.432-15.433-3e-7 -8.5235 6.9097-15.433 15.433-15.433 8.5235-6e-7 15.433 6.9097 15.432 15.433l-0.0014 61.736c-1.5e-5 8.5235-6.9097 15.433-15.433 15.433-8.5235 0-15.433-6.9097-15.433-15.433 6e-7 -8.5235 6.9097-15.433 15.433-15.433l61.736 2e-6c8.5235 0 15.433 6.9097 15.433 15.433 0 8.5235-6.9097 15.433-15.433 15.433-8.5235 2e-6 -15.433-6.9097-15.433-15.433z"
        fill="none" stroke="currentColor" stroke-width="7.4"></path>
</svg>`;

  function applyWinSVG() {
    document.querySelectorAll('[data-key="MetaLeft"], [data-key="MetaRight"]').forEach(key => {
      const svg = key.querySelector("svg");
      if (!svg) return;

      if (!originalSvgMap.has(key)) {
        originalSvgMap.set(key, svg.outerHTML);
      }

      svg.outerHTML = winSVG;
    });
  }

  function restoreCmdSVG() {
    document.querySelectorAll('[data-key="MetaLeft"], [data-key="MetaRight"]').forEach(key => {
      if (originalSvgMap.has(key)) {
        const orig = originalSvgMap.get(key);
        const svg = key.querySelector("svg");
        if (svg) svg.outerHTML = orig;
      }
    });
  }

  /*********************************
   * 6. APPLY LAYOUT LOGIC
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
   * 7. WIRING
   *********************************/
  yin.onclick = () => { modal.style.display = "block"; };
  closeBtn.onclick = () => { modal.style.display = "none"; };

  // Presets
  modal.querySelectorAll(".preset").forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      if (presetActions[mode]) presetActions[mode]();
      updateActivePreset(mode);
      modal.style.display = "none";
    };
  });

  // Checkbox
  svgCheckbox.addEventListener("change", () => {
    if (svgCheckbox.checked) applyWinSVG();
    else restoreCmdSVG();
  });

  // Reapply SVG after redraw (shift/fn/etc)
  const triggers = [
    '[data-key="ShiftLeft"]',
    '[data-key="ShiftRight"]',
    '[data-key="Fn"]'
  ];

  triggers.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener("click", () => {
      setTimeout(() => {
        if (svgCheckbox.checked) applyWinSVG();
      }, 50);
    });
  });


})();

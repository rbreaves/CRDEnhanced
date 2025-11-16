// ==UserScript==
// @name         CRD Enhanced Keyboard & Touchpad Layout
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds advanced keyboard & touchpad layout modes (float, split, landscape, etc.) to Chrome Remote Desktop web client
// @author       Ben Reaves
// @match        https://remotedesktop.google.com/u/*
// @match        https://remotedesktop.google.com/access/*
// @icon         https://remotedesktop.google.com/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // 🕒 Wait for CRD DOM to finish loading
  function waitForCRDReady() {
      const observer = new MutationObserver(() => {
          const kb  = document.querySelector('.V9Tle.JZG3Fc, .V9Tle.JZG3Fc.hdWt0');
          const sp  = document.querySelector('section.MboOLb[aria-label="Displays"]');
          const c   = document.querySelector('canvas.sshIvb');
          const vc  = document.querySelector('div.VCqmx');
          const crd = document.querySelector('.SaCab');
          if (kb && sp && c && vc && crd) {
              observer.disconnect();
              console.log('✅ CRD live session detected, initializing layout enhancements…');
              resolutions();
              initCRDLayout();
              setTimeout(() => {
                  console.log("⏳ Running toolbarKB() after delay…");
                  toolbarKB();
              }, 2000);
          }
      });

      observer.observe(document.body, { childList: true, subtree: true });
  }

  waitForCRDReady();

  function resolutions() {
    // -------------------------------------------------------
    // Utilities
    // -------------------------------------------------------
    function gcd(a, b) {
      return b === 0 ? a : gcd(b, a % b);
    }

    function getExactRatio(w, h) {
      const g = gcd(w, h);
      return `${w / g}:${h / g}`;
    }

    function twoDigitRatio(w, h) {
      const g = gcd(w, h);
      let a = w / g;
      let b = h / g;

      while (a > 99) { a = Math.round(a / 10); b = Math.round(b / 10); }
      while (a < 10) { a = Math.round(a * 2); b = Math.round(b * 2); }

      return { a, b, ratio: `${a}:${b}` };
    }

    function roundedRatioResolutions(w, h) {
      const { a, b, ratio } = twoDigitRatio(w, h);
      const heightFromWidth = Math.round(w * (b / a));
      const widthFromHeight = Math.round(h * (a / b));

      return {
        ratio,
        widthSet: `${w}×${heightFromWidth}`,
        heightSet: `${widthFromHeight}×${h}`
      };
    }

    // -------------------------------------------------------
    // Build modal contents
    // -------------------------------------------------------
    function buildModalContent(modalBody) {
      const viewport = document.querySelector('.YtOxne[jsname="vzJc7b"]');
      if (!viewport) return;

      const rect = viewport.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      const exactRatio = getExactRatio(w, h);
      const rounded = roundedRatioResolutions(w, h);

      const scaleFactors = [
        { label: "Current size", factor: 1 },
        { label: "+25%", factor: 1.25 },
        { label: "+50%", factor: 1.5 },
        { label: "+75%", factor: 1.75 },
        { label: "+100%", factor: 2 }
      ];

      let html = `
        <div style="font-size:14px;color:#fff;">
          <div><b>Viewport:</b> ${w}×${h}</div>
          <div><b>Exact Ratio:</b> ${exactRatio}</div>
          <div><b>Rounded Ratio:</b> ${rounded.ratio}</div>
          <hr style="border-color:#666;">
          <div style="margin-bottom:6px;"><b>Scale Options:</b></div>
      `;

      scaleFactors.forEach(s => {
        const nw = Math.round(w * s.factor);
        const nh = Math.round(h * s.factor);
        html += `<div>${s.label}: <b>${nw}×${nh}</b></div>`;
      });

      html += `
        <hr style="border-color:#666;">
        <div><b>Rounded Ratio Match:</b> ${rounded.widthSet}</div>
        <hr style="border-color:#666;">
        <div><b>Custom Width → Height Calculator</b></div>
        <div style="margin-top:4px;">
          <input id="crd-custom-width" type="number" placeholder="Enter width…" 
             style="width:120px;padding:4px;border-radius:4px;border:1px solid #444;background:#222;color:white;">
          <button id="crd-calc-btn"
             style="margin-left:6px;padding:4px 8px;background:#444;border:1px solid #777;color:white;border-radius:4px;cursor:pointer;">
             Calc
          </button>
        </div>
        <div id="crd-calc-result" style="margin-top:8px;font-size:14px;color:#fff;"></div>
      `;

      modalBody.innerHTML = html;

      // Calculation logic
      const ratio = twoDigitRatio(w, h);
      const a = ratio.a;
      const b = ratio.b;

      const btn = document.getElementById("crd-calc-btn");
      const inp = document.getElementById("crd-custom-width");
      const res = document.getElementById("crd-calc-result");

      btn.onclick = () => {
        const cw = parseInt(inp.value, 10);
        if (!cw || cw < 10) {
          res.textContent = "Enter a valid width.";
          return;
        }
        const ch = Math.round(cw * (b / a));
        res.textContent = `Result:  ${cw}×${ch}  (ratio ${a}:${b})`;
      };
    }

    // -------------------------------------------------------
    // Prevent duplicate insertion
    // -------------------------------------------------------
    if (document.getElementById("crd-reso-widget")) return;

    const group1 = document.querySelector('[jsname="c6xFrd"] [data-group-id="1"]');
    if (!group1) return;

    // -------------------------------------------------------
    // Wrapper
    // -------------------------------------------------------
    const wrapper = document.createElement("span");
    wrapper.id = "crd-reso-widget";
    wrapper.style.position = "absolute";
    wrapper.style.left = "10px";
    wrapper.style.top = "8px";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "6px";
    wrapper.style.zIndex = "99999";

    // -------------------------------------------------------
    // Res. Button → Opens modal
    // -------------------------------------------------------
    const openModalBtn = document.createElement("button");
    openModalBtn.textContent = "Res.";
    openModalBtn.style.cursor = "pointer";
    openModalBtn.style.fontSize = "12px";
    openModalBtn.style.border = "1px solid rgba(255,255,255,0.3)";
    openModalBtn.style.background = "rgba(255,255,255,0.1)";
    openModalBtn.style.color = "white";
    openModalBtn.style.borderRadius = "3px";
    openModalBtn.style.padding = "2px 6px";
    openModalBtn.title = "View resolution calculations";

    // -------------------------------------------------------
    // Refresh Page Button
    // -------------------------------------------------------
    const refreshPage = document.createElement("button");
    refreshPage.textContent = "⟳";
    refreshPage.style.cursor = "pointer";
    refreshPage.style.fontSize = "14px";
    refreshPage.style.border = "1px solid rgba(255,255,255,0.3)";
    refreshPage.style.background = "rgba(255,255,255,0.1)";
    refreshPage.style.color = "white";
    refreshPage.style.borderRadius = "3px";
    refreshPage.style.padding = "1px 5px";
    refreshPage.title = "Reload page";
    refreshPage.onclick = () => location.reload();

    // -------------------------------------------------------
    // Modal (hidden initially)
    // -------------------------------------------------------
    const modal = document.createElement("div");
    modal.id = "crd-reso-modal";
    modal.style.display = "none";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(0,0,0,0.6)";
    modal.style.zIndex = "999999";
    modal.style.backdropFilter = "blur(6px)";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";

    const modalInner = document.createElement("div");
    modalInner.style.background = "#111";
    modalInner.style.padding = "20px";
    modalInner.style.borderRadius = "8px";
    modalInner.style.width = "300px";
    modalInner.style.border = "1px solid #333";
    modalInner.style.color = "white";
    modalInner.style.maxHeight = "80vh";
    modalInner.style.overflowY = "auto";
    modalInner.style.boxShadow = "0 0 20px rgba(0,0,0,0.8)";

    const modalClose = document.createElement("button");
    modalClose.textContent = "Close";
    modalClose.style.marginBottom = "10px";
    modalClose.style.padding = "4px 10px";
    modalClose.style.cursor = "pointer";
    modalClose.style.border = "1px solid #555";
    modalClose.style.background = "#222";
    modalClose.style.color = "#fff";
    modalClose.style.borderRadius = "4px";

    const modalBody = document.createElement("div");

    modalInner.appendChild(modalBody);
    modal.appendChild(modalInner);
    document.body.appendChild(modal);
    modalInner.appendChild(modalClose);

    // -------------------------------------------------------
    // Open Modal
    // -------------------------------------------------------
    openModalBtn.onclick = () => {
      buildModalContent(modalBody);
      modal.style.display = "flex";
    };

    modalClose.onclick = () => {
      modal.style.display = "none";
    };

    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };

    // -------------------------------------------------------
    // Add widget to toolbar
    // -------------------------------------------------------
    wrapper.appendChild(openModalBtn);
    wrapper.appendChild(refreshPage);
    group1.parentElement.appendChild(wrapper);

    console.log("CRD resolution modal widget added.");
  }

  function toolbarKB() {

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
  }

  // === The full script body ===
  function initCRDLayout() {

    // === LocalStorage helpers ===
    const STORAGE_KEY = 'crd_layout_settings';

    function loadSettings() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch {
        return {};
      }
    }

    function saveSetting(key, value) {
      const s = loadSettings();
      s[key] = value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }

    const settings = loadSettings();

    // ===== Locate CRD Elements (tolerant selectors) =====
    const s  = document.querySelector('.xHUvi.qr01Jb') ||
               document.querySelector('.xHUvi.REbh3b.qr01Jb') ||
               document.querySelector('.xHUvi.REbh3b.FKhztc.qr01Jb');
    const sp = document.querySelector('section.MboOLb[aria-label="Displays"]');
    const c  = document.querySelector('canvas.sshIvb');
    const vc = document.querySelector('div.VCqmx');
    const crdSurface = document.querySelector('.SaCab');
    const landscapeDiv = document.querySelector('.n9VB4d.LgVU8b'); // landscape keyboard container

    // === New: the main view area wrapper we constrain to for Float KB ===
    const mainView = document.querySelector('.YtOxne[role="main"]') || document.querySelector('.YtOxne');

    if (!(sp && c && vc && crdSurface)) {
      console.warn('⚠️ Missing required CRD elements.');
      return;
    }

    // --- Ensure keyboard is expanded before proceeding ---
    let ke = document.querySelector('.V9Tle.JZG3Fc.hdWt0');
    if (!ke) {
      const collapsed = document.querySelector('.V9Tle.JZG3Fc');
      if (collapsed) {
        console.log('🟡 Expanding collapsed keyboard…');
        collapsed.classList.add('hdWt0');
        const start = Date.now();
        while (Date.now() - start < 500) {} // half-second delay for DOM update
      }
    }

    let k = document.querySelector('.V9Tle.JZG3Fc');
    if (!k) {
      console.error('❌ Could not find or expand keyboard — aborting.');
      return;
    }

    const baseKeyboardHeight = k?.offsetHeight || 0;
    console.log(`🎹 Keyboard height detected: ${baseKeyboardHeight}px`);

    const originalParent = k?.parentElement || null;
    const originalNextSibling = k?.nextSibling || null;
    let ns = null;

    const insertKeyboard = () => {
      if (!k || ns) return;
      ns = document.createElement('section');
      ns.className = 'MboOLb injected-keyboard-section';
      ns.setAttribute('role', 'region');
      ns.setAttribute('aria-label', 'Keyboard');
      ns.appendChild(k);
      sp.insertAdjacentElement('afterend', ns);
      Object.assign(k.style, {
        width: '100%',
        background: 'rgba(0,0,0,0.25)',
        position: 'relative',
        transform: 'none',
        left: '0',
        bottom: '0',
        zIndex: 'auto'
      });
      console.log('✅ Keyboard relocated (sidebar).');
    };

    const removeKeyboard = () => {
      if (!k) return;
      if (originalParent && k.parentElement !== originalParent) {
        if (originalNextSibling) originalParent.insertBefore(k, originalNextSibling);
        else originalParent.appendChild(k);
        console.log('↩️ Keyboard restored to original (main area).');
      }
      if (ns) { ns.remove(); ns = null; }
      k.removeAttribute('style');
    };

    // ===== Touchpad Section (sidebar pad) =====
    const padSection = document.createElement('section');
    padSection.className = 'MboOLb injected-pad-section';
    padSection.setAttribute('role', 'region');
    padSection.setAttribute('aria-label', 'Touchpad Section');

    const padContainer = document.createElement('div');
    Object.assign(padContainer.style, {
      height: '400px',
      background: 'transparent',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: '12px'
    });

    const padLabel = document.createElement('div');
    padLabel.textContent = 'Touchpad Overlay';
    Object.assign(padLabel.style, {
      color: '#fff',
      fontSize: '16px',
      marginBottom: '8px'
    });

    const touchpad = document.createElement('div');
    Object.assign(touchpad.style, {
      width: '90%',
      maxWidth: '360px',
      height: '240px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      touchAction: 'none',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(4px)',
      transition: 'background 0.15s'
    });

    padContainer.append(padLabel, touchpad);
    padSection.append(padContainer);

    insertKeyboard();
    const kbSection = document.querySelector('.injected-keyboard-section');
    if (kbSection) kbSection.insertAdjacentElement('afterend', padSection);
    else sp.insertAdjacentElement('afterend', padSection);
    console.log('✅ Touchpad overlay inserted below keyboard (sidebar mode).');

    // ===== Offset / Controls Section (below touchpad) =====
    const o = document.createElement('section');
    o.className = 'MboOLb injected-offset-section';
    o.setAttribute('role', 'region');
    o.setAttribute('aria-label', 'Sidebar Offset');

    const w = document.createElement('div');
    w.style.padding = '6px 8px';

    const l = document.createElement('label');
    l.textContent = 'Sidebar Offset (px):';
    l.style.display = 'block';
    l.style.marginBottom = '4px';
    const i = document.createElement('input');
    i.type = 'number';
    i.placeholder = 'e.g. 100 or -100';
    i.value = settings.sidebarOffset ?? '';
    i.addEventListener('input', () => saveSetting('sidebarOffset', i.value));
    Object.assign(i.style, { width: '100%', boxSizing: 'border-box', padding: '4px' });
    w.append(l, i);

    // Landscape offset
    const l2 = document.createElement('label');
    l2.textContent = 'Landscape Offset (px):';
    Object.assign(l2.style, { display: 'block', marginTop: '8px', marginBottom: '4px' });
    const i2 = document.createElement('input');
    i2.type = 'number';
    i2.placeholder = 'e.g. 50 or -50';
    i2.value = settings.landscapeOffset ?? '';
    i2.addEventListener('input', () => saveSetting('landscapeOffset', i2.value));
    Object.assign(i2.style, { width: '100%', boxSizing: 'border-box', padding: '4px' });

    // const chkWrap = document.createElement('div');
    // chkWrap.style.marginTop = '6px';
    // const chk = document.createElement('input');
    // chk.type = 'checkbox';
    // chk.id = 'useRightMargin';
    // const chkLabel = document.createElement('label');
    // chkLabel.htmlFor = 'useRightMargin';
    // chkLabel.textContent = ' Use Right Margin';
    // chk.checked = settings.useRightMargin ? true : false;
    // chk.addEventListener('change', () => saveSetting('useRightMargin', chk.checked));
    // chkWrap.append(chk, chkLabel);

    // Keyboard Height Override
    const l3 = document.createElement('label');
    l3.textContent = 'Landscape Keyboard Height (px):';
    Object.assign(l3.style, { display: 'block', marginTop: '8px', marginBottom: '4px' });

    const i3 = document.createElement('input');
    i3.type = 'number';
    i3.value = settings.keyboardHeight ?? baseKeyboardHeight;
    i3.addEventListener('input', () => saveSetting('keyboardHeight', i3.value));
    Object.assign(i3.style, { width: '100%', boxSizing: 'border-box', padding: '4px' });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Height';
    Object.assign(resetBtn.style, {
      marginTop: '6px',
      padding: '4px 8px',
      background: '#333',
      color: '#fff',
      border: '1px solid #555',
      borderRadius: '4px',
      cursor: 'pointer'
    });

    resetBtn.addEventListener('click', () => {
      if (!k) return;
      k.style.height = '';
      if (landscapeDiv) {
        landscapeDiv.style.removeProperty('--keyboard-height');
        landscapeDiv.style.height = '';
      }
      const currentHeight = k.offsetHeight || baseKeyboardHeight;
      i3.value = currentHeight;
      const inlinePad = document.querySelector('.touchpad-inline');
      if (inlinePad) inlinePad.style.height = `${currentHeight}px`;
      console.log(`↩️ Keyboard height reset to default (${currentHeight}px).`);
      updateDockLayout();
    });

    // Placement selector
    const layoutLabel = document.createElement('label');
    layoutLabel.textContent = 'Touchpad & Keyboard Placement:';
    Object.assign(layoutLabel.style, { display: 'block', marginTop: '10px', marginBottom: '4px' });

    const layoutSelect = document.createElement('select');
    Object.assign(layoutSelect.style, {
      width: '100%', boxSizing: 'border-box', padding: '4px', marginBottom: '6px'
    });
    layoutSelect.innerHTML = `
      <option value="sidebar" selected>Sidebar (default)</option>
      <option value="land-left">Left Landscape (keyboard left, touchpad right)</option>
      <option value="land-right">Right Landscape (keyboard right, touchpad left)</option>
      <option value="land-bottom-touchpad">Landscape Bottom Touchpad</option>
      <option value="land-kb-only">Landscape Keyboard Only (no touchpad)</option>
      <option value="float-kb">Float keyboard (PiP overlay)</option>
      <option value="land-split">Landscape Split Keyboard</option>
    `;

    const layoutNote = document.createElement('div');
    layoutNote.textContent = '(Landscape options require the landscape keyboard to be visible)';
    Object.assign(layoutNote.style, {
      fontSize: '12px',
      color: '#aaa',
      marginTop: '-2px',
      marginBottom: '6px'
    });

    if (!landscapeDiv) {
      Array.from(layoutSelect.options).forEach(opt => {
        if (opt.value.startsWith('land-')) opt.disabled = true;
      });
      layoutNote.style.color = '#f77';
    }

    // Restore saved layout value (or default to 'sidebar')
    layoutSelect.value = settings.layoutMode ? settings.layoutMode : 'sidebar';
    layoutSelect.addEventListener('change', () => {
      saveSetting('layoutMode', layoutSelect.value);
    });

    let l4, i4;

    // Landscape touchpad width
    l4 = document.createElement('label');
    l4.textContent = 'Landscape Touchpad Width (px):';
    Object.assign(l4.style, { display: 'block', marginTop: '6px', marginBottom: '4px' });
    i4 = document.createElement('input');
    i4.type = 'number';
    i4.value = settings.touchpadWidth ?? 320;
    i4.addEventListener('input', () => saveSetting('touchpadWidth', i4.value));
    Object.assign(i4.style, { width: '100%', boxSizing: 'border-box', padding: '4px' });

    // === Split Gap Control ===
    const splitGapWrap = document.createElement('div');
    Object.assign(splitGapWrap.style, { marginTop: '8px' });
    const splitLabel = document.createElement('label');
    splitLabel.textContent = 'Split gap (px):';
    Object.assign(splitLabel.style, { display: 'block', marginBottom: '4px' });

    const splitInput = document.createElement('input');
    splitInput.type = 'number';
    splitInput.min = 0;
    splitInput.value = loadSettings().splitGap || 20;
    Object.assign(splitInput.style, { width: '100%', boxSizing: 'border-box' });
    splitInput.addEventListener('change', () => {
      const val = parseInt(splitInput.value) || 0;
      saveSetting('splitGap', val);
      applySplitGap();
    });

    splitGapWrap.append(splitLabel, splitInput);
    // sidebar.append(splitGapWrap);


    // === FLOAT KB transparency control (appears only in float-kb) ===
    const alphaWrap = document.createElement('div');
    Object.assign(alphaWrap.style, { marginTop: '10px', display: 'none' });

    const alphaLabel = document.createElement('label');
    alphaLabel.textContent = 'Float keyboard transparency:';
    Object.assign(alphaLabel.style, { display: 'block', marginBottom: '4px' });

    // ✅ Slider version
    const alphaInput = document.createElement('input');
    alphaInput.type = 'range';
    alphaInput.min = '0';
    alphaInput.max = '1';
    alphaInput.step = '0.05';
    alphaInput.value = (settings.floatAlpha ?? 0.25);
    Object.assign(alphaInput.style, { width: '100%' });

    const alphaValue = document.createElement('span');
    alphaValue.textContent = alphaInput.value;
    Object.assign(alphaValue.style, { marginLeft: '8px', color: '#ccc', fontSize: '13px' });

    alphaInput.addEventListener('input', () => {
      let v = parseFloat(alphaInput.value);
      if (isNaN(v)) v = 0.25;
      v = Math.max(0, Math.min(1, v));
      alphaValue.textContent = v.toFixed(2);
      saveSetting('floatAlpha', v);
      applyFloatAlpha(); // now real-time visual update
    });

    alphaWrap.append(alphaLabel, alphaInput, alphaValue);

    // === Additional Float KB toggles ===
    const blurToggleWrap = document.createElement('div');
    Object.assign(blurToggleWrap.style, { marginTop: '8px' });
    const blurChk = document.createElement('input');
    blurChk.type = 'checkbox';
    blurChk.id = 'floatBlur';
    blurChk.checked = settings.floatBlur !== false; // default ON
    const blurLabel = document.createElement('label');
    blurLabel.htmlFor = 'floatBlur';
    blurLabel.textContent = ' Enable blur background';
    blurChk.addEventListener('change', () => {
      saveSetting('floatBlur', blurChk.checked);
      applyFloatBlur();
    });
    blurToggleWrap.append(blurChk, blurLabel);

    // --- Title Bar toggle ---
    const barToggleWrap = document.createElement('div');
    Object.assign(barToggleWrap.style, { marginTop: '6px' });
    const barChk = document.createElement('input');
    barChk.type = 'checkbox';
    barChk.id = 'floatTitleBar';
    barChk.checked = settings.floatShowBar !== false; // default ON
    const barLabel = document.createElement('label');
    barLabel.htmlFor = 'floatTitleBar';
    barLabel.textContent = ' Show title bar';
    barChk.addEventListener('change', () => {
      saveSetting('floatShowBar', barChk.checked);
      applyFloatTitleBar();
    });
    barToggleWrap.append(barChk, barLabel);

    alphaWrap.append(blurToggleWrap, barToggleWrap);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Saved Settings';
    Object.assign(clearBtn.style, {
      marginTop: '6px',
      padding: '4px 8px',
      background: '#552222',
      color: '#fff',
      border: '1px solid #844',
      borderRadius: '4px',
      cursor: 'pointer'
    });

    clearBtn.addEventListener('click', () => {
      localStorage.removeItem('crd_layout_settings');
      console.log('🧹 LocalStorage cleared for crd_layout_settings');
      alert('Saved layout settings cleared. Reload or re-run the script to reset.');
    });

    w.append(
      l, i,
      l2, i2,
      l3, i3, resetBtn,
      l4, i4, splitGapWrap,
      layoutLabel, layoutSelect, layoutNote,
      alphaWrap,           // <= new, transparency control block
      clearBtn
    );
    o.append(w);
    padSection.insertAdjacentElement('afterend', o);

    // ===== Dock Layout Handler =====
    let dockPad = null;
    const GAP = 12;

    const ensureDockPad = () => {
      if (dockPad && document.body.contains(dockPad)) return dockPad;
      dockPad = touchpad.cloneNode(true);
      dockPad.classList.add('touchpad-inline');
      Object.assign(dockPad.style, {
        position: 'absolute',
        top: '0',
        bottom: '0',
        width: `${Math.max(120, parseInt(i4.value || '320', 10))}px`,
        margin: '0',
        maxWidth: 'none',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.08)'
      });
      ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend'].forEach(evt => {
        dockPad.addEventListener(evt, e => {
          const clone = new e.constructor(evt, e);
          crdSurface.dispatchEvent(clone);
          e.preventDefault();
        }, { passive: false });
      });
      return dockPad;
    };

    const removeDockPad = () => {
      if (dockPad && dockPad.parentElement) dockPad.remove();
      dockPad = null;
    };

    // === FLOAT KB elements/state ===
    let floatWrap = null;
    let floatBar  = null;
    let floatTag  = null;
    let isLocked  = !!settings.floatLocked;
    let hiddenEdge = settings.floatHiddenEdge || null;
    const TAG_W = 28;
    const SWIPE_THRESHOLD = 120;
    const DEFAULT_ALPHA = (settings.floatAlpha ?? 0.25);
    // let swipeEnabled = settings.floatSwipeEnabled !== false; // default ON
    let swipeEnabled = false; // default OFF (and hidden toggle)

    function applyFloatAlpha() {
      const v = parseFloat(alphaInput.value);
      const a = isNaN(v) ? DEFAULT_ALPHA : Math.max(0, Math.min(1, v));
      if (!floatWrap) return;

      // ✅ Update background instantly
      floatWrap.style.background = `rgba(0,0,0,${a})`;

      // Optionally fade keyboard contents slightly as well
      const innerKeyboard = floatWrap.querySelector('.V9Tle.JZG3Fc');
      if (innerKeyboard) {
        innerKeyboard.style.opacity = `${0.6 + a * 0.4}`; // makes text slightly dimmer if desired
      }
    }

    function applyFloatBlur() {
      if (!floatWrap) return;
      const enabled = loadSettings().floatBlur !== false;
      floatWrap.style.backdropFilter = enabled ? 'blur(4px)' : 'none';
    }

    function applyFloatTitleBar() {
      if (!floatBar || !floatWrap) return;
      const enabled = loadSettings().floatShowBar !== false;

      // Show/hide the title bar
      floatBar.style.display = enabled ? 'flex' : 'none';

      // Adjust height so keyboard area fills entire float box
      const kbArea = floatWrap.querySelector('.V9Tle.JZG3Fc');
      if (kbArea) {
        kbArea.style.height = enabled
          ? `calc(100% - ${floatBar.offsetHeight}px)`
          : '100%';
      }
    }


    function killFloatKb() {
      if (floatTag) { floatTag.remove(); floatTag = null; }
      if (floatWrap) {
        // move keyboard back out before removing
        if (k && floatWrap.contains(k)) {
          if (originalParent) {
            if (originalNextSibling) originalParent.insertBefore(k, originalNextSibling);
            else originalParent.appendChild(k);
          }
        }
        floatWrap.remove();
        floatWrap = null;
        floatBar = null;
      }
      hiddenEdge = null;
    }

    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    function ensureFloatKb() {
      if (!mainView) {
        console.warn('Float KB requested but main view (.YtOxne) not found.');
        return;
      }
      if (floatWrap && document.body.contains(floatWrap)) return;

      // === Container ===
      floatWrap = document.createElement('div');
      floatWrap.className = 'crd-float-kb';
      Object.assign(floatWrap.style, {
        position: 'absolute',
        left: '20px',
        top: '20px',
        maxWidth: '90%',
        zIndex: '99999',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '8px',
        overflow: 'hidden',
        backdropFilter: (settings.floatBlur !== false ? 'blur(4px)' : 'none'),
        background: `rgba(0,0,0,${parseFloat(alphaInput.value) || DEFAULT_ALPHA})`,
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
      });

      // === Title / control bar ===
      floatBar = document.createElement('div');
      Object.assign(floatBar.style, {
        height: '32px',
        lineHeight: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        padding: '0 8px',
        userSelect: 'none',
        cursor: isLocked ? 'default' : 'move',
        background: 'rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.15)'
      });

      const title = document.createElement('span');
      title.textContent = 'Floating Keyboard';
      Object.assign(title.style, { color: '#fff', fontSize: '13px', opacity: '0.9' });

      const controls = document.createElement('div');
      Object.assign(controls.style, { display: 'flex', gap: '6px' });

      // --- Lock button ---
      const lockBtn = document.createElement('button');
      lockBtn.textContent = isLocked ? 'Unlock' : 'Lock';
      Object.assign(lockBtn.style, {
        border: '1px solid #777',
        borderRadius: '4px',
        padding: '2px 8px',
        background: '#333',
        color: '#fff',
        cursor: 'pointer'
      });
      lockBtn.addEventListener('click', () => {
        isLocked = !isLocked;
        saveSetting('floatLocked', isLocked);
        lockBtn.textContent = isLocked ? 'Unlock' : 'Lock';
        floatBar.style.cursor = isLocked ? 'default' : 'move';
      });

      // --- Hide button ---
      const hideBtn = document.createElement('button');
      hideBtn.textContent = 'Hide';
      Object.assign(hideBtn.style, {
        border: '1px solid #777',
        borderRadius: '4px',
        padding: '2px 8px',
        background: '#333',
        color: '#fff',
        cursor: 'pointer'
      });
      hideBtn.addEventListener('click', () => {
        if (!floatWrap) return;
        const parentRect = mainView.getBoundingClientRect();
        const myRect = floatWrap.getBoundingClientRect();
        const distLeft = myRect.left - parentRect.left;
        const distRight = parentRect.right - myRect.right;
        if (distLeft <= distRight) {
          setFloatPos(-myRect.width + TAG_W, myRect.top - parentRect.top);
          hiddenEdge = 'left';
        } else {
          setFloatPos(parentRect.width - TAG_W, myRect.top - parentRect.top);
          hiddenEdge = 'right';
        }
        makeOrUpdateTag();
        saveSetting('floatHiddenEdge', hiddenEdge);
      });

      // --- Swipe toggle (hidden for now) ---
      const swipeBtn = document.createElement('button');
      swipeBtn.textContent = swipeEnabled ? 'Swipe: On' : 'Swipe: Off';
      Object.assign(swipeBtn.style, {
        border: '1px solid #777',
        borderRadius: '4px',
        padding: '2px 8px',
        background: '#333',
        color: '#fff',
        cursor: 'pointer',
        visibility: 'hidden' // hidden but functional for later
      });
      swipeBtn.addEventListener('click', () => {
        swipeEnabled = !swipeEnabled;
        swipeBtn.textContent = swipeEnabled ? 'Swipe: On' : 'Swipe: Off';
        saveSetting('floatSwipeEnabled', swipeEnabled);
      });

      controls.append(lockBtn, hideBtn, swipeBtn);
      floatBar.append(title, controls);

      // === Keyboard container ===
      const kbHost = document.createElement('div');
      Object.assign(kbHost.style, { position: 'relative' });
      kbHost.appendChild(k);
      floatWrap.append(floatBar, kbHost);

      // === Insert overlay into main view ===
      if (getComputedStyle(mainView).position === 'static') {
        mainView.style.position = 'relative';
      }
      mainView.appendChild(floatWrap);

      // === Restore position ===
      const px = settings.floatPosX ?? 20;
      const py = settings.floatPosY ?? 20;
      setFloatPos(px, py);

      // === Restore size ===
      const MIN_W = 240;
      const MIN_H = 120;
      function applySavedSize() {
        const w = settings.floatWidth ?? 480;
        const h = settings.floatHeight ?? (k ? k.offsetHeight : 200);
        floatWrap.style.width = w + 'px';
        floatWrap.style.height = h + 'px';
      }
      applySavedSize();

      // === Resize handles (top-left & top-right) ===
      const handleLeft = document.createElement('div');
      const handleRight = document.createElement('div');
      [handleLeft, handleRight].forEach(h => {
        Object.assign(h.style, {
          position: 'absolute',
          top: '0',
          width: '20px',
          height: '20px',
          cursor: (h === handleLeft) ? 'nwse-resize' : 'nesw-resize',
          zIndex: '100000',
          userSelect: 'none'
        });
      });
      handleLeft.style.left = '0';
      handleRight.style.right = '0';
      floatWrap.append(handleLeft, handleRight);

      let resizing = false;
      let resizeStartX = 0, resizeStartY = 0;
      let startWidth = 0, startHeight = 0;

      function beginResize(e, fromLeft) {
        resizing = true;

        resizeStartX = (e.touches ? e.touches[0].clientX : e.clientX);
        resizeStartY = (e.touches ? e.touches[0].clientY : e.clientY);

        const rect = floatWrap.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        const startLeftPos = parseFloat(floatWrap.style.left) || 0;
        const startTopPos  = parseFloat(floatWrap.style.top)  || 0;

        e.preventDefault();
        document.body.style.cursor = fromLeft ? 'nwse-resize' : 'nesw-resize';
        document.body.style.userSelect = 'none';

        const moveHandler = ev => {
          if (!resizing) return;

          const curX = (ev.touches ? ev.touches[0].clientX : ev.clientX);
          const curY = (ev.touches ? ev.touches[0].clientY : ev.clientY);

          const dx = curX - resizeStartX;
          const dy = curY - resizeStartY;

          // Width behavior
          let newW = fromLeft
            ? Math.max(MIN_W, startWidth - dx)
            : Math.max(MIN_W, startWidth + dx);

          // Height behavior (up = shrink, down = grow)
          let newH = Math.max(MIN_H, startHeight - dy);

          floatWrap.style.width = newW + 'px';
          floatWrap.style.height = newH + 'px';

          // Adjust top/left anchors
          if (fromLeft) floatWrap.style.left = (startLeftPos + dx) + 'px';
          floatWrap.style.top = (startTopPos + dy) + 'px';

          // ✅ Sync landscape keyboard container height (minus title bar)
          const titleBarHeight = floatBar?.offsetHeight || 0;
          if (landscapeDiv) {
            const adjusted = newH - titleBarHeight;
            landscapeDiv.style.height = `${adjusted}px`;
            landscapeDiv.style.setProperty('--keyboard-height', `${adjusted}px`);
          }
        };

        const endHandler = () => {
          if (!resizing) return;
          resizing = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';

          const rect = floatWrap.getBoundingClientRect();
          saveSetting('floatWidth', rect.width);
          saveSetting('floatHeight', rect.height);
          saveSetting('floatPosX', parseFloat(floatWrap.style.left));
          saveSetting('floatPosY', parseFloat(floatWrap.style.top));

          // ✅ Persist keyboard height for reloads
          const adjusted = rect.height - (floatBar?.offsetHeight || 0);
          if (landscapeDiv) saveSetting('keyboardHeight', adjusted);

          window.removeEventListener('pointermove', moveHandler);
          window.removeEventListener('pointerup', endHandler);
          window.removeEventListener('touchmove', moveHandler);
          window.removeEventListener('touchend', endHandler);
        };

        window.addEventListener('pointermove', moveHandler, { passive: false });
        window.addEventListener('pointerup', endHandler);
        window.addEventListener('touchmove', moveHandler, { passive: false });
        window.addEventListener('touchend', endHandler);
      }

      handleLeft.addEventListener('pointerdown', e => beginResize(e, true));
      handleRight.addEventListener('pointerdown', e => beginResize(e, false));
      handleLeft.addEventListener('touchstart', e => beginResize(e, true));
      handleRight.addEventListener('touchstart', e => beginResize(e, false));

      // === Restore hidden-edge tag if previously hidden ===
      if (settings.floatHiddenEdge) {
        hiddenEdge = settings.floatHiddenEdge;
        makeOrUpdateTag();
      }

      // === Drag logic (move bar) ===
      let dragging = false;
      let startX = 0, startY = 0;
      let startLeft = 0, startTop = 0;
      let movedX = 0;

      function onDown(e) {
        if (isLocked) return;
        dragging = true;
        movedX = 0;
        const rect = floatWrap.getBoundingClientRect();
        startLeft = rect.left;
        startTop  = rect.top;
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        startY = (e.touches ? e.touches[0].clientY : e.clientY);
        e.preventDefault();
      }

      function onMove(e) {
        if (!dragging) return;
        const curX = (e.touches ? e.touches[0].clientX : e.clientX);
        const curY = (e.touches ? e.touches[0].clientY : e.clientY);
        const dx = curX - startX;
        const dy = curY - startY;
        movedX = dx;
        const parentRect = mainView.getBoundingClientRect();
        const myRect = floatWrap.getBoundingClientRect();
        const newLeft = clamp(startLeft + dx - parentRect.left, -myRect.width + TAG_W, parentRect.width - TAG_W);
        const newTop  = clamp(startTop  + dy - parentRect.top,  0, parentRect.height - myRect.height);
        floatWrap.style.left = `${newLeft}px`;
        floatWrap.style.top  = `${newTop}px`;
      }

      function onUp() {
        if (!dragging) return;
        dragging = false;
        const parentRect = mainView.getBoundingClientRect();
        const myRect = floatWrap.getBoundingClientRect();

        if (swipeEnabled && Math.abs(movedX) > SWIPE_THRESHOLD) {
          if (movedX < 0) {
            setFloatPos(-myRect.width + TAG_W, myRect.top - parentRect.top);
            hiddenEdge = 'left';
          } else {
            setFloatPos(parentRect.width - TAG_W, myRect.top - parentRect.top);
            hiddenEdge = 'right';
          }
          makeOrUpdateTag();
          saveSetting('floatHiddenEdge', hiddenEdge);
        } else {
          saveSetting('floatPosX', myRect.left - parentRect.left);
          saveSetting('floatPosY', myRect.top - parentRect.top);
          hiddenEdge = null;
          saveSetting('floatHiddenEdge', hiddenEdge);
          removeTag();
        }
      }

      floatBar.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      floatBar.addEventListener('touchstart', onDown, { passive: false });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);

      applyFloatAlpha();
      applyFloatBlur();
      applyFloatTitleBar();
    }

    function setFloatPos(leftPx, topPx) {
      if (!floatWrap || !mainView) return;
      const parentRect = mainView.getBoundingClientRect();
      const myRect = floatWrap.getBoundingClientRect();

      // clamp
      const L = clamp(leftPx, -myRect.width + TAG_W, parentRect.width - TAG_W);
      const T = clamp(topPx, 0, Math.max(0, parentRect.height - myRect.height));
      floatWrap.style.left = `${L}px`;
      floatWrap.style.top  = `${T}px`;

      saveSetting('floatPosX', L);
      saveSetting('floatPosY', T);
    }

    function makeOrUpdateTag() {
      if (!mainView || !floatWrap) return;
      if (!floatTag) {
        floatTag = document.createElement('div');
        floatTag.textContent = 'KB';
        Object.assign(floatTag.style, {
          position: 'absolute',
          top: '0px',
          width: `${TAG_W}px`,
          height: '48px',
          lineHeight: '48px',
          textAlign: 'center',
          color: '#fff',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '8px',
          zIndex: '100000',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)'
        });
        mainView.appendChild(floatTag);
        floatTag.addEventListener('click', () => {
          // bring back from edge, slightly inside
          const parentRect = mainView.getBoundingClientRect();
          const myRect = floatWrap.getBoundingClientRect();
          const targetLeft = (hiddenEdge === 'left') ? 8 : (parentRect.width - myRect.width - 8);
          const targetTop  = parseFloat(floatWrap.style.top) || 20;
          setFloatPos(targetLeft, targetTop);
          hiddenEdge = null;
          saveSetting('floatHiddenEdge', hiddenEdge);
          removeTag();
        });
      }

      // Position tag on the same edge and aligned with floatWrap top
      const y = parseFloat(floatWrap.style.top) || 0;
      floatTag.style.top = `${y}px`;
      if (hiddenEdge === 'left') {
        floatTag.style.left = '0px';
        floatTag.style.right = '';
        floatTag.style.borderTopLeftRadius = '0';
        floatTag.style.borderBottomLeftRadius = '0';
      } else if (hiddenEdge === 'right') {
        floatTag.style.right = '0px';
        floatTag.style.left = '';
        floatTag.style.borderTopRightRadius = '0';
        floatTag.style.borderBottomRightRadius = '0';
      }
    }

    function removeTag() {
      if (floatTag) { floatTag.remove(); floatTag = null; }
    }

    function showAlphaControl(show) {
      alphaWrap.style.display = show ? '' : 'none';
    }

    let __lastSplitKbWidth = null;

    function applySplitGap() {
      const settings = loadSettings();
      const gap = settings.splitGap ?? 100;
      const keyboard = document.querySelector('.n9VB4d.LgVU8b');
      if (!keyboard) return;

      // 50/50 split (7 left, 7 right)
      const splitPairs = [
        ['Digit6', 'Digit7'],
        ['KeyY',   'KeyU'],
        ['KeyH',   'KeyJ'],
        ['KeyB',   'KeyN']
      ];

      // Measure width (and remember so the watcher can avoid rework)
      const kbWidth = keyboard.offsetWidth || keyboard.getBoundingClientRect().width;
      __lastSplitKbWidth = Math.round(kbWidth);

      const borderWidth = 2;
      const numKeys = 14;

      // Base key width calculation
      const keyWidth = (kbWidth / numKeys) - borderWidth - (gap / numKeys);
      const keyWidthPx = `${keyWidth}px`;

      // Reset styles first
      keyboard.querySelectorAll('.kwQ2Lb').forEach(k => {
        k.style.removeProperty('margin-left');
        k.style.removeProperty('margin-right');
        k.style.removeProperty('min-width');
        k.style.removeProperty('max-width');
        k.style.removeProperty('left');
        k.style.removeProperty('position');
      });

      const halfGap = gap / 2;

      // === Main split logic
      splitPairs.forEach(([leftKey, rightKey]) => {
        const leftEl  = keyboard.querySelector(`[data-key="${leftKey}"]`);
        const rightEl = keyboard.querySelector(`[data-key="${rightKey}"]`);
        if (!leftEl || !rightEl) return;

        // Stabilize sizing
        leftEl.style.minWidth  = keyWidthPx;
        rightEl.style.minWidth = keyWidthPx;

        // Margins to create total split gap
        leftEl.style.marginRight  = `${halfGap}px`;
        rightEl.style.marginLeft  = `${halfGap}px`;

        // Relative position for subtle inward offsets
        leftEl.style.position  = 'relative';
        rightEl.style.position = 'relative';

        // Inward offsets, halved as requested
        // - Do NOT offset left for 6, Y, B
        if (!['Digit6', 'KeyY', 'KeyB'].includes(leftKey)) {
          leftEl.style.left = `-${halfGap / 2}px`;
        }

        // - Do NOT offset right for J
        if (rightKey !== 'KeyJ') {
          rightEl.style.left = `${halfGap / 2}px`;
        }
      });

      // === Center anchor on the left side now: lock G (min+max)
      const gKey = keyboard.querySelector('[data-key="KeyG"]');
      if (gKey) {
        gKey.style.minWidth = keyWidthPx;
        gKey.style.maxWidth = keyWidthPx;
        gKey.style.position = 'relative';
      }

      // === Mirror anchors on the right side: 8 / I / M => max-width + left offset (no min-width)
      ['Digit8', 'KeyI', 'KeyM'].forEach(code => {
        const el = keyboard.querySelector(`[data-key="${code}"]`);
        if (!el) return;
        el.style.maxWidth = keyWidthPx;
        el.style.position = 'relative';
        el.style.left = `${halfGap / 2}px`;
      });

      // Optional: smoothen changes while sliding gap
      // keyboard.querySelectorAll('.kwQ2Lb').forEach(k => k.style.transition = 'all 0.12s ease');

      console.log(`🎹 Split gap ${gap}px applied (keyWidth=${keyWidth.toFixed(1)}px, half-gap=${halfGap}px; G locked min/max; 8/I/M max+left).`);
    }

    let __splitKB_RO = null;
    let __splitKB_applyQueued = false;

    function __queueApplySplitGap() {
      if (__splitKB_applyQueued) return;
      __splitKB_applyQueued = true;
      setTimeout(() => {
        __splitKB_applyQueued = false;
        applySplitGap();
      }, 120); // light debounce
    }

    function startSplitKbWatcher() {
      const keyboard = document.querySelector('.n9VB4d.LgVU8b');
      if (!keyboard) return;

      // Disconnect any previous observer
      if (__splitKB_RO) {
        try { __splitKB_RO.disconnect(); } catch {}
        __splitKB_RO = null;
      }

      // Prime width so we can compare
      __lastSplitKbWidth = Math.round(keyboard.offsetWidth || keyboard.getBoundingClientRect().width);

      // ResizeObserver (cheap; triggers only on content rect changes)
      __splitKB_RO = new ResizeObserver(entries => {
        const cr = entries[0]?.contentRect;
        if (!cr) return;
        const w = Math.round(cr.width);
        if (w !== __lastSplitKbWidth) {
          __lastSplitKbWidth = w;
          // Defer work; prefer idle if available
          if (window.requestIdleCallback) {
            requestIdleCallback(() => __queueApplySplitGap(), { timeout: 200 });
          } else {
            __queueApplySplitGap();
          }
        }
      });

      __splitKB_RO.observe(keyboard);

      // Fallbacks for viewport changes/orientation
      window.addEventListener('resize', __queueApplySplitGap);
      window.addEventListener('orientationchange', __queueApplySplitGap);
    }

    function stopSplitKbWatcher() {
      if (__splitKB_RO) {
        try { __splitKB_RO.disconnect(); } catch {}
        __splitKB_RO = null;
      }
      window.removeEventListener('resize', __queueApplySplitGap);
      window.removeEventListener('orientationchange', __queueApplySplitGap);
    }


    function showSplitGapControl(show) {
      // Show/hide the Split Gap control in the sidebar
      splitGapWrap.style.visibility = show ? 'visible' : 'hidden';
      splitGapWrap.style.height = show ? '' : '0';
      splitGapWrap.style.overflow = show ? '' : 'hidden';

      // Only do cleanup when turning OFF split mode
      if (show) return;

      const keyboard = document.querySelector('.n9VB4d.LgVU8b');
      if (!keyboard) return;

      // // All keys we ever touched in split mode
      // const ALL_TOUCHED_KEYS = [
      //   'Digit5','Digit6',
      //   'KeyT','KeyY',
      //   'KeyG','KeyH',
      //   'KeyV','KeyB',
      //   'KeyF',          // center anchor (min/max)
      //   'Digit7','KeyU','KeyN' // right-side anchors (max + left)
      // ];

      // // Pairs used for margins (ensure margins are cleared)
      // const SPLIT_PAIRS = [
      //   ['Digit5','Digit6'],
      //   ['KeyT','KeyY'],
      //   ['KeyG','KeyH'],
      //   ['KeyV','KeyB']
      // ];

      // All keys we ever touched in split mode
      const ALL_TOUCHED_KEYS = [
        'Digit6','Digit7',
        'KeyY','KeyU',
        'KeyH','KeyJ',
        'KeyB','KeyN',
        'KeyG',          // center anchor (min/max)
        'Digit8','KeyI','KeyM' // right-side anchors (max + left)
      ];

      // Pairs used for margins (ensure margins are cleared)
      const SPLIT_PAIRS = [
        ['Digit6', 'Digit7'],
        ['KeyY', 'KeyU'],
        ['KeyH', 'KeyJ'],
        ['KeyB', 'KeyN']
      ];

      // 1) Clear pair margins
      SPLIT_PAIRS.forEach(([leftKey, rightKey]) => {
        const leftEl  = keyboard.querySelector(`[data-key="${leftKey}"]`);
        const rightEl = keyboard.querySelector(`[data-key="${rightKey}"]`);
        if (leftEl)  leftEl.style.removeProperty('margin-right');
        if (rightEl) rightEl.style.removeProperty('margin-left');
      });

      // 2) Clear widths & offsets on every key we touched
      ALL_TOUCHED_KEYS.forEach(code => {
        const el = keyboard.querySelector(`[data-key="${code}"]`);
        if (!el) return;
        el.style.removeProperty('min-width');
        el.style.removeProperty('max-width');
        el.style.removeProperty('left');
        el.style.removeProperty('position');
        el.style.removeProperty('transition');
      });

      // (Optional) If you added transitions globally during tuning, clear them:
      // keyboard.querySelectorAll('.kwQ2Lb').forEach(k => k.style.removeProperty('transition'));

      console.log('🔄 Split mode styles cleared: margins, widths, and offsets reset.');
    }


    function updateDockLayout() {
      const mode = layoutSelect.value;

      // Always show touchpad width, unluss turned off in a mode.
      if (l4) l4.style.display = '';
      if (i4) i4.style.display = '';

      console.log("updateDockLayout mode =", mode);

      // Float KB mode handled first
      if (mode === 'float-kb') {
        // hide sidebar pad; ensure keyboard floats in main view
        padSection.style.display = 'none';
        showSplitGapControl(false);
        showAlphaControl(true);
        removeDockPad();
        // ensure keyboard not in landscape container
        removeKeyboard(); // put k back to original, then we'll rehost it
        ensureFloatKb();
        console.log('🪟 Float keyboard enabled.');
        return;
      } else {
        // leaving float mode — cleanup
        showAlphaControl(false);
        if (floatWrap) killFloatKb();
        removeTag();
      }

      if (mode === 'land-split') {
        padSection.style.display = 'none';
        removeDockPad();
        removeKeyboard();

        const kb = document.querySelector('.n9VB4d.LgVU8b');
        if (kb) {
          kb.style.display = 'block';
          kb.style.margin = '0 auto';
          kb.style.justifyContent = 'center';
          kb.style.transition = 'all 0.2s ease';
        }

        showSplitGapControl(true);
        applySplitGap();
        startSplitKbWatcher();
        console.log('⌨️ Landscape Split Keyboard mode enabled.');
        return;
      }
      else{
        stopSplitKbWatcher();
        showSplitGapControl(false);
      }

      // Non-landscape or sidebar
      if (!landscapeDiv || mode === 'sidebar') {
        padSection.style.display = '';
        touchpad.style.height = '240px';
        removeDockPad();
        insertKeyboard();

        // Reset keyboard sizing
        if (k) {
          k.style.width = '100%';
          k.style.height = '';
          k.style.removeProperty('--keyboard-height');
        }

        // ✅ Fully clear out landscape keyboard sizing leftovers
        if (landscapeDiv) {
          landscapeDiv.style.marginLeft = '';
          landscapeDiv.style.marginRight = '';
          landscapeDiv.style.marginBottom = '';
          landscapeDiv.style.width = '';
          landscapeDiv.style.height = ''; // 👈 new
          landscapeDiv.style.removeProperty('--keyboard-height'); // 👈 new
        }

        // Optional: forget saved keyboard height so it doesn’t reapply next float
        saveSetting('keyboardHeight', null);

        console.log('↩️ Sidebar layout restored (keyboard height cleared).');
        return;
      }

      // === Landscape Bottom Touchpad logic ===
      if (mode === 'land-bottom-touchpad') {
          padSection.style.display = 'none'; // Hide sidebar pad
          // Hide touchpad width
          l4.style.display = 'none';
          i4.style.display = 'none';

          removeKeyboard();

          const container = landscapeDiv?.parentElement;
          if (!container) return;

          if (getComputedStyle(container).position === 'static')
              container.style.position = 'relative';

          const dp = ensureDockPad();

          // -----------------------------
          // APPLY YOUR LANDSCAPE RULE
          // -----------------------------
          let LO = parseInt(i2.value || '', 10);  // Landscape Offset input
          let TPH, MB;

          if (isNaN(LO)) {
              // No offset entered → default behavior
              TPH = 240;         // touchpad height
              MB  = TPH + 10;    // keyboard margin-bottom
          } else {
              // User provided an offset
              MB  = LO;
              TPH = Math.max(40, LO - 10); // touchpad height
          }

          // Apply margin-bottom to keyboard container
          landscapeDiv.style.marginBottom = `${MB}px`;

          // Apply height to touchpad
          dp.style.height = `${TPH}px`;
          dp.style.width = '100%';
          dp.style.left = '0';
          dp.style.right = '0';
          dp.style.transform = '';
          dp.style.bottom = '0';
          dp.style.top = '';

          if (!dp.parentElement) container.appendChild(dp);

          console.log(`Landscape Bottom Touchpad:
              LandscapeOffset = ${i2.value || '(default)'}
              TouchpadHeight = ${TPH}px
              KeyboardMarginBottom = ${MB}px`);

          return;
      }

      // Landscape Keyboard Only mode
      if (mode === 'land-kb-only') {
        padSection.style.display = 'none';
        if (landscapeDiv) {
          landscapeDiv.style.marginLeft = '';
          landscapeDiv.style.marginRight = '';
          landscapeDiv.style.marginBottom = `${i2.value}px`;
        }
        removeDockPad();
        removeKeyboard();
        console.log('⌨️ Landscape keyboard only mode enabled.');
        return;
      }

      // Landscape with touchpad modes
      padSection.style.display = 'none';
      touchpad.style.height = '100%';
      removeKeyboard();
      const container = landscapeDiv.parentElement;
      if (!container) return;
      if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
      const dp = ensureDockPad();
      if (!dp.parentElement) container.appendChild(dp);

      const padW = Math.max(120, parseInt(i4.value || '320', 10));
      dp.style.width = `${padW}px`;

      landscapeDiv.style.marginLeft = '';
      landscapeDiv.style.marginRight = '';
      // landscapeDiv.style.marginBottom = '';
      if (mode === 'land-right') {
        console.log('sets land-right offset ' + i2.value);
        dp.style.left = '0'; dp.style.right = '';
        landscapeDiv.style.marginLeft = `${padW + GAP}px`;
        landscapeDiv.style.marginBottom = `${i2.value}px`;
      } else if (mode === 'land-left') {
        console.log('sets land-left offset' + i2.value);
        dp.style.right = '0'; dp.style.left = '';
        landscapeDiv.style.marginRight = `${padW + GAP}px`;
        landscapeDiv.style.marginBottom = `${i2.value}px`;
      }

      landscapeDiv.style.width = '';
    }

    // ===== Show docked touchpad again when keyboard icon is clicked =====
    const showKeyboardBtn = document.querySelector('div[role="button"][aria-label="Show remote keyboard"]');
    if (showKeyboardBtn) {
      showKeyboardBtn.addEventListener('click', () => {
        setTimeout(() => {
          const dock = document.querySelector('.touchpad-inline');
          if (!dock) return;
          dock.style.display = '';
          console.log('⌨️ Keyboard reopened — touchpad shown.');
        }, 300);
      });
    }

    // ===== Auto-hide docked touchpad when "Compose text locally" is toggled =====
    const textInputBtn = document.querySelector('div[role="button"][data-key="TextInput"]');
    if (textInputBtn) {
      textInputBtn.addEventListener('click', () => {
        setTimeout(() => {
          const dock = document.querySelector('.touchpad-inline');
          if (!dock) return;
          const kbHeight = landscapeDiv ? landscapeDiv.offsetHeight : 0;
          if (kbHeight < 100) {
            dock.style.display = 'none';
            console.log('📉 Keyboard minimized — touchpad hidden.');
          } else {
            dock.style.display = '';
            console.log('📈 Keyboard expanded — touchpad restored.');
          }
        }, 200);
      });
    }

    // ===== Apply Keyboard Height (syncs landscape + inline pad) =====
    const applyKeyboardHeight = () => {
      const val = parseInt(i3.value, 10);
      if (!Number.isNaN(val) && val > 0) {
        if (k) k.style.height = `${val}px`;
        if (landscapeDiv) {
          landscapeDiv.style.setProperty('--keyboard-height', `${val}px`);
          landscapeDiv.style.height = `${val}px`;
        }
        const inlinePad = document.querySelector('.touchpad-inline');
        if (inlinePad) inlinePad.style.height = `${val}px`;
        console.log(`🎛️ Keyboard height overridden: ${val}px`);
      } else {
        if (k) k.style.height = '';
        if (landscapeDiv) {
          landscapeDiv.style.removeProperty('--keyboard-height');
          landscapeDiv.style.height = '';
        }
        const inlinePad = document.querySelector('.touchpad-inline');
        if (inlinePad) inlinePad.style.height = '';
      }
      updateDockLayout();
    };
    i2.addEventListener('input', updateDockLayout);
    i3.addEventListener('input', applyKeyboardHeight);

    layoutSelect.addEventListener('change', updateDockLayout);
    i4.addEventListener('input', updateDockLayout);

    // === Apply saved values on load ===
    if (settings.keyboardHeight && settings.layoutMode=='land-kb-only') {
      i3.value = settings.keyboardHeight;
      applyKeyboardHeight();
    }
    if (settings.layoutMode) layoutSelect.value = settings.layoutMode;
    if (settings.touchpadWidth) i4.value = settings.touchpadWidth;
    // if (settings.useRightMargin) chk.checked = true;
    if (settings.sidebarOffset) i.value = settings.sidebarOffset;
    if (settings.landscapeOffset) i2.value = settings.landscapeOffset;
    if (typeof settings.floatAlpha === 'number') alphaInput.value = settings.floatAlpha;

    // Initial show/hide of transparency control
    showAlphaControl(layoutSelect.value === 'float-kb');

    updateDockLayout();
  }
})();


(function () {
  // Helper to normalize grid-area comparisons
  function normalizeGridArea(str) {
    if (!str) return "";
    return str.replace(/\s+/g, "");
  }

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

  // Common SVGs for arrows
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

  // 4)//////////////////////////////////////////////////////
  // MetaRight / AltRight / ControlRight Logic - Left ArrowKey
  //////////////////////////////////////////////////////////
  function handleMetaAltCtrlSwap() {
    const metaRight = document.querySelector('.kwQ2Lb[data-key="MetaRight"]');
    const altRight  = document.querySelector('.kwQ2Lb[data-key="AltRight"]');
    const ctrlRight = document.querySelector('.kwQ2Lb[data-key="ControlRight"]');
    const textInput = document.querySelector('.kwQ2Lb[data-key="TextInput"]');

    textInput.style = "display: none;";

    const metaTitle = (metaRight.getAttribute("title") || "").trim().toLowerCase();

    const targetAlt = "5/19/6/21";
    const targetMeta = "5/21/6/23";

    console.log("metaTitle: " + metaTitle);
    if (metaTitle === "command") {
      altRight.dataset.key = "MetaRight";
      altRight.setAttribute("aria-label", "Command");
      altRight.setAttribute("title", "Command");
      const svgCmd = altRight.querySelector("svg");
      svgCmd.outerHTML = cmdSVG;
    }
    else{
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
    altRight.style.gridArea="5/19/6/21";

    // Update identity
    metaRight.dataset.key = "ArrowLeft";
    metaRight.setAttribute("aria-label", "Left");
    metaRight.setAttribute("title", "Left");

    // Replace SVG
    const span = metaRight.querySelector(".f8w40e");
    if (span) span.innerHTML = arrowLeftSVG;

    // Apply correct grid-area exactly as specified
    metaRight.style.gridArea = "5 / 21 / 6 / 23";

    console.log("Right modifier updates");
  }

  handleMetaAltCtrlSwap();


  // 5) Replace ControlRight with ArrowRight ONLY if already at 5/25/6/27
  function ctrlRightArwRight() {
    const target = "5/25/6/27";

    // Find ALL ControlRight keys
    const ctrlRights = document.querySelectorAll('.kwQ2Lb[data-key="ControlRight"]');

    if (!ctrlRights.length) {
      console.log("No ControlRight elements found; skipping ArrowRight replacement.");
      return;
    }

    ctrlRights.forEach(ctrlRight => {
      const currentArea = getComputedStyle(ctrlRight).gridArea.replace(/\s+/g, "");

      if (currentArea !== target) {
        console.log(`ControlRight grid-area is ${currentArea}, not ${target}; leaving unchanged.`);
        return; // Only skip THIS one, not all
      }

      // Convert ONLY when it's in the correct target location
      ctrlRight.dataset.key = "ArrowRight";
      ctrlRight.setAttribute("aria-label", "Right");
      ctrlRight.setAttribute("title", "Right");

      const span = ctrlRight.querySelector(".f8w40e");
      if (span) span.innerHTML = arrowRightSVG;

      // Ensure it stays in the correct position
      ctrlRight.style.gridArea = "5 / 25 / 6 / 27";

      console.log("ControlRight converted → ArrowRight at 5/25/6/27");
    });
  };

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

  console.log("Arrow cluster + modifier remap script completed (Option B).");

})();

(function () {

  // ----------------------------
  //   CUSTOM SVG: WINDOWS KEYS
  // ----------------------------
  const newWinSVG = `
<svg class="xW0COb" version="1.1" viewBox="0 0 100 100">
  <path d="m65.434 19.133c-1e-6 -8.5235 6.9097-15.433 15.433-15.433 8.5235 0 15.433 6.9097 15.433 15.433s-6.9097 15.433-15.433 15.433l-61.735 2e-6c-8.5221 1.8e-5 -15.432-6.9097-15.432-15.433-3e-7 -8.5235 6.9097-15.433 15.433-15.433 8.5235-6e-7 15.433 6.9097 15.432 15.433l-0.0014 61.736c-1.5e-5 8.5235-6.9097 15.433-15.433 15.433-8.5235 0-15.433-6.9097-15.433-15.433 6e-7 -8.5235 6.9097-15.433 15.433-15.433l61.736 2e-6c8.5235 0 15.433 6.9097 15.433 15.433 0 8.5235-6.9097 15.433-15.433 15.433-8.5235 2e-6 -15.433-6.9097-15.433-15.433z"
        fill="none" stroke="currentColor" stroke-width="7.4"></path>
</svg>`;


  // ----------------------------
  //   CUSTOM SVG: CONTROL KEYS
  // ----------------------------
  const newCtrlSVG = `
<svg class="xW0COb" viewBox="0 0 100 100" version="1.1">
  <path d="M10 70 L50 20 L90 70" 
        fill="none" 
        stroke="currentColor"
        stroke-width="10"
        stroke-linecap="round"
        stroke-linejoin="round" />
</svg>`;


  // ----------------------------
  //   APPLY WINDOWS SVG
  // ----------------------------
  function applyWinSVG() {
    document
      .querySelectorAll('[data-key="MetaLeft"], [data-key="MetaRight"]')
      .forEach(key => {
        const svg = key.querySelector("svg");
        if (!svg || svg.outerHTML.trim() !== newWinSVG.trim()) {
          if (svg) svg.outerHTML = newWinSVG;
          console.log("Updated Windows key:", key.dataset.key);
        }
      });
  }


  // ----------------------------
  //   APPLY CONTROL SVG
  // ----------------------------
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


  // ----------------------------
  //   RUN BOTH NOW
  // ----------------------------
  applyWinSVG();
  applyCtrlSVG();


  // ----------------------------
  //   LIGHTWEIGHT EVENT TRIGGERS
  // ----------------------------
  const triggers = [
    '[data-key="ShiftLeft"]',
    '[data-key="ShiftRight"]',
    '[data-key="Fn"]'
  ];

  triggers.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) {
      console.warn("Trigger key not found:", sel);
      return;
    }

    el.addEventListener("click", () => {
      // Allow CRD to redraw first
      setTimeout(() => {
        applyWinSVG();
        applyCtrlSVG();
      }, 50);
    });
  });

  console.log("Merged SVG override installed (Meta + Ctrl). Low-CPU event-based mode.");

})();

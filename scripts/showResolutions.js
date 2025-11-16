(function () {
  console.log("applying resolutions addition.");

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
})();

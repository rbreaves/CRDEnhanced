(function () {

  // ---- 1. Grab the four keys ----
  const fnKey        = document.querySelector('[data-key="Fn"]');
  const altKey       = document.querySelector('[data-key="AltLeft"]');
  const metaKey      = document.querySelector('[data-key="MetaLeft"]');
  const ctrlKey      = document.querySelector('[data-key="ControlLeft"]');

  if (!fnKey || !altKey || !metaKey || !ctrlKey) {
    console.warn("One or more keys not found.");
    return;
  }

  // ---- 2. Read current grid-area placements ----
  // Using computed styles ensures we get whatever CRD assigned
  const fnGrid    = getComputedStyle(fnKey).gridArea;
  const altGrid   = getComputedStyle(altKey).gridArea;
  const metaGrid  = getComputedStyle(metaKey).gridArea;
  const ctrlGrid  = getComputedStyle(ctrlKey).gridArea;

  // ---- 3. Apply the required rearrangement ----
  // Fn        → AltLeft’s old location
  fnKey.style.gridArea = altGrid;

  // MetaLeft  → Fn’s old location
  metaKey.style.gridArea = fnGrid;

  // AltLeft   → ControlLeft’s old location
  altKey.style.gridArea = ctrlGrid;

  // ControlLeft → MetaLeft’s old location
  ctrlKey.style.gridArea = metaGrid;

  console.log("Grid-area swap completed:");
  console.log("Fn → AltLeft");
  console.log("MetaLeft → Fn");
  console.log("AltLeft → ControlLeft");
  console.log("ControlLeft → MetaLeft");

})();

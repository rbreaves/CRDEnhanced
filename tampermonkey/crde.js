// ==UserScript==
// @name         CRD Enhanced Keyboard & Touchpad Layout
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds advanced keyboard & touchpad layout modes (float, split, landscape, etc.) to Chrome Remote Desktop web client
// @author       Ben Reaves
// @match        https://remotedesktop.google.com/u/*
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
              initCRDLayout();
          }
      });

      observer.observe(document.body, { childList: true, subtree: true });
  }

  waitForCRDReady();

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

    const chkWrap = document.createElement('div');
    chkWrap.style.marginTop = '6px';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = 'useRightMargin';
    const chkLabel = document.createElement('label');
    chkLabel.htmlFor = 'useRightMargin';
    chkLabel.textContent = ' Use Right Margin';
    chk.checked = settings.useRightMargin ? true : false;
    chk.addEventListener('change', () => saveSetting('useRightMargin', chk.checked));
    chkWrap.append(chk, chkLabel);

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

    // Landscape touchpad width
    const l4 = document.createElement('label');
    l4.textContent = 'Landscape Touchpad Width (px):';
    Object.assign(l4.style, { display: 'block', marginTop: '6px', marginBottom: '4px' });
    const i4 = document.createElement('input');
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
      l2, i2, chkWrap,
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
          landscapeDiv.style.width = '';
          landscapeDiv.style.height = ''; // 👈 new
          landscapeDiv.style.removeProperty('--keyboard-height'); // 👈 new
        }

        // Optional: forget saved keyboard height so it doesn’t reapply next float
        saveSetting('keyboardHeight', null);

        console.log('↩️ Sidebar layout restored (keyboard height cleared).');
        return;
      }

      // Landscape Keyboard Only mode
      if (mode === 'land-kb-only') {
        padSection.style.display = 'none';
        if (landscapeDiv) {
          landscapeDiv.style.marginLeft = '';
          landscapeDiv.style.marginRight = '';
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
      if (mode === 'land-right') {
        dp.style.left = '0'; dp.style.right = '';
        landscapeDiv.style.marginLeft = `${padW + GAP}px`;
      } else if (mode === 'land-left') {
        dp.style.right = '0'; dp.style.left = '';
        landscapeDiv.style.marginRight = `${padW + GAP}px`;
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
    if (settings.useRightMargin) chk.checked = true;
    if (settings.sidebarOffset) i.value = settings.sidebarOffset;
    if (settings.landscapeOffset) i2.value = settings.landscapeOffset;
    if (typeof settings.floatAlpha === 'number') alphaInput.value = settings.floatAlpha;

    // Initial show/hide of transparency control
    showAlphaControl(layoutSelect.value === 'float-kb');

    updateDockLayout();
  }
})();


const App = (() => {
  let players = [];
  let currentEditIndex = -1;
  let scoreEditOriginal = 0;
  let scoreEditDelta = 0;

  /* DOM refs */
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  const setupScreen = $('#setup-screen');
  const gameScreen = $('#game-screen');
  const playerInputsEl = $('#player-inputs');
  const addPlayerBtn = $('#add-player-btn');
  const setupOkBtn = $('#setup-ok-btn');
  const scoreGrid = $('#score-grid');
  const hamburgerBtn = $('#hamburger-btn');

  const scoreEditOverlay = $('#score-edit-overlay');
  const editPlayerName = $('#edit-player-name');
  const editPlayerScore = $('#edit-player-score');
  const editScoreOriginal = $('#edit-score-original');
  const editScoreDelta = $('#edit-score-delta');
  const scoreEditOk = $('#score-edit-ok');

  const menuOverlay = $('#menu-overlay');
  const menuInstallBtn = $('#menu-install-btn');

  const preferencesOverlay = $('#preferences-overlay');
  const soundToggle = $('#sound-toggle');
  const horizontalToggle = $('#horizontal-toggle');
  const fontSelect = $('#font-select');

  const aboutOverlay = $('#about-overlay');

  const confirmOverlay = $('#confirm-overlay');
  const confirmMessage = $('#confirm-message');
  const confirmYes = $('#confirm-yes');
  const confirmNo = $('#confirm-no');

  let confirmCallback = null;
  let deferredPrompt = null;

  /* ========== SCREENS ========== */
  function showScreen(screen) {
    [setupScreen, gameScreen].forEach(s => s.style.display = 'none');
    screen.style.display = 'flex';
  }

  function showOverlay(overlay) {
    overlay.style.display = 'flex';
  }

  function hideOverlay(overlay) {
    overlay.style.display = 'none';
  }

  /* ========== CONFIRM DIALOG ========== */
  function showConfirm(msg, cb) {
    confirmMessage.textContent = msg;
    confirmCallback = cb;
    showOverlay(confirmOverlay);
  }

  function hideConfirm() {
    hideOverlay(confirmOverlay);
    confirmCallback = null;
  }

  /* ========== SETUP ========== */
  function initSetup(playerCount) {
    playerInputsEl.innerHTML = '';
    const count = playerCount || 2;
    for (let i = 0; i < count; i++) {
      addPlayerInput(i);
    }
    updateAddRemoveButtons();
  }

  function addPlayerInput(index) {
    const idx = index !== undefined ? index : playerInputsEl.children.length;
    const wrap = document.createElement('div');
    wrap.className = 'player-input-wrap';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-player';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      if (playerInputsEl.children.length <= 2) return;
      wrap.remove();
      updateAddRemoveButtons();
      renumber();
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Player ${idx + 1}`;
    input.maxLength = 20;
    input.inputMode = 'text';
    input.autocapitalize = 'words';
    input.addEventListener('input', updateAddRemoveButtons);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = input.value.trim();
        if (!val) return;
        const inputs = $$('.player-input-wrap input', playerInputsEl);
        const cur = inputs.indexOf(input);
        if (cur === inputs.length - 1) {
          if (inputs.length < 8) {
            addPlayerInput();
            const all = $$('.player-input-wrap input', playerInputsEl);
            all[all.length - 1].focus();
          }
        } else {
          inputs[cur + 1].focus();
        }
      }
    });

    wrap.appendChild(removeBtn);
    wrap.appendChild(input);
    playerInputsEl.appendChild(wrap);
    updateAddRemoveButtons();
  }

  function renumber() {
    $$('.player-input-wrap input', playerInputsEl).forEach((inp, i) => {
      inp.placeholder = `Player ${i + 1}`;
    });
  }

  function updateAddRemoveButtons() {
    const count = playerInputsEl.children.length;
    addPlayerBtn.disabled = count >= 8;
    $$('.btn-remove-player', playerInputsEl).forEach(btn => {
      btn.style.display = count <= 2 ? 'none' : 'flex';
    });
  }

  function getSetupNames() {
    return $$('.player-input-wrap input', playerInputsEl)
      .map(inp => inp.value.trim())
      .filter(n => n.length > 0);
  }

  /* ========== GAME GRID ========== */
  function renderGrid() {
    scoreGrid.innerHTML = '';
    const cols = SoundFX.isHorizontalView() ? 1 : 2;
    const rows = Math.ceil(players.length / cols);
    scoreGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    scoreGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    players.forEach((player, i) => {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.index = i;

      addTapHandler(cell, i);

      const nameEl = document.createElement('div');
      nameEl.className = 'grid-cell-name';
      nameEl.textContent = player.name;

      const scoreEl = document.createElement('div');
      scoreEl.className = 'grid-cell-score';
      scoreEl.textContent = player.score;

      cell.appendChild(nameEl);
      cell.appendChild(scoreEl);
      scoreGrid.appendChild(cell);
    });

    const totalCells = rows * cols;
    for (let i = players.length; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell empty';
      scoreGrid.appendChild(cell);
    }
  }

  function addTapHandler(cell, index) {
    cell.addEventListener('click', () => openScoreEdit(index));
    cell.addEventListener('dblclick', () => editPlayerNameAction(index));
  }

  function updateGridCell(index) {
    const cell = scoreGrid.querySelector(`[data-index="${index}"]`);
    if (!cell) return;
    const nameEl = cell.querySelector('.grid-cell-name');
    if (nameEl) nameEl.textContent = players[index].name;
    const scoreEl = cell.querySelector('.grid-cell-score');
    if (scoreEl) scoreEl.textContent = players[index].score;
  }

  /* ========== SCORE EDIT ========== */
  function openScoreEdit(index) {
    currentEditIndex = index;
    const player = players[index];
    scoreEditOriginal = player.score;
    scoreEditDelta = 0;
    editPlayerName.textContent = player.name;
    editScoreOriginal.textContent = player.score;
    editScoreDelta.textContent = '';
    editScoreDelta.className = 'delta';
    editPlayerScore.textContent = player.score;
    showOverlay(scoreEditOverlay);
    document.addEventListener('keydown', scoreEditKeyHandler);
  }

  function applyScore(delta) {
    if (currentEditIndex < 0) return;
    const player = players[currentEditIndex];
    player.score += delta;
    scoreEditDelta += delta;

    const sign = scoreEditDelta > 0 ? '+' : '';
    editScoreDelta.textContent = `(${sign}${scoreEditDelta})`;
    editScoreDelta.classList.remove('positive', 'negative');
    editScoreDelta.classList.add(scoreEditDelta >= 0 ? 'positive' : 'negative');

    editPlayerScore.textContent = player.score;
    editPlayerScore.classList.remove('pulse');
    void editPlayerScore.offsetWidth;
    editPlayerScore.classList.add('pulse');

    updateGridCell(currentEditIndex);
    const cell = scoreGrid.querySelector(`[data-index="${currentEditIndex}"]`);
    if (cell) {
      cell.classList.remove('pulse', 'feedback-plus', 'feedback-minus');
      void cell.offsetWidth;
      cell.classList.add('pulse');
      cell.classList.add(delta > 0 ? 'feedback-plus' : 'feedback-minus');
    }

    DataStore.save(players);

    if (Math.abs(delta) >= 5) {
      delta > 0 ? SoundFX.onPlusBig() : SoundFX.onMinusBig();
    } else {
      delta > 0 ? SoundFX.onPlus() : SoundFX.onMinus();
    }
  }

  function scoreEditKeyHandler(e) {
    if (e.key === 'h') { e.preventDefault(); applyScore(-5); }
    else if (e.key === 'j') { e.preventDefault(); applyScore(-1); }
    else if (e.key === 'k') { e.preventDefault(); applyScore(1); }
    else if (e.key === 'l') { e.preventDefault(); applyScore(5); }
    else if (e.key === 'Enter') { e.preventDefault(); closeScoreEdit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelScoreEdit(); }
  }

  function cancelScoreEdit() {
    if (currentEditIndex >= 0) {
      players[currentEditIndex].score = scoreEditOriginal;
      DataStore.save(players);
      updateGridCell(currentEditIndex);
    }
    closeScoreEdit();
  }

  function closeScoreEdit() {
    hideOverlay(scoreEditOverlay);
    currentEditIndex = -1;
    document.removeEventListener('keydown', scoreEditKeyHandler);
  }

  /* ========== NAME EDIT ========== */
  function editPlayerNameAction(index) {
    const player = players[index];
    const newName = prompt('Edit name', player.name);
    if (newName !== null && newName.trim().length > 0) {
      player.name = newName.trim();
      DataStore.save(players);
      updateGridCell(index);
    }
  }

  /* ========== MENU ========== */
  function openMenu() {
    menuInstallBtn.style.display = deferredPrompt ? 'block' : 'none';
    showOverlay(menuOverlay);
  }

  function closeMenu() {
    hideOverlay(menuOverlay);
  }

  /* ========== ACTIONS ========== */
  function actionNewScore() {
    closeMenu();
    showConfirm('Start fresh? All scores and players will be lost.', () => {
      players = [];
      DataStore.clear();
      initSetup(2);
      showScreen(setupScreen);
      hideConfirm();
    });
  }

  function actionReset() {
    closeMenu();
    showConfirm('Reset all scores to zero?', () => {
      players.forEach(p => p.score = 0);
      DataStore.save(players);
      renderGrid();
      hideConfirm();
    });
  }

  function actionPreferences() {
    closeMenu();
    soundToggle.checked = SoundFX.isEnabled();
    horizontalToggle.checked = SoundFX.isHorizontalView();
    fontSelect.value = SoundFX.getFontFamily();
    showOverlay(preferencesOverlay);
  }

  function actionInstall() {
    closeMenu();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(result => {
        if (result.outcome === 'accepted') {
          deferredPrompt = null;
          menuInstallBtn.style.display = 'none';
        }
      });
    }
  }

  function applyFont(family) {
    document.documentElement.style.setProperty('--font', `'${family}', cursive`);
  }

  function actionAbout() {
    closeMenu();
    showOverlay(aboutOverlay);
  }

  /* ========== INIT ========== */
  function init() {
    applyFont(SoundFX.getFontFamily());

    const data = DataStore.load();
    if (data && data.players && data.players.length >= 2) {
      players = data.players;
      showScreen(gameScreen);
      renderGrid();
    } else {
      players = [];
      DataStore.clear();
      initSetup(2);
      showScreen(setupScreen);
    }

    /* Setup events */
    addPlayerBtn.addEventListener('click', () => {
      if (playerInputsEl.children.length < 8) addPlayerInput();
    });

    setupOkBtn.addEventListener('click', () => {
      const names = getSetupNames();
      if (names.length < 2) {
        showConfirm('Need at least 2 player names.', hideConfirm);
        return;
      }
      players = names.map(n => ({ name: n, score: 0 }));
      DataStore.save(players);
      showScreen(gameScreen);
      renderGrid();
    });

    /* Score edit events */
    scoreEditOk.addEventListener('click', closeScoreEdit);

    $$('.score-btn', scoreEditOverlay).forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseInt(btn.dataset.delta, 10);
        if (!isNaN(delta)) applyScore(delta);
      });
    });

    scoreEditOverlay.addEventListener('click', e => {
      if (e.target === scoreEditOverlay) closeScoreEdit();
    });

    /* Menu events */
    hamburgerBtn.addEventListener('click', openMenu);

    $$('.menu-btn', menuOverlay).forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        switch (action) {
          case 'new': actionNewScore(); break;
          case 'reset': actionReset(); break;
          case 'preferences': actionPreferences(); break;
          case 'install': actionInstall(); break;
          case 'about': actionAbout(); break;
          case 'close': closeMenu(); break;
        }
      });
    });

    menuOverlay.addEventListener('click', e => {
      if (e.target === menuOverlay) closeMenu();
    });

    /* Preferences events */
    soundToggle.addEventListener('change', () => {
      SoundFX.setEnabled(soundToggle.checked);
    });

    horizontalToggle.addEventListener('change', () => {
      SoundFX.setHorizontalView(horizontalToggle.checked);
      renderGrid();
    });

    fontSelect.addEventListener('change', () => {
      SoundFX.setFontFamily(fontSelect.value);
      applyFont(fontSelect.value);
    });

    $('.close-prefs', preferencesOverlay).addEventListener('click', () => {
      hideOverlay(preferencesOverlay);
    });

    preferencesOverlay.addEventListener('click', e => {
      if (e.target === preferencesOverlay) hideOverlay(preferencesOverlay);
    });

    /* About events */
    $('.close-about', aboutOverlay).addEventListener('click', () => {
      hideOverlay(aboutOverlay);
    });

    aboutOverlay.addEventListener('click', e => {
      if (e.target === aboutOverlay) hideOverlay(aboutOverlay);
    });

    /* Confirm events */
    confirmYes.addEventListener('click', () => {
      if (confirmCallback) confirmCallback();
    });

    confirmNo.addEventListener('click', hideConfirm);

    confirmOverlay.addEventListener('click', e => {
      if (e.target === confirmOverlay) hideConfirm();
    });

    /* PWA install */
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      menuInstallBtn.style.display = 'none';
    });

    /* Service worker */
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    /* Pull to refresh */
    setupPullToRefresh();
  }

  function setupPullToRefresh() {
    const indicator = document.querySelector('.pull-indicator');
    if (!indicator) return;
    let startY = 0;
    let pulling = false;
    let pullDist = 0;
    const THRESHOLD = 60;

    document.addEventListener('touchstart', e => {
      if (gameScreen.scrollTop > 0) return;
      startY = e.touches[0].clientY;
      pulling = true;
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (!pulling) return;
      pullDist = e.touches[0].clientY - startY;
      if (pullDist > 20) {
        indicator.classList.add('active');
        if (pullDist >= THRESHOLD) indicator.classList.add('ready');
        else indicator.classList.remove('ready');
      } else {
        indicator.classList.remove('active', 'ready');
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (!pulling) return;
      pulling = false;
      if (pullDist >= THRESHOLD) {
        indicator.classList.remove('active', 'ready');
        window.location.reload();
      } else {
        indicator.classList.remove('active', 'ready');
      }
      pullDist = 0;
    }, { passive: true });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
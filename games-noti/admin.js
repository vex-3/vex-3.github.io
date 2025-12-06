/**
 * Admin Panel JavaScript
 * Handles login, form submission and Firebase Realtime Database operations (Firebase v9+ Modular)
 */

(function() {
  'use strict';

  // Login credentials
  const ADMIN_CREDENTIALS = {
    username: 'ADMIN',
    password: 'tranhuyhoang'
  };

  const LOGIN_STORAGE_KEY = 'admin_logged_in';

  // Login elements
  const loginContainer = document.getElementById('loginContainer');
  const adminContent = document.getElementById('adminContent');
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const loginStatus = document.getElementById('loginStatus');
  const logoutBtn = document.getElementById('logoutBtn');

  // Wait for Firebase to be initialized
  function waitForFirebase() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkFirebase = setInterval(() => {
        attempts++;
        if (window.firebaseDb) {
          clearInterval(checkFirebase);
          resolve(window.firebaseDb);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkFirebase);
          reject(new Error('Firebase initialization timeout'));
        }
      }, 100);
    });
  }

  const NOTIFICATION_PATH = 'notifications/current';

  // Form elements
  const form = document.getElementById('notificationForm');
  const iconInput = document.getElementById('icon');
  const messageInput = document.getElementById('message');
  const submitBtn = document.getElementById('submitBtn');
  const statusDiv = document.getElementById('status');
  const previewDiv = document.getElementById('preview');
  const previewIcon = document.getElementById('previewIcon');
  const previewText = document.getElementById('previewText');

  /**
   * Check if user is logged in
   */
  function isLoggedIn() {
    return sessionStorage.getItem(LOGIN_STORAGE_KEY) === 'true';
  }

  /**
   * Show login form
   */
  function showLogin() {
    loginContainer.classList.remove('hidden');
    adminContent.classList.remove('show');
    sessionStorage.removeItem(LOGIN_STORAGE_KEY);
  }

  /**
   * Show admin content
   */
  function showAdminContent() {
    loginContainer.classList.add('hidden');
    adminContent.classList.add('show');
    sessionStorage.setItem(LOGIN_STORAGE_KEY, 'true');
  }

  /**
   * Handle login
   */
  function handleLogin(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      showAdminContent();
      showStatus(loginStatus, '✅ Login successful!', 'success');
      // Clear form
      usernameInput.value = '';
      passwordInput.value = '';
      return true;
    } else {
      showStatus(loginStatus, '❌ Invalid username or password', 'error');
      passwordInput.value = '';
      return false;
    }
  }

  /**
   * Handle logout
   */
  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      showLogin();
      showStatus(loginStatus, '👋 Logged out successfully', 'success');
    }
  }

  /**
   * Show status message
   */
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        element.style.display = 'none';
      }, 3000);
    }
  }

  // Import Firebase functions dynamically
  let db = null;
  let ref = null;
  let set = null;
  let get = null;
  let onValue = null;
  let off = null;
  let serverTimestamp = null;

  /**
   * Load Firebase functions
   */
  async function loadFirebaseFunctions() {
    if (!window.firebaseDb) {
      await waitForFirebase();
    }
    
    db = window.firebaseDb;
    
    // Dynamically import Firebase Realtime Database functions
    const databaseModule = await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js");
    ref = databaseModule.ref;
    set = databaseModule.set;
    get = databaseModule.get;
    onValue = databaseModule.onValue;
    off = databaseModule.off;
    serverTimestamp = databaseModule.serverTimestamp;
    
    return db;
  }


  /**
   * Update preview
   */
  function updatePreview() {
    const icon = iconInput.value || '🎮';
    const message = messageInput.value;
    
    if (message) {
      previewIcon.textContent = icon;
      previewText.innerHTML = message;
      previewDiv.style.display = 'block';
    } else {
      previewDiv.style.display = 'none';
    }
  }

  /**
   * Load current notification from Firebase Realtime Database
   */
  async function loadCurrentNotification() {
    try {
      await loadFirebaseFunctions();
      
      const notificationRef = ref(db, NOTIFICATION_PATH);
      const snapshot = await get(notificationRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        iconInput.value = data.icon || '🎮';
        messageInput.value = data.message || '';
        updatePreview();
        showStatus(statusDiv, '✅ Loaded current notification from Firebase', 'success');
      } else {
        showStatus(statusDiv, 'ℹ️ No notification found. Create a new one!', 'loading');
      }
    } catch (error) {
      console.error('Error loading notification:', error);
      showStatus(statusDiv, '⚠️ Could not load notification. Check Firebase connection.', 'error');
    }
  }

  /**
   * Save notification to Firebase Realtime Database
   */
  async function saveNotification(icon, message) {
    try {
      await loadFirebaseFunctions();
      
      showStatus(statusDiv, '⏳ Saving to Firebase...', 'loading');
      submitBtn.disabled = true;

      const notificationData = {
        icon: icon || '🎮',
        message: message,
        updatedAt: serverTimestamp(),
        updatedBy: 'admin'
      };

      const notificationRef = ref(db, NOTIFICATION_PATH);
      await set(notificationRef, notificationData);
      
      showStatus(statusDiv, '✅ Notification saved successfully! It will update on the website automatically.', 'success');
      submitBtn.disabled = false;
      updatePreview();
    } catch (error) {
      console.error('Error saving notification:', error);
      showStatus(statusDiv, '❌ Error saving notification: ' + error.message, 'error');
      submitBtn.disabled = false;
    }
  }

  /**
   * Login form submission handler
   */
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      showStatus(loginStatus, '❌ Please enter both username and password', 'error');
      return;
    }

    handleLogin(username, password);
  });

  /**
   * Logout button handler
   */
  logoutBtn.addEventListener('click', handleLogout);

  /**
   * Notification form submission handler
   */
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const icon = iconInput.value.trim() || '🎮';
    const message = messageInput.value.trim();
    
    if (!message) {
      showStatus(statusDiv, '❌ Please enter a notification message', 'error');
      return;
    }

    await saveNotification(icon, message);
  });

  /**
   * Real-time preview
   */
  iconInput.addEventListener('input', updatePreview);
  messageInput.addEventListener('input', updatePreview);

  /**
   * Initialize: Check login status
   */
  function init() {
    if (isLoggedIn()) {
      showAdminContent();
      // Load current notification after showing admin content
      loadCurrentNotification();
    } else {
      showLogin();
    }
  }

  // Initialize on page load
  init();

  // ==================== GAMES MANAGEMENT ====================
  // Tab elements
  const tabLoadBtn = document.getElementById('tabLoadBtn');
  const tabSingleBtn = document.getElementById('tabSingleBtn');
  const tabBulkBtn = document.getElementById('tabBulkBtn');
  const tabLoad = document.getElementById('tabLoad');
  const tabSingle = document.getElementById('tabSingle');
  const tabBulk = document.getElementById('tabBulk');

  // Load tab elements
  const gamesList = document.getElementById('gamesList');
  const loadGamesBtn = document.getElementById('loadGamesBtn');
  const gamesStatus = document.getElementById('gamesStatus');

  // Single add tab elements
  const singleGamesList = document.getElementById('singleGamesList');
  const addGameBtn = document.getElementById('addGameBtn');
  const uploadGamesBtn = document.getElementById('uploadGamesBtn');
  const singleGamesStatus = document.getElementById('singleGamesStatus');

  // Bulk add tab elements
  const processBulkBtn = document.getElementById('processBulkBtn');
  const clearBulkBtn = document.getElementById('clearBulkBtn');
  const bulkGameNames = document.getElementById('bulkGameNames');
  const bulkGameUrls = document.getElementById('bulkGameUrls');
  const bulkGameImgs = document.getElementById('bulkGameImgs');
  const bulkGamesStatus = document.getElementById('bulkGamesStatus');

  // Data storage
  let loadedGamesData = []; // Games loaded from Firebase (for Load tab)
  let singleGamesData = []; // Games added manually (for Single Add tab)
  let isLoadedFromFirebase = false; // Track if games are loaded from Firebase
  let syncTimeout = null; // Debounce for auto-sync

  // Tab switching functionality
  function switchTab(tabName) {
    // Hide all tabs
    tabLoad.classList.remove('active');
    tabSingle.classList.remove('active');
    tabBulk.classList.remove('active');
    tabLoadBtn.classList.remove('active');
    tabSingleBtn.classList.remove('active');
    tabBulkBtn.classList.remove('active');

    // Show selected tab
    if (tabName === 'load') {
      tabLoad.classList.add('active');
      tabLoadBtn.classList.add('active');
    } else if (tabName === 'single') {
      tabSingle.classList.add('active');
      tabSingleBtn.classList.add('active');
    } else if (tabName === 'bulk') {
      tabBulk.classList.add('active');
      tabBulkBtn.classList.add('active');
    }
  }

  // Tab button event listeners
  if (tabLoadBtn) {
    tabLoadBtn.addEventListener('click', () => switchTab('load'));
  }
  if (tabSingleBtn) {
    tabSingleBtn.addEventListener('click', () => switchTab('single'));
  }
  if (tabBulkBtn) {
    tabBulkBtn.addEventListener('click', () => switchTab('bulk'));
  }

  // Function to create slug from game name
  function createSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Function to add a game item to the list
  function addGameItem(game = null, targetList = 'load', fromFirebase = false) {
    const targetElement = targetList === 'load' ? gamesList : singleGamesList;
    const gameData = targetList === 'load' ? loadedGamesData : singleGamesData;
    
    const gameItem = document.createElement('div');
    gameItem.className = 'game-item';
    gameItem.dataset.index = gameData.length;
    gameItem.dataset.target = targetList;
    if (fromFirebase) {
      gameItem.dataset.fromFirebase = 'true';
    }

    const gameName = game?.name || '';
    const gameUrl = game?.url || '';
    const gameImg = game?.img || '';

    gameItem.innerHTML = `
      <div class="game-item-header">
        <span class="game-item-title">Game #${gameData.length + 1}</span>
        <button type="button" class="remove-game-btn" onclick="removeGameItem(this)">
          🗑️ Remove
        </button>
      </div>
      <div class="game-item-fields">
        <input
          type="text"
          class="game-name-input"
          placeholder="Game Name (e.g., Vex 3)"
          value="${gameName}"
          required
        />
        <input
          type="url"
          class="game-url-input"
          placeholder="Game URL (e.g., https://example.com/game)"
          value="${gameUrl}"
          required
        />
        <input
          type="url"
          class="game-img-input"
          placeholder="Image URL (e.g., https://example.com/logo.png)"
          value="${gameImg}"
          required
        />
      </div>
    `;

    targetElement.appendChild(gameItem);
    gameData.push({
      name: gameName,
      url: gameUrl,
      img: gameImg,
      slug: game?.slug || createSlug(gameName),
    });

    if (targetList === 'load') {
      updateLoadedGamesList();
    } else {
      updateSingleGamesList();
    }
    
    if (targetList === 'single') {
      uploadGamesBtn.style.display = singleGamesData.length > 0 ? 'block' : 'none';
    }
    
    checkEmptyGames(targetList);
  }

  // Function to remove a game item
  window.removeGameItem = function(btn) {
    const gameItem = btn.closest('.game-item');
    const targetList = gameItem.dataset.target || 'load';
    const index = parseInt(gameItem.dataset.index);
    
    if (targetList === 'load') {
      loadedGamesData.splice(index, 1);
      gameItem.remove();
      updateLoadedGamesList();
      
      // Auto-sync if loaded from Firebase
      if (isLoadedFromFirebase) {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          syncGamesToFirebase();
        }, 1000);
      }
      checkEmptyGames('load');
    } else {
      singleGamesData.splice(index, 1);
      gameItem.remove();
      updateSingleGamesList();
      uploadGamesBtn.style.display = singleGamesData.length > 0 ? 'block' : 'none';
      checkEmptyGames('single');
    }
  };

  // Function to update loaded games list (re-index)
  function updateLoadedGamesList() {
    const items = gamesList.querySelectorAll('.game-item[data-target="load"]');
    items.forEach((item, index) => {
      item.dataset.index = index;
      item.querySelector('.game-item-title').textContent = `Game #${index + 1}`;
    });

    // Update loadedGamesData from inputs
    items.forEach((item, index) => {
      const nameInput = item.querySelector('.game-name-input');
      const urlInput = item.querySelector('.game-url-input');
      const imgInput = item.querySelector('.game-img-input');

      if (loadedGamesData[index]) {
        loadedGamesData[index].name = nameInput.value.trim();
        loadedGamesData[index].url = urlInput.value.trim();
        loadedGamesData[index].img = imgInput.value.trim();
        loadedGamesData[index].slug = createSlug(loadedGamesData[index].name);
      }
    });
  }

  // Function to update single games list (re-index)
  function updateSingleGamesList() {
    const items = singleGamesList.querySelectorAll('.game-item[data-target="single"]');
    items.forEach((item, index) => {
      item.dataset.index = index;
      item.querySelector('.game-item-title').textContent = `Game #${index + 1}`;
    });

    // Update singleGamesData from inputs
    items.forEach((item, index) => {
      const nameInput = item.querySelector('.game-name-input');
      const urlInput = item.querySelector('.game-url-input');
      const imgInput = item.querySelector('.game-img-input');

      if (singleGamesData[index]) {
        singleGamesData[index].name = nameInput.value.trim();
        singleGamesData[index].url = urlInput.value.trim();
        singleGamesData[index].img = imgInput.value.trim();
        singleGamesData[index].slug = createSlug(singleGamesData[index].name);
      }
    });
  }

  // Add event listeners to inputs for auto-update and auto-sync
  function attachInputListeners() {
    // Listen to both lists
    if (gamesList) {
      gamesList.addEventListener('input', (e) => {
        if (e.target.classList.contains('game-name-input') ||
            e.target.classList.contains('game-url-input') ||
            e.target.classList.contains('game-img-input')) {
          updateLoadedGamesList();
          
          // Auto-sync to Firebase if loaded from Firebase
          if (isLoadedFromFirebase) {
            // Debounce sync to avoid too many requests
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
              syncGamesToFirebase();
            }, 1000); // Wait 1 second after last change
          }
        }
      });
    }

    if (singleGamesList) {
      singleGamesList.addEventListener('input', (e) => {
        if (e.target.classList.contains('game-name-input') ||
            e.target.classList.contains('game-url-input') ||
            e.target.classList.contains('game-img-input')) {
          updateSingleGamesList();
        }
      });
    }
  }

  attachInputListeners();

  // Auto-sync games to Firebase
  async function syncGamesToFirebase() {
    try {
      updateLoadedGamesList(); // Update loadedGamesData first
      
      await loadFirebaseFunctions();
      const gamesRef = ref(db, 'games/list');
      
      // Prepare games data for Firebase
      const gamesToSync = loadedGamesData
        .filter(game => game.name && game.url && game.img)
        .map(game => ({
          slug: game.slug || createSlug(game.name),
          url: game.url,
          img: game.img,
        }));

      if (gamesToSync.length === 0) {
        return;
      }

      await set(gamesRef, gamesToSync);
      showGamesStatus(`✅ Auto-synced ${gamesToSync.length} games to Firebase`, 'success');
    } catch (error) {
      console.error('Error syncing games:', error);
      showGamesStatus('⚠️ Auto-sync failed: ' + error.message, 'error');
    }
  }

  // Add game button (Single Add tab)
  if (addGameBtn) {
    addGameBtn.addEventListener('click', () => {
      addGameItem(null, 'single');
      uploadGamesBtn.style.display = singleGamesData.length > 0 ? 'block' : 'none';
    });
  }

  // Clear bulk form
  if (clearBulkBtn) {
    clearBulkBtn.addEventListener('click', () => {
      bulkGameNames.value = '';
      bulkGameUrls.value = '';
      bulkGameImgs.value = '';
      showBulkGamesStatus('', '');
    });
  }

  // Process bulk add
  if (processBulkBtn) {
    processBulkBtn.addEventListener('click', async () => {
      const names = bulkGameNames.value.trim().split('\n').filter(line => line.trim());
      const urls = bulkGameUrls.value.trim().split('\n').filter(line => line.trim());
      const imgs = bulkGameImgs.value.trim().split('\n').filter(line => line.trim());

      if (names.length === 0 || urls.length === 0 || imgs.length === 0) {
        showBulkGamesStatus('❌ Please fill all three fields', 'error');
        return;
      }

      if (names.length !== urls.length || names.length !== imgs.length) {
        showBulkGamesStatus(`❌ Number of lines must match! Names: ${names.length}, URLs: ${urls.length}, Images: ${imgs.length}`, 'error');
        return;
      }

      try {
        showBulkGamesStatus(`⏳ Processing ${names.length} games...`, 'loading');
        processBulkBtn.disabled = true;

        await loadFirebaseFunctions();
        const gamesRef = ref(db, 'games/list');
        const snapshot = await get(gamesRef);

        let allGames = [];
        if (snapshot.exists()) {
          allGames = snapshot.val() || [];
          if (!Array.isArray(allGames)) {
            allGames = [];
          }
        }

        // Prepare new games
        const newGames = [];
        for (let i = 0; i < names.length; i++) {
          const slug = createSlug(names[i].trim());
          newGames.push({
            slug: slug,
            url: urls[i].trim(),
            img: imgs[i].trim(),
          });
        }

        // Merge with existing games (avoid duplicates by slug)
        newGames.forEach((game) => {
          const existingIndex = allGames.findIndex(g => g.slug === game.slug);
          if (existingIndex >= 0) {
            // Update existing
            allGames[existingIndex] = game;
          } else {
            // Add new
            allGames.push(game);
          }
        });

        await set(gamesRef, allGames);

        // Clear bulk form
        bulkGameNames.value = '';
        bulkGameUrls.value = '';
        bulkGameImgs.value = '';

        showBulkGamesStatus(`✅ Successfully added ${names.length} games to Firebase! Total games: ${allGames.length}`, 'success');
        processBulkBtn.disabled = false;
      } catch (error) {
        console.error('Error processing bulk games:', error);
        showBulkGamesStatus('❌ Error: ' + error.message, 'error');
        processBulkBtn.disabled = false;
      }
    });
  }

  // Load games from Firebase
  if (loadGamesBtn) {
    loadGamesBtn.addEventListener('click', async () => {
      try {
        showGamesStatus('⏳ Loading games from Firebase...', 'loading');
        loadGamesBtn.disabled = true;

        await loadFirebaseFunctions();
        const gamesRef = ref(db, 'games/list');
        const snapshot = await get(gamesRef);

        if (snapshot.exists()) {
          const games = snapshot.val();
          loadedGamesData = [];
          gamesList.innerHTML = '';

          if (Array.isArray(games) && games.length > 0) {
            games.forEach((game) => {
              // Convert slug back to name (approximate)
              const name = game.slug
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              addGameItem({
                name: name,
                url: game.url,
                img: game.img,
                slug: game.slug,
              }, 'load', true); // Mark as loaded from Firebase
            });
            isLoadedFromFirebase = true;
            showGamesStatus(`✅ Loaded ${games.length} games from Firebase. Changes will auto-sync.`, 'success');
          } else {
            isLoadedFromFirebase = false;
            showGamesStatus('ℹ️ No games found in Firebase', 'success');
            checkEmptyGames('load');
          }
        } else {
          loadedGamesData = [];
          gamesList.innerHTML = '';
          isLoadedFromFirebase = false;
          showGamesStatus('ℹ️ No games found in Firebase', 'success');
          checkEmptyGames('load');
        }

        loadGamesBtn.disabled = false;
      } catch (error) {
        console.error('Error loading games:', error);
        showGamesStatus('❌ Error loading games: ' + error.message, 'error');
        loadGamesBtn.disabled = false;
      }
    });
  }

  // Upload games to Firebase (Single Add tab)
  if (uploadGamesBtn) {
    uploadGamesBtn.addEventListener('click', async () => {
      try {
        // Update singleGamesData from inputs first
        updateSingleGamesList();

        // Validate games
        const validGames = [];
        const invalidGames = [];

        singleGamesData.forEach((game, index) => {
          if (game.name && game.url && game.img) {
            validGames.push({
              slug: game.slug || createSlug(game.name),
              url: game.url,
              img: game.img,
            });
          } else {
            invalidGames.push(index + 1);
          }
        });

        if (invalidGames.length > 0) {
          showSingleGamesStatus(`⚠️ Please fill all fields for games: ${invalidGames.join(', ')}`, 'error');
          return;
        }

        if (validGames.length === 0) {
          showSingleGamesStatus('⚠️ Please add at least one game', 'error');
          return;
        }

        showSingleGamesStatus(`⏳ Uploading ${validGames.length} games to Firebase...`, 'loading');
        uploadGamesBtn.disabled = true;

        await loadFirebaseFunctions();
        const gamesRef = ref(db, 'games/list');
        const snapshot = await get(gamesRef);

        let allGames = [];
        if (snapshot.exists()) {
          allGames = snapshot.val() || [];
          if (!Array.isArray(allGames)) {
            allGames = [];
          }
        }

        // Merge with existing games (avoid duplicates by slug)
        validGames.forEach((game) => {
          const existingIndex = allGames.findIndex(g => g.slug === game.slug);
          if (existingIndex >= 0) {
            // Update existing
            allGames[existingIndex] = game;
          } else {
            // Add new
            allGames.push(game);
          }
        });

        await set(gamesRef, allGames);

        showSingleGamesStatus(`✅ Successfully uploaded ${validGames.length} games to Firebase! Total games: ${allGames.length}`, 'success');
        uploadGamesBtn.disabled = false;
        
        // Clear single games list after successful upload
        singleGamesData = [];
        singleGamesList.innerHTML = '';
        uploadGamesBtn.style.display = 'none';
        checkEmptyGames('single');
      } catch (error) {
        console.error('Error uploading games:', error);
        showSingleGamesStatus('❌ Error uploading games: ' + error.message, 'error');
        uploadGamesBtn.disabled = false;
      }
    });
  }

  // Show games status (Load tab)
  function showGamesStatus(message, type) {
    if (gamesStatus) {
      gamesStatus.textContent = message;
      gamesStatus.className = `status ${type}`;
      gamesStatus.style.display = 'block';
    }
  }

  // Show single games status
  function showSingleGamesStatus(message, type) {
    if (singleGamesStatus) {
      singleGamesStatus.textContent = message;
      singleGamesStatus.className = `status ${type}`;
      singleGamesStatus.style.display = 'block';
    }
  }

  // Show bulk games status
  function showBulkGamesStatus(message, type) {
    if (bulkGamesStatus) {
      if (message) {
        bulkGamesStatus.textContent = message;
        bulkGamesStatus.className = `status ${type}`;
        bulkGamesStatus.style.display = 'block';
      } else {
        bulkGamesStatus.style.display = 'none';
      }
    }
  }

  // Show empty state if no games
  function checkEmptyGames(targetList = 'load') {
    if (targetList === 'load') {
      if (gamesList && loadedGamesData.length === 0) {
        gamesList.innerHTML = `
          <div class="empty-games">
            <p>No games loaded. Click "Load Games from Firebase" to start!</p>
          </div>
        `;
      }
    } else if (targetList === 'single') {
      if (singleGamesList && singleGamesData.length === 0) {
        singleGamesList.innerHTML = `
          <div class="empty-games">
            <p>No games added yet. Click "Add New Game" to start!</p>
          </div>
        `;
      }
    }
  }

  // Initialize empty states
  if (gamesList) {
    checkEmptyGames('load');
  }
  if (singleGamesList) {
    checkEmptyGames('single');
  }

})();

/**
 * Game Notification Ticker System
 * Loads and displays scrolling ticker from Firebase Realtime Database (Firebase v9+ Modular)
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    cssUrl: '/games-noti/noti.css',
    showDelay: 0, // Show immediately
    storageKey: 'game_notification_shown',
    showOncePerSession: false,
    // Firebase Realtime Database config
    notificationPath: 'notifications/current'
  };

  let db = null;
  let unsubscribe = null;
  let ref = null;
  let get = null;
  let onValue = null;
  let off = null;

  /**
   * Load CSS file
   */
  function loadCSS() {
    // Check if already loaded
    if (document.querySelector(`link[href="${config.cssUrl}"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.cssUrl;
    document.head.appendChild(link);
  }

  /**
   * Initialize Firebase
   */
  async function initFirebase() {
    // Wait for Firebase to be initialized from index.html
    let attempts = 0;
    const maxAttempts = 50;
    
    return new Promise((resolve, reject) => {
      const checkFirebase = setInterval(() => {
        attempts++;
        if (window.firebaseDb && window.firebaseApp) {
          clearInterval(checkFirebase);
          db = window.firebaseDb;
          
          // Dynamically import Firebase Realtime Database functions
          import("https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js")
            .then((databaseModule) => {
              ref = databaseModule.ref;
              get = databaseModule.get;
              onValue = databaseModule.onValue;
              off = databaseModule.off;
              resolve();
            })
            .catch(reject);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkFirebase);
          reject(new Error('Firebase not initialized'));
        }
      }, 100);
    });
  }

  /**
   * Load notification from Firebase Realtime Database
   */
  async function loadNotificationFromFirebase() {
    if (!db || !ref || !get) {
      console.warn('Firebase not initialized, using default notification');
      return createDefaultNotification();
    }

    try {
      const notificationRef = ref(db, config.notificationPath);
      const snapshot = await get(notificationRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return createNotificationHTML(data.icon || '🎮', data.message || 'Welcome to Vex 3!');
      } else {
        return createDefaultNotification();
      }
    } catch (error) {
      console.warn('Error loading from Firebase:', error);
      return createDefaultNotification();
    }
  }

  /**
   * Create default notification HTML
   */
  function createDefaultNotification() {
    return createNotificationHTML(
      '🎮',
      '🎉 New games added! Check out our complete collection in <a href="/all-games.html" class="ticker-link">All Games</a> section! • Play Vex 3 now - completely free and unblocked! • Experience the ultimate platformer adventure with challenging levels!'
    );
  }

  /**
   * Create notification HTML from data
   */
  function createNotificationHTML(icon, message) {
    return `
      <div class="game-notification-ticker">
        <div class="ticker-wrapper">
          <div class="ticker-content">
            <span class="ticker-icon">${icon}</span>
            <span class="ticker-text">${message}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create notification container
   */
  function createNotificationContainer(content) {
    const container = document.createElement('div');
    container.id = 'game-notification-ticker-container';
    container.innerHTML = content;
    return container;
  }

  /**
   * Show notification ticker
   */
  function showNotification(content) {
    // Check if already shown in this session
    if (config.showOncePerSession) {
      const shown = sessionStorage.getItem(config.storageKey);
      if (shown === 'true') {
        return;
      }
    }

    // Remove existing container if any
    const existing = document.getElementById('game-notification-ticker-container');
    if (existing) {
      existing.remove();
    }

    const container = createNotificationContainer(content);
    
    // Wait for body to be available
    if (document.body) {
      // Insert at the beginning of body (after opening body tag)
      document.body.insertBefore(container, document.body.firstChild);
      
      // Force animation to start immediately
      requestAnimationFrame(() => {
        const tickerWrapper = container.querySelector('.ticker-wrapper');
        if (tickerWrapper) {
          // Get viewport width for dynamic animation
          const vw = window.innerWidth;
          const duration = vw > 1920 ? 45 : vw > 1200 ? 40 : vw > 768 ? 35 : vw > 480 ? 30 : 25;
          
          // Force animation start
          tickerWrapper.style.animation = `scroll-left ${duration}s linear infinite`;
          tickerWrapper.style.transform = `translateX(${vw}px)`;
          // Trigger reflow to start animation
          void tickerWrapper.offsetWidth;
        }
      });
    } else {
      // If body not ready, wait for it
      const checkBody = setInterval(() => {
        if (document.body) {
          clearInterval(checkBody);
          document.body.insertBefore(container, document.body.firstChild);
          
          // Force animation to start immediately
          requestAnimationFrame(() => {
            const tickerWrapper = container.querySelector('.ticker-wrapper');
            if (tickerWrapper) {
              // Get viewport width for dynamic animation
              const vw = window.innerWidth;
              const duration = vw > 1920 ? 45 : vw > 1200 ? 40 : vw > 768 ? 35 : vw > 480 ? 30 : 25;
              
              // Force animation start
              tickerWrapper.style.animation = `scroll-left ${duration}s linear infinite`;
              tickerWrapper.style.transform = `translateX(${vw}px)`;
              // Trigger reflow to start animation
              void tickerWrapper.offsetWidth;
            }
          });
        }
      }, 10);
    }

    // Adjust navbar position to be below ticker
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.top = '50px';
    }

    // Adjust hero section padding to account for ticker + navbar
    const hero = document.querySelector('.hero');
    if (hero) {
      const currentHeroPadding = parseInt(getComputedStyle(hero).paddingTop) || 80;
      hero.style.paddingTop = (currentHeroPadding + 50) + 'px';
    }

    // Mark as shown
    if (config.showOncePerSession) {
      sessionStorage.setItem(config.storageKey, 'true');
    }
  }

  /**
   * Hide notification ticker
   */
  function hideNotification() {
    const container = document.getElementById('game-notification-ticker-container');
    if (container) {
      container.remove();
      
      // Reset navbar position
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.style.top = '';
      }
      
      // Reset hero section padding
      const hero = document.querySelector('.hero');
      if (hero) {
        const currentHeroPadding = parseInt(getComputedStyle(hero).paddingTop) || 130;
        hero.style.paddingTop = Math.max(80, currentHeroPadding - 50) + 'px';
      }
    }
  }

  /**
   * Setup real-time listener for Firebase Realtime Database updates
   */
  function setupRealtimeListener() {
    if (!db || !ref || !onValue) return;

    try {
      const notificationRef = ref(db, config.notificationPath);
      
      unsubscribe = onValue(notificationRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const content = createNotificationHTML(data.icon || '🎮', data.message || '');
          showNotification(content);
        }
      }, (error) => {
        console.warn('Firebase listener error:', error);
      });
    } catch (error) {
      console.warn('Error setting up listener:', error);
    }
  }

  /**
   * Initialize notification system
   */
  async function init() {
    // Only show on homepage (index.html)
    const isHomepage = window.location.pathname === '/' || 
                       window.location.pathname === '/index.html' ||
                       window.location.pathname.endsWith('/');

    if (!isHomepage) {
      return;
    }

    // Load CSS first
    loadCSS();

    // Try to initialize Firebase and load notification
    try {
      await initFirebase();
      
      // Load initial notification
      const content = await loadNotificationFromFirebase();
      if (content) {
        showNotification(content);
      }

      // Setup real-time listener for updates
      setupRealtimeListener();
    } catch (error) {
      console.warn('Firebase not available, using default:', error);
      // Fallback to default notification
      const defaultContent = createDefaultNotification();
      showNotification(defaultContent);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (unsubscribe && off) {
      const notificationRef = ref(db, config.notificationPath);
      off(notificationRef, 'value', unsubscribe);
    }
  });

  // Export for manual control
  window.GameNotification = {
    show: (content) => showNotification(content),
    hide: hideNotification,
    reload: async () => {
      const content = await loadNotificationFromFirebase();
      if (content) showNotification(content);
    },
    config: config
  };

})();

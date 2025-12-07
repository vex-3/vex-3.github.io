/**
 * Game Notification Ticker System
 * Loads and displays scrolling ticker from Firebase Realtime Database (Firebase v9+ Modular)
 */

(function () {
  "use strict";

  // Configuration
  const config = {
    cssUrl: "/games-noti/noti.css",
    showDelay: 0, // Show immediately
    storageKey: "game_notification_shown",
    showOncePerSession: false,
    // Firebase Realtime Database config
    notificationPath: "notifications/current",
    // Firebase config riêng cho notification (Vex 3 project)
    firebaseConfig: {
      apiKey: "AIzaSyCMJzfqbFF_A2-_xj_T3TMb3BgwLTfqfTU",
      authDomain: "vex3-1c776.firebaseapp.com",
      databaseURL: "https://vex3-1c776-default-rtdb.firebaseio.com",
      projectId: "vex3-1c776",
      storageBucket: "vex3-1c776.firebasestorage.app",
      messagingSenderId: "876445767780",
      appId: "1:876445767780:web:175506d6c672c8d1ee2771",
      measurementId: "G-7KCP1CHJYJ",
    },
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

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = config.cssUrl;
    document.head.appendChild(link);
  }

  /**
   * Try to auto-detect and set window.firebaseDb if not already set
   */
  async function tryAutoSetFirebaseDb() {
    // Nếu đã có window.firebaseDb rồi thì không làm gì
    if (window.firebaseDb) {
      console.log("✅ window.firebaseDb đã có sẵn");
      return;
    }

    console.log("🔍 Đang tìm Firebase database...");
    console.log("window.firebaseDb:", window.firebaseDb);
    console.log("window.firebaseApp:", window.firebaseApp);
    console.log("window.firebase:", window.firebase);

    // Thử tìm Firebase từ các cách khác nhau
    let foundDb = null;

    // Cách 1: Firebase v9+ Modular - từ window.firebaseApp
    if (window.firebaseApp) {
      try {
        console.log(
          "🔍 Tìm thấy window.firebaseApp, đang import database module..."
        );
        const databaseModule = await import(
          "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js"
        );
        foundDb = databaseModule.getDatabase(window.firebaseApp);
        window.firebaseDb = foundDb;
        console.log(
          "✅ Đã tự động set window.firebaseDb từ window.firebaseApp"
        );
        return;
      } catch (e) {
        console.warn("⚠️ Không thể import Firebase Database module:", e);
      }
    }

    // Cách 2: Firebase compat (cũ)
    if (!foundDb && window.firebase && window.firebase.database) {
      try {
        console.log("🔍 Tìm thấy Firebase compat, đang lấy database...");
        foundDb = window.firebase.database();
        window.firebaseDb = foundDb;
        console.log("✅ Đã tự động set window.firebaseDb từ Firebase compat");
        return;
      } catch (e) {
        console.warn("⚠️ Lỗi khi set window.firebaseDb từ compat:", e);
      }
    }

    // Cách 3: Tìm trong các biến global khác
    if (!foundDb) {
      const possibleVars = [
        "db",
        "database",
        "firebaseDb",
        "firebaseDatabase",
        "firebaseDB",
      ];
      console.log("🔍 Đang tìm trong các biến global:", possibleVars);
      for (const varName of possibleVars) {
        if (window[varName] && typeof window[varName] === "object") {
          window.firebaseDb = window[varName];
          console.log(
            `✅ Đã tự động set window.firebaseDb từ window.${varName}`
          );
          foundDb = window[varName];
          break;
        }
      }
    }

    // Cách 4: Thử tìm Firebase app và tạo database
    if (!foundDb) {
      // Tìm tất cả các biến có thể là Firebase app
      for (const key in window) {
        try {
          const value = window[key];
          // Kiểm tra xem có phải Firebase app không (có _delegate hoặc _options)
          if (
            value &&
            typeof value === "object" &&
            (value._delegate || value._options)
          ) {
            try {
              const databaseModule = await import(
                "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js"
              );
              foundDb = databaseModule.getDatabase(value);
              window.firebaseDb = foundDb;
              console.log(
                `✅ Đã tự động set window.firebaseDb từ window.${key}`
              );
              return;
            } catch (e) {
              // Không phải Firebase app, tiếp tục
            }
          }
        } catch (e) {
          // Bỏ qua
        }
      }
    }

    if (!foundDb) {
      console.warn("⚠️ Không tìm thấy Firebase database");
      console.log("💡 Hướng dẫn: Thêm dòng này vào code Firebase của bạn:");
      console.log("   window.firebaseDb = db; // Sau khi có db");
    }
  }

  /**
   * Initialize Firebase riêng cho notification (Vex 3 project)
   */
  async function initOwnFirebase() {
    try {
      console.log(
        "🔧 Đang khởi tạo Firebase riêng cho notification (Vex 3 project)..."
      );

      // Import Firebase modules
      const appModule = await import(
        "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js"
      );
      const databaseModule = await import(
        "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js"
      );

      // Khởi tạo Firebase app riêng với tên "vex3-notification" để tránh conflict
      let notificationApp;
      try {
        notificationApp = appModule.getApp("vex3-notification");
        console.log("✅ Đã có Firebase app 'vex3-notification'");
      } catch (e) {
        // App chưa tồn tại, tạo mới
        notificationApp = appModule.initializeApp(
          config.firebaseConfig,
          "vex3-notification"
        );
        console.log("✅ Đã tạo Firebase app 'vex3-notification'");
      }

      // Lấy database từ app riêng
      db = databaseModule.getDatabase(notificationApp);

      // Load functions
      ref = databaseModule.ref;
      get = databaseModule.get;
      onValue = databaseModule.onValue;
      off = databaseModule.off;

      console.log("✅ Firebase riêng đã khởi tạo thành công!");
      return true;
    } catch (error) {
      console.error("❌ Lỗi khi khởi tạo Firebase riêng:", error);
      return false;
    }
  }

  /**
   * Initialize Firebase
   * Luôn khởi tạo Firebase riêng cho notification (Vex 3 project)
   * để tránh conflict với Firebase project khác của website
   */
  async function initFirebase() {
    // Đợi một chút để DOM và các script khác load xong
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log("🔧 Đang khởi tạo Firebase riêng cho notification...");

    // Luôn khởi tạo Firebase riêng cho notification
    // Không dùng window.firebaseDb của website khác để tránh conflict
    try {
      const success = await initOwnFirebase();
      if (success) {
        console.log("✅ Firebase riêng đã sẵn sàng!");
        return Promise.resolve();
      } else {
        return Promise.reject(
          new Error("Failed to initialize Firebase for notification")
        );
      }
    } catch (error) {
      console.error("❌ Lỗi khi khởi tạo Firebase:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Load notification from Firebase Realtime Database
   */
  async function loadNotificationFromFirebase() {
    if (!db || !ref || !get) {
      console.warn("❌ Firebase not initialized, using default notification");
      console.log("db:", db, "ref:", ref, "get:", get);
      console.log("window.firebaseDb:", window.firebaseDb);
      console.log("💡 Đang dùng notification mặc định");
      return createDefaultNotification();
    }

    try {
      console.log("═══════════════════════════════════════════════════════");
      console.log("📡 Đang tải notification từ Firebase...");
      console.log("📍 Path:", config.notificationPath);
      console.log("🔗 Database URL:", config.firebaseConfig.databaseURL);
      console.log("═══════════════════════════════════════════════════════");

      const notificationRef = ref(db, config.notificationPath);
      const snapshot = await get(notificationRef);

      console.log(
        "📦 Firebase snapshot:",
        snapshot.exists() ? "✅ EXISTS" : "❌ NOT EXISTS"
      );

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("✅ Dữ liệu từ Firebase:", data);
        console.log("📝 Icon:", data.icon || "🎮");
        console.log("📝 Message:", data.message || "(empty)");

        const html = createNotificationHTML(
          data.icon || "🎮",
          data.message || "Welcome to Vex 3!"
        );
        console.log("✅ Đã tạo HTML từ dữ liệu Firebase");
        return html;
      } else {
        console.warn(
          "⚠️ Không tìm thấy dữ liệu tại path:",
          config.notificationPath
        );
        console.log("💡 HƯỚNG DẪN:");
        console.log("   1. Vào Firebase Console → Project: vex3-1c776");
        console.log("   2. Vào Realtime Database");
        console.log("   3. Tạo path: notifications/current");
        console.log("   4. Thêm dữ liệu:");
        console.log("      {");
        console.log('        "icon": "🎮",');
        console.log('        "message": "Nội dung thông báo của bạn"');
        console.log("      }");
        console.log("═══════════════════════════════════════════════════════");
        return createDefaultNotification();
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải từ Firebase:", error);
      console.error("📋 Chi tiết lỗi:", error.message);
      console.error("📋 Stack:", error.stack);
      console.log("💡 Đang dùng notification mặc định");
      return createDefaultNotification();
    }
  }

  /**
   * Create default notification HTML
   */
  function createDefaultNotification() {
    return createNotificationHTML(
      "🎮",
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
    const container = document.createElement("div");
    container.id = "game-notification-ticker-container";
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
      if (shown === "true") {
        return;
      }
    }

    // Remove existing container if any
    const existing = document.getElementById(
      "game-notification-ticker-container"
    );
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
        const tickerWrapper = container.querySelector(".ticker-wrapper");
        if (tickerWrapper) {
          // Get viewport width for dynamic animation
          const vw = window.innerWidth;
          const duration =
            vw > 1920
              ? 45
              : vw > 1200
              ? 40
              : vw > 768
              ? 35
              : vw > 480
              ? 30
              : 25;

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
            const tickerWrapper = container.querySelector(".ticker-wrapper");
            if (tickerWrapper) {
              // Get viewport width for dynamic animation
              const vw = window.innerWidth;
              const duration =
                vw > 1920
                  ? 45
                  : vw > 1200
                  ? 40
                  : vw > 768
                  ? 35
                  : vw > 480
                  ? 30
                  : 25;

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
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      navbar.style.top = "50px";
    }

    // Adjust hero section padding to account for ticker + navbar
    const hero = document.querySelector(".hero");
    if (hero) {
      const currentHeroPadding =
        parseInt(getComputedStyle(hero).paddingTop) || 80;
      hero.style.paddingTop = currentHeroPadding + 50 + "px";
    }

    // Mark as shown
    if (config.showOncePerSession) {
      sessionStorage.setItem(config.storageKey, "true");
    }
  }

  /**
   * Hide notification ticker
   */
  function hideNotification() {
    const container = document.getElementById(
      "game-notification-ticker-container"
    );
    if (container) {
      container.remove();

      // Reset navbar position
      const navbar = document.querySelector(".navbar");
      if (navbar) {
        navbar.style.top = "";
      }

      // Reset hero section padding
      const hero = document.querySelector(".hero");
      if (hero) {
        const currentHeroPadding =
          parseInt(getComputedStyle(hero).paddingTop) || 130;
        hero.style.paddingTop = Math.max(80, currentHeroPadding - 50) + "px";
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

      unsubscribe = onValue(
        notificationRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const content = createNotificationHTML(
              data.icon || "🎮",
              data.message || ""
            );
            showNotification(content);
          }
        },
        (error) => {
          console.warn("Firebase listener error:", error);
        }
      );
    } catch (error) {
      console.warn("Error setting up listener:", error);
    }
  }

  /**
   * Initialize notification system
   */
  async function init() {
    // Only show on homepage (index.html)
    const isHomepage =
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html" ||
      window.location.pathname.endsWith("/");

    if (!isHomepage) {
      return;
    }

    // Load CSS first
    loadCSS();

    // Try to initialize Firebase and load notification
    try {
      console.log("🚀 Initializing notification system...");
      await initFirebase();
      console.log("✅ Firebase initialized successfully");

      // Load initial notification
      const content = await loadNotificationFromFirebase();
      if (content) {
        // Kiểm tra xem có phải default notification không
        const isDefault = content.includes(
          "New games added! Check out our complete collection"
        );
        if (isDefault) {
          console.warn(
            "⚠️ Using default notification - Firebase data not found or empty"
          );
          console.log("💡 Kiểm tra:");
          console.log(
            "   1. Firebase Realtime Database có path 'notifications/current' không?"
          );
          console.log(
            "   2. Có dữ liệu { icon: '...', message: '...' } không?"
          );
          console.log("   3. Rules có cho phép read không?");
        } else {
          console.log("✅ Notification loaded from Firebase, displaying...");
        }
        showNotification(content);
      } else {
        console.warn("⚠️ No notification content returned");
      }

      // Setup real-time listener for updates
      setupRealtimeListener();
      console.log("✅ Real-time listener setup complete");
    } catch (error) {
      console.error("❌ Firebase not available, using default:", error);
      console.error("Error details:", error.message);
      console.log("💡 Hướng dẫn:");
      console.log("   1. Đảm bảo Firebase đã được initialize");
      console.log("   2. Đảm bảo có window.firebaseDb hoặc window.firebaseApp");
      console.log("   3. Kiểm tra Firebase Realtime Database đã được tạo chưa");
      // Fallback to default notification
      const defaultContent = createDefaultNotification();
      showNotification(defaultContent);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (unsubscribe && off) {
      const notificationRef = ref(db, config.notificationPath);
      off(notificationRef, "value", unsubscribe);
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
    config: config,
  };
})();

// Games data loaded from Firebase Realtime Database
// This file loads games dynamically from Firebase instead of using a static array

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMJzfqbFF_A2-_xj_T3TMb3BgwLTfqfTU",
  authDomain: "vex3-1c776.firebaseapp.com",
  databaseURL: "https://vex3-1c776-default-rtdb.firebaseio.com",
  projectId: "vex3-1c776",
  storageBucket: "vex3-1c776.firebasestorage.app",
  messagingSenderId: "876445767780",
  appId: "1:876445767780:web:175506d6c672c8d1ee2771",
  measurementId: "G-7KCP1CHJYJ",
};

// Firebase initialization
let db = null;
let ref = null;
let get = null;
let onValue = null;

// Initialize Firebase
async function initFirebase() {
  if (db) return; // Already initialized

  try {
    // Import Firebase modules
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js"
    );
    const { getDatabase, ref: refFn, get: getFn, onValue: onValueFn } = await import(
      "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js"
    );

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    ref = refFn;
    get = getFn;
    onValue = onValueFn;

    console.log("✅ Firebase initialized for games-data2.js");
  } catch (error) {
    console.error("❌ Error initializing Firebase:", error);
    throw error;
  }
}

// Games data array (will be populated from Firebase)
let additionalGames = [];

// Flag to track if games are loaded
let gamesLoaded = false;
let gamesLoadPromise = null;

// Path to games in Firebase
const GAMES_PATH = "games/list";

/**
 * Load games from Firebase Realtime Database
 * @returns {Promise<Array>} Array of game objects
 */
async function loadGamesFromFirebase() {
  // Return cached promise if already loading
  if (gamesLoadPromise) {
    return gamesLoadPromise;
  }

  // Return cached data if already loaded
  if (gamesLoaded && additionalGames.length > 0) {
    return additionalGames;
  }

  // Create new load promise
  gamesLoadPromise = (async () => {
    try {
      // Initialize Firebase if not already done
      if (!db) {
        await initFirebase();
      }

      // Get games from Firebase
      const gamesRef = ref(db, GAMES_PATH);
      const snapshot = await get(gamesRef);

      if (snapshot.exists()) {
        const games = snapshot.val();
        
        if (Array.isArray(games) && games.length > 0) {
          additionalGames = games.map((game) => ({
            slug: game.slug || "",
            url: game.url || "",
            img: game.img || "",
          }));

          gamesLoaded = true;
          console.log(`✅ Loaded ${additionalGames.length} games from Firebase`);
          return additionalGames;
        } else {
          console.warn("⚠️ Firebase returned empty or invalid games array");
          additionalGames = [];
          gamesLoaded = true;
          return additionalGames;
        }
      } else {
        console.warn("⚠️ No games found in Firebase");
        additionalGames = [];
        gamesLoaded = true;
        return additionalGames;
      }
    } catch (error) {
      console.error("❌ Error loading games from Firebase:", error);
      // Return empty array on error
      additionalGames = [];
      gamesLoaded = true;
      return additionalGames;
    } finally {
      // Clear the promise so it can be called again if needed
      gamesLoadPromise = null;
    }
  })();

  return gamesLoadPromise;
}

/**
 * Get games (loads from Firebase if not already loaded)
 * @returns {Promise<Array>} Array of game objects
 */
async function getGames() {
  return await loadGamesFromFirebase();
}

/**
 * Get games synchronously (returns cached data if available, otherwise empty array)
 * Note: This will return empty array if Firebase hasn't loaded yet
 * @returns {Array} Array of game objects
 */
function getGamesSync() {
  return additionalGames;
}

// Function to format game name from slug
function formatGameName(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Function to generate game card HTML
function generateGameCard(game) {
  const name = formatGameName(game.slug);
  const urlEscaped = game.url.replace(/'/g, "\\'");
  const nameEscaped = name.replace(/'/g, "\\'");

  return `
              <!-- ${name} Game Card -->
              <div class="game-card" itemscope itemtype="https://schema.org/VideoGame">
                <a href="${
                  game.url
                }" class="game-image-wrapper" data-game-title="${name}" onclick="event.preventDefault(); openGameModal('${urlEscaped}', '${nameEscaped}');">
                  <img src="${
                    game.img
                  }" alt="${name} - Free Online Game" class="game-image" loading="lazy" decoding="async" itemprop="image" title="${name}" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'%3E%3Crect width=\\'200\\' height=\\'200\\' fill=\\'%23151515\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%2300ff88\\' font-family=\\'Arial\\' font-size=\\'14\\'%3E${encodeURIComponent(
    name
  )}%3C/text%3E%3C/svg%3E';" />
                </a>
                <div class="game-info">
                  <h3 class="game-title">${name}</h3>
                  <a href="${game.url}" class="play-btn">Play Now</a>
                </div>
              </div>`;
}

// Function to try different image extensions if original fails
function tryImageExtensions(img, baseUrl) {
  const extensions = ["png", "jpg", "jpeg", "jfif", "webp"];
  const currentExt = img.split(".").pop().toLowerCase();
  const basePath = img.substring(0, img.lastIndexOf("/") + 1);
  const fileName = img.substring(
    img.lastIndexOf("/") + 1,
    img.lastIndexOf(".")
  );

  // Try current extension first, then others
  const extensionsToTry = [
    currentExt,
    ...extensions.filter((ext) => ext !== currentExt),
  ];

  let currentIndex = 0;
  const tryNext = () => {
    if (currentIndex < extensionsToTry.length) {
      const testImg = new Image();
      testImg.onload = () => {
        // Found working image
        const workingUrl =
          basePath + fileName + "." + extensionsToTry[currentIndex];
        document.querySelectorAll(`img[src="${img}"]`).forEach((imgEl) => {
          imgEl.src = workingUrl;
        });
      };
      testImg.onerror = () => {
        currentIndex++;
        tryNext();
      };
      testImg.src = basePath + fileName + "." + extensionsToTry[currentIndex];
    }
  };
  tryNext();
}

// Function to add all games to the grid
async function addAdditionalGames() {
  const gamesGrid = document.querySelector(".games-grid");
  if (!gamesGrid) {
    console.warn("⚠️ Games grid not found");
    return;
  }

  try {
    // Load games from Firebase
    const games = await loadGamesFromFirebase();

    if (games.length === 0) {
      console.warn("⚠️ No games loaded from Firebase");
      return;
    }

    // Add all games to the grid
    games.forEach((game) => {
      const gameCardHTML = generateGameCard(game);
      gamesGrid.insertAdjacentHTML("beforeend", gameCardHTML);
    });

    // Add error handlers to all images - try different extensions as fallback
    setTimeout(() => {
      document.querySelectorAll(".game-image").forEach((img) => {
        img.addEventListener("error", function () {
          // Try different extensions
          const basePath = this.src.substring(0, this.src.lastIndexOf("/") + 1);
          const fileName = this.src.substring(
            this.src.lastIndexOf("/") + 1,
            this.src.lastIndexOf(".")
          );
          const extensions = ["png", "jpg", "jpeg", "jfif", "webp"];
          let currentExt = this.src.split(".").pop().toLowerCase();

          const tryNext = (i) => {
            if (i < extensions.length) {
              const testUrl = basePath + fileName + "." + extensions[i];
              const testImg = new Image();
              testImg.onload = () => {
                this.src = testUrl;
                console.log("Fixed image on error:", this.src);
              };
              testImg.onerror = () => {
                if (i === extensions.length - 1) {
                  // All extensions failed
                  console.warn("Image not found with any extension:", this.src);
                } else {
                  tryNext(i + 1);
                }
              };
              testImg.src = testUrl;
            }
          };
          tryNext(0);
        });
      });
    }, 100);

    // Re-initialize play buttons for new games
    if (typeof initializePlayButtons === "function") {
      initializePlayButtons();
    }

    // Re-shuffle games after adding new ones
    if (typeof shuffleGames === "function") {
      shuffleGames();
    }

    console.log(`✅ Added ${games.length} games from Firebase to the grid`);
  } catch (error) {
    console.error("❌ Error adding games from Firebase:", error);
  }
}

// Auto-load games when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // Small delay to ensure other scripts are loaded
    setTimeout(addAdditionalGames, 100);
  });
} else {
  // If DOM is already loaded, wait a bit for other scripts to complete
  setTimeout(addAdditionalGames, 100);
}

// Export for use in other scripts
if (typeof window !== "undefined") {
  window.gamesData2 = {
    loadGamesFromFirebase,
    getGames,
    getGamesSync,
    addAdditionalGames,
    formatGameName,
    generateGameCard,
  };
}


/**
 * Firebase Configuration
 * Firebase v9+ Modular SDK
 */

// Your web app's Firebase configuration
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

// Export config for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { firebaseConfig };
}

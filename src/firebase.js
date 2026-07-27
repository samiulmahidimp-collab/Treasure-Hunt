import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";
import { TEAMS_CONFIG } from "./teamsConfig";

export const generateDefaultTeams = () => {
  const teams = {};
  const now = Date.now();
  TEAMS_CONFIG.forEach(t => {
    teams[t.id] = {
      id: t.id,
      name: t.name,
      password: t.password,
      score: 0,
      solvedClues: [],
      currentClueId: null,
      chatMessages: [],
      sessionToken: "",
      attempts: 0,
      locked: false,
      isPaused: false,
      needsHelp: false,
      resetToken: now
    };
  });
  return teams;
};

// Vite Environment variables for Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  !firebaseConfig.apiKey.includes("YOUR_FIREBASE_API_KEY");

let db = null;
let useMock = true;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    useMock = false;
    window.__HEIST_DB_MODE__ = "FIRESTORE_LIVE";
    console.log("Firebase initialized successfully. Running in real-time serverless mode.");
  } catch (error) {
    console.error("Firebase failed to initialize. Falling back to Local/Network API mode:", error);
    useMock = true;
    window.__HEIST_DB_MODE__ = "LOCAL_FALLBACK";
  }
} else {
  console.log("No Firebase config found. Running in Local/Network API mode.");
  useMock = true;
  window.__HEIST_DB_MODE__ = "LOCAL_FALLBACK";
}

// Local Storage Fallback implementation (used when API is not present on static Vercel deployments)
const MOCK_STORAGE_KEY = "la_casa_del_tesoro_db_v4";
let hasDetectedNoAPI = false;

const getLocalStorageDB = () => {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    const defaultTeams = generateDefaultTeams();
    let updated = false;
    Object.keys(defaultTeams).forEach(key => {
      if (!parsed.teams[key]) {
        parsed.teams[key] = defaultTeams[key];
        updated = true;
      } else if (parsed.teams[key].password !== defaultTeams[key].password) {
        parsed.teams[key].password = defaultTeams[key].password;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  }
  const newState = {
    gameSettings: { isStarted: false, isPaused: false },
    teams: generateDefaultTeams()
  };
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newState));
  return newState;
};

const updateLocalStorageDB = (updater) => {
  const state = getLocalStorageDB();
  updater(state);
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("mock-db-update"));
};

// Network API fetcher helper
const fetchGameState = async () => {
  if (hasDetectedNoAPI) {
    return getLocalStorageDB();
  }
  try {
    const res = await fetch("/api/game-state");
    if (res.ok) return await res.json();
    if (res.status === 404) {
      hasDetectedNoAPI = true;
    }
  } catch (e) {
    // network error - do not lock hasDetectedNoAPI in case it's a transient glitch
  }
  return getLocalStorageDB();
};

export const dbService = {
  // Subscribe to Global Game Settings
  subscribeGameSettings: (callback) => {
    if (!useMock) {
      const docRef = doc(db, "game_settings", "settings");
      return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        } else {
          const defaultSettings = { isStarted: false, isPaused: false };
          setDoc(docRef, defaultSettings);
          callback(defaultSettings);
        }
      }, (error) => {
        console.error("Firestore settings subscription error:", error);
        alert("DATABASE CONFIG ERROR: Firestore permission denied. Please go to Firebase Console > Firestore Database > Rules, and change rules to allow read/write: 'allow read, write: if true;'");
      });
    } else {
      let isSubscribed = true;
      const handleUpdate = () => {
        if (hasDetectedNoAPI) {
          const state = getLocalStorageDB();
          callback(state.gameSettings || { isStarted: false, isPaused: false });
        }
      };
      window.addEventListener("mock-db-update", handleUpdate);
      window.addEventListener("storage", handleUpdate);

      const poll = async () => {
        if (!isSubscribed) return;
        const state = await fetchGameState();
        if (!hasDetectedNoAPI) {
          callback(state.gameSettings || { isStarted: false, isPaused: false });
        }
      };
      poll();
      const intervalId = setInterval(poll, 1000);
      return () => {
        isSubscribed = false;
        clearInterval(intervalId);
        window.removeEventListener("mock-db-update", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      };
    }
  },

  // Update Game Settings (Admin Control)
  updateGameSettings: async (settings) => {
    if (!useMock) {
      const docRef = doc(db, "game_settings", "settings");
      await setDoc(docRef, settings, { merge: true });
    } else if (hasDetectedNoAPI) {
      updateLocalStorageDB((state) => {
        state.gameSettings = { ...state.gameSettings, ...settings };
      });
    } else {
      try {
        const res = await fetch("/api/update-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings)
        });
        if (!res.ok) throw new Error();
      } catch (e) {
        updateLocalStorageDB((state) => {
          state.gameSettings = { ...state.gameSettings, ...settings };
        });
      }
    }
  },

  // Subscribe to all teams for Leaderboard
  subscribeTeams: (callback) => {
    if (!useMock) {
      const handleSnapshot = () => {
        const teamsRef = doc(db, "game_settings", "teams_list");
        return onSnapshot(teamsRef, (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.data());
          } else {
            const initialTeams = generateDefaultTeams();
            setDoc(teamsRef, initialTeams);
            callback(initialTeams);
          }
        }, (error) => {
          console.error("Firestore teams subscription error:", error);
        });
      };
      return handleSnapshot();
    } else {
      let isSubscribed = true;
      const handleUpdate = () => {
        if (hasDetectedNoAPI) {
          const state = getLocalStorageDB();
          callback(state.teams || generateDefaultTeams());
        }
      };
      window.addEventListener("mock-db-update", handleUpdate);
      window.addEventListener("storage", handleUpdate);

      const poll = async () => {
        if (!isSubscribed) return;
        const state = await fetchGameState();
        if (!hasDetectedNoAPI) {
          callback(state.teams || generateDefaultTeams());
        }
      };
      poll();
      const intervalId = setInterval(poll, 1000);
      return () => {
        isSubscribed = false;
        clearInterval(intervalId);
        window.removeEventListener("mock-db-update", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      };
    }
  },

  // Subscribe to a specific team's details
  subscribeTeam: (teamName, callback) => {
    if (!useMock) {
      const docRef = doc(db, "game_settings", "teams_list");
      return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const allTeams = snapshot.data();
          if (allTeams[teamName]) {
            callback(allTeams[teamName]);
          } else {
            const defaultTeams = generateDefaultTeams();
            const defaultTeam = defaultTeams[teamName] || { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false, isPaused: false };
            updateDoc(docRef, { [teamName]: defaultTeam });
            callback(defaultTeam);
          }
        } else {
          const initialTeams = generateDefaultTeams();
          setDoc(docRef, initialTeams);
          callback(initialTeams[teamName]);
        }
      }, (error) => {
        console.error("Firestore team subscription error:", error);
      });
    } else {
      let isSubscribed = true;
      const handleUpdate = () => {
        if (hasDetectedNoAPI) {
          const state = getLocalStorageDB();
          if (state.teams && state.teams[teamName]) {
            callback(state.teams[teamName]);
          }
        }
      };
      window.addEventListener("mock-db-update", handleUpdate);
      window.addEventListener("storage", handleUpdate);

      const poll = async () => {
        if (!isSubscribed) return;
        const state = await fetchGameState();
        if (!hasDetectedNoAPI && state.teams && state.teams[teamName]) {
          callback(state.teams[teamName]);
        }
      };
      poll();
      const intervalId = setInterval(poll, 1000);
      return () => {
        isSubscribed = false;
        clearInterval(intervalId);
        window.removeEventListener("mock-db-update", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      };
    }
  },

  // Update specific team fields
  updateTeam: async (teamName, teamData) => {
    if (!useMock) {
      const docRef = doc(db, "game_settings", "teams_list");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const currentData = snap.data();
        const updatedTeam = { ...currentData[teamName], ...teamData };
        await updateDoc(docRef, { [teamName]: updatedTeam });
      } else {
        const initialTeams = generateDefaultTeams();
        initialTeams[teamName] = { ...initialTeams[teamName], ...teamData };
        await setDoc(docRef, initialTeams);
      }
    } else if (hasDetectedNoAPI) {
      updateLocalStorageDB((state) => {
        state.teams[teamName] = { ...(state.teams[teamName] || {}), ...teamData };
      });
    } else {
      try {
        const res = await fetch("/api/update-team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: teamName, teamData })
        });
        if (!res.ok) throw new Error();
      } catch (e) {
        updateLocalStorageDB((state) => {
          state.teams[teamName] = { ...(state.teams[teamName] || {}), ...teamData };
        });
      }
    }
  },

  // Get a one-time snapshot of ALL teams
  getAllTeams: async () => {
    if (!useMock) {
      const docRef = doc(db, "game_settings", "teams_list");
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : {};
    } else {
      const state = await fetchGameState();
      return state.teams || {};
    }
  },

  // Admin resets the whole game
  resetGame: async () => {
    const defaultSettings = { isStarted: false, isPaused: false };
    const defaultTeams = generateDefaultTeams();

    // Clear all local chat histories from browser localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("heist_chat_")) {
        localStorage.removeItem(key);
      }
    });
    window.dispatchEvent(new Event("heist-game-reset"));

    if (!useMock) {
      const settingsRef = doc(db, "game_settings", "settings");
      const teamsRef = doc(db, "game_settings", "teams_list");
      await setDoc(settingsRef, defaultSettings);
      await setDoc(teamsRef, defaultTeams);
    } else if (hasDetectedNoAPI) {
      updateLocalStorageDB((state) => {
        state.gameSettings = defaultSettings;
        state.teams = defaultTeams;
      });
    } else {
      try {
        const res = await fetch("/api/reset-game", { method: "POST" });
        if (!res.ok) throw new Error();
      } catch (e) {
        updateLocalStorageDB((state) => {
          state.gameSettings = defaultSettings;
          state.teams = defaultTeams;
        });
      }
    }
  }
};

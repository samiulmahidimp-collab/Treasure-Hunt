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

// Generate initial state for all configured teams
export const generateDefaultTeams = () => {
  const teams = {};
  TEAMS_CONFIG.forEach(t => {
    teams[t.id] = {
      name: t.name,
      password: t.password,
      score: 0,
      solvedClues: [],
      sessionToken: "",
      attempts: 0,
      locked: false,
      isPaused: false
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

// Check if firebase is configured
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "YOUR_API_KEY";

let db = null;
let useMock = true;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    useMock = false;
    console.log("Firebase initialized successfully. Running in real-time serverless mode.");
  } catch (error) {
    console.error("Firebase failed to initialize. Falling back to local state:", error);
    useMock = true;
  }
} else {
  console.log("No Firebase config found. Running in Local Storage Mock database mode.");
  useMock = true;
}

// ==========================================
// MOCK DATABASE IMPLEMENTATION (Local Storage)
// ==========================================
const MOCK_STORAGE_KEY = "la_casa_del_tesoro_db_v3";

const getMockDB = () => {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    // Ensure all 8 teams exist and have updated passwords in current state
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

  // Initial Mock State
  const initialState = {
    gameSettings: {
      isStarted: false,
      isPaused: false
    },
    teams: generateDefaultTeams()
  };
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
};

const updateMockDB = (updater) => {
  const dbState = getMockDB();
  updater(dbState);
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(dbState));
  window.dispatchEvent(new Event("mock-db-update"));
};

// ==========================================
// EXPORTED DATABASE INTERFACE
// ==========================================

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
      });
    } else {
      const handleUpdate = () => {
        const state = getMockDB();
        callback(state.gameSettings);
      };
      window.addEventListener("mock-db-update", handleUpdate);
      window.addEventListener("storage", handleUpdate);
      handleUpdate();
      return () => {
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
    } else {
      updateMockDB((state) => {
        state.gameSettings = { ...state.gameSettings, ...settings };
      });
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
        });
      };
      return handleSnapshot();
    } else {
      const handleUpdate = () => {
        const state = getMockDB();
        callback(state.teams);
      };
      window.addEventListener("mock-db-update", handleUpdate);
      window.addEventListener("storage", handleUpdate);
      handleUpdate();
      return () => {
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
            const defaultTeam = { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false, isPaused: false };
            updateDoc(docRef, { [teamName]: defaultTeam });
            callback(defaultTeam);
          }
        }
      });
    } else {
      const handleUpdate = () => {
        const state = getMockDB();
        if (state.teams[teamName]) {
          callback(state.teams[teamName]);
        }
      };
      window.addEventListener("mock-db-update", handleUpdate);
      window.addEventListener("storage", handleUpdate);
      handleUpdate();
      return () => {
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
    } else {
      updateMockDB((state) => {
        if (!state.teams[teamName]) {
          const defaults = generateDefaultTeams();
          state.teams[teamName] = defaults[teamName] || { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false, isPaused: false };
        }
        state.teams[teamName] = { ...state.teams[teamName], ...teamData };
      });
    }
  },

  // Get a one-time snapshot of ALL teams
  getAllTeams: async () => {
    if (!useMock) {
      const docRef = doc(db, "game_settings", "teams_list");
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : {};
    } else {
      const state = getMockDB();
      return state.teams || {};
    }
  },

  // Admin resets the whole game state
  resetGame: async () => {
    const defaultSettings = { isStarted: false, isPaused: false };
    const defaultTeams = generateDefaultTeams();

    if (!useMock) {
      const settingsRef = doc(db, "game_settings", "settings");
      const teamsRef = doc(db, "game_settings", "teams_list");
      await setDoc(settingsRef, defaultSettings);
      await setDoc(teamsRef, defaultTeams);
    } else {
      updateMockDB((state) => {
        state.gameSettings = defaultSettings;
        state.teams = defaultTeams;
      });
    }
  }
};

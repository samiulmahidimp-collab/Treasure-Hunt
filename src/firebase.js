import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";

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
const MOCK_STORAGE_KEY = "la_casa_del_tesoro_db";

const getMockDB = () => {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (data) return JSON.parse(data);

  // Initial Mock State
  const initialState = {
    gameSettings: {
      isStarted: false,
      isPaused: false
    },
    teams: {
      mahid: {
        score: 0,
        solvedClues: [],
        sessionToken: "",
        attempts: 0,
        locked: false
      },
      oyshee: {
        score: 0,
        solvedClues: [],
        sessionToken: "",
        attempts: 0,
        locked: false
      },
      prizon: {
        score: 0,
        solvedClues: [],
        sessionToken: "",
        attempts: 0,
        locked: false
      }
    }
  };
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
};

const updateMockDB = (updater) => {
  const dbState = getMockDB();
  updater(dbState);
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(dbState));
  // Dispatch a custom event to notify listeners of local change (simulating real-time socket/subscription)
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
          // Initialize settings if they don't exist
          const defaultSettings = { isStarted: false, isPaused: false };
          setDoc(docRef, defaultSettings);
          callback(defaultSettings);
        }
      }, (error) => {
        console.error("Firestore settings subscription error:", error);
      });
    } else {
      // Local Mock DB behavior
      const handleUpdate = () => {
        const state = getMockDB();
        callback(state.gameSettings);
      };
      window.addEventListener("mock-db-update", handleUpdate);
      // Immediate invoke
      handleUpdate();
      // Unsubscribe callback
      return () => window.removeEventListener("mock-db-update", handleUpdate);
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
      // In Firestore, we listen to the teams collection
      const handleSnapshot = () => {
        const teamsRef = doc(db, "game_settings", "teams_list");
        return onSnapshot(teamsRef, (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.data());
          } else {
            const initialTeams = {
              mahid: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false },
              oyshee: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false },
              prizon: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false }
            };
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
      handleUpdate();
      return () => window.removeEventListener("mock-db-update", handleUpdate);
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
            // If team doesn't exist, create template
            const defaultTeam = { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false };
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
      handleUpdate();
      return () => window.removeEventListener("mock-db-update", handleUpdate);
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
        const initialTeams = {
          mahid: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false },
          oyshee: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false },
          prizon: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false }
        };
        initialTeams[teamName] = { ...initialTeams[teamName], ...teamData };
        await setDoc(docRef, initialTeams);
      }
    } else {
      updateMockDB((state) => {
        if (!state.teams[teamName]) {
          state.teams[teamName] = { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false };
        }
        state.teams[teamName] = { ...state.teams[teamName], ...teamData };
      });
    }
  },

  // Get a one-time snapshot of ALL teams (used for anti-collision clue picking)
  getAllTeams: async () => {
    if (!useMock) {
      const docRef = doc(db, "game_settings", "teams_list");
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : {};
    } else {
      // Synchronous read directly from localStorage — no subscription needed
      const state = getMockDB();
      return state.teams || {};
    }
  },

  // Admin resets the whole game state
  resetGame: async () => {
    const defaultSettings = { isStarted: false, isPaused: false };
    const defaultTeams = {
      mahid: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false },
      oyshee: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false },
      prizon: { score: 0, solvedClues: [], sessionToken: "", attempts: 0, locked: false }
    };

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

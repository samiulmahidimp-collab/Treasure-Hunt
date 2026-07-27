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
    console.error("Firebase failed to initialize. Falling back to Network API mode:", error);
    useMock = true;
  }
} else {
  console.log("Running in Network Server Game State mode.");
  useMock = true;
}

// Network API fetcher helper
const fetchGameState = async () => {
  try {
    const res = await fetch("/api/game-state");
    if (res.ok) return await res.json();
  } catch (e) {}
  return { gameSettings: { isStarted: false, isPaused: false }, teams: generateDefaultTeams() };
};

export const dbService = {
  // Subscribe to Global Game Settings (polls every 1s across network)
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
      let isSubscribed = true;
      const poll = async () => {
        if (!isSubscribed) return;
        const state = await fetchGameState();
        callback(state.gameSettings || { isStarted: false, isPaused: false });
      };
      poll();
      const intervalId = setInterval(poll, 1000);
      return () => {
        isSubscribed = false;
        clearInterval(intervalId);
      };
    }
  },

  // Update Game Settings (Admin Control)
  updateGameSettings: async (settings) => {
    if (!useMock) {
      const docRef = doc(db, "game_settings", "settings");
      await setDoc(docRef, settings, { merge: true });
    } else {
      await fetch("/api/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
    }
  },

  // Subscribe to all teams for Leaderboard (polls every 1s across network)
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
      let isSubscribed = true;
      const poll = async () => {
        if (!isSubscribed) return;
        const state = await fetchGameState();
        callback(state.teams || generateDefaultTeams());
      };
      poll();
      const intervalId = setInterval(poll, 1000);
      return () => {
        isSubscribed = false;
        clearInterval(intervalId);
      };
    }
  },

  // Subscribe to a specific team's details (polls every 1s across network)
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
      let isSubscribed = true;
      const poll = async () => {
        if (!isSubscribed) return;
        const state = await fetchGameState();
        if (state.teams && state.teams[teamName]) {
          callback(state.teams[teamName]);
        }
      };
      poll();
      const intervalId = setInterval(poll, 1000);
      return () => {
        isSubscribed = false;
        clearInterval(intervalId);
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
      await fetch("/api/update-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamName, teamData })
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
      const state = await fetchGameState();
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
      await fetch("/api/reset-game", { method: "POST" });
    }
  }
};

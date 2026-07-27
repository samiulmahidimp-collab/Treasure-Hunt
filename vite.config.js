import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.resolve(__dirname, 'server_game_state.json');

const defaultTeams = {
  khuje_berai: { id: "khuje_berai", name: "খুঁজে বেড়াই", password: "chemri", score: 0, solvedClues: [], currentClueId: null, chatMessages: [], sessionToken: "", attempts: 0, locked: false, isPaused: false },
  team_damn: { id: "team_damn", name: "Team Damn", password: "bolod", score: 0, solvedClues: [], currentClueId: null, chatMessages: [], sessionToken: "", attempts: 0, locked: false, isPaused: false },
  los_reyes: { id: "los_reyes", name: "Los Reyes", password: "goru", score: 0, solvedClues: [], currentClueId: null, chatMessages: [], sessionToken: "", attempts: 0, locked: false, isPaused: false },
  the_explorers: { id: "the_explorers", name: "The explorers", password: "chagol", score: 0, solvedClues: [], currentClueId: null, chatMessages: [], sessionToken: "", attempts: 0, locked: false, isPaused: false },
  pirates_of_ipe: { id: "pirates_of_ipe", name: "The Pirates of IPE", password: "nabisco", score: 0, solvedClues: [], currentClueId: null, chatMessages: [], sessionToken: "", attempts: 0, locked: false, isPaused: false },
  treasure_titans: { id: "treasure_titans", name: "Treasure Titans", password: "dishwash", score: 0, solvedClues: [], currentClueId: null, chatMessages: [], sessionToken: "", attempts: 0, locked: false, isPaused: false },
  chockers_squad: { id: "chockers_squad", name: "CHOCKERS’ SQUAD", password: "vera", score: 0, solvedClues: [], currentClueId: null, chatMessages: [], sessionToken: "", attempts: 0, locked: false, isPaused: false },
  team_nexus: { id: "team_nexus", name: "Team nexus", password: "Gandu", score: 0, solvedClues: [], currentClueId: null, chatMessages: [], sessionToken: "", attempts: 0, locked: false, isPaused: false }
};

const getInitialState = () => ({
  gameSettings: { isStarted: false, isPaused: false },
  teams: JSON.parse(JSON.stringify(defaultTeams))
});

const loadState = () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      // Ensure all default team keys exist
      let updated = false;
      Object.keys(defaultTeams).forEach(k => {
        if (!data.teams[k]) {
          data.teams[k] = defaultTeams[k];
          updated = true;
        }
      });
      if (updated) {
        fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
      }
      return data;
    }
  } catch (e) {
    console.error("Error loading server_game_state.json:", e);
  }
  const state = getInitialState();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  return state;
};

const saveState = (state) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error("Error saving server_game_state.json:", e);
  }
};

function gameStatePlugin() {
  return {
    name: 'game-state-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0];

        if (url === '/api/game-state' && req.method === 'GET') {
          const state = loadState();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(state));
          return;
        }

        if (url === '/api/update-settings' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            const state = loadState();
            const payload = JSON.parse(body || '{}');
            state.gameSettings = { ...state.gameSettings, ...payload };
            saveState(state);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, state }));
          });
          return;
        }

        if (url === '/api/update-team' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            const state = loadState();
            const { teamId, teamData } = JSON.parse(body || '{}');
            if (teamId) {
              state.teams[teamId] = { ...(state.teams[teamId] || {}), ...teamData };
              saveState(state);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, state }));
          });
          return;
        }

        if (url === '/api/reset-game' && req.method === 'POST') {
          const state = getInitialState();
          saveState(state);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, state }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), gameStatePlugin()],
});

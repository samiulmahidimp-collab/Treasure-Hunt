# La Casa Del Tesero (Treasure Hunt App)

A highly efficient, real-time web application and chatbot for a treasure hunt event called "La Casa Del Tesoro", styled with a premium **Money Heist (La Casa de Papel)** visual theme (deep reds, dark charcoal blacks, neon glow borders, and grungy typewriter styling).

Built using **Vite + React (JS)** and integrated with **Firebase Firestore** (featuring an automated local storage fallback for easy zero-setup testing).

---

## 🚀 Git Setup & GitHub Deployment Commands

To push this codebase to your GitHub repository `la-casa-de-tesero`, run the following commands in your terminal:

```bash
# 1. Initialize a new local Git repository
git init

# 2. Add all files to staging
git add .

# 3. Create the initial commit
git commit -m "feat: initial release of La Casa Del Tesero chatbot and admin portal"

# 4. Rename the default branch to main
git branch -M main

# 5. Link your local repository to your remote GitHub repository
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/la-casa-de-tesero.git

# 6. Push the code online (forces upload if needed)
git push -u origin main
```
*(Make sure to replace `YOUR_GITHUB_USERNAME` with your actual GitHub username).*

---

## 🧪 Local Testing Checklist

Follow these steps to run and thoroughly test the application locally before deploying to Vercel:

### 1. Launch the Server
1. Open your terminal in the project directory.
2. Run `npm install` (if you haven't already).
3. Run `npm run dev` to boot the Vite development server.
4. Open the local address (usually `http://localhost:5173`) in your browser.

### 2. Verify Database Connection
- Check your browser console (`F12`):
  - If Firebase variables are set in `.env.local`, you will see: `Firebase initialized successfully. Running in real-time serverless mode.`
  - If no environment variables are set, you will see: `No Firebase config found. Running in Local Storage Mock database mode.` (Everything will sync locally across tabs in real-time).

### 3. Test Game Controls (Admin Sync)
1. Open two browser windows side-by-side:
   - **Window A (Player)**: Go to the main lobby and select **Operative (Player)**. Select a team (e.g. `mahid`) and try to connect. It should show: **"CHANNEL ENCRYPTED. The Professor has not started the protocol yet."**
   - **Window B (Admin)**: Go to **The Professor (Admin)**. Login with Operative ID: `jonogoner_raja_mahid_bro` and Access Key: `ami_mahid`.
2. In **Window B (Admin)**, click the red **START SYSTEM LOCK** button.
3. Observe **Window A (Player)**: It should instantly refresh and display the welcome chatbot message!
4. In **Window B (Admin)**, click **PAUSE SYSTEM LOCK**. **Window A (Player)** should immediately show a **"MISSION HOLD"** overlay. Click **RESUME** to restore the game.

### 4. Test Single-Device Session Enforcement
1. Open two separate browsers (e.g., Chrome and Firefox, or normal and Incognito tabs).
2. **Tab 1**: Log in as team `mahid`. You will enter the chatbot.
3. **Tab 2**: Log in as team `mahid` as well.
4. **Result**: **Tab 1** should immediately display a pop-up alert: `"SECURITY BREACH: Your team logged in on another device! You have been disconnected."` and will be automatically logged out and returned to the sign-in lobby.

### 5. Test Chatbot Gameplay & Lockout Rules
1. In the Player Chatbot, type `Yes` to start the game. The bot will deliver **Clue #1**.
2. Type an incorrect answer (e.g., `wrong_code`).
   - The bot should reply with a decryption error indicating you have 1/3 attempts used.
3. Type another wrong answer (2/3 attempts used).
4. Type a third wrong answer (3/3 attempts used).
   - **Result**: The chatbot screen must immediately lock, showing a full-screen red flashing **"SYSTEM LOCKED"** overlay.
5. In the locked overlay, type the admin override key: `ami_mahid`.
   - **Result**: The system unlocks, resets your attempt counter, and lets you guess the same clue again.
6. Look at the clue image. The correct answer is the filename of the image (e.g., type `tokyo` for Tokyo's clue).
   - **Result**: A green **ACCESS GRANTED** screen will flash, your score will update to 1, and the bot will deliver the next clue.

### 6. Test Phase 1 Completion
1. Solve 8 clues in a row.
2. **Result**: Upon cracking the 8th clue, the screen must display a green-bordered **"PHASE 1 COMPLETE - Awaiting Semi-Final Instructions"** graphic and lock further gameplay inputs.
3. Verify that the Admin dashboard leaderboard correctly updates in real-time to show the team solved `8 / 8` clues.

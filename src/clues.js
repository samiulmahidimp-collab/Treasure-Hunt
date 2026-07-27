// Configuration and initial schema for 3-Stage Treasure Hunt
// Assets are served from:
// - Stage 1 (Initial Hunt): /pictures/stage1/  (8 sequential clues)
// - Stage 2 (The Qualifiers): /pictures/stage2/  (2 sequential clues)
// - Stage 3 (The Final Round): /pictures/final/   (1 ultimate clue)

export const STAGE_CONFIG = {
  1: { stage: 1, name: "Stage 1: The Initial Hunt", totalClues: 8, folder: "stage1" },
  2: { stage: 2, name: "Stage 2: The Qualifiers", totalClues: 2, folder: "stage2" },
  3: { stage: 3, name: "Stage 3: The Final Round", totalClues: 1, folder: "final" }
};

export const DEFAULT_CLUES = [
  // Stage 1 (8 sequential clues)
  {
    id: "clue_1",
    stage: 1,
    stageName: "Stage 1: The Initial Hunt",
    stageFolder: "stage1",
    image_path: "/pictures/stage1/afrewa.png",
    imageFilename: "afrewa.png",
    answer: "afrewa",
    description: "CLUE #1: Analyze this image and enter the secret code."
  },
  {
    id: "clue_2",
    stage: 1,
    stageName: "Stage 1: The Initial Hunt",
    stageFolder: "stage1",
    image_path: "/pictures/stage1/kiytth.png",
    imageFilename: "kiytth.png",
    answer: "kiytth",
    description: "CLUE #2: Analyze this image and enter the secret code."
  },
  {
    id: "clue_3",
    stage: 1,
    stageName: "Stage 1: The Initial Hunt",
    stageFolder: "stage1",
    image_path: "/pictures/stage1/qplwet.png",
    imageFilename: "qplwet.png",
    answer: "qplwet",
    description: "CLUE #3: Analyze this image and enter the secret code."
  },
  {
    id: "clue_4",
    stage: 1,
    stageName: "Stage 1: The Initial Hunt",
    stageFolder: "stage1",
    image_path: "/pictures/stage1/abklcd.jpg",
    imageFilename: "abklcd.jpg",
    answer: "abklcd",
    description: "CLUE #4: Analyze this image and enter the secret code."
  },
  {
    id: "clue_5",
    stage: 1,
    stageName: "Stage 1: The Initial Hunt",
    stageFolder: "stage1",
    image_path: "/pictures/stage1/ahfiuw.jpg",
    imageFilename: "ahfiuw.jpg",
    answer: "ahfiuw",
    description: "CLUE #5: Analyze this image and enter the secret code."
  },
  {
    id: "clue_6",
    stage: 1,
    stageName: "Stage 1: The Initial Hunt",
    stageFolder: "stage1",
    image_path: "/pictures/stage1/apndaq.jpg",
    imageFilename: "apndaq.jpg",
    answer: "apndaq",
    description: "CLUE #6: Analyze this image and enter the secret code."
  },
  {
    id: "clue_7",
    stage: 1,
    stageName: "Stage 1: The Initial Hunt",
    stageFolder: "stage1",
    image_path: "/pictures/stage1/jk1106.png",
    imageFilename: "jk1106.png",
    answer: "jk1106",
    description: "CLUE #7: Analyze this image and enter the secret code."
  },
  {
    id: "clue_8",
    stage: 1,
    stageName: "Stage 1: The Initial Hunt",
    stageFolder: "stage1",
    image_path: "/pictures/stage1/kshpfl.png",
    imageFilename: "kshpfl.png",
    answer: "kshpfl",
    description: "CLUE #8: Final vault code for Stage 1."
  },

  // Stage 2 (2 sequential clues)
  {
    id: "clue_9",
    stage: 2,
    stageName: "Stage 2: The Qualifiers",
    stageFolder: "stage2",
    image_path: "/pictures/stage2/opklru.jpg",
    imageFilename: "opklru.jpg",
    answer: "opklru",
    description: "STAGE 2 CLUE #1: Qualifier cipher."
  },
  {
    id: "clue_10",
    stage: 2,
    stageName: "Stage 2: The Qualifiers",
    stageFolder: "stage2",
    image_path: "/pictures/stage2/romhkf.jpg",
    imageFilename: "romhkf.jpg",
    answer: "romhkf",
    description: "STAGE 2 CLUE #2: Qualifier cipher."
  },

  // Stage 3 (1 final clue)
  {
    id: "clue_11",
    stage: 3,
    stageName: "Stage 3: The Final Round",
    stageFolder: "final",
    image_path: "/pictures/final/yen7rc.jpg",
    imageFilename: "yen7rc.jpg",
    answer: "yen7rc",
    description: "FINAL ROUND: The Ultimate Heist Treasure Code."
  }
];

// Helper to compute image_path dynamically based on stage & filename
export function getDynamicImagePath(stage, filename) {
  const folderMap = { 1: "stage1", 2: "stage2", 3: "final" };
  const folder = folderMap[stage] || "stage1";
  const cleanFilename = (filename || "").replace(/^\/+/, "").replace(/^pictures\/(stage1|stage2|final)\//, "");
  return `/pictures/${folder}/${cleanFilename}`;
}

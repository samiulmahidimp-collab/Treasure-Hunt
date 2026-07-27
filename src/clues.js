// Configuration mapping clue images to stage, id, answer, and description
// Stage 1: 8 clues (/pictures/stage1/)
// Stage 2: 2 clues (/pictures/stage2/)
// Final Stage: 1 clue (/pictures/final/)
// Total: 11 clues

export const STAGE_1_CLUES_COUNT = 8;
export const STAGE_2_CLUES_COUNT = 2;
export const FINAL_STAGE_CLUES_COUNT = 1;
export const TOTAL_CLUES_COUNT = 11;

export const INITIAL_CLUES = [
  {
    id: "clue_1",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/stage1/afrewa.png",
    answer: "afrewa",
    description: "CLUE #1: Analyze this image and enter the secret code."
  },
  {
    id: "clue_2",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/stage1/kiytth.png",
    answer: "kiytth",
    description: "CLUE #2: Analyze this image and enter the secret code."
  },
  {
    id: "clue_3",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/stage1/qplwet.png",
    answer: "qplwet",
    description: "CLUE #3: Analyze this image and enter the secret code."
  },
  {
    id: "clue_4",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/stage1/abklcd.jpg",
    answer: "abklcd",
    description: "CLUE #4: Analyze this image and enter the secret code."
  },
  {
    id: "clue_5",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/stage1/ahfiuw.jpg",
    answer: "ahfiuw",
    description: "CLUE #5: Analyze this image and enter the secret code."
  },
  {
    id: "clue_6",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/stage1/apndaq.jpg",
    answer: "apndaq",
    description: "CLUE #6: Analyze this image and enter the secret code."
  },
  {
    id: "clue_7",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/stage1/jk1106.png",
    answer: "jk1106",
    description: "CLUE #7: Analyze this image and enter the secret code."
  },
  {
    id: "clue_8",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/stage1/kshpfl.png",
    answer: "kshpfl",
    description: "CLUE #8: Analyze this image and enter the secret code."
  },
  {
    id: "clue_9",
    stage: 2,
    stageName: "Stage 2 (Semi-Final)",
    image: "/pictures/stage2/opklru.jpg",
    answer: "opklru",
    description: "CLUE #9: Analyze this image and enter the secret code."
  },
  {
    id: "clue_10",
    stage: 2,
    stageName: "Stage 2 (Semi-Final)",
    image: "/pictures/stage2/romhkf.jpg",
    answer: "romhkf",
    description: "CLUE #10: Analyze this image and enter the secret code."
  },
  {
    id: "clue_11",
    stage: 3,
    stageName: "Final Stage (Grand Vault)",
    image: "/pictures/final/yen7rc.jpg",
    answer: "yen7rc",
    description: "CLUE #11 (Final): Analyze this image and enter the secret code."
  }
];

export let CLUES = [...INITIAL_CLUES];

export const updateCluesList = (newList) => {
  CLUES = newList;
};

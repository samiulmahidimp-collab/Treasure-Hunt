// Configuration mapping clue images to stage, id, answer, and description
// Stage 1 (Initial Hunt): 8 clues
// Stage 2 (Final Vault): 3 clues
// Total: 11 clues

export const STAGE_1_CLUES_COUNT = 8;
export const STAGE_2_CLUES_COUNT = 3;
export const TOTAL_CLUES_COUNT = 11;

export const INITIAL_CLUES = [
  {
    id: "clue_1",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/afrewa.png",
    answer: "afrewa",
    description: "CLUE #1: Analyze this image and enter the secret code."
  },
  {
    id: "clue_2",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/kiytth.png",
    answer: "kiytth",
    description: "CLUE #2: Analyze this image and enter the secret code."
  },
  {
    id: "clue_3",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/qplwet.png",
    answer: "qplwet",
    description: "CLUE #3: Analyze this image and enter the secret code."
  },
  {
    id: "clue_4",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/abklcd.jpg",
    answer: "abklcd",
    description: "CLUE #4: Analyze this image and enter the secret code."
  },
  {
    id: "clue_5",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/ahfiuw.jpg",
    answer: "ahfiuw",
    description: "CLUE #5: Analyze this image and enter the secret code."
  },
  {
    id: "clue_6",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/apndaq.jpg",
    answer: "apndaq",
    description: "CLUE #6: Analyze this image and enter the secret code."
  },
  {
    id: "clue_7",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/jk1106.png",
    answer: "jk1106",
    description: "CLUE #7: Analyze this image and enter the secret code."
  },
  {
    id: "clue_8",
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: "/pictures/kshpfl.png",
    answer: "kshpfl",
    description: "CLUE #8: Analyze this image and enter the secret code."
  },
  {
    id: "clue_9",
    stage: 2,
    stageName: "Stage 2 (Final Vault)",
    image: "/pictures/opklru.jpg",
    answer: "opklru",
    description: "CLUE #9: Analyze this image and enter the secret code."
  },
  {
    id: "clue_10",
    stage: 2,
    stageName: "Stage 2 (Final Vault)",
    image: "/pictures/romhkf.jpg",
    answer: "romhkf",
    description: "CLUE #10: Analyze this image and enter the secret code."
  },
  {
    id: "clue_11",
    stage: 2,
    stageName: "Stage 2 (Final Vault)",
    image: "/pictures/yen7rc.jpg",
    answer: "yen7rc",
    description: "CLUE #11: Analyze this image and enter the secret code."
  }
];

export let CLUES = [...INITIAL_CLUES];

export const updateCluesList = (newList) => {
  CLUES = newList;
};

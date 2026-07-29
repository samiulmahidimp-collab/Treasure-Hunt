// Configuration mapping clue images and videos to stage, id, answer, and description
// Stage 1: 40 clues (/pictures/stage1/)
// Stage 2: 2 clues (/pictures/stage2/)
// Final Stage: 1 clue (/pictures/final/)

export const STAGE_1_RAW_FILES = [
  "afrewa.png", "kiytth.png", "qplwet.png", "abklcd.jpg", "ahfiuw.jpg", "apndaq.jpg",
  "jk1106.png", "kshpfl.png", "afdhus.png", "dfghjk.png", "efigpn.png", "fhwhgh.png",
  "fkhjol.png", "fwepkl.png", "ghajof.png", "hjpnet.png", "jhkdklt.mp4", "jnoipk.png",
  "ljknpm.png", "mjghsl.png", "mjkhol.png", "najfep.png", "oksghj.png", "pklshu.png",
  "psigko.png", "pskggh.png", "qrwhwk.png", "quwysa.png", "rbafla.png", "rskter.png",
  "sghijk.png", "shfhwo.png", "sihijk.png", "skgbks.png", "smkgho.mp4", "soigsl.png",
  "tkrunp.png", "uiolfh.png", "uteuok.png", "yoovsk.png"
];

export const STAGE_1_CLUES_COUNT = 8; // Number of Stage 1 clues each team must solve to advance
export const STAGE_2_CLUES_COUNT = 2;
export const FINAL_STAGE_CLUES_COUNT = 1;
export const TOTAL_CLUES_COUNT = 11;

export const STAGE_1_CLUES = STAGE_1_RAW_FILES.map((fileName, index) => {
  const answer = fileName.split(".")[0];
  const isVideo = fileName.endsWith(".mp4");
  return {
    id: `clue_s1_${index + 1}`,
    stage: 1,
    stageName: "Stage 1 (Initial Hunt)",
    image: `/pictures/stage1/${fileName}`,
    answer: answer,
    isVideo: isVideo,
    description: isVideo 
      ? `CLUE #${index + 1}: Analyze this video intel file and enter the secret code.`
      : `CLUE #${index + 1}: Analyze this visual intel file and enter the secret code.`
  };
});

export const STAGE_2_CLUES = [
  {
    id: "clue_s2_1",
    stage: 2,
    stageName: "Stage 2 (Semi-Final)",
    image: "/pictures/stage2/opklru.jpg",
    answer: "opklru",
    description: "CLUE (Stage 2): Analyze this image and enter the secret code."
  },
  {
    id: "clue_s2_2",
    stage: 2,
    stageName: "Stage 2 (Semi-Final)",
    image: "/pictures/stage2/romhkf.jpg",
    answer: "romhkf",
    description: "CLUE (Stage 2): Analyze this image and enter the secret code."
  }
];

export const FINAL_STAGE_CLUES = [
  {
    id: "clue_final_1",
    stage: 3,
    stageName: "Final Stage (Grand Vault)",
    image: "/pictures/final/yen7rc.jpg",
    answer: "yen7rc",
    description: "CLUE (Final): Analyze this image and enter the secret code."
  }
];

export const INITIAL_CLUES = [
  ...STAGE_1_CLUES,
  ...STAGE_2_CLUES,
  ...FINAL_STAGE_CLUES
];

export let CLUES = [...INITIAL_CLUES];

export const updateCluesList = (newList) => {
  CLUES = newList;
};

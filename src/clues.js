// Configuration mapping clue images, videos, and PDF documents to stage, id, answer, and description
// Stage 1: 58 clues (/pictures/stage1/)
// Stage 2: 3 clues (/pictures/stage2/)
// Final Stage: 1 PDF clue (/pictures/final/)

export const STAGE_1_RAW_FILES = [
  "123486.png", "25bppk.png", "Emmeme.png", "abklcd.jpg", "abrr2f.png", "afdhus.png",
  "afrewa.png", "ahfiuw.jpg", "andohc.png", "apndaq.jpg", "auisgy.png", "dfghjk.png",
  "efigpn.png", "fhwhgh.png", "fkhjol.png", "fwepkl.png", "ghajof.png", "hjpnet.png",
  "hueiye.jpg", "jhkdklt.mp4", "jk1106.png", "jnoipk.png", "kiytth.png", "kshpfl.png",
  "ljknpm.png", "lkhiao.png", "meowww.png", "mjghsl.png", "mjkhol.png", "msofob.png",
  "najfep.png", "oksghj.png", "opklru.jpg", "pklshu.png", "pqifoj.png", "psigko.png",
  "pskggh.png", "qplwet.jpg", "qrwhwk.png", "quwysa.png", "rbafla.png", "romhkf.jpg",
  "rskter.png", "shfhwo.png", "sihijk.png", "sjhtsd.png", "skgbks.png", "skjdks.png",
  "smkgho.mp4", "soigsl.png", "tkrunp.png", "tqweiq.png", "uiolfh.png", "uragay.png",
  "uteuok.png", "xjkbne.png", "yen7rc.jpg", "yoovsk.png"
];

export const STAGE_1_CLUES_COUNT = 8; // Number of Stage 1 clues each team must solve to advance
export const STAGE_2_CLUES_COUNT = 3;
export const FINAL_STAGE_CLUES_COUNT = 1;
export const TOTAL_CLUES_COUNT = 12; // 8 (Stage 1) + 3 (Stage 2) + 1 (Final PDF)

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
    isPDF: false,
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
    image: "/pictures/stage2/akgpsl.png",
    answer: "akgpsl",
    isVideo: false,
    isPDF: false,
    description: "STAGE 2 CLUE #1: Analyze this semi-final intel file and enter the secret code."
  },
  {
    id: "clue_s2_2",
    stage: 2,
    stageName: "Stage 2 (Semi-Final)",
    image: "/pictures/stage2/uoseiu.png",
    answer: "uoseiu",
    isVideo: false,
    isPDF: false,
    description: "STAGE 2 CLUE #2: Analyze this semi-final intel file and enter the secret code."
  },
  {
    id: "clue_s2_3",
    stage: 2,
    stageName: "Stage 2 (Semi-Final)",
    image: "/pictures/stage2/uy54gh.png",
    answer: "uy54gh",
    isVideo: false,
    isPDF: false,
    description: "STAGE 2 CLUE #3: Analyze this semi-final intel file and enter the secret code."
  }
];

export const FINAL_STAGE_CLUES = [
  {
    id: "clue_final_1",
    stage: 3,
    stageName: "Final Stage (Grand Vault)",
    image: "/pictures/final/FInal-Clue.pdf",
    answer: "final-clue",
    altAnswers: ["finalclue", "final clue", "final-clue", "final_clue"],
    isVideo: false,
    isPDF: true,
    description: "FINAL VAULT CLUE: Download and inspect the encrypted PDF document below to retrieve the ultimate heist code!"
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

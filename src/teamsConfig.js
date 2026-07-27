// List of participating teams and their credentials
export const TEAMS_CONFIG = [
  {
    id: "khuje_berai",
    name: "খুঁজে বেড়াই",
    password: "bolod"
  },
  {
    id: "team_damn",
    name: "Team Damn",
    password: "chemri"
  },
  {
    id: "los_reyes",
    name: "Los Reyes",
    password: "goru"
  },
  {
    id: "the_explorers",
    name: "The explorers",
    password: "chagol"
  },
  {
    id: "pirates_of_ipe",
    name: "The Pirates of IPE",
    password: "nabisco"
  },
  {
    id: "treasure_titans",
    name: "Treasure Titans",
    password: "dishwash"
  },
  {
    id: "chockers_squad",
    name: "CHOCKERS’ SQUAD",
    password: "vera"
  },
  {
    id: "team_nexus",
    name: "Team nexus",
    password: "Gandu"
  }
];

export const getTeamById = (id) => TEAMS_CONFIG.find(t => t.id === id);

export const getTeamByNameOrId = (input) => {
  if (!input) return null;
  const lower = input.trim().toLowerCase();
  return TEAMS_CONFIG.find(t => t.id.toLowerCase() === lower || t.name.toLowerCase() === lower);
};

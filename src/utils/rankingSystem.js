// Ranking system based on XP
export const RANKS = [
  { name: 'Iron', minXP: 0, maxXP: 999, color: '#71797E' },
  { name: 'Bronze', minXP: 1000, maxXP: 2499, color: '#CD7F32' },
  { name: 'Silver', minXP: 2500, maxXP: 4999, color: '#C0C0C0' },
  { name: 'Gold', minXP: 5000, maxXP: 9999, color: '#FFD700' },
  { name: 'Platinum', minXP: 10000, maxXP: 19999, color: '#E5E4E2' },
  { name: 'Diamond', minXP: 20000, maxXP: 39999, color: '#B9F2FF' },
  { name: 'Master', minXP: 40000, maxXP: 79999, color: '#8A2BE2' },
  { name: 'Grandmaster', minXP: 80000, maxXP: 149999, color: '#FF4500' },
  { name: 'Radiant', minXP: 150000, maxXP: Infinity, color: '#FFD700' }
];

/**
 * Get rank info based on XP
 * @param {number} xp - Player's total XP
 * @returns {object} Rank information {name, color, minXP, maxXP, progress}
 */
export const getRankFromXP = (xp = 0) => {
  const rank = RANKS.find(r => xp >= r.minXP && xp <= r.maxXP) || RANKS[0];
  
  // Calculate progress to next rank
  const xpInRank = xp - rank.minXP;
  const xpNeededForRank = rank.maxXP - rank.minXP;
  const progress = rank.maxXP === Infinity ? 100 : Math.min(100, (xpInRank / xpNeededForRank) * 100);
  
  return {
    name: rank.name,
    color: rank.color,
    minXP: rank.minXP,
    maxXP: rank.maxXP,
    progress,
    xpInRank,
    xpNeededForRank
  };
};

/**
 * Get XP needed  for next rank
 * @param {number} xp - Player's total XP
 * @returns {number} XP needed
 */
export const getXPForNextRank = (xp = 0) => {
  const currentRank = getRankFromXP(xp);
  if (currentRank.maxXP === Infinity) return 0;
  return currentRank.maxXP - xp + 1;
};

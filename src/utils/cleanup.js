import { ref, query, orderByChild, endAt, remove, get } from 'firebase/database';
import { rtdb } from '../firebaseConfig';

/**
 * Cleanup old game data from Firebase Realtime Database
 * Deletes games older than 1 day to save storage on free plan
 */
export const cleanupOldGames = async () => {
  try {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds

    console.log('🧹 Starting game cleanup...');

    // Reference to games
    const gamesRef = ref(rtdb, 'games');
    
    // Get all games
    const snapshot = await get(gamesRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No games to clean up');
      return { deleted: 0, total: 0 };
    }

    const games = snapshot.val();
    const gameIds = Object.keys(games);
    let deletedCount = 0;

    // Delete games older than 1 day
    const deletePromises = gameIds.map(async (gameId) => {
      const game = games[gameId];
      const createdAt = game.createdAt || 0;

      if (createdAt < oneDayAgo) {
        await remove(ref(rtdb, `games/${gameId}`));
        deletedCount++;
        console.log(`🗑️ Deleted old game: ${gameId}`);
      }
    });

    await Promise.all(deletePromises);

    console.log(`✅ Cleanup complete: Deleted ${deletedCount} out of ${gameIds.length} games`);
    
    return {
      deleted: deletedCount,
      total: gameIds.length,
      message: `Cleaned up ${deletedCount} old game(s)`
    };

  } catch (error) {
    console.error('❌ Error during game cleanup:', error);
    return {
      deleted: 0,
      total: 0,
      error: error.message
    };
  }
};

/**
 * Cleanup old game invites from Firebase Realtime Database
 * Deletes invites older than 1 hour
 */
export const cleanupOldInvites = async () => {
  try {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds

    console.log('🧹 Starting invite cleanup...');

    // Reference to invites - CORRECT PATH is gameInvites
    const invitesRef = ref(rtdb, 'gameInvites');
    
    // Get all invites
    // Note: This might fail if rules don't allow reading root gameInvites
    // We'll wrap in specific try/catch to suppress permission errors
    let snapshot;
    try {
      snapshot = await get(invitesRef);
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED') {
        console.warn('⚠️ Cleanup skipped: Permission denied (User cannot read all invites)');
        return { deleted: 0, total: 0, error: 'Permission denied' };
      }
      throw err;
    }
    
    if (!snapshot.exists()) {
      console.log('✅ No invites to clean up');
      return { deleted: 0, total: 0 };
    }

    const usersInvites = snapshot.val(); // Organized by userID
    let deletedCount = 0;
    let checkedCount = 0;

    const deletePromises = [];

    // Iterate through each user's invite list
    Object.keys(usersInvites).forEach(userId => {
      const userInvites = usersInvites[userId];
      if (!userInvites) return;

      Object.keys(userInvites).forEach(inviteId => {
        checkedCount++;
        const invite = userInvites[inviteId];
        const timestamp = invite.timestamp || 0;

        if (timestamp < oneHourAgo) {
          deletePromises.push(
            remove(ref(rtdb, `gameInvites/${userId}/${inviteId}`))
              .catch(e => console.warn(`Failed to delete invite ${inviteId}:`, e))
          );
          deletedCount++;
        }
      });
    });

    await Promise.all(deletePromises);

    console.log(`✅ Invite cleanup complete: Deleted ${deletedCount} out of ${checkedCount} invites`);
    
    return {
      deleted: deletedCount,
      total: checkedCount,
      message: `Cleaned up ${deletedCount} old invite(s)`
    };

  } catch (error) {
    console.error('❌ Error during invite cleanup:', error);
    return {
      deleted: 0,
      total: 0,
      error: error.message
    };
  }
};

/**
 * Run all cleanup tasks
 */
export const runCleanupTasks = async () => {
  console.log('🧹 Running all cleanup tasks...');
  
  const [gamesResult, invitesResult] = await Promise.all([
    cleanupOldGames(),
    cleanupOldInvites()
  ]);

  const totalDeleted = gamesResult.deleted + invitesResult.deleted;
  
  console.log(`✅ All cleanup tasks complete. Total items deleted: ${totalDeleted}`);
  
  return {
    games: gamesResult,
    invites: invitesResult,
    totalDeleted
  };
};

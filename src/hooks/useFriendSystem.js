import { useState, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { ref, push, set, remove, get, query, orderByChild, equalTo } from 'firebase/database';
import { db, rtdb } from '../firebaseConfig';
import toast from 'react-hot-toast';

const FRIEND_LIMIT = 50;
const REQUEST_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export const useFriendSystem = (user) => {
  const [loading, setLoading] = useState(false);

  // Helper: Get friend count
  const getFriendCount = useCallback(async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'players', userId));
      const friends = userDoc.data()?.friends || [];
      return friends.length;
    } catch (error) {
      console.error('Get friend count error:', error);
      return 0;
    }
  }, []);

  // Helper: Check for duplicate/recent requests
  const checkDuplicateRequest = useCallback(async (targetUserId) => {
    try {
      const requestsRef = ref(rtdb, `friendRequests/${targetUserId}`);
      const snapshot = await get(requestsRef);
      
      if (!snapshot.exists()) return null;

      const requests = snapshot.val();
      const now = Date.now();

      // Check for existing pending or recent rejected requests
      for (const [requestId, requestData] of Object.entries(requests)) {
        if (requestData.from === user.uid) {
          // Pending request exists
          if (requestData.status === 'pending') {
            return { exists: true, type: 'pending', requestId };
          }
          
          // Recently rejected (within cooldown period)
          if (requestData.status === 'rejected' && 
              (now - requestData.timestamp) < REQUEST_COOLDOWN) {
            return { 
              exists: true, 
              type: 'rejected', 
              cooldownEnds: new Date(requestData.timestamp + REQUEST_COOLDOWN)
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Check duplicate request error:', error);
      return null;
    }
  }, [user]);

  // Enhanced: Send Friend Request with validation
  const sendFriendRequest = useCallback(async (targetUser) => {
    if (!user?.uid || !targetUser?.uid) return;
    
    if (user.uid === targetUser.uid) {
      toast.error("YOU CANNOT RECRUIT YOURSELF");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("VALIDATING REQUEST...");

    try {
      // 1. Check if already friends
      const currentUserDoc = await getDoc(doc(db, 'players', user.uid));
      const currentFriends = currentUserDoc.data()?.friends || [];
      
      if (currentFriends.includes(targetUser.uid)) {
        toast.error("AGENT ALREADY IN SQUAD", { id: toastId });
        setLoading(false);
        return;
      }

      // 2. Check friend limit
      const myFriendCount = currentFriends.length;
      if (myFriendCount >= FRIEND_LIMIT) {
        toast.error(`SQUAD FULL (${FRIEND_LIMIT} MAX)`, { id: toastId });
        setLoading(false);
        return;
      }

      // 3. Check for duplicate/recent requests
      const duplicateCheck = await checkDuplicateRequest(targetUser.uid);
      if (duplicateCheck?.exists) {
        if (duplicateCheck.type === 'pending') {
          toast.error("REQUEST ALREADY PENDING", { id: toastId });
        } else if (duplicateCheck.type === 'rejected') {
          const hoursLeft = Math.ceil((duplicateCheck.cooldownEnds - new Date()) / (1000 * 60 * 60));
          toast.error(`COOLDOWN ACTIVE (${hoursLeft}h remaining)`, { id: toastId });
        }
        setLoading(false);
        return;
      }

      // 4. Send request
      const requestId = push(ref(rtdb, `friendRequests/${targetUser.uid}`)).key;
      await set(ref(rtdb, `friendRequests/${targetUser.uid}/${requestId}`), {
        from: user.uid,
        fromName: user.displayName,
        fromAvatar: user.photoURL ? { url: user.photoURL } : null,
        to: targetUser.uid,
        status: 'pending',
        timestamp: Date.now(),
        expiresAt: Date.now() + REQUEST_EXPIRATION
      });

      toast.success("REQUEST TRANSMITTED", { id: toastId });
    } catch (error) {
      console.error('Send request error:', error);
      toast.error("TRANSMISSION FAILED", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [user, checkDuplicateRequest]);

  // Enhanced: Accept Friend Request with validation
  const acceptFriendRequest = useCallback(async (request) => {
    if (!user?.uid || !request?.from) return;
    
    setLoading(true);
    const toastId = toast.loading("VALIDATING ALLIANCE...");

    try {
      // 1. Check both users' friend limits
      const [myCount, theirCount] = await Promise.all([
        getFriendCount(user.uid),
        getFriendCount(request.from)
      ]);

      if (myCount >= FRIEND_LIMIT) {
        toast.error(`YOUR SQUAD IS FULL (${FRIEND_LIMIT} MAX)`, { id: toastId });
        setLoading(false);
        return;
      }

      if (theirCount >= FRIEND_LIMIT) {
        toast.error("THEIR SQUAD IS FULL", { id: toastId });
        setLoading(false);
        return;
      }

      // 2. Check if request expired
      if (request.expiresAt && Date.now() > request.expiresAt) {
        toast.error("REQUEST EXPIRED", { id: toastId });
        // Auto-cleanup expired request
        if (request.id) {
          await remove(ref(rtdb, `friendRequests/${user.uid}/${request.id}`));
        }
        setLoading(false);
        return;
      }

      // 3. Add friends atomically
      await Promise.all([
        updateDoc(doc(db, 'players', user.uid), { friends: arrayUnion(request.from) }),
        updateDoc(doc(db, 'players', request.from), { friends: arrayUnion(user.uid) })
      ]);

      // 4. Delete request
      if (request.id) {
        await remove(ref(rtdb, `friendRequests/${user.uid}/${request.id}`));
      }

      toast.success("ALLIANCE FORMED", { id: toastId });
    } catch (error) {
      console.error('Accept friend error:', error);
      toast.error("ALLIANCE FAILED", { id: toastId });
      
      // Attempt rollback on error
      try {
        await Promise.all([
          updateDoc(doc(db, 'players', user.uid), { friends: arrayRemove(request.from) }),
          updateDoc(doc(db, 'players', request.from), { friends: arrayRemove(user.uid) })
        ]);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [user, getFriendCount]);

  // NEW: Decline Friend Request
  const declineFriendRequest = useCallback(async (request) => {
    if (!user?.uid || !request?.from) return;

    setLoading(true);
    const toastId = toast.loading("DECLINING REQUEST...");

    try {
      if (request.id) {
        // Mark as rejected instead of deleting (for cooldown tracking)
        await set(ref(rtdb, `friendRequests/${user.uid}/${request.id}`), {
          ...request,
          status: 'rejected',
          rejectedAt: Date.now()
        });

        // Schedule cleanup after 7 days
        setTimeout(async () => {
          try {
            await remove(ref(rtdb, `friendRequests/${user.uid}/${request.id}`));
          } catch (err) {
            console.error('Cleanup error:', err);
          }
        }, 7 * 24 * 60 * 60 * 1000);
      }

      toast.success("REQUEST DECLINED", { id: toastId });
    } catch (error) {
      console.error('Decline request error:', error);
      toast.error("DECLINE FAILED", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Enhanced: Remove Friend with better error handling
  const removeFriend = useCallback(async (friendUid, friendName) => {
    if (!user?.uid || !friendUid) return;

    setLoading(true);
    const toastId = toast.loading("SEVERING CONNECTION...");

    try {
      // Remove from both sides atomically
      await Promise.all([
        updateDoc(doc(db, 'players', user.uid), { friends: arrayRemove(friendUid) }),
        updateDoc(doc(db, 'players', friendUid), { friends: arrayRemove(user.uid) })
      ]);

      toast.success(`REMOVED ${friendName?.toUpperCase() || 'AGENT'} FROM SQUAD`, { id: toastId });
    } catch (error) {
      console.error('Delete friend error:', error);
      toast.error("REMOVAL FAILED", { id: toastId });
      
      // Attempt to restore on error
      try {
        await Promise.all([
          updateDoc(doc(db, 'players', user.uid), { friends: arrayUnion(friendUid) }),
          updateDoc(doc(db, 'players', friendUid), { friends: arrayUnion(user.uid) })
        ]);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    getFriendCount,
    loading,
    FRIEND_LIMIT
  };
};

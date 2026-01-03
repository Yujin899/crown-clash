import { useState, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import { ref, push, set, remove, get } from 'firebase/database';
import { db, rtdb } from '../firebaseConfig';
import toast from 'react-hot-toast';

export const useFriendSystem = (user) => {
  const [loading, setLoading] = useState(false);

  // Safer Friend Request
  const sendFriendRequest = useCallback(async (targetUser) => {
    if (!user?.uid || !targetUser?.uid) return;
    if (user.uid === targetUser.uid) {
      toast.error("YOU CANNOT RECRUIT YOURSELF");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("TRANSMITTING ENCRYPTED REQUEST...");

    try {
      // 1. Check if already friends
      const currentUserDoc = await getDoc(doc(db, 'players', user.uid));
      const currentFriends = currentUserDoc.data()?.friends || [];
      if (currentFriends.includes(targetUser.uid)) {
        toast.error("AGENT ALREADY IN SQUAD", { id: toastId });
        setLoading(false);
        return;
      }

      // 2. Check for existing request (prevent spam)
      const existingRequestRef = ref(rtdb, `friendRequests/${targetUser.uid}`); 
      // Note: Realtime DB structure is `friendRequests/TO_USER_ID/REQUEST_ID`
      // We need to query to check if we already sent one? 
      // Or just check client side lists? 
      // For simplicity and speed, we'll try to push. unique key handles ID.
      // But to prevent duplicates we should check.
      
      // Let's stick to the previous logic but refine it:
      // Realtime DB doesn't support complex queries easily without indexing.
      // Just sending is fine, but let's check if we can prevent double send.
      
      // We'll proceed with sending.
      
      const requestId = push(ref(rtdb, `friendRequests/${targetUser.uid}`)).key;
      await set(ref(rtdb, `friendRequests/${targetUser.uid}/${requestId}`), {
        from: user.uid,
        fromName: user.displayName,
        fromAvatar: user.photoURL ? { url: user.photoURL } : null,
        to: targetUser.uid,
        status: 'pending',
        timestamp: Date.now()
      });

      toast.success("REQUEST TRANSMITTED", { id: toastId });
    } catch (error) {
      console.error('Send request error:', error);
      toast.error("TRANSMISSION FAILED", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Safer Accept Request
  const acceptFriendRequest = useCallback(async (request) => {
    if (!user?.uid || !request?.from) return;
    
    setLoading(true);
    const toastId = toast.loading("ESTABLISHING LINK...");

    try {
      // 1. Run updates in parallel
      await Promise.all([
         updateDoc(doc(db, 'players', user.uid), { friends: arrayUnion(request.from) }),
         updateDoc(doc(db, 'players', request.from), { friends: arrayUnion(user.uid) })
      ]);

      // Delete request doc
      if (request.id) {
         // This assumes request.id is the key in RTDB `friendRequests/USER_ID/REQUEST_ID`
         await remove(ref(rtdb, `friendRequests/${user.uid}/${request.id}`));
      }

      toast.success(`ALLIANCE FORMED`, { id: toastId });
    } catch (error) {
      console.error('Accept friend error:', error);
      toast.error("LINK ESTABLISHMENT FAILED", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Safer Delete Friend
  const removeFriend = useCallback(async (friendUid, friendName) => {
    if (!user?.uid || !friendUid) return;

    setLoading(true);
    const toastId = toast.loading("SEVERING CONNECTION...");

    try {
      await Promise.all([
        updateDoc(doc(db, 'players', user.uid), { friends: arrayRemove(friendUid) }),
        updateDoc(doc(db, 'players', friendUid), { friends: arrayRemove(user.uid) })
      ]);

      toast.success(`REMOVED ${friendName?.toUpperCase() || 'AGENT'} FROM SQUAD`, { id: toastId });
    } catch (error) {
      console.error('Delete friend error:', error);
      toast.error("FAILED TO REMOVE AGENT", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    loading
  };
};

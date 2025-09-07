import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { characterClasses } from "@/config/characterClasses";
import { specialTreasures } from "@/config/specialTreasures";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";

const GameContext = createContext(null);

const initialGameState = {
  room: null,
  players: {},
  gamePhase: "menu",
  connectionError: null,
};

export function MultiplayerProvider({ children }) {
  const [gameState, setGameState] = useState(initialGameState);
  const { currentUser: authUser } = useAuth();
  const unsubscribeRoomRef = useRef(null);
  const hasTriedReconnectRef = useRef(false);

  const saveRoomId = useCallback((roomId) => {
    if (roomId) {
      localStorage.setItem("currentRoomId", roomId);
    } else {
      localStorage.removeItem("currentRoomId");
    }
  }, []);

  const getSavedRoomId = useCallback(() => {
    try {
      return localStorage.getItem("currentRoomId");
    } catch {
      return null;
    }
  }, []);

  const setupRealtimeListener = useCallback(
    (roomId) => {
      if (unsubscribeRoomRef.current) unsubscribeRoomRef.current();
      if (!roomId) return;

      const roomRef = doc(db, "rooms", roomId);
      unsubscribeRoomRef.current = onSnapshot(
        roomRef,
        (snap) => {
          if (!snap.exists()) {
            saveRoomId(null);
            setGameState(initialGameState);
            return;
          }
          const data = snap.data();
          const playersArray = Array.isArray(data.players) ? data.players : [];
          const playersObj = playersArray.reduce((acc, p) => {
            if (p && p.id) acc[p.id] = p;
            return acc;
          }, {});

          setGameState((prev) => ({
            ...prev,
            room: {
              id: roomId,
              inviteLink:
                data.inviteLink || `${window.location.origin}?room=${roomId}`,
              hostId: data.hostId,
              hostName: data.hostName,
              endGameProposal: data.endGameProposal || null,
            },
            players: playersObj,
            gamePhase: data.gamePhase || "lobby",
            connectionError: null,
          }));
        },
        (error) => {
          console.error("onSnapshot error:", error);
          setGameState((prev) => ({
            ...prev,
            connectionError: "Problema de conexão com a sala.",
          }));
        }
      );
    },
    [saveRoomId]
  );

  const joinRoom = useCallback(
    async (roomId) => {
      if (!authUser) return false;
      const roomRef = doc(db, "rooms", roomId);
      try {
        await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw new Error("Sala não encontrada");
          let playersList = roomDoc.data().players || [];
          if (!playersList.some((p) => p.id === authUser.uid)) {
            if (playersList.length >= 6) throw new Error("Sala cheia");
            let playerName = authUser.email;
            const userDocSnap = await getDoc(doc(db, "users", authUser.uid));
            if (userDocSnap.exists() && userDocSnap.data().displayName) {
              playerName = userDocSnap.data().displayName;
            }
            playersList.push({
              id: authUser.uid,
              name: playerName,
              color: `#${Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0")}`,
              isHost: false,
              ready: false,
              character: null,
              joinedAt: new Date().toISOString(),
              gold: 0,
              isWounded: false,
              inventory: [],
            });
            transaction.update(roomRef, { players: playersList });
          }
        });
        saveRoomId(roomId);
        setupRealtimeListener(roomId);
        return true;
      } catch (e) {
        console.error("Erro ao entrar na sala:", e.message);
        return false;
      }
    },
    [authUser, saveRoomId, setupRealtimeListener]
  );

  const attemptAutoReconnect = useCallback(async () => {
    if (!authUser || hasTriedReconnectRef.current) return;
    const savedRoomId = getSavedRoomId();
    if (savedRoomId) {
      hasTriedReconnectRef.current = true;
      const roomSnap = await getDoc(doc(db, "rooms", savedRoomId));
      if (roomSnap.exists()) await joinRoom(savedRoomId);
      else saveRoomId(null);
    }
  }, [authUser, getSavedRoomId, joinRoom, saveRoomId]);

  useEffect(() => {
    if (authUser && !gameState.room?.id) attemptAutoReconnect();
  }, [authUser, gameState.room?.id, attemptAutoReconnect]);

  const createRoom = async () => {
    if (!authUser) return;
    let playerName = authUser.email;
    const userDocSnap = await getDoc(doc(db, "users", authUser.uid));
    if (userDocSnap.exists() && userDocSnap.data().displayName) {
      playerName = userDocSnap.data().displayName;
    }
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newPlayer = {
      id: authUser.uid,
      name: playerName,
      color: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,
      isHost: true,
      ready: false,
      character: null,
      createdAt: new Date().toISOString(),
      gold: 0,
      isWounded: false,
      inventory: [],
    };
    await setDoc(doc(db, "rooms", roomId), {
      id: roomId,
      inviteLink: `${window.location.origin}?room=${roomId}`,
      hostId: newPlayer.id,
      hostName: newPlayer.name,
      createdAt: serverTimestamp(),
      players: [newPlayer],
      gamePhase: "lobby",
    });
    saveRoomId(roomId);
    setupRealtimeListener(roomId);
  };

  const runPlayerUpdateTransaction = async (updateLogic) => {
    const roomId = gameState.room?.id;
    if (!roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) throw new Error("Sala não encontrada!");
      transaction.update(roomRef, {
        players: updateLogic(roomDoc.data().players || []),
      });
    });
  };

  const updatePlayerStats = (playerId, newStats) => {
    runPlayerUpdateTransaction((players) =>
      players.map((p) => (p.id === playerId ? { ...p, ...newStats } : p))
    );
  };
  const addItemToInventory = (playerId, itemId) => {
    const item = specialTreasures.find((i) => i.id === itemId);
    if (!item) return;
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId
          ? { ...p, inventory: [...(p.inventory || []), item] }
          : p
      )
    );
  };
  const removeItemFromInventory = (playerId, itemIndex) => {
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId
          ? { ...p, inventory: p.inventory.filter((_, i) => i !== itemIndex) }
          : p
      )
    );
  };
  const backToMenu = async () => {
    const roomId = gameState.room?.id;
    if (authUser && roomId) {
      await runPlayerUpdateTransaction((players) => {
        const updated = players.filter((p) => p.id !== authUser.uid);
        if (
          updated.length > 0 &&
          players.find((p) => p.id === authUser.uid)?.isHost
        ) {
          updated[0].isHost = true;
        }
        return updated;
      });
    }
    saveRoomId(null);
    setGameState(initialGameState);
    if (unsubscribeRoomRef.current) unsubscribeRoomRef.current();
  };
  const goToJoinRoom = () =>
    setGameState((s) => ({ ...s, gamePhase: "joining" }));
  const goToProfile = () =>
    setGameState((s) => ({ ...s, gamePhase: "profile" }));
  const startGameSelection = () => updateRoomData({ gamePhase: "selection" });
  const startGame = () =>
    runPlayerUpdateTransaction((players) =>
      players.map((p) => ({ ...p, gold: 0, isWounded: false, inventory: [] }))
    ).then(() => updateRoomData({ gamePhase: "playing" }));
  const selectCharacterForPlayer = (playerId, character) =>
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId ? { ...p, character, ready: true } : p
      )
    );
  const unselectCharacter = (playerId) =>
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId ? { ...p, character: null, ready: false } : p
      )
    );
  const proposeEndGame = () =>
    updateRoomData({
      endGameProposal: {
        proposerId: authUser.uid,
        votes: { [authUser.uid]: "proposer" },
        status: "pending",
      },
    });
  const voteOnEndGame = (vote) =>
    updateRoomData({ [`endGameProposal.votes.${authUser.uid}`]: vote });
  const value = useMemo(
    () => ({
      gameState,
      currentUser: authUser ? gameState.players[authUser.uid] : null,
      createRoom,
      joinRoom,
      backToMenu,
      updatePlayerStats,
      addItemToInventory,
      removeItemFromInventory,
      goToJoinRoom,
      goToProfile,
      startGameSelection,
      startGame,
      selectCharacterForPlayer,
      unselectCharacter,
      proposeEndGame,
      voteOnEndGame,
    }),
    [gameState, authUser]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => useContext(GameContext);

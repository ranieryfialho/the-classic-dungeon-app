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

  // ===== ORDEM CORRIGIDA: FunÃ§Ãµes declaradas antes de serem usadas =====

  const setupRealtimeListener = useCallback(
    (roomId) => {
      if (unsubscribeRoomRef.current) {
        unsubscribeRoomRef.current();
      }
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
            connectionError: "Problema de conexÃ£o com a sala.",
          }));
        }
      );
    },
    [saveRoomId]
  );

  const joinRoom = useCallback(async (roomId) => {
    if (!authUser) return false;
    const roomRef = doc(db, "rooms", roomId);
    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw new Error("Sala nÃ£o encontrada");
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
            color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
            isHost: false,
            ready: false,
            character: null,
            joinedAt: new Date().toISOString(),
            gold: 0,
            isWounded: false,
            inventory: [],
            isGoldHidden: true, // ALTERAÇÃO: Ouro oculto por padrão
          });
          transaction.update(roomRef, { players: playersList });
        }
      });
      saveRoomId(roomId);
      setupRealtimeListener(roomId);
      return true;
    } catch (e) {
      console.error("Erro ao entrar na sala:", e.message);
      if (e.message === "Sala cheia") alert("A sala estÃ¡ cheia.");
      if (e.message === "Sala nÃ£o encontrada") alert("Sala nÃ£o encontrada.");
      return false;
    }
  }, [authUser, saveRoomId, setupRealtimeListener]
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
    if (!gameState.room?.id) {
      hasTriedReconnectRef.current = false;
    }
    if (authUser && !gameState.room?.id) {
      attemptAutoReconnect();
    }
  }, [authUser, gameState.room?.id, attemptAutoReconnect]);

  useEffect(() => {
    const roomId = gameState.room?.id;
    if (authUser && roomId) {
      setupRealtimeListener(roomId);
    }
    return () => {
      if (unsubscribeRoomRef.current) {
        unsubscribeRoomRef.current();
        unsubscribeRoomRef.current = null;
      }
    };
  }, [authUser, gameState.room?.id, setupRealtimeListener]);

  const runPlayerUpdateTransaction = useCallback(async (updateLogic) => {
    const roomId = gameState.room?.id;
    if (!roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) throw new Error("Sala nÃ£o encontrada!");
        const currentPlayers = roomDoc.data().players || [];
        const newPlayers = updateLogic(currentPlayers);
        transaction.update(roomRef, { players: newPlayers, lastUpdated: serverTimestamp() });
      });
    } catch (error) {
      console.error("Falha na transaÃ§Ã£o de atualizaÃ§Ã£o de jogador:", error);
    }
  }, [gameState.room?.id]);

  const updateRoomData = useCallback((updates) => {
    const roomId = gameState.room?.id;
    if (!roomId) return;
    return updateDoc(doc(db, "rooms", roomId), { ...updates, lastUpdated: serverTimestamp() });
  }, [gameState.room?.id]);

  const createRoom = useCallback(async () => {
    if (!authUser) return;
    let playerName = authUser.email;
    try {
      const userDocSnap = await getDoc(doc(db, "users", authUser.uid));
      if (userDocSnap.exists() && userDocSnap.data().displayName) {
        playerName = userDocSnap.data().displayName;
      }
    } catch (e) {
      console.error("Erro ao buscar nome do jogador:", e);
    }
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newPlayer = {
      id: authUser.uid,
      name: playerName,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
      isHost: true,
      ready: false,
      character: null,
      createdAt: new Date().toISOString(),
      gold: 0,
      isWounded: false,
      inventory: [],
      isGoldHidden: true, // ALTERAÇÃO: Ouro oculto por padrão
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
  }, [authUser, saveRoomId, setupRealtimeListener]);

  const removePlayer = useCallback((playerIdToRemove) => {
    const me = authUser ? gameState.players[authUser.uid] : null;
    if (!me || !me.isHost || me.id === playerIdToRemove) return;
    runPlayerUpdateTransaction((currentPlayers) =>
      currentPlayers.filter((p) => p.id !== playerIdToRemove)
    );
  }, [authUser, gameState.players, runPlayerUpdateTransaction]);

  const backToMenu = useCallback(async () => {
    const roomId = gameState.room?.id;
    if (authUser && roomId) {
      await runPlayerUpdateTransaction(players => {
        const updated = players.filter(p => p.id !== authUser.uid);
        if (updated.length > 0 && players.find(p => p.id === authUser.uid)?.isHost) {
          updated[0].isHost = true;
        }
        return updated;
      });
    }
    saveRoomId(null);
    setGameState(initialGameState);
    if (unsubscribeRoomRef.current) unsubscribeRoomRef.current();
  }, [authUser, gameState.room?.id, runPlayerUpdateTransaction, saveRoomId]);

  const goToJoinRoom = useCallback(() => setGameState((s) => ({ ...s, gamePhase: "joining" })), []);
  const goToProfile = useCallback(() => setGameState((s) => ({ ...s, gamePhase: "profile" })), []);
  const startGameSelection = useCallback(() => updateRoomData({ gamePhase: "selection" }), [updateRoomData]);

  const startGame = useCallback(() => runPlayerUpdateTransaction(players => players.map(p => ({
    ...p,
    gold: 0,
    isWounded: false,
    inventory: []
  })))
    .then(() => updateRoomData({ gamePhase: "playing" })), [runPlayerUpdateTransaction, updateRoomData]);

  const selectCharacterForPlayer = useCallback((playerId, character) => runPlayerUpdateTransaction(players => players.map(p => p.id === playerId ? { ...p, character, ready: true } : p)), [runPlayerUpdateTransaction]);
  const unselectCharacter = useCallback((playerId) => runPlayerUpdateTransaction(players => players.map(p => p.id === playerId ? { ...p, character: null, ready: false } : p)), [runPlayerUpdateTransaction]);

  const updatePlayerStats = useCallback((playerId, newStats) => {
    runPlayerUpdateTransaction((players) =>
      players.map((p) => (p.id === playerId ? { ...p, ...newStats } : p))
    );
  }, [runPlayerUpdateTransaction]);

  const addItemToInventory = useCallback((playerId, itemId) => {
    const item = specialTreasures.find((i) => i.id === itemId);
    if (!item) return;
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId ? { ...p, inventory: [...(p.inventory || []), item] } : p
      )
    );
  }, [runPlayerUpdateTransaction]);

  const removeItemFromInventory = useCallback((playerId, itemIndex) => {
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId
          ? { ...p, inventory: p.inventory.filter((_, i) => i !== itemIndex) }
          : p
      )
    );
  }, [runPlayerUpdateTransaction]);

  const proposeEndGame = useCallback(() => updateRoomData({ endGameProposal: { proposerId: authUser.uid, votes: { [authUser.uid]: 'proposer' }, status: 'pending' } }), [authUser, updateRoomData]);
  const voteOnEndGame = useCallback((vote) => updateRoomData({ [`endGameProposal.votes.${authUser.uid}`]: vote }), [authUser, updateRoomData]);

  const endGameAndSaveHistory = useCallback(async () => {
    const { players, room } = gameState;
    const playerList = Object.values(players);
    if (playerList.length === 0) return;

    const winner = playerList.reduce((a, b) => (Number(a.gold || 0) > Number(b.gold || 0) ? a : b));
    const playersSnapshot = playerList.map((p) => ({
      userId: p.id,
      playerName: p.name,
      characterName: p.character?.name || null,
      characterClass: p.character?.className || null,
      gold: Number(p.gold || 0),
      inventory: (p.inventory || []).map((i) => ({ id: i.id, name: i.name })),
    }));

    await addDoc(collection(db, "matches"), {
      roomId: room.id,
      winnerId: winner.id,
      winnerName: winner.name,
      endedAt: serverTimestamp(),
      players: playersSnapshot,
    });
    await deleteDoc(doc(db, "rooms", room.id));
    saveRoomId(null);
    setGameState(initialGameState);
  }, [gameState, saveRoomId]);

  const processEndGameVotes = useCallback(async () => {
    const { room, players } = gameState;
    const proposal = room?.endGameProposal;
    const me = authUser ? players[authUser.uid] : null;
    if (!proposal || room.gamePhase === 'ending' || !me?.isHost || proposal.status !== 'pending') return;

    const playerIds = Object.keys(players);
    const voterIds = playerIds.filter((id) => id !== proposal.proposerId);
    const votes = Object.keys(proposal.votes);
    const hasEveryoneVoted = voterIds.every((id) => votes.includes(id));

    if (hasEveryoneVoted) {
      const hasRejection = Object.values(proposal.votes).includes("reject");
      if (hasRejection) {
        await updateRoomData({ endGameProposal: null });
      } else {
        await updateRoomData({ gamePhase: 'ending' });
        await endGameAndSaveHistory();
      }
    }
  }, [gameState, authUser, updateRoomData, endGameAndSaveHistory]);

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
      processEndGameVotes,
      removePlayer
    }),
    [gameState, authUser, createRoom, joinRoom, backToMenu, updatePlayerStats, addItemToInventory, removeItemFromInventory, goToJoinRoom, goToProfile, startGameSelection, startGame, selectCharacterForPlayer, unselectCharacter, proposeEndGame, voteOnEndGame, processEndGameVotes, removePlayer]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => useContext(GameContext);
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
  runTransaction, // Importação da função de transação
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
  const isListeningRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const currentRoomIdRef = useRef(null);
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

  // A função joinRoom já está sendo usada aqui, e ela será refatorada abaixo
  const attemptAutoReconnect = useCallback(async () => {
    if (!authUser) return;

    const savedRoomId = getSavedRoomId();
    if (!savedRoomId) return;

    console.log(
      "[v1] Tentando reconectar automaticamente à sala:",
      savedRoomId
    );

    try {
      const roomRef = doc(db, "rooms", savedRoomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const success = await joinRoom(savedRoomId);
        if (success) {
          console.log("[v1] Reconexão automática bem-sucedida");
          hasTriedReconnectRef.current = true;
        } else {
          console.log("[v1] Falha na reconexão automática");
          saveRoomId(null);
        }
      } else {
        console.log("[v1] Sala salva não existe mais");
        saveRoomId(null);
      }
    } catch (error) {
      console.error("[v1] Erro na reconexão automática:", error);
      saveRoomId(null);
    }
  }, [authUser, getSavedRoomId, saveRoomId]);

  useEffect(() => {
    if (!authUser || !gameState.room?.id) {
      hasTriedReconnectRef.current = false;
    }
  }, [authUser, gameState.room?.id]);

  useEffect(() => {
    if (authUser && !gameState.room?.id && !hasTriedReconnectRef.current) {
      attemptAutoReconnect();
    }
  }, [authUser, gameState.room?.id, attemptAutoReconnect]);

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
            connectionError: "Connection problem",
          }));
        }
      );
    },
    [saveRoomId]
  );

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

  // ————————————————————————————————————————
  // Utilitários
  // ————————————————————————————————————————
  const updateRoomData = (updates) => {
    const roomId = gameState.room?.id || currentRoomIdRef.current;
    if (!roomId) return;
    return updateDoc(doc(db, "rooms", roomId), {
      ...updates,
      lastUpdated: serverTimestamp(),
    });
  };

  // NOVA FUNÇÃO AUXILIAR PARA TRANSAÇÕES
  const runPlayerUpdateTransaction = async (updateLogic) => {
    const roomId = gameState.room?.id;
    if (!roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
          throw new Error("Sala não encontrada!");
        }
        const currentPlayers = roomDoc.data().players || [];
        const newPlayers = updateLogic(currentPlayers);
        transaction.update(roomRef, {
          players: newPlayers,
          lastUpdated: serverTimestamp(),
        });
      });
    } catch (error) {
      console.error("Falha na transação de atualização de jogador:", error);
    }
  };

  const removePlayer = async (playerIdToRemove) => {
    const me = authUser ? gameState.players[authUser.uid] : null;
    if (!me || !me.isHost || me.id === playerIdToRemove) return;

    await runPlayerUpdateTransaction((currentPlayers) =>
      currentPlayers.filter((p) => p.id !== playerIdToRemove)
    );
  };

  // ————————————————————————————————————————
  // Criação / Entrada em Sala
  // ————————————————————————————————————————
  const createRoom = async () => {
    if (!authUser) return;

    let playerName = authUser.email;
    try {
      const userDocRef = doc(db, "users", authUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data().displayName) {
        playerName = userDocSnap.data().displayName;
      }
    } catch (e) {
      console.error("Erro ao buscar nome do jogador:", e);
    }

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteLink = `${window.location.origin}?room=${roomId}`;

    const initialPlayer = {
      id: authUser.uid,
      name: playerName,
      color:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
      isHost: true,
      ready: false,
      character: null,
      createdAt: new Date().toISOString(),
      gold: 0,
      isWounded: false,
      isGoldHidden: false,
      inventory: [],
    };

    const roomData = {
      id: roomId,
      inviteLink,
      hostId: initialPlayer.id,
      hostName: initialPlayer.name,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      players: [initialPlayer],
      gamePhase: "lobby",
    };

    try {
      await setDoc(doc(db, "rooms", roomId), roomData);
      saveRoomId(roomId);
      // A sincronização será feita pelo listener
    } catch (e) {
      console.error("[useMultiplayerGame] createRoom error:", e);
      alert("Erro ao criar sala. Tente novamente.");
    }
  };

  const joinRoom = async (roomId) => {
    if (!authUser) return false;
    const roomRef = doc(db, "rooms", roomId);

    try {
      let playerWasAdded = false;
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
          throw new Error("Sala não encontrada");
        }

        let playersList = roomDoc.data().players || [];
        const playerExists = playersList.some((p) => p.id === authUser.uid);

        if (!playerExists) {
          if (playersList.length >= 6) {
            throw new Error("Sala cheia");
          }

          let playerName = authUser.email;
          const userDocRef = doc(db, "users", authUser.uid);
          const userDocSnap = await getDoc(userDocRef); // Não pode ser transaction.get pois é outra coleção
          if (userDocSnap.exists() && userDocSnap.data().displayName) {
            playerName = userDocSnap.data().displayName;
          }

          const newPlayer = {
            id: authUser.uid,
            name: playerName,
            color:
              "#" +
              Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0"),
            isHost: false,
            ready: false,
            character: null,
            joinedAt: new Date().toISOString(),
            gold: 0,
            isWounded: false,
            isGoldHidden: false,
            inventory: [],
          };
          playersList.push(newPlayer);
          transaction.update(roomRef, { players: playersList });
          playerWasAdded = true;
        }
      });

      saveRoomId(roomId);
      setupRealtimeListener(roomId); // Garante que o listener seja ativado
      return true;
    } catch (e) {
      console.error("[useMultiplayerGame] joinRoom error:", e);
      if (e.message === "Sala cheia") alert("A sala está cheia.");
      if (e.message === "Sala não encontrada") alert("Sala não encontrada.");
      return false;
    }
  };

  // ————————————————————————————————————————
  // Fases de jogo
  // ————————————————————————————————————————
  const goToJoinRoom = () =>
    setGameState((s) => ({ ...s, gamePhase: "joining" }));
  const goToProfile = () =>
    setGameState((s) => ({ ...s, gamePhase: "profile" }));

  const startGameSelection = async () => {
    await updateRoomData({ gamePhase: "selection" });
  };

  const startGame = async () => {
    await runPlayerUpdateTransaction((currentPlayers) =>
      currentPlayers.map((p) => ({
        ...p,
        gold: 0,
        isWounded: false,
        isGoldHidden: false,
        inventory: Array.isArray(p.inventory) ? p.inventory : [],
      }))
    );
    await updateRoomData({ gamePhase: "playing" });
  };

  // ————————————————————————————————————————
  // Ações de jogador (sempre persistindo no Firestore)
  // ————————————————————————————————————————
  const selectCharacterForPlayer = (playerId, characterData) => {
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId ? { ...p, character: characterData, ready: true } : p
      )
    );
  };

  const unselectCharacter = (playerId) => {
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId ? { ...p, character: null, ready: false } : p
      )
    );
  };

  const updatePlayerStats = (playerId, newStats) => {
    runPlayerUpdateTransaction((players) =>
      players.map((p) =>
        p.id === playerId
          ? { ...p, ...newStats, lastStatsUpdate: new Date().toISOString() }
          : p
      )
    );
  };

  const addItemToInventory = (playerId, itemId) => {
    const item = specialTreasures.find((i) => i.id === itemId);
    if (!item) return;

    runPlayerUpdateTransaction((players) =>
      players.map((p) => {
        if (p.id !== playerId) return p;
        const inv = Array.isArray(p.inventory) ? p.inventory : [];
        return { ...p, inventory: [...inv, item] };
      })
    );
  };

  const removeItemFromInventory = (playerId, itemIndex) => {
    runPlayerUpdateTransaction((players) =>
      players.map((p) => {
        if (p.id !== playerId) return p;
        const inv = Array.isArray(p.inventory) ? p.inventory : [];
        return { ...p, inventory: inv.filter((_, idx) => idx !== itemIndex) };
      })
    );
  };

  // ————————————————————————————————————————
  // Proposta / votação de fim de jogo
  // ————————————————————————————————————————
  const proposeEndGame = async () => {
    const me = authUser ? gameState.players[authUser.uid] : null;
    if (!me) return;
    const proposal = {
      proposerId: me.id,
      proposerName: me.name,
      votes: { [me.id]: "proposer" },
      status: "pending",
      createdAt: serverTimestamp(),
    };
    await updateRoomData({ endGameProposal: proposal });
  };

  const voteOnEndGame = async (vote) => {
    const roomId = gameState.room?.id;
    if (!roomId || !authUser) return;

    const path = `endGameProposal.votes.${authUser.uid}`;
    await updateDoc(doc(db, "rooms", roomId), {
      [path]: vote,
      lastUpdated: serverTimestamp(),
    });
  };

  const processEndGameVotes = async () => {
    const { room, players } = gameState;
    const proposal = room?.endGameProposal;
    const me = authUser ? players[authUser.uid] : null;

    if (
      !proposal ||
      room.gamePhase === "ending" ||
      !me?.isHost ||
      proposal.status !== "pending"
    ) {
      return;
    }

    const playerIds = Object.keys(players);
    const voterIds = playerIds.filter((id) => id !== proposal.proposerId);
    const votes = Object.keys(proposal.votes);
    const hasEveryoneVoted = voterIds.every((id) => votes.includes(id));

    if (hasEveryoneVoted) {
      const hasRejection = Object.values(proposal.votes).includes("reject");
      const roomRef = doc(db, "rooms", room.id);

      if (hasRejection) {
        console.log("Proposta rejeitada! Resetando votação.");
        await updateDoc(roomRef, { endGameProposal: null });
      } else {
        console.log("Proposta aceita! Finalizando o jogo.");
        await updateDoc(roomRef, { gamePhase: "ending" });
        await endGameAndSaveHistory();
      }
    }
  };

  const endGameAndSaveHistory = async () => {
    const { players, room } = gameState;
    const playerList = Object.values(players);
    if (playerList.length === 0) return;

    const proposer = room?.endGameProposal
      ? players[room.endGameProposal.proposerId]
      : null;
    let winner = null;

    if (proposer?.character?.className) {
      const proposerClass = characterClasses.find(
        (c) => c.name === proposer.character.className
      );
      if (proposerClass && (proposer.gold ?? 0) >= proposerClass.goldTarget) {
        winner = proposer;
      }
    }
    if (!winner) {
      winner = playerList.reduce((a, b) =>
        Number(a.gold || 0) > Number(b.gold || 0) ? a : b
      );
    }

    const playersSnapshot = playerList.map((p) => ({
      userId: p.id,
      playerName: p.name,
      characterName: p.character?.name || null,
      characterClass: p.character?.className || null,
      gold: Number(p.gold || 0),
      inventory: (p.inventory || []).map((i) => ({ id: i.id, name: i.name })),
    }));

    try {
      await addDoc(collection(db, "matches"), {
        roomId: room.id,
        winnerId: winner.id,
        winnerName: winner.name,
        endedAt: serverTimestamp(),
        playerCount: playerList.length,
        players: playersSnapshot,
        playerIds: playerList.map((p) => p.id),
      });
      await deleteDoc(doc(db, "rooms", room.id));
    } catch (e) {
      console.error("[useMultiplayerGame] endGameAndSaveHistory error:", e);
    }

    saveRoomId(null);
    setGameState(initialGameState);
  };

  // ————————————————————————————————————————
  // Sair/voltar ao menu (limpa presença e sala se for o último)
  // ————————————————————————————————————————
  const backToMenu = async () => {
    const roomId = gameState.room?.id;
    if (!authUser || !roomId) {
      saveRoomId(null);
      hasTriedReconnectRef.current = false;
      setGameState(initialGameState);
      return;
    }

    const roomRef = doc(db, "rooms", roomId);
    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) return; // A sala já foi removida

        const players = roomDoc.data().players || [];
        const updatedPlayers = players.filter((p) => p.id !== authUser.uid);

        if (updatedPlayers.length === 0) {
          transaction.delete(roomRef);
        } else {
          // Se o host sair, elege um novo host (o jogador mais antigo)
          const isHostLeaving = players.find(
            (p) => p.id === authUser.uid
          )?.isHost;
          if (isHostLeaving) {
            updatedPlayers.sort(
              (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
            );
            updatedPlayers[0].isHost = true;
          }
          transaction.update(roomRef, {
            players: updatedPlayers,
            lastUpdated: serverTimestamp(),
          });
        }
      });
    } catch (e) {
      console.error("[useMultiplayerGame] backToMenu transaction error:", e);
    }

    saveRoomId(null);
    hasTriedReconnectRef.current = false;
    setGameState(initialGameState);
  };

  // ————————————————————————————————————————
  // Context value
  // ————————————————————————————————————————
  const value = useMemo(
    () => ({
      gameState,
      setGameState,
      currentUser: authUser ? gameState.players[authUser.uid] : null,

      goToJoinRoom,
      goToProfile,
      backToMenu,

      createRoom,
      joinRoom,
      removePlayer,

      startGameSelection,
      startGame,

      selectCharacterForPlayer,
      unselectCharacter,
      updatePlayerStats,
      addItemToInventory,
      removeItemFromInventory,

      proposeEndGame,
      voteOnEndGame,
      endGameAndSaveHistory,
      processEndGameVotes,

      isConnected: !gameState.connectionError,
      connectionError: gameState.connectionError,
    }),
    [gameState, authUser]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => useContext(GameContext);
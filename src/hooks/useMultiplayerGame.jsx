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
  query,
  orderBy,
  limit,
} from "firebase/firestore";

const GameContext = createContext(null);

const initialGameState = {
  room: null,
  players: {},
  gamePhase: "menu",
  connectionError: null,
  log: [], // Adicionado para o log de eventos
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

  const addLogEntry = useCallback(
    async (message) => {
      const roomId = getSavedRoomId();
      if (!roomId) return;
      try {
        const logCollectionRef = collection(db, "rooms", roomId, "log");
        await addDoc(logCollectionRef, {
          message,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("Erro ao adicionar entrada no log:", error);
      }
    },
    [getSavedRoomId]
  );

  const setupRealtimeListener = useCallback(
    (roomId) => {
      if (unsubscribeRoomRef.current) {
        unsubscribeRoomRef.current();
      }
      if (!roomId) return;

      const roomRef = doc(db, "rooms", roomId);
      const roomUnsubscribe = onSnapshot(
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
              turnOrder: data.turnOrder || [],
              currentTurnPlayerId: data.currentTurnPlayerId || null,
              turnRolls: data.turnRolls || {},
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

      const logCollectionRef = collection(db, "rooms", roomId, "log");
      const logQuery = query(
        logCollectionRef,
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const logUnsubscribe = onSnapshot(logQuery, (snapshot) => {
        const logEntries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGameState((prev) => ({ ...prev, log: logEntries }));
      });

      unsubscribeRoomRef.current = () => {
        roomUnsubscribe();
        logUnsubscribe();
      };
    },
    [saveRoomId]
  );

  const runPlayerUpdateTransaction = useCallback(
    async (updateLogic) => {
      const roomId = gameState.room?.id;
      if (!roomId) return;
      const roomRef = doc(db, "rooms", roomId);
      try {
        await runTransaction(db, async (transaction) => {
          const roomDoc = await transaction.get(roomRef);
          if (!roomDoc.exists()) throw new Error("Sala não encontrada!");
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
    },
    [gameState.room?.id]
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
              isGoldHidden: true,
              woundType: null,
              turnsToSkip: 0,
              isDead: false,
              spells: [],
            });
            transaction.update(roomRef, { players: playersList });
          }
        });
        saveRoomId(roomId);
        setupRealtimeListener(roomId);
        return true;
      } catch (e) {
        console.error("Erro ao entrar na sala:", e.message);
        if (e.message === "Sala cheia") alert("A sala está cheia.");
        if (e.message === "Sala não encontrada") alert("Sala não encontrada.");
        return false;
      }
    },
    [authUser, saveRoomId, setupRealtimeListener]
  );

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
      woundType: null,
      turnsToSkip: 0,
      isDead: false,
      spells: [],
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

  const updateRoomData = useCallback(
    (updates) => {
      const roomId = gameState.room?.id;
      if (!roomId) return;
      return updateDoc(doc(db, "rooms", roomId), {
        ...updates,
        lastUpdated: serverTimestamp(),
      });
    },
    [gameState.room?.id]
  );

  const updatePlayerStats = useCallback(
    (playerId, newStats) => {
      runPlayerUpdateTransaction((players) =>
        players.map((p) => (p.id === playerId ? { ...p, ...newStats } : p))
      );
    },
    [runPlayerUpdateTransaction]
  );

  const passTurn = useCallback(async () => {
    const { room, players } = gameState;
    if (
      !room ||
      !room.currentTurnPlayerId ||
      !room.turnOrder ||
      room.turnOrder.length === 0
    )
      return;

    const currentTurnOrder = room.turnOrder;
    const currentPlayerId = room.currentTurnPlayerId;
    const currentPlayerIndex = currentTurnOrder.indexOf(currentPlayerId);

    const currentPlayer = players[currentPlayerId];
    if (currentPlayer) {
      addLogEntry(`➡️ ${currentPlayer.character.name} finalizou o seu turno.`);
    }

    const updatedPlayers = { ...players };
    const dbUpdates = {};

    let nextPlayerIndex = (currentPlayerIndex + 1) % currentTurnOrder.length;

    for (let i = 0; i < currentTurnOrder.length; i++) {
      const candidateId = currentTurnOrder[nextPlayerIndex];
      const candidatePlayer = updatedPlayers[candidateId];

      if (!candidatePlayer || candidatePlayer.isDead) {
        nextPlayerIndex = (nextPlayerIndex + 1) % currentTurnOrder.length;
        continue;
      }

      if (candidatePlayer.turnsToSkip > 0) {
        const newTurnsToSkip = candidatePlayer.turnsToSkip - 1;
        dbUpdates[candidateId] = { turnsToSkip: newTurnsToSkip };
        updatedPlayers[candidateId] = {
          ...candidatePlayer,
          turnsToSkip: newTurnsToSkip,
        };
        addLogEntry(
          `⏳ ${candidatePlayer.character.name} continua preso e perde o turno.`
        );
        nextPlayerIndex = (nextPlayerIndex + 1) % currentTurnOrder.length;
        continue;
      }

      break;
    }

    const nextPlayerId = currentTurnOrder[nextPlayerIndex];

    if (Object.keys(dbUpdates).length > 0) {
      await runPlayerUpdateTransaction((currentPlayers) => {
        return currentPlayers.map((p) => {
          if (dbUpdates[p.id]) {
            return { ...p, ...dbUpdates[p.id] };
          }
          return p;
        });
      });
    }

    updateRoomData({ currentTurnPlayerId: nextPlayerId });
  }, [gameState, runPlayerUpdateTransaction, updateRoomData, addLogEntry]);

  const backToMenu = useCallback(async () => {
    const roomId = gameState.room?.id;
    if (!authUser || !roomId) return;

    const roomRef = doc(db, "rooms", roomId);

    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
          return;
        }

        const currentPlayers = roomDoc.data().players || [];
        const updatedPlayers = currentPlayers.filter((p) => p.id !== authUser.uid);

        if (updatedPlayers.length === 0) {
          transaction.delete(roomRef);
        } else {
          const wasHost = currentPlayers.find((p) => p.id === authUser.uid)?.isHost;
          if (wasHost) {
            updatedPlayers[0].isHost = true;
          }
          transaction.update(roomRef, { players: updatedPlayers });
        }
      });
    } catch (error) {
      console.error("Erro ao sair e limpar a sala:", error);
    } finally {
      saveRoomId(null);
      setGameState(initialGameState);
      if (unsubscribeRoomRef.current) unsubscribeRoomRef.current();
    }
  }, [authUser, gameState.room?.id, runPlayerUpdateTransaction, saveRoomId]);

  const setPlayerSkipTurns = useCallback(
    (playerId, turns) => {
      const player = gameState.players[playerId];
      if (player) {
        addLogEntry(
          `⛓️ ${player.character.name} caiu em uma jaula e ficará ${turns} turno(s) sem jogar.`
        );
      }
      updatePlayerStats(playerId, { turnsToSkip: turns });
    },
    [updatePlayerStats, addLogEntry, gameState.players]
  );

  const killPlayer = useCallback(
    (playerId) => {
      const player = gameState.players[playerId];
      if (player) {
        addLogEntry(
          `💀 ${player.character.name} foi derrotado e perdeu todos os seus tesouros.`
        );
      }
      updatePlayerStats(playerId, {
        isDead: true,
        isWounded: false,
        isStunned: false,
        inventory: [],
        gold: 0,
        woundType: null,
        turnsToSkip: 0,
      });
      setTimeout(() => {
        updatePlayerStats(playerId, { isDead: false });
      }, 5000);
    },
    [updatePlayerStats, addLogEntry, gameState.players]
  );

  const warriorSurvives = useCallback(
    (playerId) => {
      const player = gameState.players[playerId];
      if (player) {
        addLogEntry(
          `🛡️ ${player.character.name} usou Fôlego de Batalha e sobreviveu por um triz!`
        );
      }
      updatePlayerStats(playerId, {
        isWounded: true,
        woundType: "leve",
        turnsToSkip: 1,
        isDead: false,
        isStunned: false,
      });
    },
    [updatePlayerStats, addLogEntry, gameState.players]
  );

  const setPlayerSpells = useCallback(
    (playerId, spells) => {
      addLogEntry(
        `📖 ${gameState.players[playerId]?.character.name} preparou suas magias.`
      );
      updatePlayerStats(playerId, { spells });
    },
    [updatePlayerStats, addLogEntry, gameState.players]
  );

  const toggleSpellState = useCallback(
    (playerId, spellIndex) => {
      runPlayerUpdateTransaction((players) =>
        players.map((p) => {
          if (p.id === playerId) {
            const newSpells = [...p.spells];
            if (newSpells[spellIndex]) {
              const spell = newSpells[spellIndex];
              spell.used = !spell.used;
              if (spell.used) {
                addLogEntry(`✨ ${p.character.name} usou ${spell.name}!`);
              }
            }
            return { ...p, spells: newSpells };
          }
          return p;
        })
      );
    },
    [runPlayerUpdateTransaction, addLogEntry]
  );

  const removePlayer = useCallback(
    (playerIdToRemove) => {
      const me = authUser ? gameState.players[authUser.uid] : null;
      if (!me || !me.isHost || me.id === playerIdToRemove) return;
      const removedPlayerName =
        gameState.players[playerIdToRemove]?.name || "um jogador";
      addLogEntry(`👋 ${removedPlayerName} foi removido da sala.`);
      runPlayerUpdateTransaction((currentPlayers) =>
        currentPlayers.filter((p) => p.id !== playerIdToRemove)
      );
    },
    [authUser, gameState.players, runPlayerUpdateTransaction, addLogEntry]
  );

  const goToJoinRoom = useCallback(
    () => setGameState((s) => ({ ...s, gamePhase: "joining" })),
    []
  );
  const goToProfile = useCallback(
    () => setGameState((s) => ({ ...s, gamePhase: "profile" })),
    []
  );
  const startGameSelection = useCallback(() => {
    addLogEntry("⚔️ O Host iniciou a seleção de personagens!");
    updateRoomData({ gamePhase: "selection" });
  }, [updateRoomData, addLogEntry]);

  const beginTurnRoll = useCallback(() => {
    addLogEntry(
      "🎲 Todos estão prontos! Rolando dados para a ordem de turno..."
    );
    runPlayerUpdateTransaction((players) =>
      players.map((p) => ({
        ...p,
        gold: 0,
        isWounded: false,
        inventory: [],
        spells: [],
        turnsToSkip: 0,
      }))
    ).then(() => {
      updateRoomData({
        gamePhase: "rollingForTurn",
        turnRolls: {},
      });
    });
  }, [runPlayerUpdateTransaction, updateRoomData, addLogEntry]);

  const submitTurnRoll = useCallback(
    (playerId, roll) => {
      const player = gameState.players[playerId];
      if (player) {
        addLogEntry(`🎲 ${player.name} rolou um ${roll}.`);
      }
      updateRoomData({
        [`turnRolls.${playerId}`]: roll,
      });
    },
    [updateRoomData, addLogEntry, gameState.players]
  );

  const finalizeTurnOrder = useCallback(
    (sortedPlayerIds) => {
      addLogEntry("📜 A ordem de turno foi definida!");
      updateRoomData({
        gamePhase: "playing",
        turnOrder: sortedPlayerIds,
        currentTurnPlayerId: sortedPlayerIds[0],
      });
    },
    [updateRoomData, addLogEntry]
  );

  const selectCharacterForPlayer = useCallback(
    (playerId, character) => {
      addLogEntry(
        `👤 ${gameState.players[playerId]?.name} escolheu ser ${character.name}, o ${character.className}.`
      );
      runPlayerUpdateTransaction((players) =>
        players.map((p) =>
          p.id === playerId ? { ...p, character, ready: true } : p
        )
      );
    },
    [runPlayerUpdateTransaction, addLogEntry, gameState.players]
  );
  const unselectCharacter = useCallback(
    (playerId) => {
      const player = gameState.players[playerId];
      if (player && player.character) {
        addLogEntry(
          `🔄 ${player.name} mudou de ideia e desmarcou ${player.character.name}.`
        );
      }
      runPlayerUpdateTransaction((players) =>
        players.map((p) =>
          p.id === playerId ? { ...p, character: null, ready: false } : p
        )
      );
    },
    [runPlayerUpdateTransaction, addLogEntry, gameState.players]
  );
  const addItemToInventory = useCallback(
    (playerId, itemId) => {
      const item = specialTreasures.find((i) => i.id === itemId);
      if (!item) return;
      const player = gameState.players[playerId];
      if (player) {
        addLogEntry(
          `💎 ${player.character.name} encontrou um item: ${item.name}!`
        );
      }
      runPlayerUpdateTransaction((players) =>
        players.map((p) =>
          p.id === playerId
            ? { ...p, inventory: [...(p.inventory || []), item] }
            : p
        )
      );
    },
    [runPlayerUpdateTransaction, addLogEntry, gameState.players]
  );

  const removeItemFromInventory = useCallback(
    (playerId, itemIndex) => {
      const player = gameState.players[playerId];
      const item = player?.inventory[itemIndex];
      if (player && item) {
        addLogEntry(`🗑️ ${player.character.name} descartou ${item.name}.`);
      }
      runPlayerUpdateTransaction((players) =>
        players.map((p) =>
          p.id === playerId
            ? { ...p, inventory: p.inventory.filter((_, i) => i !== itemIndex) }
            : p
        )
      );
    },
    [runPlayerUpdateTransaction, addLogEntry, gameState.players]
  );

  const stealItemFromPlayer = useCallback(
    (thiefId, targetId, item, itemIndex) => {
      const thief = gameState.players[thiefId];
      const target = gameState.players[targetId];
      if (thief && target) {
        addLogEntry(
          `🗡️ ${thief.character.name} roubou ${item.name} de ${target.character.name}!`
        );
      }
      runPlayerUpdateTransaction((players) =>
        players.map((p) => {
          if (p.id === thiefId) {
            return { ...p, inventory: [...(p.inventory || []), item] };
          }
          if (p.id === targetId) {
            return {
              ...p,
              inventory: p.inventory.filter((_, i) => i !== itemIndex),
            };
          }
          return p;
        })
      );
    },
    [runPlayerUpdateTransaction, addLogEntry, gameState.players]
  );

  const stealGoldFromPlayer = useCallback(
    (thiefId, targetId, amount) => {
      const thief = gameState.players[thiefId];
      const target = gameState.players[targetId];
      if (thief && target) {
        addLogEntry(
          `💰 ${thief.character.name} roubou ${amount.toLocaleString(
            "pt-BR"
          )} de ouro de ${target.character.name}!`
        );
      }
      runPlayerUpdateTransaction((players) =>
        players.map((p) => {
          if (p.id === thiefId) {
            return { ...p, gold: (p.gold || 0) + amount };
          }
          if (p.id === targetId) {
            return { ...p, gold: Math.max(0, (p.gold || 0) - amount) };
          }
          return p;
        })
      );
    },
    [runPlayerUpdateTransaction, addLogEntry, gameState.players]
  );

  const addGoldBonus = useCallback(
    (playerId, amount) => {
      runPlayerUpdateTransaction((players) =>
        players.map((p) => {
          if (p.id === playerId) {
            return { ...p, gold: (p.gold || 0) + amount };
          }
          return p;
        })
      );
    },
    [runPlayerUpdateTransaction]
  );

  const proposeEndGame = useCallback(() => {
    const currentPlayer = gameState.players[authUser.uid];
    if (!currentPlayer) return;

    addLogEntry(`🏁 ${currentPlayer.name} propôs o fim do jogo!`);
    updateRoomData({
      endGameProposal: {
        proposerId: authUser.uid,
        votes: { [authUser.uid]: "proposer" },
        status: "pending",
      },
    });
  }, [authUser, gameState, updateRoomData, addLogEntry]);
  
  const voteOnEndGame = useCallback(
    (vote) => {
      const currentPlayer = gameState.players[authUser.uid];
      if (!currentPlayer) return;

      const voteText = vote === "accept" ? "aceitou" : "rejeitou";
      addLogEntry(`🗳️ ${currentPlayer.name} ${voteText} o fim do jogo.`);
      updateRoomData({ [`endGameProposal.votes.${authUser.uid}`]: vote });
    },
    [authUser, gameState, updateRoomData, addLogEntry]
  );

  const endGameAndSaveHistory = useCallback(async () => {
    const { room, players } = gameState;
    if (!room || !players) return;

    const playerList = Object.values(players);
    const winner = playerList.reduce((prev, current) => {
      if (current.gold > prev.gold) return current;
      if (
        current.gold === prev.gold &&
        current.id === room.endGameProposal.proposerId
      )
        return current;
      return prev;
    });

    addLogEntry(
      `🏆 O jogo terminou! O vencedor é ${
        winner.name
      } com ${winner.gold.toLocaleString("pt-BR")} de ouro!`
    );

    const matchData = {
      roomId: room.id,
      winnerId: winner.id,
      winnerName: winner.name,
      endedAt: serverTimestamp(),
      playerIds: playerList.map((p) => p.id),
      players: playerList.map((p) => ({
        userId: p.id,
        playerName: p.name,
        characterClass: p.character.className,
        gold: p.gold,
      })),
    };

    try {
      const matchesCollectionRef = collection(db, "matches");
      await addDoc(matchesCollectionRef, matchData);

      const roomRef = doc(db, "rooms", room.id);
      await deleteDoc(roomRef);
    } catch (error) {
      console.error("Erro ao salvar histórico e finalizar o jogo:", error);
    } finally {
      saveRoomId(null);
      setGameState(initialGameState);
      if (unsubscribeRoomRef.current) unsubscribeRoomRef.current();
    }
  }, [gameState, saveRoomId, addLogEntry]);

  const processEndGameVotes = useCallback(async () => {
    const { room, players } = gameState;
    const proposal = room?.endGameProposal;
    const currentPlayer = authUser ? players[authUser.uid] : null;

    if (!proposal || proposal.status !== 'pending' || !currentPlayer || !currentPlayer.isHost) {
      return;
    }

    const votes = proposal.votes || {};
    const totalPlayers = Object.keys(players).length;
    const rejectVotes = Object.values(votes).filter(v => v === 'reject').length;
    
    if (rejectVotes > 0) {
      addLogEntry("🚫 A proposta para finalizar o jogo foi rejeitada. A aventura continua!");
      await updateRoomData({
        endGameProposal: { ...proposal, status: 'rejected' },
      });
      setTimeout(() => updateRoomData({ endGameProposal: null }), 5000);
      return;
    }
    
    const requiredAccepts = totalPlayers - 1;
    const acceptVotes = Object.values(votes).filter(v => v === 'accept').length;

    if (acceptVotes >= requiredAccepts) {
      await updateRoomData({
        'endGameProposal.status': 'finished'
      });
      endGameAndSaveHistory();
    }
  }, [gameState, authUser, updateRoomData, endGameAndSaveHistory, addLogEntry]);

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
      beginTurnRoll,
      submitTurnRoll,
      finalizeTurnOrder,
      selectCharacterForPlayer,
      unselectCharacter,
      proposeEndGame,
      voteOnEndGame,
      processEndGameVotes,
      removePlayer,
      setPlayerSpells,
      toggleSpellState,
      stealItemFromPlayer,
      stealGoldFromPlayer,
      addGoldBonus,
      warriorSurvives,
      killPlayer,
      passTurn,
      setPlayerSkipTurns,
      addLogEntry,
    }),
    [
      gameState,
      authUser,
      createRoom,
      joinRoom,
      backToMenu,
      updatePlayerStats,
      addItemToInventory,
      removeItemFromInventory,
      goToJoinRoom,
      goToProfile,
      startGameSelection,
      beginTurnRoll,
      submitTurnRoll,
      finalizeTurnOrder,
      selectCharacterForPlayer,
      unselectCharacter,
      proposeEndGame,
      voteOnEndGame,
      processEndGameVotes,
      removePlayer,
      setPlayerSpells,
      toggleSpellState,
      stealItemFromPlayer,
      stealGoldFromPlayer,
      addGoldBonus,
      warriorSurvives,
      killPlayer,
      passTurn,
      setPlayerSkipTurns,
      addLogEntry,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => useContext(GameContext);

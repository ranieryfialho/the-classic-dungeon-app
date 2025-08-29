import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStoredState } from './useHatchMock';
import { characterClasses } from '@/config/characterClasses';
import { specialTreasures } from '@/config/specialTreasures';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot, deleteDoc } from 'firebase/firestore';

const GameContext = createContext();

const initialGameState = {
  room: null,
  players: {},
  gamePhase: 'menu',
};

export function MultiplayerProvider({ children }) {
  const [gameState, setGameState] = useStoredState('dungeonGame', initialGameState);
  const { currentUser: authUser } = useAuth();

  useEffect(() => {
    if (!gameState.room?.id) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const roomData = docSnap.data();
        if (roomData.players.length === 0) {
          setGameState(initialGameState);
          return;
        }
        const playersObject = roomData.players.reduce((acc, player) => {
          acc[player.id] = player;
          return acc;
        }, {});
        setGameState(prev => ({
          ...prev,
          room: { ...prev.room, ...roomData },
          players: playersObject,
          gamePhase: roomData.gamePhase || prev.gamePhase
        }));
      } else {
        setGameState(initialGameState);
      }
    });
    return () => unsubscribe();
  }, [gameState.room?.id, setGameState]);

  const createRoom = async () => {
    if (!authUser) {
      console.error("Usuário não autenticado, não é possível criar a sala.");
      return;
    }
    let playerName = authUser.email;
    try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().displayName) {
          playerName = userDocSnap.data().displayName;
        }
    } catch (error) {
        console.error("Erro ao buscar nome do jogador:", error);
    }
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteLink = `${window.location.origin}?room=${roomId}`;
    const initialPlayer = {
      id: authUser.uid, name: playerName, color: "#" + Math.floor(Math.random()*16777215).toString(16),
      isHost: true, ready: false, character: null,
    };
    const roomData = { 
      id: roomId, inviteLink, hostId: initialPlayer.id, hostName: initialPlayer.name,
      createdAt: serverTimestamp(), players: [initialPlayer], gamePhase: 'lobby'
    };
    await setDoc(doc(db, "rooms", roomId), roomData);
    setGameState({ 
      ...initialGameState, 
      room: { id: roomId, inviteLink, hostId: initialPlayer.id, hostName: initialPlayer.name }, 
      players: { [initialPlayer.id]: initialPlayer }, 
      gamePhase: 'lobby', 
    });
  };

  const joinRoom = async (roomId) => {
    if (!authUser) return false;
    const roomRef = doc(db, "rooms", roomId);
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) { return false; }
      const roomData = roomSnap.data();
      let playersList = roomData.players;
      if (!playersList.some(p => p.id === authUser.uid)) {
        if (playersList.length >= 4) { return false; }
        let playerName = authUser.email;
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().displayName) {
          playerName = userDocSnap.data().displayName;
        }
        const newPlayer = {
          id: authUser.uid, name: playerName, color: "#" + Math.floor(Math.random()*16777215).toString(16),
          isHost: false, ready: false, character: null,
        };
        await updateDoc(roomRef, { players: arrayUnion(newPlayer) });
        playersList.push(newPlayer);
      }
      const playersObject = playersList.reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {});
      setGameState({
        ...gameState,
        room: { id: roomData.id, inviteLink: roomData.inviteLink, hostId: roomData.hostId, hostName: roomData.hostName },
        players: playersObject,
        gamePhase: 'lobby'
      });
      return true;
    } catch (error) { console.error("Erro ao entrar na sala:", error); return false; }
  };
  
  const goToJoinRoom = () => { setGameState(prev => ({ ...prev, gamePhase: 'joining' })); };
  
  const startGameSelection = async () => {
    if (!gameState.room?.id) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    await updateDoc(roomRef, { gamePhase: 'selection' });
  };
  
  const startGame = async () => {
    if (!gameState.room?.id) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;
        const currentPlayers = roomSnap.data().players;
        const playersWithStats = currentPlayers.map(player => ({
            ...player, gold: 0, isWounded: false, isGoldHidden: false, inventory: [],
        }));
        await updateDoc(roomRef, { players: playersWithStats, gamePhase: 'playing' });
    } catch (error) { console.error("Erro ao iniciar o jogo:", error); }
  };

  const selectCharacterForPlayer = async (playerId, characterData) => {
    if (!gameState.room?.id) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const currentPlayers = roomSnap.data().players;
      const updatedPlayers = currentPlayers.map(p => {
        if (p.id === playerId) {
          return { ...p, character: characterData, ready: true };
        }
        return p;
      });
      await updateDoc(roomRef, { players: updatedPlayers });
    } catch (error) { console.error("Erro ao selecionar personagem:", error); }
  };

  const unselectCharacter = async (playerId) => {
    if (!gameState.room?.id) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const currentPlayers = roomSnap.data().players;
      const updatedPlayers = currentPlayers.map(p => {
        if (p.id === playerId) {
          return { ...p, character: null, ready: false };
        }
        return p;
      });
      await updateDoc(roomRef, { players: updatedPlayers });
    } catch (error) { console.error("Erro ao cancelar seleção de personagem:", error); }
  };
  
  const updatePlayerStats = async (playerId, newStats) => {
    if (!gameState.room?.id) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;
        const currentPlayers = roomSnap.data().players;
        const updatedPlayers = currentPlayers.map(player => {
            if (player.id === playerId) {
                return { ...player, ...newStats };
            }
            return player;
        });
        await updateDoc(roomRef, { players: updatedPlayers });
    } catch (error) { console.error("Erro ao atualizar status do jogador:", error); }
  };

  const addItemToInventory = async (playerId, itemId) => {
    if (!gameState.room?.id) return;
    const itemToAdd = specialTreasures.find(item => item.id === itemId);
    if (!itemToAdd) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;
        const currentPlayers = roomSnap.data().players;
        const updatedPlayers = currentPlayers.map(player => {
            if (player.id === playerId) {
                const newInventory = [...(player.inventory || []), itemToAdd];
                return { ...player, inventory: newInventory };
            }
            return player;
        });
        await updateDoc(roomRef, { players: updatedPlayers });
    } catch (error) { console.error("Erro ao adicionar item:", error); }
  };

  const removeItemFromInventory = async (playerId, itemIndex) => {
    if (!gameState.room?.id) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;
        const currentPlayers = roomSnap.data().players;
        const updatedPlayers = currentPlayers.map(player => {
            if (player.id === playerId) {
                const newInventory = player.inventory.filter((_, index) => index !== itemIndex);
                return { ...player, inventory: newInventory };
            }
            return player;
        });
        await updateDoc(roomRef, { players: updatedPlayers });
    } catch (error) { console.error("Erro ao remover item:", error); }
  };
  
  const proposeEndGame = async () => {
    if (!authUser || !gameState.room?.id) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    const proposingPlayer = gameState.players[authUser.uid];
    const proposal = {
      proposerId: authUser.uid,
      proposerName: proposingPlayer.name,
      votes: { [authUser.uid]: 'proposer' },
      status: 'pending'
    };
    await updateDoc(roomRef, { endGameProposal: proposal });
  };
  
  const voteOnEndGame = async (vote) => {
    if (!authUser || !gameState.room?.id || !gameState.room.endGameProposal) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    const votePath = `endGameProposal.votes.${authUser.uid}`;
    await updateDoc(roomRef, { [votePath]: vote });
  };

  const endGameAndSaveHistory = async () => {
    const { players, room } = gameState;
    const playerList = Object.values(players);
    if (playerList.length === 0) return;
    let winner = null;
    const proposer = players[room.endGameProposal.proposerId];
    const proposerClassData = characterClasses.find(c => c.name === proposer.character.className);
    if (proposer.gold >= proposerClassData.goldTarget) {
        winner = proposer;
    } else {
        winner = playerList.reduce((prev, current) => (prev.gold > current.gold) ? prev : current);
    }
    const playersSnapshot = playerList.map(p => ({
      userId: p.id, playerName: p.name, characterName: p.character.name,
      characterClass: p.character.className, gold: p.gold,
      inventory: p.inventory.map(item => ({ id: item.id, name: item.name })),
    }));

    const playerIds = playerList.map(p => p.id);

    try {
      await addDoc(collection(db, "matches"), {
        roomId: room.id, 
        winnerId: winner.id, 
        winnerName: winner.name,
        endedAt: serverTimestamp(), 
        playerCount: playerList.length, 
        players: playersSnapshot,
        playerIds: playerIds,
      });
      await deleteDoc(doc(db, "rooms", room.id));
    } catch (error) { console.error("Erro ao salvar o histórico ou deletar a sala:", error); }
    setGameState({ ...initialGameState, gamePhase: 'menu' });
  };
  
  const goToProfile = () => { setGameState(prev => ({ ...prev, gamePhase: 'profile' })); };
  
  const backToMenu = async () => {
    if (!authUser || !gameState.room?.id) {
      setGameState(initialGameState);
      return;
    }
    const roomRef = doc(db, "rooms", gameState.room.id);
    try {
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const currentPlayers = roomSnap.data().players;
        const updatedPlayers = currentPlayers.filter(p => p.id !== authUser.uid);
        if (updatedPlayers.length === 0) {
          await deleteDoc(roomRef);
        } else {
          await updateDoc(roomRef, { players: updatedPlayers });
        }
      }
    } catch (error) { console.error("Erro ao sair da sala:", error); }
    setGameState(initialGameState);
  }

  const value = { 
    gameState, setGameState, currentUser: authUser ? gameState.players[authUser.uid] : null, 
    createRoom, joinRoom, goToJoinRoom,
    startGameSelection, startGame, selectCharacterForPlayer, unselectCharacter,
    updatePlayerStats, addItemToInventory, removeItemFromInventory,
    endGameAndSaveHistory, goToProfile, backToMenu,
    proposeEndGame, voteOnEndGame
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => { 
  return useContext(GameContext); 
};
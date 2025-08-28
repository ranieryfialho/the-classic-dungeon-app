import { createContext, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStoredState } from './useHatchMock';
import { characterClasses } from '@/config/characterClasses';
import { specialTreasures } from '@/config/specialTreasures';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const GameContext = createContext();

const initialGameState = {
  room: null,
  players: {},
  gamePhase: 'menu',
};

export function MultiplayerProvider({ children }) {
  const [gameState, setGameState] = useStoredState('dungeonGame', initialGameState);
  const { currentUser: authUser } = useAuth();

  const createRoom = async () => {
    if (!authUser) return;

    let playerName = authUser.email;
    try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().displayName) {
          playerName = userDocSnap.data().displayName;
        }
    } catch (error) {
        console.error("Erro ao buscar nome do jogador, usando e-mail.", error);
    }

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteLink = `${window.location.origin}?room=${roomId}`;
    
    const initialPlayer = {
      id: authUser.uid,
      name: playerName,
      color: "#" + Math.floor(Math.random()*16777215).toString(16),
      isHost: true,
      ready: false,
      character: null,
    };

    const roomData = { 
      id: roomId, 
      inviteLink, 
      hostId: initialPlayer.id, 
      hostName: initialPlayer.name,
      createdAt: serverTimestamp(),
      players: [initialPlayer],
      gamePhase: 'lobby'
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
      if (!roomSnap.exists()) {
        console.error("Sala não encontrada");
        return false;
      }
      const roomData = roomSnap.data();
      if (roomData.players.length >= 4) return false;
      
      let newPlayer = null;
      if (!roomData.players.some(p => p.id === authUser.uid)) {
        let playerName = authUser.email;
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().displayName) {
          playerName = userDocSnap.data().displayName;
        }
        newPlayer = {
          id: authUser.uid,
          name: playerName,
          color: "#" + Math.floor(Math.random()*16777215).toString(16),
          isHost: false,
          ready: false,
          character: null,
        };
        await updateDoc(roomRef, { players: arrayUnion(newPlayer) });
      }
      
      const updatedPlayersList = newPlayer ? [...roomData.players, newPlayer] : roomData.players;
      const playersObject = updatedPlayersList.reduce((acc, player) => {
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
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
      return false;
    }
  };

  const goToJoinRoom = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'joining' }));
  };

  const startGameSelection = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'selection' }));
  };
  
  const startGame = () => {
    const playersWithStats = { ...gameState.players };
    Object.keys(playersWithStats).forEach(playerId => {
      if(playersWithStats[playerId].character) {
        playersWithStats[playerId] = {
          ...playersWithStats[playerId],
          gold: 0, 
          isWounded: false,
          isGoldHidden: false,
          inventory: [],
        };
      }
    });
    setGameState(prev => ({ ...prev, players: playersWithStats, gamePhase: 'playing' }));
  };

  const selectCharacterForPlayer = (playerId) => {
    setGameState(prev => {
      const allPlayers = Object.values(prev.players);
      const takenClasses = allPlayers.map(p => p.character?.className).filter(Boolean);
      const availableClass = characterClasses.find(c => !takenClasses.includes(c.name));
      if (!availableClass) { console.error("Não há mais classes disponíveis para escolher."); return prev; }
      const selectedHero = availableClass.heroes[0];
      const updatedPlayers = { ...prev.players, [playerId]: { ...prev.players[playerId], character: { name: selectedHero, className: availableClass.name }, ready: true } };
      return { ...prev, players: updatedPlayers };
    });
  };

  const updatePlayerStats = (playerId, newStats) => {
    setGameState(prev => {
      const playerToUpdate = prev.players[playerId];
      if (!playerToUpdate) return prev;
      return { ...prev, players: { ...prev.players, [playerId]: { ...playerToUpdate, ...newStats } } };
    });
  };

  const addItemToInventory = (playerId, itemId) => {
    const itemToAdd = specialTreasures.find(item => item.id === itemId);
    if (!itemToAdd) return;
    setGameState(prev => {
      const player = prev.players[playerId];
      const newInventory = [...player.inventory, itemToAdd];
      return { ...prev, players: { ...prev.players, [playerId]: { ...player, inventory: newInventory } } };
    });
  };

  const removeItemFromInventory = (playerId, itemIndex) => {
    setGameState(prev => {
      const player = prev.players[playerId];
      const newInventory = player.inventory.filter((_, index) => index !== itemIndex);
      return { ...prev, players: { ...prev.players, [playerId]: { ...player, inventory: newInventory } } };
    });
  };

  const endGameAndSaveHistory = async () => {
    const { players, room } = gameState;
    const playerList = Object.values(players);
    const winner = playerList.reduce((prev, current) => (prev.gold > current.gold) ? prev : current);
    const playersSnapshot = playerList.map(p => ({
      userId: p.id,
      playerName: p.name,
      characterName: p.character.name,
      characterClass: p.character.className,
      gold: p.gold,
      inventory: p.inventory.map(item => ({ id: item.id, name: item.name })),
    }));
    try {
      await addDoc(collection(db, "matches"), {
        roomId: room.id,
        winnerId: winner.id,
        winnerName: winner.name,
        endedAt: serverTimestamp(),
        playerCount: playerList.length,
        players: playersSnapshot,
      });
    } catch (error) {
      console.error("Erro ao salvar o histórico da partida:", error);
    }
    setGameState({ ...initialGameState, gamePhase: 'menu' });
  };
  
  const goToProfile = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'profile' }));
  };
  
  const backToMenu = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'menu' }));
  }

  const value = { 
    gameState, setGameState, currentUser: gameState.players[authUser?.uid], 
    createRoom, joinRoom, goToJoinRoom,
    startGameSelection, startGame, selectCharacterForPlayer, 
    updatePlayerStats, addItemToInventory, removeItemFromInventory,
    endGameAndSaveHistory, goToProfile, backToMenu,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => { 
  return useContext(GameContext); 
};
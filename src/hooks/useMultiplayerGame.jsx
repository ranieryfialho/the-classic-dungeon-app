import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStoredState } from './useHatchMock';
import { characterClasses } from '@/config/characterClasses';
import { specialTreasures } from '@/config/specialTreasures';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const GameContext = createContext();

const initialGameState = {
  room: null,
  players: {},
  gamePhase: 'menu',
};

export function MultiplayerProvider({ children }) {
  const [gameState, setGameState] = useStoredState('dungeonGame', initialGameState);
  const { currentUser: authUser } = useAuth();

  const createRoom = () => {
    if (!authUser) {
      console.error("Usuário não autenticado, não é possível criar a sala.");
      return;
    }
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteLink = `${window.location.origin}?room=${roomId}`;
    const initialPlayer = {
      id: authUser.uid,
      name: authUser.email,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      isHost: true,
      ready: false,
      character: null,
    };
    setGameState({
      ...initialGameState,
      room: { id: roomId, inviteLink, hostId: initialPlayer.id, hostName: initialPlayer.name },
      players: { [initialPlayer.id]: initialPlayer },
      gamePhase: 'lobby',
    });
  };

  const startGameSelection = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'selection' }));
  };

  const startGame = () => {
    const playersWithStats = { ...gameState.players };
    Object.keys(playersWithStats).forEach(playerId => {
      if (playersWithStats[playerId].character) {
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

  // ++ NOVA FUNÇÃO ++
  const goToProfile = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'profile' }));
  };

  // ++ NOVA FUNÇÃO ++
  const backToMenu = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'menu' }));
  }

  const value = {
    gameState,
    setGameState,
    currentUser: gameState.players[authUser?.uid],
    createRoom,
    startGameSelection,
    startGame,
    selectCharacterForPlayer,
    updatePlayerStats,
    addItemToInventory,
    removeItemFromInventory,
    endGameAndSaveHistory,
    goToProfile, // <-- Exportar a função
    backToMenu,  // <-- Exportar a função
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => {
  return useContext(GameContext);
};
import { createContext, useContext, useEffect } from 'react';
import { useStoredState, useUser, useCollaborators } from './useHatchMock';
import { characterClasses } from '@/config/characterClasses';
import { specialTreasures } from '@/config/specialTreasures';

const GameContext = createContext();

const initialGameState = {
  room: null,
  players: {},
  gamePhase: 'menu',
};

export function MultiplayerProvider({ children }) {
  const [gameState, setGameState] = useStoredState('dungeonGame', initialGameState);
  const currentUser = useUser();
  const collaborators = useCollaborators();

  useEffect(() => {
    if (gameState.gamePhase === 'lobby' || gameState.gamePhase === 'selection') {
      const playerIds = Object.keys(gameState.players);
      collaborators.forEach(collab => {
        if (!playerIds.includes(collab.id)) {
          setGameState(prev => ({ 
            ...prev, 
            players: { 
              ...prev.players, 
              [collab.id]: { 
                ...collab, 
                isHost: collab.id === prev.room.hostId, 
                ready: false, 
                character: null, 
              } 
            } 
          }));
        }
      });
    }
  }, [collaborators, gameState.gamePhase, setGameState]);

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteLink = `${window.location.origin}?room=${roomId}`;
    setGameState({ 
      ...initialGameState, 
      room: { 
        id: roomId, 
        inviteLink, 
        hostId: currentUser.id, 
        hostName: currentUser.name, 
      }, 
      players: { 
        [currentUser.id]: { 
          ...currentUser, 
          isHost: true, 
          ready: false, 
          character: null, 
        } 
      }, 
      gamePhase: 'lobby', 
    });
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
      if (!availableClass) { 
        console.error("Não há mais classes disponíveis para escolher."); 
        return prev; 
      }
      const selectedHero = availableClass.heroes[0];
      const updatedPlayers = { 
        ...prev.players, 
        [playerId]: { 
          ...prev.players[playerId], 
          character: { 
            name: selectedHero, 
            className: availableClass.name, 
          }, 
          ready: true, 
        } 
      };
      return { ...prev, players: updatedPlayers };
    });
  };

  const updatePlayerStats = (playerId, newStats) => {
    setGameState(prev => {
      const playerToUpdate = prev.players[playerId];
      if (!playerToUpdate) return prev;
      return { 
        ...prev, 
        players: { 
          ...prev.players, 
          [playerId]: { 
            ...playerToUpdate, 
            ...newStats, 
          } 
        } 
      };
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

  const value = { 
    gameState, 
    setGameState, 
    currentUser, 
    createRoom, 
    startGameSelection, 
    startGame, 
    selectCharacterForPlayer, 
    updatePlayerStats, 
    addItemToInventory, 
    removeItemFromInventory 
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => { 
  return useContext(GameContext); 
};
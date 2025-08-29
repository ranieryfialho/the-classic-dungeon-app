// src/hooks/useMultiplayerGame.jsx - Sistema Tempo Real CORRIGIDO
import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocalStorage } from './useLocalStorage';
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
  const [gameState, setGameState] = useLocalStorage('dungeonGame', initialGameState);
  const { currentUser: authUser } = useAuth();
  
  // Referencias para cleanup
  const unsubscribeRef = useRef(null);
  const isListeningRef = useRef(false);

  // VERSÃO CORRIGIDA DO FIREBASE LISTENER
  const setupRealtimeListener = useCallback((roomId) => {
    // Limpar listener anterior se existir
    if (unsubscribeRef.current) {
      console.log('🔌 Limpando listener anterior');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!roomId || isListeningRef.current) return;

    console.log('🔄 Configurando listener para sala:', roomId);
    isListeningRef.current = true;

    const roomRef = doc(db, "rooms", roomId);
    
    // CONFIGURAÇÃO CORRETA do onSnapshot
    const unsubscribe = onSnapshot(
      roomRef,
      {
        // CRÍTICO: Incluir metadata changes
        includeMetadataChanges: true
      },
      (docSnap) => {
        console.log('📨 Snapshot recebido:', {
          exists: docSnap.exists(),
          hasPendingWrites: docSnap.metadata.hasPendingWrites,
          isFromCache: docSnap.metadata.fromCache
        });

        if (docSnap.exists()) {
          const roomData = docSnap.data();
          console.log('📊 Dados da sala:', roomData);

          // Verificar se há players
          if (!roomData.players || roomData.players.length === 0) {
            console.log('🚪 Sala sem jogadores');
            setGameState(initialGameState);
            return;
          }

          // Converter players para objeto
          const playersObject = roomData.players.reduce((acc, player) => {
            acc[player.id] = player;
            return acc;
          }, {});

          console.log('👥 Jogadores processados:', playersObject);

          // ATUALIZAÇÃO OTIMIZADA DO ESTADO
          setGameState(prevState => {
            const newState = {
              room: {
                id: roomId,
                inviteLink: roomData.inviteLink || prevState.room?.inviteLink || `${window.location.origin}?room=${roomId}`,
                hostId: roomData.hostId,
                hostName: roomData.hostName,
                endGameProposal: roomData.endGameProposal || null
              },
              players: playersObject,
              gamePhase: roomData.gamePhase || 'lobby'
            };

            console.log('🔄 Estado atualizado:', newState);
            return newState;
          });

        } else {
          console.log('❌ Documento não existe');
          setGameState(initialGameState);
        }
      },
      (error) => {
        console.error('❌ Erro no listener Firebase:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem:', error.message);
        
        // Tentar reconectar em caso de erro de rede
        if (error.code === 'unavailable') {
          console.log('🔄 Tentando reconectar em 5s...');
          setTimeout(() => {
            if (roomId) {
              isListeningRef.current = false;
              setupRealtimeListener(roomId);
            }
          }, 5000);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;
  }, [setGameState]);

  // EFFECT PARA GERENCIAR O LISTENER
  useEffect(() => {
    const roomId = gameState.room?.id;
    
    if (roomId && authUser) {
      setupRealtimeListener(roomId);
    } else {
      // Limpar listener se não há sala ou usuário
      if (unsubscribeRef.current) {
        console.log('🧹 Limpando listener (sem sala/usuário)');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isListeningRef.current = false;
      }
    }

    // Cleanup quando component desmonta
    return () => {
      if (unsubscribeRef.current) {
        console.log('🧹 Cleanup final do listener');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isListeningRef.current = false;
      }
    };
  }, [gameState.room?.id, authUser, setupRealtimeListener]);

  // FUNÇÃO DE TESTE DE CONECTIVIDADE
  const testFirebaseConnection = async () => {
    try {
      console.log('🧪 Testando conexão Firebase...');
      const testDoc = doc(db, 'test', 'connectivity');
      await getDoc(testDoc);
      console.log('✅ Firebase conectado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro de conectividade Firebase:', error);
      return false;
    }
  };

  const createRoom = async () => {
    if (!authUser) {
      console.error("❌ Usuário não autenticado");
      return;
    }

    // Testar conectividade primeiro
    const isConnected = await testFirebaseConnection();
    if (!isConnected) {
      alert("Erro de conexão com o Firebase. Verifique sua internet.");
      return;
    }

    console.log('🏗️ Criando nova sala...');

    let playerName = authUser.email;
    try {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().displayName) {
          playerName = userDocSnap.data().displayName;
        }
    } catch (error) {
        console.error("⚠️ Erro ao buscar nome:", error);
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
      createdAt: new Date().toISOString()
    };

    const roomData = { 
      id: roomId, 
      inviteLink, 
      hostId: initialPlayer.id, 
      hostName: initialPlayer.name,
      createdAt: serverTimestamp(), 
      players: [initialPlayer], 
      gamePhase: 'lobby',
      lastUpdated: serverTimestamp()
    };

    try {
      // USAR setDoc ao invés de addDoc para garantir ID específico
      await setDoc(doc(db, "rooms", roomId), roomData);
      
      console.log('✅ Sala criada no Firebase:', roomId);

      // Atualizar estado local APÓS sucesso no Firebase
      setGameState({ 
        room: { 
          id: roomId, 
          inviteLink, 
          hostId: initialPlayer.id, 
          hostName: initialPlayer.name 
        }, 
        players: { [initialPlayer.id]: initialPlayer }, 
        gamePhase: 'lobby'
      });

      console.log('✅ Estado local atualizado');

    } catch (error) {
      console.error('❌ Erro ao criar sala:', error);
      alert("Erro ao criar sala. Tente novamente.");
    }
  };

  const joinRoom = async (roomId) => {
    if (!authUser) {
      console.error("❌ Usuário não autenticado");
      return false;
    }

    console.log('🚪 Tentando entrar na sala:', roomId);

    const roomRef = doc(db, "rooms", roomId);
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) { 
        console.log('❌ Sala não encontrada');
        return false; 
      }

      const roomData = roomSnap.data();
      let playersList = roomData.players || [];

      console.log('👥 Jogadores atuais:', playersList);

      // Verificar se já está na sala
      const existingPlayerIndex = playersList.findIndex(p => p.id === authUser.uid);
      
      if (existingPlayerIndex === -1) {
        // Jogador não está na sala
        if (playersList.length >= 6) { 
          console.log('❌ Sala lotada');
          return false; 
        }

        let playerName = authUser.email;
        try {
          const userDocRef = doc(db, 'users', authUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().displayName) {
            playerName = userDocSnap.data().displayName;
          }
        } catch (error) {
          console.log("⚠️ Usando email como nome");
        }

        const newPlayer = {
          id: authUser.uid, 
          name: playerName, 
          color: "#" + Math.floor(Math.random()*16777215).toString(16),
          isHost: false, 
          ready: false, 
          character: null,
          joinedAt: new Date().toISOString()
        };

        // ATUALIZAR no Firebase PRIMEIRO
        playersList.push(newPlayer);
        await updateDoc(roomRef, { 
          players: playersList,
          lastUpdated: serverTimestamp()
        });

        console.log('✅ Jogador adicionado ao Firebase');
      } else {
        console.log('ℹ️ Jogador já estava na sala');
      }

      // Atualizar estado local
      const playersObject = playersList.reduce((acc, player) => {
        acc[player.id] = player;
        return acc;
      }, {});

      setGameState({
        room: { 
          id: roomData.id, 
          inviteLink: roomData.inviteLink, 
          hostId: roomData.hostId, 
          hostName: roomData.hostName 
        },
        players: playersObject,
        gamePhase: roomData.gamePhase || 'lobby'
      });

      console.log('✅ Entrou na sala com sucesso');
      return true;

    } catch (error) { 
      console.error("❌ Erro ao entrar na sala:", error); 
      return false; 
    }
  };

  // OTIMIZAÇÃO: Usar updateDoc ao invés de buscar + atualizar
  const updateRoomData = async (updates) => {
    if (!gameState.room?.id) return false;
    
    try {
      const roomRef = doc(db, "rooms", gameState.room.id);
      await updateDoc(roomRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
      console.log('✅ Sala atualizada:', updates);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar sala:', error);
      return false;
    }
  };

  const selectCharacterForPlayer = async (playerId, characterData) => {
    console.log('👤 Selecionando personagem:', { playerId, characterData });
    
    const roomRef = doc(db, "rooms", gameState.room.id);
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      
      const currentPlayers = roomSnap.data().players;
      const updatedPlayers = currentPlayers.map(p => 
        p.id === playerId 
          ? { ...p, character: characterData, ready: true, updatedAt: new Date().toISOString() }
          : p
      );
      
      await updateDoc(roomRef, { 
        players: updatedPlayers,
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Personagem selecionado no Firebase');
    } catch (error) { 
      console.error("❌ Erro ao selecionar personagem:", error); 
    }
  };

  // OUTRAS FUNÇÕES (simplificadas para não quebrar)
  const goToJoinRoom = () => setGameState(prev => ({ ...prev, gamePhase: 'joining' }));
  const goToProfile = () => setGameState(prev => ({ ...prev, gamePhase: 'profile' }));
  
  const startGameSelection = () => updateRoomData({ gamePhase: 'selection' });
  const startGame = async () => {
    const roomRef = doc(db, "rooms", gameState.room.id);
    const roomSnap = await getDoc(roomRef);
    const currentPlayers = roomSnap.data().players;
    const playersWithStats = currentPlayers.map(player => ({
        ...player, gold: 0, isWounded: false, isGoldHidden: false, inventory: [],
    }));
    await updateDoc(roomRef, { players: playersWithStats, gamePhase: 'playing' });
  };

  const unselectCharacter = async (playerId) => {
    const roomRef = doc(db, "rooms", gameState.room.id);
    const roomSnap = await getDoc(roomRef);
    const currentPlayers = roomSnap.data().players;
    const updatedPlayers = currentPlayers.map(p => 
      p.id === playerId ? { ...p, character: null, ready: false } : p
    );
    await updateDoc(roomRef, { players: updatedPlayers });
  };

  const updatePlayerStats = async (playerId, newStats) => {
    const roomRef = doc(db, "rooms", gameState.room.id);
    const roomSnap = await getDoc(roomRef);
    const currentPlayers = roomSnap.data().players;
    const updatedPlayers = currentPlayers.map(player => 
        player.id === playerId ? { ...player, ...newStats } : player
    );
    await updateDoc(roomRef, { players: updatedPlayers });
  };

  const addItemToInventory = async (playerId, itemId) => {
    const itemToAdd = specialTreasures.find(item => item.id === itemId);
    if (!itemToAdd) return;
    const roomRef = doc(db, "rooms", gameState.room.id);
    const roomSnap = await getDoc(roomRef);
    const currentPlayers = roomSnap.data().players;
    const updatedPlayers = currentPlayers.map(player => {
        if (player.id === playerId) {
            const newInventory = [...(player.inventory || []), itemToAdd];
            return { ...player, inventory: newInventory };
        }
        return player;
    });
    await updateDoc(roomRef, { players: updatedPlayers });
  };

  const removeItemFromInventory = async (playerId, itemIndex) => {
    const roomRef = doc(db, "rooms", gameState.room.id);
    const roomSnap = await getDoc(roomRef);
    const currentPlayers = roomSnap.data().players;
    const updatedPlayers = currentPlayers.map(player => {
        if (player.id === playerId) {
            const newInventory = player.inventory.filter((_, index) => index !== itemIndex);
            return { ...player, inventory: newInventory };
        }
        return player;
    });
    await updateDoc(roomRef, { players: updatedPlayers });
  };

  const proposeEndGame = async () => {
    const proposingPlayer = gameState.players[authUser.uid];
    const proposal = {
      proposerId: authUser.uid,
      proposerName: proposingPlayer.name,
      votes: { [authUser.uid]: 'proposer' },
      status: 'pending'
    };
    await updateRoomData({ endGameProposal: proposal });
  };

  const voteOnEndGame = async (vote) => {
    const roomRef = doc(db, "rooms", gameState.room.id);
    const votePath = `endGameProposal.votes.${authUser.uid}`;
    await updateDoc(roomRef, { [votePath]: vote });
  };

  const endGameAndSaveHistory = async () => {
    // [manter código original]
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

    try {
      await addDoc(collection(db, "matches"), {
        roomId: room.id, winnerId: winner.id, winnerName: winner.name,
        endedAt: serverTimestamp(), playerCount: playerList.length, 
        players: playersSnapshot, playerIds: playerList.map(p => p.id),
      });
      await deleteDoc(doc(db, "rooms", room.id));
    } catch (error) { console.error("Erro ao finalizar:", error); }
    
    setGameState({ ...initialGameState, gamePhase: 'menu' });
  };

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
    } catch (error) { console.error("Erro ao sair:", error); }
    
    setGameState(initialGameState);
  };

  const value = { 
    gameState, setGameState, 
    currentUser: authUser ? gameState.players[authUser.uid] : null, 
    createRoom, joinRoom, goToJoinRoom, startGameSelection, startGame, 
    selectCharacterForPlayer, unselectCharacter, updatePlayerStats, 
    addItemToInventory, removeItemFromInventory, endGameAndSaveHistory, 
    goToProfile, backToMenu, proposeEndGame, voteOnEndGame, testFirebaseConnection
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useMultiplayerGame = () => { 
  return useContext(GameContext); 
};
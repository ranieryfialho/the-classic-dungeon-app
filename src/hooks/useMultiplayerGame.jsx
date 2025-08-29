import { createContext, useContext, useEffect, useRef, useCallback, useMemo, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { characterClasses } from "@/config/characterClasses"
import { specialTreasures } from "@/config/specialTreasures"
import { db } from "@/lib/firebase"
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
} from "firebase/firestore"

const GameContext = createContext(null)

const initialGameState = {
  room: null,
  players: {},
  gamePhase: "menu",
  connectionError: null,
}

export function MultiplayerProvider({ children }) {
  const [gameState, setGameState] = useState(initialGameState)
  const { currentUser: authUser } = useAuth()

  const unsubscribeRoomRef = useRef(null)
  const isListeningRef = useRef(false)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const currentRoomIdRef = useRef(null)
  const hasTriedReconnectRef = useRef(false)

  const saveRoomId = useCallback((roomId) => {
    if (roomId) {
      localStorage.setItem("currentRoomId", roomId)
    } else {
      localStorage.removeItem("currentRoomId")
    }
  }, [])

  const getSavedRoomId = useCallback(() => {
    try {
      return localStorage.getItem("currentRoomId")
    } catch {
      return null
    }
  }, [])

  const attemptAutoReconnect = useCallback(async () => {
    if (!authUser) return

    const savedRoomId = getSavedRoomId()
    if (!savedRoomId) return

    console.log("[v0] Tentando reconectar automaticamente à sala:", savedRoomId)

    try {
      const roomRef = doc(db, "rooms", savedRoomId)
      const roomSnap = await getDoc(roomRef)

      if (roomSnap.exists()) {
        const success = await joinRoom(savedRoomId)
        if (success) {
          console.log("[v0] Reconexão automática bem-sucedida")
          hasTriedReconnectRef.current = true
        } else {
          console.log("[v0] Falha na reconexão automática")
          saveRoomId(null)
        }
      } else {
        console.log("[v0] Sala salva não existe mais")
        saveRoomId(null)
      }
    } catch (error) {
      console.error("[v0] Erro na reconexão automática:", error)
      saveRoomId(null)
    }
  }, [authUser, getSavedRoomId, saveRoomId])

  useEffect(() => {
    if (!authUser || !gameState.room?.id) {
      hasTriedReconnectRef.current = false
    }
  }, [authUser, gameState.room?.id])

  useEffect(() => {
    if (authUser && !gameState.room?.id && !hasTriedReconnectRef.current) {
      attemptAutoReconnect()
    }
  }, [authUser, gameState.room?.id, attemptAutoReconnect])


  const setupRealtimeListener = useCallback(
    (roomId) => {
      console.log("[v0] Configurando listener para sala:", roomId)

      if (unsubscribeRoomRef.current) {
        try {
          unsubscribeRoomRef.current()
        } catch {}
        unsubscribeRoomRef.current = null
      }

      if (!roomId) return

      if (isListeningRef.current && currentRoomIdRef.current === roomId) {
        console.log("[v0] Listener já ativo para esta sala, ignorando")
        return
      }

      isListeningRef.current = true
      currentRoomIdRef.current = roomId

      const roomRef = doc(db, "rooms", roomId)

      const unsubscribe = onSnapshot(
        roomRef,
        { includeMetadataChanges: true },
        (snap) => {
          console.log("[v0] Recebida atualização da sala:", snap.exists() ? "dados atualizados" : "sala deletada")
          reconnectAttemptsRef.current = 0

          if (!snap.exists()) {
            console.log("[v0] Sala não existe mais, voltando ao menu")
            saveRoomId(null)
            setGameState(initialGameState)
            return
          }

          const data = snap.data()

          if (!data || typeof data !== "object") {
            console.warn("[useMultiplayerGame] Dados da sala corrompidos, ignorando update")
            return
          }

          const playersArray = Array.isArray(data.players) ? data.players : []
          console.log("[v0] Jogadores na sala:", playersArray.length)

          const playersObj = playersArray.reduce((acc, p) => {
            if (p && p.id) {
              acc[p.id] = p
            }
            return acc
          }, {})

          setGameState((prev) => ({
            room: {
              id: roomId,
              inviteLink: data.inviteLink || prev.room?.inviteLink || `${window.location.origin}?room=${roomId}`,
              hostId: data.hostId,
              hostName: data.hostName,
              endGameProposal: data.endGameProposal || null,
            },
            players: playersObj,
            gamePhase: data.gamePhase || prev.gamePhase || "lobby",
            connectionError: null,
          }))
        },
        (error) => {
          console.error("[useMultiplayerGame] onSnapshot error:", error?.code || error, error?.message || "")

          if (error?.code === "unavailable" || error?.code === "permission-denied") {
            isListeningRef.current = false
            currentRoomIdRef.current = null

            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              reconnectAttemptsRef.current++
              const delay = Math.min(1000 * reconnectAttemptsRef.current, 10000)

              console.log(
                `[useMultiplayerGame] Tentando reconectar em ${delay}ms (tentativa ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
              )

              reconnectTimeoutRef.current = setTimeout(() => {
                setupRealtimeListener(roomId)
              }, delay)
            } else {
              console.error("[useMultiplayerGame] Máximo de tentativas de reconexão atingido")
              setGameState((prev) => ({
                ...prev,
                connectionError: "Problema de conexão. Verifique sua internet e tente novamente.",
              }))
            }
          }
        },
      )

      unsubscribeRoomRef.current = unsubscribe
    },
    [setGameState, saveRoomId],
  )

  useEffect(() => {
    const roomId = gameState.room?.id
    console.log("[v0] useEffect - roomId:", roomId, "authUser:", !!authUser)

    if (authUser && roomId) {
      setupRealtimeListener(roomId)
    } else {
      console.log("[v0] Encerrando listeners - sem sala ou usuário")
      if (unsubscribeRoomRef.current) {
        try {
          unsubscribeRoomRef.current()
        } catch {}
        unsubscribeRoomRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      isListeningRef.current = false
      currentRoomIdRef.current = null
      reconnectAttemptsRef.current = 0
    }

    return () => {
      if (unsubscribeRoomRef.current) {
        try {
          unsubscribeRoomRef.current()
        } catch {}
        unsubscribeRoomRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      isListeningRef.current = false
      currentRoomIdRef.current = null
      reconnectAttemptsRef.current = 0
    }
  }, [authUser, gameState.room?.id, setupRealtimeListener])

  // ————————————————————————————————————————
  // Utilitários
  // ————————————————————————————————————————
  const testFirebaseConnection = async () => {
    try {
      const testRef = doc(db, "test", "connectivity")
      await getDoc(testRef)
      setGameState((prev) => {
        const { connectionError, ...rest } = prev
        return rest
      })
      return true
    } catch (e) {
      console.error("[useMultiplayerGame] Firebase connectivity error:", e)
      return false
    }
  }

  const updateRoomData = async (updates) => {
    const roomId = gameState.room?.id
    if (!roomId) return false
    try {
      const roomRef = doc(db, "rooms", roomId)
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        try {
          await updateDoc(roomRef, { ...updates, lastUpdated: serverTimestamp() })
          return true
        } catch (error) {
          attempts++
          if (attempts >= maxAttempts) throw error

          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts))
        }
      }
    } catch (e) {
      console.error("[useMultiplayerGame] updateRoomData error:", e)
      return false
    }
  }

  const readPlayersArray = async (roomRef) => {
    const snap = await getDoc(roomRef)
    if (!snap.exists()) return []
    const data = snap.data()
    return Array.isArray(data.players) ? data.players : []
  }

  // ————————————————————————————————————————
  // Criação / Entrada em Sala
  // ————————————————————————————————————————
  const createRoom = async () => {
    if (!authUser) return

    const ok = await testFirebaseConnection()
    if (!ok) {
      alert("Erro de conexão com o Firebase. Verifique sua internet.")
      return
    }

    let playerName = authUser.email
    try {
      const userDocRef = doc(db, "users", authUser.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists() && userDocSnap.data().displayName) {
        playerName = userDocSnap.data().displayName
      }
    } catch {
    }

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const inviteLink = `${window.location.origin}?room=${roomId}`

    const initialPlayer = {
      id: authUser.uid,
      name: playerName,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      isHost: true,
      ready: false,
      character: null,
      createdAt: new Date().toISOString(),
      gold: 0,
      isWounded: false,
      isGoldHidden: false,
      inventory: [],
    }

    const roomData = {
      id: roomId,
      inviteLink,
      hostId: initialPlayer.id,
      hostName: initialPlayer.name,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      players: [initialPlayer],
      gamePhase: "lobby",
    }

    try {
      await setDoc(doc(db, "rooms", roomId), roomData)

      saveRoomId(roomId)

      setGameState({
        room: { id: roomId, inviteLink, hostId: initialPlayer.id, hostName: initialPlayer.name },
        players: { [initialPlayer.id]: initialPlayer },
        gamePhase: "lobby",
        connectionError: null,
      })
    } catch (e) {
      console.error("[useMultiplayerGame] createRoom error:", e)
      alert("Erro ao criar sala. Tente novamente.")
    }
  }

  const joinRoom = async (roomId) => {
    if (!authUser) return false

    console.log("[v0] Tentando entrar na sala:", roomId)
    const roomRef = doc(db, "rooms", roomId)
    try {
      const roomSnap = await getDoc(roomRef)
      if (!roomSnap.exists()) {
        console.log("[v0] Sala não existe")
        return false
      }

      const data = roomSnap.data()
      const playersList = Array.isArray(data.players) ? [...data.players] : []

      const idx = playersList.findIndex((p) => p.id === authUser.uid)
      console.log("[v0] Jogador já na sala?", idx !== -1)

      if (idx === -1) {
        if (playersList.length >= 6) {
          console.log("[v0] Sala lotada")
          return false
        }

        let playerName = authUser.email
        try {
          const userDocRef = doc(db, "users", authUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists() && userDocSnap.data().displayName) {
            playerName = userDocSnap.data().displayName
          }
        } catch {
        }

        const newPlayer = {
          id: authUser.uid,
          name: playerName,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          isHost: false,
          ready: false,
          character: null,
          joinedAt: new Date().toISOString(),
          gold: 0,
          isWounded: false,
          isGoldHidden: false,
          inventory: [],
        }

        playersList.push(newPlayer)
        console.log("[v0] Adicionando jogador à sala, total:", playersList.length)
        await updateDoc(roomRef, { players: playersList, lastUpdated: serverTimestamp() })
      }

      saveRoomId(roomId)

      const playersObj = playersList.reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {})

      console.log("[v0] Definindo estado local da sala")
      setGameState({
        room: { id: data.id, inviteLink: data.inviteLink, hostId: data.hostId, hostName: data.hostName },
        players: playersObj,
        gamePhase: data.gamePhase || "lobby",
        connectionError: null,
      })

      return true
    } catch (e) {
      console.error("[useMultiplayerGame] joinRoom error:", e)
      return false
    }
  }

  // ————————————————————————————————————————
  // Fases de jogo
  // ————————————————————————————————————————
  const goToJoinRoom = () => setGameState((s) => ({ ...s, gamePhase: "joining" }))
  const goToProfile = () => setGameState((s) => ({ ...s, gamePhase: "profile" }))

  const startGameSelection = async () => {
    await updateRoomData({ gamePhase: "selection" })
  }

  const startGame = async () => {
    const roomId = gameState.room?.id
    if (!roomId) return

    const roomRef = doc(db, "rooms", roomId)
    const players = await readPlayersArray(roomRef)

    const initialized = players.map((p) => ({
      ...p,
      gold: 0,
      isWounded: false,
      isGoldHidden: false,
      inventory: Array.isArray(p.inventory) ? p.inventory : [],
    }))

    await updateDoc(roomRef, { players: initialized, gamePhase: "playing", lastUpdated: serverTimestamp() })
  }

  // ————————————————————————————————————————
  // Ações de jogador (sempre persistindo no Firestore)
  // ————————————————————————————————————————
  const selectCharacterForPlayer = async (playerId, characterData) => {
    const roomId = gameState.room?.id
    if (!roomId) return

    const roomRef = doc(db, "rooms", roomId)
    const players = await readPlayersArray(roomRef)

    const updated = players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            character: characterData,
            ready: true,
            updatedAt: new Date().toISOString(),
          }
        : p,
    )

    await updateRoomData({ players: updated })
  }

  const unselectCharacter = async (playerId) => {
    const roomId = gameState.room?.id
    if (!roomId) return

    const roomRef = doc(db, "rooms", roomId)
    const players = await readPlayersArray(roomRef)

    const updated = players.map((p) => (p.id === playerId ? { ...p, character: null, ready: false } : p))
    await updateDoc(roomRef, { players: updated, lastUpdated: serverTimestamp() })
  }

  const updatePlayerStats = async (playerId, newStats) => {
    const roomId = gameState.room?.id
    if (!roomId) return

    const roomRef = doc(db, "rooms", roomId)
    const players = await readPlayersArray(roomRef)

    const updated = players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            ...newStats,
            lastStatsUpdate: new Date().toISOString(),
          }
        : p,
    )

    await updateRoomData({ players: updated })
  }

  const addItemToInventory = async (playerId, itemId) => {
    const roomId = gameState.room?.id
    if (!roomId) return

    const item = specialTreasures.find((i) => i.id === itemId)
    if (!item) return

    const roomRef = doc(db, "rooms", roomId)
    const players = await readPlayersArray(roomRef)

    const updated = players.map((p) => {
      if (p.id !== playerId) return p
      const inv = Array.isArray(p.inventory) ? p.inventory : []
      return { ...p, inventory: [...inv, item] }
    })

    await updateDoc(roomRef, { players: updated, lastUpdated: serverTimestamp() })
  }

  const removeItemFromInventory = async (playerId, itemIndex) => {
    const roomId = gameState.room?.id
    if (!roomId) return

    const roomRef = doc(db, "rooms", roomId)
    const players = await readPlayersArray(roomRef)

    const updated = players.map((p) => {
      if (p.id !== playerId) return p
      const inv = Array.isArray(p.inventory) ? p.inventory : []
      return { ...p, inventory: inv.filter((_, idx) => idx !== itemIndex) }
    })

    await updateDoc(roomRef, { players: updated, lastUpdated: serverTimestamp() })
  }

  // ————————————————————————————————————————
  // Proposta / votação de fim de jogo
  // ————————————————————————————————————————
  const proposeEndGame = async () => {
    const me = authUser ? gameState.players[authUser.uid] : null
    if (!me) return
    const proposal = {
      proposerId: me.id,
      proposerName: me.name,
      votes: { [me.id]: "proposer" },
      status: "pending",
      createdAt: serverTimestamp(),
    }
    await updateRoomData({ endGameProposal: proposal })
  }

  const voteOnEndGame = async (vote) => {
    const roomId = gameState.room?.id
    if (!roomId || !authUser) return

    const path = `endGameProposal.votes.${authUser.uid}`
    await updateDoc(doc(db, "rooms", roomId), { [path]: vote, lastUpdated: serverTimestamp() })
  }

  const endGameAndSaveHistory = async () => {
    const { players, room } = gameState
    const playerList = Object.values(players)
    if (playerList.length === 0) return

    const proposer = room?.endGameProposal ? players[room.endGameProposal.proposerId] : null
    let winner = null

    if (proposer?.character?.className) {
      const proposerClass = characterClasses.find((c) => c.name === proposer.character.className)
      if (proposerClass && (proposer.gold ?? 0) >= proposerClass.goldTarget) {
        winner = proposer
      }
    }
    if (!winner) {
      winner = playerList.reduce((a, b) => (Number(a.gold || 0) > Number(b.gold || 0) ? a : b))
    }

    const playersSnapshot = playerList.map((p) => ({
      userId: p.id,
      playerName: p.name,
      characterName: p.character?.name || null,
      characterClass: p.character?.className || null,
      gold: Number(p.gold || 0),
      inventory: (p.inventory || []).map((i) => ({ id: i.id, name: i.name })),
    }))

    try {
      await addDoc(collection(db, "matches"), {
        roomId: room.id,
        winnerId: winner.id,
        winnerName: winner.name,
        endedAt: serverTimestamp(),
        playerCount: playerList.length,
        players: playersSnapshot,
        playerIds: playerList.map((p) => p.id),
      })
      await deleteDoc(doc(db, "rooms", room.id))
    } catch (e) {
      console.error("[useMultiplayerGame] endGameAndSaveHistory error:", e)
    }

    setGameState({ ...initialGameState, gamePhase: "menu" })
  }

  // ————————————————————————————————————————
  // Sair/voltar ao menu (limpa presença e sala se for o último)
  // ————————————————————————————————————————
  const backToMenu = async () => {
    const roomId = gameState.room?.id
    if (!authUser || !roomId) {
      saveRoomId(null)
      hasTriedReconnectRef.current = false
      setGameState(initialGameState)
      return
    }

    try {
      const roomRef = doc(db, "rooms", roomId)
      const players = await readPlayersArray(roomRef)
      const updated = players.filter((p) => p.id !== authUser.uid)

      if (updated.length === 0) {
        await deleteDoc(roomRef)
      } else {
        await updateDoc(roomRef, { players: updated, lastUpdated: serverTimestamp() })
      }
    } catch (e) {
      console.error("[useMultiplayerGame] backToMenu error:", e)
    }

    saveRoomId(null)
    hasTriedReconnectRef.current = false
    setGameState(initialGameState)
  }

  // ————————————————————————————————————————
  // Função para forçar sincronização manual
  // ————————————————————————————————————————
  const forceSyncRoom = useCallback(async () => {
    const roomId = gameState.room?.id
    if (!roomId) return false

    try {
      const roomRef = doc(db, "rooms", roomId)
      const snap = await getDoc(roomRef)

      if (snap.exists()) {
        const data = snap.data()
        const playersArray = Array.isArray(data.players) ? data.players : []
        const playersObj = playersArray.reduce((acc, p) => {
          if (p && p.id) {
            acc[p.id] = p
          }
          return acc
        }, {})

        setGameState((prev) => ({
          ...prev,
          room: {
            ...prev.room,
            hostId: data.hostId,
            hostName: data.hostName,
            endGameProposal: data.endGameProposal || null,
          },
          players: playersObj,
          gamePhase: data.gamePhase || prev.gamePhase || "lobby",
        }))

        return true
      }
      return false
    } catch (e) {
      console.error("[useMultiplayerGame] forceSyncRoom error:", e)
      return false
    }
  }, [gameState.room?.id, setGameState])

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

      testFirebaseConnection,
      forceSyncRoom,

      isConnected: !gameState.connectionError,
      connectionError: gameState.connectionError,
    }),
    [gameState, authUser, forceSyncRoom],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export const useMultiplayerGame = () => useContext(GameContext)

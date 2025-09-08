import { useState } from "react";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { HeroStatusCard } from "@/components/game/HeroStatusCard";
import { Button } from "@/components/ui/button";
import { ManageHeroModal } from "@/components/game/ManageHeroModal";
import { ItemDetailsModal } from "@/components/game/ItemDetailsModal";
import { EndGameModal } from "@/components/game/EndGameModal";
import { WoundRulesModal } from "@/components/game/WoundRulesModal";
import { CharacterInfoModal } from "@/components/game/CharacterInfoModal";
import { SpellbookModal } from "@/components/game/SpellbookModal";
import { characterClasses } from "@/config/characterClasses";
import { AmbushModal } from "@/components/game/AmbushModal";
import { DwarfAbilityModal } from "@/components/game/DwarfAbilityModal";
import { WarriorAbilityModal } from "@/components/game/WarriorAbilityModal";

export function GameDashboard() {
  const { 
    gameState, 
    currentUser, 
    proposeEndGame, 
    setPlayerSpells,
    stealGoldFromPlayer,
    stealItemFromPlayer,
    addGoldBonus,
    warriorSurvives,
    killPlayer,
    passTurn
  } = useMultiplayerGame();
  const playerList = Object.values(gameState.players);
  const { room, players } = gameState;

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const editingPlayer = editingPlayerId ? gameState.players[editingPlayerId] : null;
  const [showingItem, setShowingItem] = useState(null);
  const [showWoundRules, setShowWoundRules] = useState(false);
  const [showingInfoForPlayer, setShowingInfoForPlayer] = useState(null);
  const [editingSpellsForPlayer, setEditingSpellsForPlayer] = useState(null);
  const [ambushTarget, setAmbushTarget] = useState(null);
  const [isDwarfModalOpen, setIsDwarfModalOpen] = useState(false);
  const [warriorLastChance, setWarriorLastChance] = useState(null);

  const handleCardClick = (player) => {
    if (player.id === currentUser.id) {
      setEditingPlayerId(player.id);
    }
  };

  const handleItemClick = (item) => {
    setShowingItem(item);
  };
  
  const handleAmbushClick = (targetPlayer) => {
    setAmbushTarget(targetPlayer);
  };
  
  const handleDwarfAbilityConfirm = () => {
    addGoldBonus(currentUser.id, 1000);
  };
  
  const handleWarriorDeathAttempt = (player) => {
    setWarriorLastChance(player);
  };

  const handleProposeEndGame = () => {
    if (!currentUser || !currentUser.character) return;
    const classData = characterClasses.find(c => c.name === currentUser.character.className);
    if (!classData) return;
    
    if (currentUser.gold >= classData.goldTarget) {
      proposeEndGame();
    } else {
      alert(`Você ainda não atingiu sua meta de ouro! Você precisa de ${classData.goldTarget.toLocaleString('pt-BR')} de ouro para propor o fim do jogo.`);
    }
  };

  const hasPendingProposal = !!room?.endGameProposal;
  const isMyTurn = room?.currentTurnPlayerId === currentUser?.id;
  const currentTurnPlayer = players[room?.currentTurnPlayerId];

  return (
    <>
      <div className="h-full w-full bg-transparent safe-area-top safe-area-left safe-area-right">
        <header className="hidden sm:block container-mobile-safe py-4 sm:py-8 mb-4 sm:mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-ethereal-blue">A Aventura Começou!</h1>
                {currentTurnPlayer && (
                  <p className="text-lg text-stone-light mt-1">
                    É a vez de: <span className="font-bold" style={{ color: currentTurnPlayer.color }}>{currentTurnPlayer.name}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isMyTurn && (
                  <Button onClick={passTurn} className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-6 h-12">
                    Finalizar Turno
                  </Button>
                )}
                <Button onClick={() => setShowWoundRules(true)} className="bg-blood-red hover:bg-red-700 text-white font-bold text-lg px-6 h-12">⚔️ Regras de Combate</Button>
                <Button onClick={handleProposeEndGame} disabled={hasPendingProposal} className="bg-treasure-gold hover:bg-yellow-500 text-dungeon-black font-bold text-lg px-6 h-12 disabled:opacity-50">{hasPendingProposal ? 'Votação em Andamento...' : 'Finalizar Jogo'}</Button>
              </div>
            </div>
          </div>
        </header>
        <header className="sm:hidden container-mobile-safe py-4 mb-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-ethereal-blue">A Aventura Começou!</h1>
            {currentTurnPlayer && (
              <p className="text-md text-stone-light mt-1">
                Turno de: <span className="font-bold" style={{ color: currentTurnPlayer.color }}>{currentTurnPlayer.name}</span>
              </p>
            )}
          </div>
        </header>
        <main className="container-mobile-safe pb-24 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {playerList.map(player => (
                <HeroStatusCard 
                  key={player.id} 
                  player={player} 
                  isCurrentUser={player.id === currentUser.id}
                  isCurrentTurn={player.id === room?.currentTurnPlayerId} 
                  onClick={() => handleCardClick(player)} 
                  onItemClick={handleItemClick}
                  onInfoClick={() => setShowingInfoForPlayer(player)}
                  onManageSpells={() => setEditingSpellsForPlayer(player)}
                  onAmbush={handleAmbushClick}
                  onOpenDwarfModal={() => setIsDwarfModalOpen(true)}
                  onWarriorDeathAttempt={() => handleWarriorDeathAttempt(player)}
                />
              ))}
            </div>
          </div>
        </main>
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-stone-charcoal/95 backdrop-blur-md border-t border-stone-light/20 p-4 safe-area-bottom">
          <div className="flex flex-col gap-2 max-w-sm mx-auto">
             {isMyTurn && (
                  <Button onClick={passTurn} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm min-h-[48px]">
                    Finalizar Turno
                  </Button>
                )}
            <div className="flex gap-2">
                <Button onClick={() => setShowWoundRules(true)} className="flex-1 bg-blood-red hover:bg-red-700 text-white font-bold text-sm min-h-[48px]">⚔️ Regras</Button>
                <Button onClick={handleProposeEndGame} disabled={hasPendingProposal} className="flex-1 bg-treasure-gold hover:bg-yellow-500 text-dungeon-black font-bold text-sm min-h-[48px] disabled:opacity-50">{hasPendingProposal ? 'Votando...' : 'Finalizar'}</Button>
            </div>
          </div>
        </div>
      </div>
      <ManageHeroModal player={editingPlayer} isOpen={!!editingPlayerId} onClose={() => setEditingPlayerId(null)}/>
      <ItemDetailsModal item={showingItem} isOpen={!!showingItem} onClose={() => setShowingItem(null)}/>
      <EndGameModal />
      <WoundRulesModal isOpen={showWoundRules} onClose={() => setShowWoundRules(false)}/>
      
      <CharacterInfoModal 
        player={showingInfoForPlayer} 
        isOpen={!!showingInfoForPlayer} 
        onClose={() => setShowingInfoForPlayer(null)}
      />

      <SpellbookModal 
        player={editingSpellsForPlayer}
        isOpen={!!editingSpellsForPlayer}
        onClose={() => setEditingSpellsForPlayer(null)}
        onSave={setPlayerSpells}
      />
      
      <AmbushModal
        isOpen={!!ambushTarget}
        onClose={() => setAmbushTarget(null)}
        thief={currentUser}
        target={ambushTarget}
        onStealGold={stealGoldFromPlayer}
        onStealItem={stealItemFromPlayer}
      />

      <DwarfAbilityModal
        isOpen={isDwarfModalOpen}
        onClose={() => setIsDwarfModalOpen(false)}
        onConfirm={handleDwarfAbilityConfirm}
      />

      <WarriorAbilityModal
        isOpen={!!warriorLastChance}
        onClose={() => setWarriorLastChance(null)}
        onSuccess={() => warriorSurvives(warriorLastChance.id)}
        onFailure={() => killPlayer(warriorLastChance.id)}
      />
    </>
  );
}
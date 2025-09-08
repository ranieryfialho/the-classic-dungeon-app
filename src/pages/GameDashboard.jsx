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

export function GameDashboard() {
  const { 
    gameState, 
    currentUser, 
    proposeEndGame, 
    setPlayerSpells,
    stealGoldFromPlayer,
    stealItemFromPlayer 
  } = useMultiplayerGame();
  const playerList = Object.values(gameState.players);

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const editingPlayer = editingPlayerId ? gameState.players[editingPlayerId] : null;
  const [showingItem, setShowingItem] = useState(null);
  const [showWoundRules, setShowWoundRules] = useState(false);
  const [showingInfoForPlayer, setShowingInfoForPlayer] = useState(null);
  const [editingSpellsForPlayer, setEditingSpellsForPlayer] = useState(null);
  const [ambushTarget, setAmbushTarget] = useState(null);

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

  const hasPendingProposal = !!gameState.room?.endGameProposal;

  return (
    <>
      <div className="h-full w-full bg-transparent safe-area-top safe-area-left safe-area-right">
        <header className="hidden sm:block container-mobile-safe py-4 sm:py-8 mb-4 sm:mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl sm:text-4xl font-bold text-ethereal-blue">A Aventura Começou!</h1>
              <div className="flex gap-3">
                <Button onClick={() => setShowWoundRules(true)} className="bg-blood-red hover:bg-red-700 text-white font-bold text-lg px-6 py-3">⚔️ Regras de Combate</Button>
                <Button onClick={handleProposeEndGame} disabled={hasPendingProposal} className="bg-treasure-gold hover:bg-yellow-500 text-dungeon-black font-bold text-lg px-6 py-3 disabled:opacity-50">{hasPendingProposal ? 'Votação em Andamento...' : 'Finalizar Jogo'}</Button>
              </div>
            </div>
          </div>
        </header>
        <header className="sm:hidden container-mobile-safe py-4 mb-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-ethereal-blue">A Aventura Começou!</h1>
          </div>
        </header>
        <main className="container-mobile-safe pb-20 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {playerList.map(player => (
                <HeroStatusCard 
                  key={player.id} 
                  player={player} 
                  isCurrentUser={player.id === currentUser.id} 
                  onClick={() => handleCardClick(player)} 
                  onItemClick={handleItemClick}
                  onInfoClick={() => setShowingInfoForPlayer(player)}
                  onManageSpells={() => setEditingSpellsForPlayer(player)}
                  onAmbush={handleAmbushClick}
                />
              ))}
            </div>
          </div>
        </main>
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-stone-charcoal/95 backdrop-blur-md border-t border-stone-light/20 p-4 safe-area-bottom">
          <div className="flex gap-2 max-w-sm mx-auto">
            <Button onClick={() => setShowWoundRules(true)} className="flex-1 bg-blood-red hover:bg-red-700 text-white font-bold text-sm min-h-[48px]">⚔️ Regras</Button>
            <Button onClick={handleProposeEndGame} disabled={hasPendingProposal} className="flex-1 bg-treasure-gold hover:bg-yellow-500 text-dungeon-black font-bold text-sm min-h-[48px] disabled:opacity-50">{hasPendingProposal ? 'Votando...' : 'Finalizar'}</Button>
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
    </>
  );
}
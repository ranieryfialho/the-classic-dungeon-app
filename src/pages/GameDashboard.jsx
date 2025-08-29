import { useState } from "react";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { HeroStatusCard } from "@/components/game/HeroStatusCard";
import { Button } from "@/components/ui/button";
import { ManageHeroModal } from "@/components/game/ManageHeroModal";
import { ItemDetailsModal } from "@/components/game/ItemDetailsModal";
import { EndGameModal } from "@/components/game/EndGameModal";
import { WoundRulesModal } from "@/components/game/WoundRulesModal";
import { characterClasses } from "@/config/characterClasses";

export function GameDashboard() {
  const { gameState, currentUser, proposeEndGame } = useMultiplayerGame();
  const playerList = Object.values(gameState.players);

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const editingPlayer = editingPlayerId ? gameState.players[editingPlayerId] : null;
  const [showingItem, setShowingItem] = useState(null);
  const [showWoundRules, setShowWoundRules] = useState(false);
  
  const handleCardClick = (player) => {
    if (player.id === currentUser.id) {
      setEditingPlayerId(player.id);
    }
  };

  const handleItemClick = (item) => {
    setShowingItem(item);
  };

  const handleProposeEndGame = () => {
    if (!currentUser || !currentUser.character) return;

    // Encontra os dados da classe do jogador atual
    const classData = characterClasses.find(c => c.name === currentUser.character.className);
    if (!classData) return;

    // Verifica se o ouro do jogador é maior ou igual à meta
    if (currentUser.gold >= classData.goldTarget) {
      proposeEndGame();
    } else {
      // Se não for, exibe um alerta
      alert(`Você ainda não atingiu sua meta de ouro! Você precisa de ${classData.goldTarget.toLocaleString('pt-BR')} de ouro para propor o fim do jogo.`);
    }
  };

  const hasPendingProposal = !!gameState.room?.endGameProposal;

  return (
    <>
      <div className="min-h-screen w-full bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black p-4 md:p-8">
        <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-ethereal-blue">A Aventura Começou!</h1>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowWoundRules(true)}
              className="bg-blood-red hover:bg-red-700 text-white font-bold text-lg"
            >
              ⚔️ Regras de Combate
            </Button>
            <Button 
              onClick={handleProposeEndGame} 
              disabled={hasPendingProposal}
              className="bg-treasure-gold hover:bg-divine-amber text-dungeon-black font-bold text-lg"
            >
              {hasPendingProposal ? 'Votação em Andamento...' : 'Finalizar Jogo'}
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {playerList.map(player => (
            <HeroStatusCard 
              key={player.id} 
              player={player}
              isCurrentUser={player.id === currentUser.id}
              onClick={() => handleCardClick(player)}
              onItemClick={handleItemClick}
            />
          ))}
        </main>
      </div>
      
      <ManageHeroModal 
        player={editingPlayer}
        isOpen={!!editingPlayerId}
        onClose={() => setEditingPlayerId(null)}
      />

      <ItemDetailsModal
        item={showingItem}
        isOpen={!!showingItem}
        onClose={() => setShowingItem(null)}
      />
      
      <EndGameModal />
      
      <WoundRulesModal 
        isOpen={showWoundRules}
        onClose={() => setShowWoundRules(false)}
      />
    </>
  );
}
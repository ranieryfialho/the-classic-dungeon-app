import { useState } from "react";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { HeroStatusCard } from "@/components/game/HeroStatusCard";
import { Button } from "@/components/ui/button";
import { ManageHeroModal } from "@/components/game/ManageHeroModal";
import { ItemDetailsModal } from "@/components/game/ItemDetailsModal";

export function GameDashboard() {
  const { gameState, currentUser, endGameAndSaveHistory } = useMultiplayerGame();
  const playerList = Object.values(gameState.players);

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const editingPlayer = editingPlayerId ? gameState.players[editingPlayerId] : null;

  const [showingItem, setShowingItem] = useState(null);
  
  const handleEndGame = () => {
    if (window.confirm("Tem certeza que deseja encerrar o jogo? O histórico será salvo.")) {
      endGameAndSaveHistory();
    }
  };

  const handleCardClick = (player) => {
    if (player.id === currentUser.id) {
      setEditingPlayerId(player.id);
    }
  };

  const handleItemClick = (item) => {
    setShowingItem(item);
  };

  return (
    <>
      <div className="min-h-screen w-full bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black p-4 md:p-8">
        <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-ethereal-blue">A Aventura Começou!</h1>
          <Button variant="destructive" onClick={handleEndGame}>Encerrar Jogo</Button>
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
    </>
  );
}
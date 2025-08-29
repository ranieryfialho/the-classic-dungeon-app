import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX } from 'lucide-react';

export function PlayerCard({ player, isHost, isCurrentUser, onRemove }) {
  
  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja remover ${player.name} da sala?`)) {
      onRemove(player.id);
    }
  };

  return (
    <Card 
      className="p-4 bg-dungeon-black/50 border-2 flex items-center justify-between gap-3 transition-colors" 
      style={{ borderColor: player.color }}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div 
          className="w-4 h-4 rounded-full shrink-0" 
          style={{ backgroundColor: player.color }} 
        />
        <span className="text-white font-medium text-lg truncate" title={player.name}>{player.name}</span>
        {player.isHost && <span className="text-yellow-400 text-lg" title="Host da Sala">👑</span>}
      </div>

      {isHost && !isCurrentUser && (
        <Button 
          onClick={handleRemoveClick}
          variant="destructive" 
          size="icon" 
          className="h-8 w-8 bg-red-900/70 hover:bg-red-800/90 shrink-0"
          title={`Remover ${player.name}`}
        >
          <UserX className="h-4 w-4" />
          <span className="sr-only">Remover jogador</span>
        </Button>
      )}
    </Card>
  );
}
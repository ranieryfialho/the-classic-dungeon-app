import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";

export function TeamStatus() {
  const { gameState, currentUser, selectCharacterForPlayer } = useMultiplayerGame();
  const playerList = Object.values(gameState.players);

  return (
    <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
      <CardHeader>
        <CardTitle className="text-xl text-ethereal-blue">Status da Equipe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {playerList.map(player => (
          <div 
            key={player.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-dungeon-black/50 border-l-4"
            style={{ borderColor: player.color }}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
              <span className="font-semibold">{player.name}</span>
            </div>
            
            {player.character ? (
              <div className="text-right">
                <p className="font-bold text-white">{player.character.name}</p>
                <p className="text-sm text-stone-light">{player.character.className}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-stone-light italic">Escolhendo...</p>
                {/* --- BOTÃO DE TESTE ADICIONADO AQUI --- */}
                {/* Ele só aparece para os outros jogadores */}
                {player.id !== currentUser.id && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-auto p-1 text-lg hover:bg-stone-charcoal"
                    onClick={() => selectCharacterForPlayer(player.id)}
                    title={`Escolher por ${player.name}`}
                  >
                    🎲
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
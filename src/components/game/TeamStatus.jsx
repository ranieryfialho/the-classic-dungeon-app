import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";

export function TeamStatus() {
  const { gameState } = useMultiplayerGame();
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
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
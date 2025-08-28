import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "@/components/game/PlayerCard";

export function RoomLobby() {
  // 1. Importar a função backToMenu
  const { gameState, startGameSelection, backToMenu } = useMultiplayerGame();
  const { room, players } = gameState;
  const playerList = Object.values(players);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(room.inviteLink);
    // Podemos usar um feedback melhor no futuro, mas por enquanto isso funciona.
    alert("Link copiado para a área de transferência!");
  };

  return (
    <div className="min-h-screen w-full bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl mx-auto w-full">

        <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white mb-6">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold text-ethereal-blue">🏰 Sala de {room.hostName}</CardTitle>
            <Button onClick={backToMenu} variant="outline" className="text-white hover:text-white bg-crystal-blue hover:bg-frost-blue">
              Voltar ao Menu
            </Button>
          </CardHeader>
          <CardContent>
            <label className="text-sm font-medium text-frost-blue">Link de Convite</label>
            <div className="flex space-x-2 mt-2">
              <Input readOnly value={room.inviteLink} className="bg-dungeon-black border-stone-light/30" />
              <Button onClick={copyInviteLink} className="bg-arcane-blue hover:bg-crystal-blue border border-frost-blue/50">Copiar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Card dos Jogadores */}
        <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">👥 Jogadores na Sala ({playerList.length}/4)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playerList.map(player => <PlayerCard key={player.id} player={player} />)}
          </CardContent>
        </Card>

        {/* Ações do Host */}
        <div className="text-center">
          <Button 
            onClick={startGameSelection}
            size="lg" 
            disabled={playerList.length < 2}
            className="bg-crystal-blue hover:bg-frost-blue text-white font-bold text-xl py-6 px-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎭 Iniciar Seleção de Personagens
          </Button>
          <p className="text-stone-light text-sm mt-2">
            É necessário no mínimo 2 jogadores para começar.
          </p>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Dice = ({ value }) => (
  <div className="w-16 h-16 bg-white border-2 border-gray-400 rounded-lg flex items-center justify-center text-black font-bold text-3xl">
    {value}
  </div>
);

export function TurnOrderModal() {
  const { gameState, currentUser, submitTurnRoll, finalizeTurnOrder, backToMenu } = useMultiplayerGame();
  const { players, room } = gameState;
  const playerList = Object.values(players);
  const turnRolls = room?.turnRolls || {};
  const [isResolving, setIsResolving] = useState(false);

  const myRoll = turnRolls[currentUser.id];
  const allPlayersRolled = playerList.length > 0 && Object.keys(turnRolls).length === playerList.length;

  const handleRollDice = () => {
    if (myRoll) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    submitTurnRoll(currentUser.id, roll);
  };

  useEffect(() => {
    if (allPlayersRolled && currentUser.isHost && !isResolving) {
      setIsResolving(true);
      setTimeout(() => {
        const sortedPlayerIds = playerList
          .sort((a, b) => {
            const rollA = turnRolls[a.id];
            const rollB = turnRolls[b.id];
            if (rollB !== rollA) {
              return rollB - rollA;
            }
            // Em caso de empate, a ordem de entrada na sala decide
            return new Date(a.joinedAt) - new Date(b.joinedAt);
          })
          .map(p => p.id);
        
        finalizeTurnOrder(sortedPlayerIds);
      }, 3000); // Aguarda 3 segundos para todos verem os resultados
    }
  }, [allPlayersRolled, currentUser, isResolving, playerList, turnRolls, finalizeTurnOrder]);
  
  return (
    <div className="h-full w-full flex items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-lg mx-auto bg-stone-charcoal/80 border-stone-light/20 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-ethereal-blue text-center">Ordem de Jogo</CardTitle>
          <CardDescription className="text-stone-light text-center pt-2">
            Cada jogador deve rolar um dado. O maior resultado joga primeiro!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {playerList.map(player => (
            <div 
              key={player.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-dungeon-black/50 border-l-4"
              style={{ borderColor: player.color }}
            >
              <span className="font-semibold text-lg">{player.name}</span>
              {turnRolls[player.id] ? (
                <Dice value={turnRolls[player.id]} />
              ) : (
                player.id === currentUser.id ? (
                  <Button onClick={handleRollDice}>Rolar Dado</Button>
                ) : (
                  <span className="text-stone-light/70 italic">Aguardando...</span>
                )
              )}
            </div>
          ))}
          {allPlayersRolled && (
             <p className="text-center text-treasure-gold font-bold pt-4 animate-pulse">
                Definindo ordem de turno...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
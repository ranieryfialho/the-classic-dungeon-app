import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function PlayerProfile() {
  const { currentUser } = useAuth();
  const { backToMenu } = useMultiplayerGame();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const matchesRef = collection(db, 'matches');
        const q = query(
          matchesRef,
          where('players', 'array-contains-any', [{ userId: currentUser.uid }]),
          orderBy('endedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const userMatches = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const filteredMatches = userMatches.filter(match => 
            match.players.some(player => player.userId === currentUser.uid)
        );

        setMatches(filteredMatches);
      } catch (error) {
        console.error("Erro ao buscar histórico de partidas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [currentUser]);

  return (
    <div className="min-h-screen w-full bg-dungeon-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-ethereal-blue">Seu Perfil</h1>
            <p className="text-stone-light">{currentUser?.email}</p>
          </div>
          <Button onClick={backToMenu} variant="outline" className="bg-weathered-gray hover:bg-stone-light">
            Voltar ao Menu
          </Button>
        </header>

        <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-frost-blue">📜 Histórico de Partidas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-stone-light">Carregando histórico...</p>}
            {!loading && matches.length === 0 && <p className="text-stone-light">Nenhuma partida encontrada.</p>}
            
            <div className="space-y-4">
              {matches.map(match => (
                <div key={match.id} className="p-4 rounded-lg bg-dungeon-black/50 border-l-4 border-treasure-gold">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-lg">
                      Vencedor: <span className="text-treasure-gold">{match.winnerName}</span>
                    </p>
                    <p className="text-sm text-stone-light">
                      {match.endedAt?.toDate().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Jogadores ({match.playerCount}):</p>
                    <ul className="list-disc list-inside pl-2 space-y-1">
                      {match.players.map(p => (
                        <li key={p.userId} className={p.userId === currentUser.uid ? 'text-ethereal-blue' : ''}>
                          {p.playerName} ({p.characterClass}) - {p.gold.toLocaleString('pt-BR')} de ouro
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
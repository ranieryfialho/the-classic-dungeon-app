import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PlayerProfile() {
  const { currentUser } = useAuth();
  const { backToMenu } = useMultiplayerGame();
  
  // Estados para os dados do perfil e do histórico
  const [displayName, setDisplayName] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para as estatísticas
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalWins, setTotalWins] = useState(0);

  // ++ NOVOS ESTADOS PARA HÁBITOS DO JOGADOR ++
  const [favoriteClass, setFavoriteClass] = useState(null);
  const [frequentPlayers, setFrequentPlayers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        // 1. Buscar dados do perfil (displayName)
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setDisplayName(userDocSnap.data().displayName || currentUser.email);
        } else {
          setDisplayName(currentUser.email);
        }

        // 2. Buscar histórico de partidas
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('players', 'array-contains-any', [{ userId: currentUser.uid }]), orderBy('endedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const userMatches = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(match => match.players.some(player => player.userId === currentUser.uid));
        
        setMatches(userMatches);

        // 3. Calcular estatísticas básicas
        setTotalMatches(userMatches.length);
        const wins = userMatches.filter(match => match.winnerId === currentUser.uid).length;
        setTotalWins(wins);

        // ++ 4. CALCULAR HÁBITOS DO JOGADOR ++
        if (userMatches.length > 0) {
          // Calcular classe favorita
          const classCounts = userMatches.reduce((acc, match) => {
            const myPlayer = match.players.find(p => p.userId === currentUser.uid);
            if (myPlayer) {
              acc[myPlayer.characterClass] = (acc[myPlayer.characterClass] || 0) + 1;
            }
            return acc;
          }, {});
          const favClass = Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b);
          setFavoriteClass(favClass);

          // Calcular jogadores frequentes
          const playerCounts = userMatches.reduce((acc, match) => {
            match.players.forEach(player => {
              if (player.userId !== currentUser.uid) {
                acc[player.playerName] = (acc[player.playerName] || 0) + 1;
              }
            });
            return acc;
          }, {});
          const sortedPlayers = Object.entries(playerCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3); // Pega o top 3
          setFrequentPlayers(sortedPlayers);
        }

      } catch (error) {
        console.error("Erro ao buscar dados do perfil ou histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!currentUser || !displayName) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { displayName: displayName, email: currentUser.email }, { merge: true });
      alert("Perfil salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar o perfil:", error);
      alert("Não foi possível salvar o perfil.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <div><h1 className="text-4xl font-bold text-ethereal-blue">Seu Perfil</h1></div>
          <Button onClick={backToMenu} variant="outline" className="text-white hover:text-white bg-crystal-blue hover:bg-frost-blue">Voltar ao Menu</Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8">
            <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
              <CardHeader><CardTitle className="text-2xl text-frost-blue">⚙️ Editar Perfil</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="displayName" className="text-stone-light">Nome de Jogador</Label>
                  <Input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome no jogo" className="mt-2 bg-dungeon-black border-ancient-stone"/>
                </div>
                <Button onClick={handleSaveProfile} className="w-full bg-crystal-blue hover:bg-frost-blue">Salvar Alterações</Button>
              </CardContent>
            </Card>

            <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
              <CardHeader><CardTitle className="text-2xl text-frost-blue">📊 Estatísticas</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-lg">
                <div className="flex justify-between items-center"><span className="text-stone-light">Partidas Jogadas:</span><span className="font-bold text-white">{loading ? '...' : totalMatches}</span></div>
                <div className="flex justify-between items-center"><span className="text-stone-light">Vitórias:</span><span className="font-bold text-treasure-gold">{loading ? '...' : totalWins}</span></div>
                <div className="flex justify-between items-center"><span className="text-stone-light">Taxa de Vitória:</span><span className="font-bold text-white">{loading ? '...' : (totalMatches > 0 ? `${((totalWins / totalMatches) * 100).toFixed(0)}%` : '0%')}</span></div>
              </CardContent>
            </Card>

            <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
              <CardHeader><CardTitle className="text-2xl text-frost-blue">⚔️ Tendências</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-lg">
                <div className="flex justify-between items-center">
                  <span className="text-stone-light">Classe Favorita:</span>
                  <span className="font-bold text-ethereal-blue">{loading ? '...' : (favoriteClass || 'N/A')}</span>
                </div>
                <div>
                  <span className="text-stone-light">Companheiros Frequentes:</span>
                  {loading ? <p className="text-sm text-white">...</p> : (
                    <ul className="text-base mt-2 space-y-1">
                      {frequentPlayers.length > 0 ? frequentPlayers.map(([name, count]) => (
                        <li key={name} className="flex justify-between">
                          <span className="font-semibold text-white">{name}</span>
                          <span className="text-stone-light">{count} {count > 1 ? 'jogos' : 'jogo'}</span>
                        </li>
                      )) : <p className="text-sm text-stone-light/70">Nenhum companheiro registrado</p>}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-2 bg-stone-charcoal/80 border-stone-light/20 text-white">
            <CardHeader><CardTitle className="text-2xl text-frost-blue">📜 Histórico de Partidas</CardTitle></CardHeader>
            <CardContent className="max-h-[44rem] overflow-y-auto">
              {loading && <p className="text-stone-light">Carregando histórico...</p>}
              {!loading && matches.length === 0 && <p className="text-stone-light">Nenhuma partida encontrada.</p>}
              <div className="space-y-4">
                {matches.map(match => (
                  <div key={match.id} className="p-4 rounded-lg bg-dungeon-black/50 border-l-4 border-treasure-gold">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-lg">Vencedor: <span className="text-treasure-gold">{match.winnerName}</span></p>
                      <p className="text-sm text-stone-light">{match.endedAt?.toDate().toLocaleDateString('pt-BR')}</p>
                    </div>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-sm">
                      {match.players.map(p => (
                        <li key={p.userId} className={p.userId === currentUser.uid ? 'text-ethereal-blue font-semibold' : ''}>
                          {p.playerName} ({p.characterClass}) - {p.gold.toLocaleString('pt-BR')} de ouro
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
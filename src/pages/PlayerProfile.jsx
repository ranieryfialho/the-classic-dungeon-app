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
  
  const [displayName, setDisplayName] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [mostPlayedClass, setMostPlayedClass] = useState(null);
  const [mostPlayedWith, setMostPlayedWith] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setDisplayName(userDocSnap.data().displayName || currentUser.email);
        } else {
          setDisplayName(currentUser.email);
        }

        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('playerIds', 'array-contains', currentUser.uid), orderBy('endedAt', 'desc'));
        
        const querySnapshot = await getDocs(q);
        const userMatches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMatches(userMatches);

        if (userMatches.length > 0) {
          setTotalMatches(userMatches.length);
          const wins = userMatches.filter(match => match.winnerId === currentUser.uid).length;
          setTotalWins(wins);

          const classCounts = {};
          userMatches.forEach(match => {
            const myPlayer = match.players.find(p => p.userId === currentUser.uid);
            if (myPlayer) {
              const className = myPlayer.characterClass;
              classCounts[className] = (classCounts[className] || 0) + 1;
            }
          });
          const mostPlayed = Object.keys(classCounts).reduce((a, b) => classCounts[a] > classCounts[b] ? a : b);
          setMostPlayedClass(mostPlayed);

          const companionCounts = {};
          userMatches.forEach(match => {
            match.playerIds.forEach(id => {
              if (id !== currentUser.uid) {
                companionCounts[id] = (companionCounts[id] || 0) + 1;
              }
            });
          });
          if (Object.keys(companionCounts).length > 0) {
            const mostFrequentId = Object.keys(companionCounts).reduce((a, b) => companionCounts[a] > companionCounts[b] ? a : b);
            const userDoc = await getDoc(doc(db, 'users', mostFrequentId));
            setMostPlayedWith(userDoc.exists() ? userDoc.data().displayName : 'Companheiro');
          }
        }
      } catch (error) {
        console.error("ERRO: Verifique se o índice do Firestore foi criado.", error);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-ethereal-blue">Seu Perfil</h1>
          </div>
          <div className="flex space-x-2">
            <Button onClick={backToMenu} variant="outline" className="bg-weathered-gray hover:bg-stone-light">
              Voltar ao Menu
            </Button>
          </div>
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
                <div className="flex justify-between items-center"><span className="text-stone-light">Classe Preferida:</span><span className="font-bold text-white">{loading ? '...' : (mostPlayedClass || 'N/A')}</span></div>
                <div className="flex justify-between items-center"><span className="text-stone-light">Principal Aliado:</span><span className="font-bold text-white">{loading ? '...' : (mostPlayedWith || 'N/A')}</span></div>
              </CardContent>
            </Card>
          </div>
          <Card className="lg:col-span-2 bg-stone-charcoal/80 border-stone-light/20 text-white">
            <CardHeader><CardTitle className="text-2xl text-frost-blue">📜 Histórico de Partidas</CardTitle></CardHeader>
            <CardContent className="max-h-[30rem] overflow-y-auto">
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
                      {match.players.map(p => (<li key={p.userId} className={p.userId === currentUser.uid ? 'text-ethereal-blue font-semibold' : ''}>{p.playerName} ({p.characterClass}) - {p.gold.toLocaleString('pt-BR')} de ouro</li>))}
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

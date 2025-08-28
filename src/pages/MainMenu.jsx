import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function MainMenu() {
  const { createRoom, goToProfile, goToJoinRoom } = useMultiplayerGame(); 

  const { currentUser, logout } = useAuth(); //
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const fetchPlayerName = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().displayName) {
            setPlayerName(userDocSnap.data().displayName);
          } else {
            setPlayerName(currentUser.email);
          }
        } catch (error) {
          console.error("Erro ao buscar nome do jogador:", error);
          setPlayerName(currentUser.email);
        }
      }
    };
    fetchPlayerName();
  }, [currentUser]);

  const handleLogout = () => {
    if (window.confirm("Você tem certeza que deseja sair?")) {
      logout();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black">
      <div className="text-center">
        {playerName && (
          <h2 className="text-2xl text-stone-light mb-4">
            Bem-vindo, <span className="font-bold text-ethereal-blue">{playerName}!</span>
          </h2>
        )}
        <Card className="w-[400px] bg-stone-charcoal/80 border-stone-light/20 text-white inline-block">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-ethereal-blue drop-shadow-[0_2px_8px_rgba(147,197,253,0.4)]">
              🏰 The Classic Dungeon
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Button onClick={createRoom} variant="outline" size="lg" className="bg-arcane-blue hover:bg-crystal-blue text-white font-bold text-lg border-frost-blue/50 hover:text-white">
              Criar Nova Sala
            </Button>
            <Button onClick={goToJoinRoom} variant="secondary" size="lg" className="bg-weathered-gray hover:bg-stone-light text-white font-bold text-lg border-stone-light/50">
              Entrar em uma Sala
            </Button>
            <Button onClick={goToProfile} variant="outline" size="lg" className="bg-void-purple/80 hover:bg-void-purple text-white hover:text-white font-bold text-lg border-stone-light/50">
              Ver Perfil e Histórico
            </Button>
            <Button 
              onClick={handleLogout}
              variant="destructive" 
              size="lg" 
              className="font-bold text-lg"
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
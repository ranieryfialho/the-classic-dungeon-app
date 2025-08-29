// src/pages/MainMenu.jsx

import { useState, useEffect } from 'react';
// Importações de ícones da biblioteca lucide-react (AGORA CORRIGIDO E VERIFICADO)
import { Swords, DoorOpen, ScrollText, LogOut, Shield } from 'lucide-react'; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function MainMenu() {
  const { createRoom, goToProfile, goToJoinRoom } = useMultiplayerGame(); 
  const { currentUser, logout } = useAuth();
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
    <div className="min-h-screen full-height w-full flex items-center justify-center bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black safe-top safe-bottom safe-left safe-right">
      <div className="container-mobile-safe py-4 sm:py-8">
        <div className="text-center max-w-md mx-auto">
          {playerName && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-2xl text-stone-light mb-2">
                Bem-vindo,
              </h2>
              <p className="text-xl sm:text-2xl font-bold text-ethereal-blue break-words">
                {playerName}!
              </p>
            </div>
          )}

          <Card className="w-full max-w-sm sm:max-w-md mx-auto bg-stone-charcoal/80 border-stone-light/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-ethereal-blue drop-shadow-[0_2px_8px_rgba(147,197,253,0.4)]">
                <div className="mb-2 flex justify-center">
                  <Shield size={48} />
                </div>
                <div className="text-xl sm:text-2xl leading-tight">The Classic Dungeon</div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col space-y-3 sm:space-y-4">
                <Button 
                  onClick={createRoom} 
                  variant="outline" 
                  size="lg" 
                  className="bg-arcane-blue hover:bg-crystal-blue text-white font-bold text-base sm:text-lg border-frost-blue/50 hover:text-white w-full min-h-[48px] sm:min-h-[52px] transition-all duration-200"
                >
                  <Swords />
                  <span>Criar Nova Sala</span>
                </Button>

                <Button 
                  onClick={goToJoinRoom} 
                  variant="secondary" 
                  size="lg" 
                  className="bg-weathered-gray hover:bg-stone-light text-white font-bold text-base sm:text-lg border-stone-light/50 w-full min-h-[48px] sm:min-h-[52px] transition-all duration-200"
                >
                  <DoorOpen />
                  <span>Entrar em uma Sala</span>
                </Button>

                <Button 
                  onClick={goToProfile} 
                  variant="outline" 
                  size="lg" 
                  className="bg-void-purple/80 hover:bg-void-purple text-white hover:text-white font-bold text-base sm:text-lg border-stone-light/50 w-full min-h-[48px] sm:min-h-[52px] transition-all duration-200"
                >
                  <ScrollText />
                  <span className="hidden sm:inline">Ver Perfil e Histórico</span>
                  <span className="sm:hidden">Perfil e Histórico</span>
                </Button>

                <Button 
                  onClick={handleLogout}
                  variant="destructive" 
                  size="lg" 
                  className="font-bold text-base sm:text-lg w-full min-h-[48px] sm:min-h-[52px] mt-4 sm:mt-6 transition-all duration-200"
                >
                  <LogOut />
                  <span>Sair</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-stone-light/60 mobile-hidden">
          </div>
        </div>
      </div>
    </div>
  );
}
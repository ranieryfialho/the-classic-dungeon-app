// src/pages/RoomLobby.jsx - Correção Completa dos Botões Duplicados
import { useState } from 'react';
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "@/components/game/PlayerCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function RoomLobby() {
  const { gameState, startGameSelection, backToMenu } = useMultiplayerGame();
  const { room, players } = gameState;
  const playerList = Object.values(players);

  const [showQrModal, setShowQrModal] = useState(false);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(room.inviteLink);
    // Toast mais amigável para mobile
    const toast = document.createElement('div');
    toast.textContent = 'Link copiado!';
    toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50 text-sm';
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 2000);
  };

  // Função para gerar QR Code usando API externa (Google Charts)
  const getQRCodeUrl = (text) => {
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedText}`;
  };

  return (
    <div className="min-h-screen w-full bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black safe-area-top safe-area-left safe-area-right">
      <div className="container-mobile-safe py-4 sm:py-8 flex items-center justify-center min-h-screen">
        <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-20 sm:pb-0"> {/* Padding bottom apenas no mobile */}
          
          {/* Room Info Card */}
          <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-ethereal-blue text-center sm:text-left">
                🏰 Sala de {room.hostName}
              </CardTitle>
              {/* Botão Voltar APENAS no desktop */}
              <Button 
                onClick={backToMenu} 
                variant="outline" 
                className="hidden sm:inline-flex text-white hover:text-white bg-crystal-blue hover:bg-frost-blue w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
              >
                Voltar ao Menu
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <label className="text-xs sm:text-sm font-medium text-frost-blue block mb-2">
                Link de Convite
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                  readOnly 
                  value={room.inviteLink} 
                  className="bg-dungeon-black border-stone-light/30 text-xs sm:text-sm flex-1" 
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={copyInviteLink}
                    variant="outline" 
                    className="bg-crystal-blue hover:bg-frost-blue text-white hover:text-white font-bold border-stone-light/50 flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm"
                  >
                    <span className="sm:hidden">📋</span>
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                  <Button 
                    onClick={() => setShowQrModal(true)} 
                    variant="outline" 
                    className="bg-void-purple/80 hover:bg-void-purple text-white hover:text-white font-bold border-stone-light/50 flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm"
                  >
                    <span className="sm:hidden">📱</span>
                    <span className="hidden sm:inline">QR Code</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Card */}
          <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-white text-center sm:text-left">
                👥 Jogadores na Sala ({playerList.length}/6)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {playerList.map(player => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Start Game Section - APENAS no desktop */}
          <div className="hidden sm:block text-center space-y-3 sm:space-y-4">
            <Button 
              onClick={startGameSelection}
              size="lg" 
              disabled={playerList.length < 2}
              className="bg-crystal-blue hover:bg-frost-blue text-white font-bold text-base sm:text-xl py-4 sm:py-6 px-6 sm:px-10 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-h-[52px] sm:min-h-[60px]"
            >
              🎭 Iniciar Seleção de Personagens
            </Button>
            <p className="text-xs sm:text-sm text-stone-light">
              É necessário no mínimo 2 jogadores para começar.
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal - Usando API externa */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-[425px] bg-stone-charcoal text-white border-stone-light/20 mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-ethereal-blue text-center">
              QR Code de Convite
            </DialogTitle>
            <DialogDescription className="text-stone-light text-center text-sm">
              Escaneie com seu celular para entrar na sala.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-2 sm:p-4">
            {room.inviteLink && (
              <div className="bg-white p-3 rounded-lg">
                <img 
                  src={getQRCodeUrl(room.inviteLink)}
                  alt="QR Code para entrar na sala"
                  className="w-48 h-48 sm:w-64 sm:h-64"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
            )}
          </div>
          <div className="px-2 sm:px-4">
            <p className="text-center text-xs sm:text-sm text-stone-light break-all bg-dungeon-black/50 p-2 rounded">
              {room.inviteLink}
            </p>
            <Button 
              onClick={copyInviteLink}
              className="w-full mt-3 bg-crystal-blue hover:bg-frost-blue min-h-[44px]"
            >
              📋 Copiar Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Fixed Bottom Actions - APENAS no mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-stone-charcoal/95 backdrop-blur-md border-t border-stone-light/20 p-4 safe-area-bottom">
        <div className="flex flex-col gap-2 max-w-sm mx-auto">
          {/* Botão principal de ação */}
          <Button 
            onClick={startGameSelection}
            disabled={playerList.length < 2}
            className="w-full bg-crystal-blue hover:bg-frost-blue text-white font-bold text-sm min-h-[48px] disabled:opacity-50"
          >
            {playerList.length < 2 ? 'Aguardando jogadores...' : '🎭 Iniciar Seleção'}
          </Button>
          
          {/* Botão secundário */}
          <Button 
            onClick={backToMenu}
            variant="outline"
            className="w-full bg-transparent border-stone-light/30 text-stone-light hover:text-white hover:bg-stone-light/10 font-bold text-sm min-h-[44px]"
          >
            Voltar ao Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
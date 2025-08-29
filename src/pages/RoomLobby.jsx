import { useState } from 'react';
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "@/components/game/PlayerCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Users, ClipboardCopy, QrCode, Link as LinkIcon, ArrowLeft, Play } from 'lucide-react';

export function RoomLobby() {
  const { gameState, startGameSelection, backToMenu, removePlayer, currentUser } = useMultiplayerGame();
  const { room, players } = gameState;
  const playerList = Object.values(players);
  const meIsHost = currentUser ? players[currentUser.id]?.isHost : false;

  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState('');

  const showToast = (message) => {
    setCopied(message);
    setTimeout(() => setCopied(''), 2000);
  };

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    showToast(message);
  };
  
  const copyRoomCode = () => {
    copyToClipboard(room.id, 'Código copiado!');
  };

  const copyInviteLink = () => {
    copyToClipboard(room.inviteLink, 'Link copiado!');
  };

  const getQRCodeUrl = (text) => {
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedText}`;
  };

  return (
    <div className="h-full w-full bg-transparent safe-area-top safe-area-left safe-area-right">
      {copied && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50 animate-in fade-in-0 slide-in-from-top-4 duration-300">
          {copied}
        </div>
      )}
      <div className="container-mobile-safe py-4 sm:py-8 flex items-center justify-center h-full">
        <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-24 sm:pb-0">
          <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-ethereal-blue text-center sm:text-left flex items-center gap-3">
                <Shield />
                Sala de {room.hostName}
              </CardTitle>
              <Button onClick={backToMenu} variant="outline" className="hidden sm:inline-flex bg-weathered-gray hover:bg-stone-light text-white font-bold border-stone-light/50 min-h-[44px] text-sm sm:text-base">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Menu
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-frost-blue block mb-2">Código da Sala</label>
                <div className="flex items-center gap-2 p-2 pr-3 bg-dungeon-black rounded-lg border border-stone-light/30">
                  <p className="text-2xl sm:text-4xl font-mono font-bold text-ethereal-blue tracking-widest flex-1 text-center">{room.id}</p>
                  <Button onClick={copyRoomCode} variant="ghost" size="icon" className="text-stone-light hover:text-white shrink-0">
                    <ClipboardCopy className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-frost-blue block mb-2">Link de Convite</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input readOnly value={room.inviteLink} className="bg-dungeon-black border-stone-light/30 text-xs sm:text-sm flex-1" />
                  <div className="flex gap-2">
                    <Button onClick={copyInviteLink} variant="outline" className="bg-crystal-blue hover:bg-frost-blue text-white font-bold border-stone-light/50 flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm">
                      <LinkIcon className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Copiar Link</span>
                    </Button>
                    <Button onClick={() => setShowQrModal(true)} variant="outline" className="bg-void-purple/80 hover:bg-void-purple text-white font-bold border-stone-light/50 flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm">
                      <QrCode className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">QR Code</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-white text-center sm:text-left flex items-center gap-3">
                <Users />
                Jogadores na Sala ({playerList.length}/6)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {playerList.map(player => (
                  <PlayerCard key={player.id} player={player} isHost={meIsHost} isCurrentUser={player.id === currentUser?.id} onRemove={removePlayer}/>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ===== INÍCIO DA CORREÇÃO ===== */}
          {/* Este bloco de código adiciona o botão de iniciar para telas maiores (desktop) */}
          <div className="hidden sm:flex justify-end mt-4">
            <Button
              onClick={startGameSelection}
              disabled={!meIsHost || playerList.length < 2}
              size="lg"
              className="bg-crystal-blue hover:bg-frost-blue text-white font-bold text-lg min-h-[52px] px-8 disabled:opacity-50"
            >
              <Play className="mr-2 h-5 w-5" />
              {!meIsHost
                ? 'Aguardando o Host iniciar'
                : playerList.length < 2
                ? 'Aguardando mais jogadores...'
                : 'Iniciar Seleção'}
            </Button>
          </div>
          {/* ===== FIM DA CORREÇÃO ===== */}

        </div>
      </div>
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-[425px] bg-stone-charcoal text-white border-stone-light/20 mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-ethereal-blue text-center">QR Code de Convite</DialogTitle>
            <DialogDescription className="text-stone-light text-center text-sm">Escaneie com seu celular para entrar na sala.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-2 sm:p-4">
            {room.inviteLink && (<div className="bg-white p-3 rounded-lg"><img src={getQRCodeUrl(room.inviteLink)} alt="QR Code para entrar na sala" className="w-48 h-48 sm:w-64 sm:h-64" style={{ imageRendering: 'crisp-edges' }}/></div>)}
          </div>
        </DialogContent>
      </Dialog>
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-stone-charcoal/95 backdrop-blur-md border-t border-stone-light/20 p-4 safe-area-bottom">
        <div className="flex flex-col gap-2 max-w-sm mx-auto">
          <Button onClick={startGameSelection} disabled={!meIsHost || playerList.length < 2} className="w-full bg-crystal-blue hover:bg-frost-blue text-white font-bold text-sm min-h-[48px] disabled:opacity-50">
            {!meIsHost 
                ? 'Aguardando o Host'
                : playerList.length < 2 
                    ? 'Aguardando jogadores...' 
                    : '🎭 Iniciar Seleção'
            }
          </Button>
          <Button onClick={backToMenu} variant="outline" className="w-full bg-transparent border-stone-light/30 text-stone-light hover:text-white hover:bg-stone-light/10 font-bold text-sm min-h-[44px]">
            <ArrowLeft className="w-4 h-4 mr-2"/>
            Voltar ao Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
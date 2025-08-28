import { useState } from 'react';
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "@/components/game/PlayerCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QRCode from "react-qr-code";

export function RoomLobby() {
  const { gameState, startGameSelection, backToMenu } = useMultiplayerGame();
  const { room, players } = gameState;
  const playerList = Object.values(players);

  const [showQrCodeModal, setShowQrCodeModal] = useState(false);

  const copyInviteLink = () => {
    navigator.clipboard.writeText(room.inviteLink);
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
              <Button 
                onClick={() => setShowQrCodeModal(true)} 
                variant="outline" 
                className="bg-void-purple/80 hover:bg-void-purple text-white hover:text-white font-bold border-stone-light/50"
              >
                Gerar QR Code
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">👥 Jogadores na Sala ({playerList.length}/6)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playerList.map(player => <PlayerCard key={player.id} player={player} />)}
          </CardContent>
        </Card>

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

      <Dialog open={showQrCodeModal} onOpenChange={setShowQrCodeModal}>
        <DialogContent className="sm:max-w-[425px] bg-stone-charcoal text-white border-stone-light/20">
          <DialogHeader>
            <DialogTitle className="text-2xl text-ethereal-blue">QR Code de Convite</DialogTitle>
            <DialogDescription className="text-stone-light">
              Escaneie com seu celular para entrar na sala.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {room.inviteLink && (
              <div style={{ background: "white", padding: "16px", borderRadius: "8px" }}>
                <QRCode 
                  value={room.inviteLink} 
                  size={256}
                  bgColor="#FFFFFF"
                  fgColor="#242629"
                  level="H"
                />
              </div>
            )}
          </div>
          <p className="text-center text-sm text-stone-light break-all">{room.inviteLink}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
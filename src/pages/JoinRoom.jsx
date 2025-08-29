import { useState, useEffect } from 'react';
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ArrowLeft, QrCode, DoorOpen } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScannerComponent = ({ onScanSuccess }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader-container', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(onScanSuccess, (error) => {});
    return () => {
      if (scanner && scanner.getState() === 2) {
        scanner.clear().catch(err => console.error("Falha ao limpar o scanner.", err));
      }
    };
  }, [onScanSuccess]);
  return <div id="qr-reader-container" />;
};

export function JoinRoom() {
  const { joinRoom, backToMenu } = useMultiplayerGame();
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      setRoomId(roomFromUrl.toUpperCase());
    }
  }, []);

  const handleJoin = async (idToJoin) => {
    const finalRoomId = idToJoin || roomId;
    if (!finalRoomId.trim()) {
      setError("Por favor, insira o código da sala.");
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const success = await joinRoom(finalRoomId.trim().toUpperCase());
      if (!success) {
        setError("Sala não encontrada ou está cheia. Verifique o código e tente novamente.");
      }
    } catch (err) {
      setError("Erro ao conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    try {
      const url = new URL(decodedText);
      const roomFromQr = url.searchParams.get('room');
      if (roomFromQr) {
        const finalRoomId = roomFromQr.toUpperCase();
        setRoomId(finalRoomId);
        handleJoin(finalRoomId);
      } else {
        setError("QR Code inválido. Não contém um link de sala válido.");
      }
    } catch (e) {
      setError("O QR Code lido não parece ser um link de convite válido.");
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    setRoomId(value);
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center bg-transparent safe-top safe-bottom safe-left safe-right">
        <div className="container-mobile-safe py-4 sm:py-8">
          <Card className="w-full max-w-sm sm:max-w-md mx-auto bg-stone-charcoal/80 border-stone-light/20 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-ethereal-blue text-center flex items-center justify-center gap-3">
                <DoorOpen />
                <span>Entrar em uma Aventura</span>
              </CardTitle>
              <CardDescription className="text-stone-light text-center text-sm sm:text-base mt-2">
                Digite o código da sala para se juntar aos seus amigos.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="room-code" className="text-frost-blue text-sm sm:text-base font-medium">Código da Sala</Label>
                  <Input id="room-code" value={roomId} onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder="Ex: J8XF2K" className="bg-dungeon-black border-ancient-stone text-white placeholder:text-stone-light/50 text-lg sm:text-xl tracking-widest text-center font-mono min-h-[48px] sm:min-h-[52px] focus:border-crystal-blue focus:ring-2 focus:ring-crystal-blue/20 transition-all duration-200" maxLength={6} autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck="false" />
                  <p className="text-xs text-stone-light/60 text-center">Códigos têm 6 caracteres (letras e números)</p>
                </div>
                {error && (<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3"><p className="text-sm text-red-400 text-center">{error}</p></div>)}
                <div className="flex flex-col space-y-3">
                  <Button onClick={() => handleJoin()} disabled={isLoading || roomId.length < 4} size="lg" className="bg-crystal-blue hover:bg-frost-blue text-white font-bold text-base sm:text-lg w-full min-h-[48px] sm:min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                    {isLoading ? "Conectando..." : <><LogIn /><span>Entrar na Sala</span></>}
                  </Button>
                  <Button onClick={() => setIsScannerOpen(true)} variant="outline" size="lg" className="bg-void-purple/80 hover:bg-void-purple text-white hover:text-white font-bold text-base sm:text-lg border-stone-light/50 w-full min-h-[48px] sm:min-h-[52px] transition-all duration-200" disabled={isLoading}>
                    <QrCode />
                    <span>Ler QR Code</span>
                  </Button>
                  <Button onClick={backToMenu} variant="secondary" size="lg" className="bg-weathered-gray hover:bg-stone-light text-white font-bold text-base sm:text-lg border-stone-light/50 w-full min-h-[48px] sm:min-h-[52px] transition-all duration-200" disabled={isLoading}>
                    <ArrowLeft />
                    <span>Voltar ao Menu</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="bg-stone-charcoal text-white border-stone-light/20">
          <DialogHeader>
            <DialogTitle className="text-xl text-ethereal-blue">Ler QR Code</DialogTitle>
            <DialogDescription className="text-stone-light">Aponte a câmera para o QR Code de convite.</DialogDescription>
          </DialogHeader>
          <div className="w-full mt-4">
            {isScannerOpen && <QrScannerComponent onScanSuccess={handleScanSuccess} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

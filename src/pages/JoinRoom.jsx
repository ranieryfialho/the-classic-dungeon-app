import { useState, useEffect } from 'react';
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinRoom() {
  const { joinRoom, backToMenu } = useMultiplayerGame();
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      setRoomId(roomFromUrl.toUpperCase());
    }
  }, []);

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setError("Por favor, insira o código da sala.");
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const success = await joinRoom(roomId.trim().toUpperCase());
      if (!success) {
        setError("Sala não encontrada ou está cheia. Verifique o código e tente novamente.");
      }
    } catch (err) {
      setError("Erro ao conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen full-height w-full flex items-center justify-center bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black safe-top safe-bottom safe-left safe-right">
      <div className="container-mobile-safe py-4 sm:py-8">
        <Card className="w-full max-w-sm sm:max-w-md mx-auto bg-stone-charcoal/80 border-stone-light/20 text-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-ethereal-blue text-center">
              🚪 Entrar em uma Aventura
            </CardTitle>
            <CardDescription className="text-stone-light text-center text-sm sm:text-base mt-2">
              Digite o código da sala para se juntar aos seus amigos.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label 
                  htmlFor="room-code" 
                  className="text-frost-blue text-sm sm:text-base font-medium"
                >
                  Código da Sala
                </Label>
                <Input
                  id="room-code"
                  value={roomId}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ex: J8XF2K"
                  className="bg-dungeon-black border-ancient-stone text-white placeholder:text-stone-light/50 text-lg sm:text-xl tracking-widest text-center font-mono min-h-[48px] sm:min-h-[52px] focus:border-crystal-blue focus:ring-2 focus:ring-crystal-blue/20 transition-all duration-200"
                  maxLength={6}
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <p className="text-xs text-stone-light/60 text-center">
                  Códigos têm 6 caracteres (letras e números)
                </p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              <div className="flex flex-col space-y-3">
                <Button 
                  onClick={handleJoin} 
                  disabled={isLoading || roomId.length < 4}
                  size="lg" 
                  className="bg-crystal-blue hover:bg-frost-blue text-white font-bold text-base sm:text-lg w-full min-h-[48px] sm:min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Conectando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>🎯</span>
                      <span>Entrar na Sala</span>
                    </span>
                  )}
                </Button>
                
                <Button 
                  onClick={backToMenu} 
                  variant="secondary" 
                  size="lg" 
                  className="bg-weathered-gray hover:bg-stone-light text-white font-bold text-base sm:text-lg border-stone-light/50 w-full min-h-[48px] sm:min-h-[52px] transition-all duration-200"
                  disabled={isLoading}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>◀️</span>
                    <span>Voltar ao Menu</span>
                  </span>
                </Button>
              </div>

              <div className="text-center space-y-2 pt-2">
                <p className="text-xs text-stone-light/60">
                  💡 Dica: O código da sala está no convite que você recebeu
                </p>
                <p className="text-xs text-stone-light/60">
                  📱 Você também pode usar o QR Code para entrar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center space-y-2 mobile-full-width">
          <Button
            onClick={() => {
              setRoomId('');
              setError('');
            }}
            variant="ghost"
            className="text-stone-light hover:text-white text-sm"
          >
            🔄 Limpar Código
          </Button>
        </div>
      </div>
    </div>
  );
}
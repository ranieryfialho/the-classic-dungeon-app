import { useState } from 'react';
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinRoom() {
  const { joinRoom, backToMenu } = useMultiplayerGame();
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setError("Por favor, insira o código da sala.");
      return;
    }
    setError('');
    const success = await joinRoom(roomId.trim().toUpperCase());
    if (!success) {
      setError("Sala não encontrada ou está cheia. Verifique o código e tente novamente.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black p-4">
      <Card className="w-[450px] bg-stone-charcoal/80 border-stone-light/20 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-ethereal-blue">Entrar em uma Aventura</CardTitle>
          <CardDescription className="text-stone-light">
            Digite o código da sala para se juntar aos seus amigos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="room-code" className="text-frost-blue">Código da Sala</Label>
            <Input
              id="room-code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Ex: J8XF2K"
              className="mt-2 bg-dungeon-black border-ancient-stone text-lg tracking-widest"
            />
          </div>
          {error && <p className="text-sm text-danger-red">{error}</p>}
          <div className="flex flex-col space-y-2">
            <Button onClick={handleJoin} size="lg" className="bg-crystal-blue hover:bg-frost-blue text-white font-bold text-lg">
              Entrar na Sala
            </Button>
            <Button onClick={backToMenu} variant="secondary" size="lg" className="bg-weathered-gray hover:bg-stone-light text-white font-bold text-lg border-stone-light/50">
              Voltar ao Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
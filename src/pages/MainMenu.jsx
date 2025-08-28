import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";

export function MainMenu() {
  const { createRoom, goToProfile } = useMultiplayerGame();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black">
      <Card className="w-[400px] bg-stone-charcoal/80 border-stone-light/20 text-white">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold text-ethereal-blue drop-shadow-[0_2px_8px_rgba(147,197,253,0.4)]">
            🏰 The Classic Dungeon
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button 
            onClick={createRoom} 
            variant="outline" 
            size="lg" 
            className="bg-arcane-blue hover:bg-crystal-blue text-white font-bold text-lg border-frost-blue/50 hover:text-white"
          >
            Criar Nova Sala
          </Button>
          <Button variant="secondary" size="lg" className="bg-weathered-gray hover:bg-stone-light text-white font-bold text-lg border-stone-light/50">
            Entrar em uma Sala
          </Button>

          <Button 
            onClick={goToProfile} 
            variant="outline" 
            size="lg" 
            className="bg-void-purple/80 hover:bg-void-purple text-white font-bold text-lg border-stone-light/50 hover:text-white"
          >
            Ver Perfil e Histórico
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
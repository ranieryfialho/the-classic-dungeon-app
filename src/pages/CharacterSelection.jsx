import { useState } from "react";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { characterClasses } from "@/config/characterClasses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TeamStatus } from "@/components/game/TeamStatus";

export function CharacterSelection() {
  const { gameState, currentUser, setGameState, startGame } =
    useMultiplayerGame();
  const { players } = gameState;
  const playerList = Object.values(players);

  const [selectedClass, setSelectedClass] = useState(null);

  const handleSelectHero = (heroName, className) => {
    setGameState((prev) => ({
      ...prev,
      players: {
        ...prev.players,
        [currentUser.id]: {
          ...prev.players[currentUser.id],
          character: {
            name: heroName,
            className: className,
          },
          ready: true,
        },
      },
    }));
    setSelectedClass(null);
  };

  const mySelection = players[currentUser.id]?.character;
  const takenClasses = playerList
    .filter((p) => p.character && p.id !== currentUser.id)
    .map((p) => p.character.className);

  const allPlayersReady = playerList.every((p) => p.ready);

  return (
    <div className="min-h-screen w-full bg-dungeon-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-ethereal-blue mb-2">
            Forme sua Equipe
          </h1>
          <p className="text-stone-light">
            Cada herói deve escolher uma classe única para a aventura.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {characterClasses.map((charClass) => {
              const isTaken = takenClasses.includes(charClass.name);
              const isSelectedByMe = mySelection?.className === charClass.name;

              return (
                <Card
                  key={charClass.name}
                  onClick={() => !isTaken && setSelectedClass(charClass)}
                  className={`
                    bg-stone-charcoal/80 border-2 text-white text-center p-6
                    transition-all duration-200 h-full flex flex-col justify-center
                    ${
                      isTaken
                        ? "opacity-40 cursor-not-allowed"
                        : "cursor-pointer hover:bg-stone-charcoal"
                    }
                    ${
                      isSelectedByMe
                        ? "border-crystal-blue shadow-lg shadow-crystal-blue/20"
                        : "border-stone-light/20"
                    }
                  `}
                >
                  <div className="text-6xl mb-4">{charClass.icon}</div>
                  <h3 className={`text-2xl font-bold ${charClass.color}`}>
                    {charClass.name}
                  </h3>
                  <p className="text-stone-light mt-2 h-10">
                    {charClass.description}
                  </p>
                  {isSelectedByMe && (
                    <p className="text-crystal-blue font-bold mt-2">
                      Você é {mySelection.name}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="space-y-6">
            <TeamStatus />
            <div className="text-center">
              <Button
                size="lg"
                onClick={startGame}
                disabled={!allPlayersReady}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl py-6 px-10 w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Iniciar Jogo
              </Button>
              {!allPlayersReady && (
                <p className="text-sm text-yellow-400 mt-2">
                  Aguardando todos os jogadores escolherem...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!selectedClass}
        onOpenChange={() => setSelectedClass(null)}
      >
        <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-ethereal-blue">
              Escolha seu {selectedClass?.name}
            </DialogTitle>
            <DialogDescription className="text-stone-light">
              Selecione um dos heróis disponíveis para esta classe.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-3 pt-4">
            {selectedClass?.heroes.map((hero) => (
              <Button
                key={hero}
                variant="outline"
                size="lg"
                className="bg-ancient-stone hover:bg-weathered-gray border-stone-light/30 text-lg font-semibold"
                onClick={() => handleSelectHero(hero, selectedClass.name)}
              >
                {hero}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { characterClasses } from "@/config/characterClasses";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TeamStatus } from "@/components/game/TeamStatus";

export function CharacterSelection() {
  const { gameState, currentUser, startGame, selectCharacterForPlayer, unselectCharacter, backToMenu } = useMultiplayerGame();
  const { players } = gameState;
  const playerList = Object.values(players);

  const [selectedClass, setSelectedClass] = useState(null);

  // ++ VERIFICAÇÃO DE SEGURANÇA ++
  // Se o currentUser ainda não foi definido (durante a transição de sair da sala), não renderiza nada.
  if (!currentUser) {
    return null; 
  }

  const handleSelectHero = (heroName, className) => {
    selectCharacterForPlayer(currentUser.id, { name: heroName, className: className });
    setSelectedClass(null);
  };

  const handleCardClick = (charClass) => {
    const isSelectedByMe = mySelection?.className === charClass.name;
    const isTakenByOther = takenClasses.includes(charClass.name);
    if (isSelectedByMe) {
      unselectCharacter(currentUser.id);
    } else if (!isTakenByOther) {
      setSelectedClass(charClass);
    }
  };

  const handleLeaveRoom = () => {
    if (window.confirm("Você tem certeza que deseja sair da sala?")) {
      backToMenu();
    }
  };

  const mySelection = players[currentUser.id]?.character;
  const takenClasses = playerList
    .filter((p) => p.character && p.id !== currentUser.id)
    .map((p) => p.character.className);

  const allPlayersReady = playerList.length > 0 && playerList.every((p) => p.ready);
  const isHost = players[currentUser.id]?.isHost;

  return (
    <div className="min-h-screen w-full bg-dungeon-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div className="text-center flex-grow">
                <h1 className="text-4xl font-bold text-ethereal-blue mb-2">
                    Forme sua Equipe
                </h1>
                <p className="text-stone-light">
                    Cada herói deve escolher uma classe única para a aventura.
                </p>
            </div>
            <Button onClick={handleLeaveRoom} variant="destructive">
                Sair da Sala
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {characterClasses.map((charClass) => {
              const isTakenByOther = takenClasses.includes(charClass.name);
              const isSelectedByMe = mySelection?.className === charClass.name;
              const isClickable = !isTakenByOther;

              return (
                <Card
                  key={charClass.name}
                  onClick={() => isClickable && handleCardClick(charClass)}
                  className={`
                    bg-stone-charcoal/80 border-2 text-white text-center p-6
                    transition-all duration-200 h-full flex flex-col justify-center
                    ${isSelectedByMe ? "border-crystal-blue shadow-lg shadow-crystal-blue/20" : "border-stone-light/20"}
                    ${!isClickable ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:border-frost-blue"}
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
            {isHost && (
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
            )}
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
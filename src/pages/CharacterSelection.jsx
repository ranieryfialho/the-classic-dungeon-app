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
  const takenClasses = playerList.filter((p) => p.character && p.id !== currentUser.id).map((p) => p.character.className);
  const allPlayersReady = playerList.length > 0 && playerList.every((p) => p.ready);
  const isHost = players[currentUser.id]?.isHost;

  return (
    <div className="h-full w-full bg-transparent safe-area-top safe-area-left safe-area-right container-mobile-safe">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 pb-24 sm:pb-8">
        <div className="hidden sm:flex sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div className="text-center sm:text-left flex-grow">
            <h1 className="text-2xl sm:text-4xl font-bold text-ethereal-blue mb-2">Forme sua Equipe</h1>
            <p className="text-sm sm:text-base text-stone-light">Cada herói deve escolher uma classe única para a aventura.</p>
          </div>
          <Button onClick={handleLeaveRoom} variant="destructive" className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base">Sair da Sala</Button>
        </div>
        <div className="sm:hidden text-center mb-6">
          <h1 className="text-2xl font-bold text-ethereal-blue mb-2">Forme sua Equipe</h1>
          <p className="text-sm text-stone-light">Cada herói deve escolher uma classe única para a aventura.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {characterClasses.map((charClass) => {
                const isTakenByOther = takenClasses.includes(charClass.name);
                const isSelectedByMe = mySelection?.className === charClass.name;
                const isClickable = !isTakenByOther;

                return (
                  <Card key={charClass.name} onClick={() => isClickable && handleCardClick(charClass)} className={`bg-stone-charcoal/80 border-2 text-white text-center p-4 sm:p-6 transition-all duration-200 h-full flex flex-col justify-center min-h-[200px] sm:min-h-[250px] ${isSelectedByMe ? "border-crystal-blue shadow-lg shadow-crystal-blue/20" : "border-stone-light/20"} ${!isClickable ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:border-frost-blue active:scale-95"}`}>
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{charClass.icon}</div>
                    <h3 className={`text-xl sm:text-2xl font-bold ${charClass.color} mb-2`}>{charClass.name}</h3>
                    <p className="text-xs sm:text-sm text-stone-light mt-2 h-8 sm:h-10 line-clamp-2">{charClass.description}</p>
                    {isSelectedByMe && (<p className="text-crystal-blue font-bold mt-2 text-sm sm:text-base">Você é {mySelection.name}</p>)}
                    {isTakenByOther && (<p className="text-red-400 font-bold mt-2 text-xs sm:text-sm">Já escolhido</p>)}
                  </Card>
                );
              })}
            </div>
          </div>
          <div className="hidden lg:block space-y-4 sm:space-y-6">
            <TeamStatus />
            {isHost && (
              <div className="text-center space-y-3">
                <Button size="lg" onClick={startGame} disabled={!allPlayersReady} className="bg-green-600 hover:bg-green-700 text-white font-bold text-base sm:text-xl py-4 sm:py-6 px-6 sm:px-10 w-full disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] sm:min-h-[60px]">Iniciar Jogo</Button>
                {!allPlayersReady && (<p className="text-xs sm:text-sm text-yellow-400">Aguardando todos os jogadores escolherem...</p>)}
              </div>
            )}
            {!isHost && (<div className="text-center"><p className="text-sm text-stone-light">Aguardando o host iniciar o jogo...</p></div>)}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white max-w-2xl w-[95vw] p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Coluna da Esquerda: Sprite e Informações */}
            <div className="w-full sm:w-1/3 bg-dungeon-black/50 p-6 flex flex-col items-center justify-center border-r border-stone-light/20">
              {selectedClass?.gifUrl && (
                <img
                  src={selectedClass.gifUrl}
                  alt={selectedClass.name}
                  className="w-32 h-32 object-contain pixelated mb-4"
                />
              )}
              <h2 className={`text-3xl font-bold ${selectedClass?.color}`}>{selectedClass?.name}</h2>
              <div className="flex gap-6 mt-4 text-stone-light">
                <div className="text-center">
                  <p className="text-xs">OURO</p>
                  <p className="font-bold text-lg text-treasure-gold">{selectedClass?.goldTarget.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs">MOV.</p>
                  <p className="font-bold text-lg text-white">{selectedClass?.movement}</p>
                </div>
              </div>
            </div>

            {/* Coluna da Direita: Confirmação e Vantagens */}
            <div className="w-full sm:w-2/3 p-6 flex flex-col">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl text-ethereal-blue">Confirmar Classe</DialogTitle>
                <DialogDescription className="text-stone-light">
                  Você será {selectedClass?.heroes[0]}, o {selectedClass?.name}.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-grow space-y-3 overflow-y-auto pr-2 mb-6">
                <h3 className="font-bold text-frost-blue border-b border-stone-light/20 pb-2">Vantagens da Classe</h3>
                {selectedClass?.advantages.map((advantage, index) => (
                  <div key={index}>
                    <p className="font-semibold text-white">{advantage.title}</p>
                    <p className="text-sm text-stone-light">{advantage.description}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full bg-crystal-blue hover:bg-frost-blue text-white font-bold text-lg h-14 mt-auto"
                onClick={() => handleSelectHero(selectedClass.heroes[0], selectedClass.name)}
              >
                Confirmar {selectedClass?.name}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-stone-charcoal/95 backdrop-blur-md border-t border-stone-light/20 p-4 safe-area-bottom">
        <div className="flex flex-col gap-2 max-w-sm mx-auto">
          {isHost && (<Button onClick={startGame} disabled={!allPlayersReady} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-sm min-h-[48px] disabled:opacity-50">{allPlayersReady ? 'Iniciar Jogo' : 'Aguardando jogadores...'}</Button>)}
          {!isHost && (<div className="text-center text-sm text-stone-light py-2">Aguardando o host iniciar o jogo...</div>)}
          <Button onClick={handleLeaveRoom} variant="outline" className="w-full bg-transparent border-stone-light/30 text-stone-light hover:text-white hover:bg-stone-light/10 font-bold text-sm min-h-[48px]">Sair da Sala</Button>
        </div>
      </div>
    </div>
  );
}
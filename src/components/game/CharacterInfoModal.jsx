import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { characterClasses } from "@/config/characterClasses";

export function CharacterInfoModal({ player, isOpen, onClose }) {
  if (!isOpen || !player?.character) {
    return null;
  }

  const classData = characterClasses.find(c => c.name === player.character.className);

  if (!classData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white max-w-2xl w-[95vw] p-0">
        <div className="flex flex-col sm:flex-row">

          <div className="w-full sm:w-1/3 bg-dungeon-black/50 p-6 flex flex-col items-center justify-center border-r border-stone-light/20">
            <img 
              src={classData.gifUrl} 
              alt={classData.name}
              className="w-32 h-32 object-contain pixelated mb-4"
            />
            <h2 className={`text-3xl font-bold ${classData.color}`}>{classData.name}</h2>
            <p className="text-lg text-stone-light mt-1">({player.character.name})</p>
            <div className="flex gap-6 mt-4 text-stone-light">
                <div className="text-center">
                    <p className="text-xs">META DE OURO</p>
                    <p className="font-bold text-lg text-treasure-gold">{classData.goldTarget.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs">MOV.</p>
                    <p className="font-bold text-lg text-white">{classData.movement}</p>
                </div>
            </div>
          </div>

          <div className="w-full sm:w-2/3 p-6 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl text-ethereal-blue">Vantagens da Classe</DialogTitle>
              <DialogDescription className="text-stone-light">
                Estas são as habilidades especiais do seu herói.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-grow space-y-4 overflow-y-auto pr-2 mb-6">
               {classData.advantages.map((advantage, index) => (
                  <div key={index}>
                      <p className="font-semibold text-white">{advantage.title}</p>
                      <p className="text-sm text-stone-light">{advantage.description}</p>
                  </div>
               ))}
            </div>

            <Button
              size="lg"
              className="w-full bg-crystal-blue hover:bg-frost-blue text-white font-bold text-lg h-14 mt-auto"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
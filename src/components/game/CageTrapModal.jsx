import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Dice = ({ value }) => (
  <div className="w-20 h-20 bg-white border-2 border-gray-400 rounded-lg flex items-center justify-center text-black font-bold text-4xl">
    {value}
  </div>
);

export function CageTrapModal({ isOpen, onClose, player, onConfirm }) {
  const [roll, setRoll] = useState(null);
  const [turnsToSkip, setTurnsToSkip] = useState(0);

  const handleRoll = () => {
    const result = Math.floor(Math.random() * 6) + 1;
    setRoll(result);
    if (result <= 3) {
      setTurnsToSkip(1);
    } else if (result <= 5) {
      setTurnsToSkip(2);
    } else {
      setTurnsToSkip(3);
    }
  };

  const handleConfirm = () => {
    onConfirm(player.id, turnsToSkip);
    handleClose();
  };
  
  const handleClose = () => {
    setRoll(null);
    setTurnsToSkip(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-stone-600/50 text-white w-[95vw] max-w-sm shadow-2xl p-6">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-orange-400">⛓️ Enjaulamento</DialogTitle>
          <DialogDescription className="text-stone-300 text-base pt-2">
            Você caiu em uma jaula! Role o dado para ver por quantas rodadas ficará preso.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center justify-center gap-4">
          {roll ? <Dice value={roll} /> : <div className="w-20 h-20" />}
          
          {roll === null ? (
            <Button onClick={handleRoll} size="lg" className="w-full bg-crystal-blue hover:bg-frost-blue text-lg">
              Rolar Dado
            </Button>
          ) : (
            <div className="text-center w-full space-y-4">
                <p className="text-lg">
                    Penalidade: <span className="font-bold text-white">{turnsToSkip} rodada(s) sem jogar.</span>
                </p>
                <Button onClick={handleConfirm} size="lg" className="w-full bg-blood-red hover:bg-red-700 text-lg">
                    Confirmar Penalidade
                </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
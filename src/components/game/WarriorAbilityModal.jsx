import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldAlert } from "lucide-react";

export function WarriorAbilityModal({ isOpen, onClose, onSuccess, onFailure }) {

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };
  
  const handleFailure = () => {
    onFailure();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-stone-600/50 text-white w-[95vw] max-w-md shadow-2xl p-6">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-3">
            <ShieldAlert size={28} />
            Fôlego de Batalha
          </DialogTitle>
          <DialogDescription className="text-stone-300 text-base pt-2 leading-relaxed">
            O contra-ataque foi mortal, mas você tem uma última chance! Você rolou <span className="font-bold text-white">6</span> no dado para sobreviver?
          </DialogDescription>
        </DialogHeader>
        
        <div className="pt-6 space-y-3">
          {/* Botão de Sucesso */}
          <button
            onClick={handleSuccess}
            className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-green-800/25 to-green-700/25 hover:from-green-700/40 hover:to-green-600/40 border-2 border-green-500/40 hover:border-green-400/60 p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-3 text-left">
              <div className="flex-1 min-w-0 text-center">
                <div className="font-bold text-lg text-green-300 group-hover:text-green-200">
                  Sim, sobrevivi!
                </div>
                <div className="text-xs text-stone-400 mt-1">
                  (Ficar ferido e perder o turno)
                </div>
              </div>
            </div>
          </button>

          {/* Botão de Falha */}
          <button
            onClick={handleFailure}
            className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-900/30 to-red-800/30 hover:from-red-800/50 hover:to-red-700/50 border-2 border-red-600/40 hover:border-red-500/60 p-4 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-3 text-left">
              <div className="flex-1 min-w-0 text-center">
                <div className="font-bold text-lg text-red-400 group-hover:text-red-300">
                  Não, o herói morreu
                </div>
                <div className="text-xs text-stone-400 mt-1">
                  (Perder todos os tesouros)
                </div>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
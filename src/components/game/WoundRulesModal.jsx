import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function WoundRulesModal({ isOpen, onClose }) {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent 
        className="bg-stone-charcoal border-stone-light/30 text-white w-[95vw] max-w-[400px] sm:max-w-2xl h-[75vh] max-h-[600px] sm:max-h-[95vh] overflow-hidden flex flex-col p-2 sm:p-6"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="flex-shrink-0 pb-1">
          <DialogTitle className="text-sm sm:text-2xl text-blood-red text-center font-bold">
            ⚔️ Regras de Combate
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scroll-container">
          <div className="bg-dungeon-black/50 rounded-lg p-1.5 sm:p-4">
            <h3 className="text-xs sm:text-lg font-bold text-ethereal-blue mb-1.5 sm:mb-3">📋 Jogo Básico</h3>
            
            <div className="space-y-1.5">
              {/* Header da tabela - oculto no mobile */}
              <div className="hidden sm:grid grid-cols-3 gap-4 text-sm font-bold text-frost-blue border-b border-stone-light/20 pb-2">
                <div>Dados</div>
                <div>Efeito</div>
                <div>Penalidade</div>
              </div>

              {/* Linhas da tabela */}
              <div className="space-y-1.5 sm:space-y-3">
                {/* Herói morto */}
                <div className="bg-blood-red/10 rounded p-1.5 sm:p-3 border-l-4 border-blood-red">
                  <div className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-4 gap-0.5">
                    <div className="flex items-center gap-2 sm:block">
                      <span className="font-bold text-blood-red text-sm sm:text-lg">2</span>
                      <span className="font-bold text-blood-red text-xs sm:hidden">- Herói morto</span>
                    </div>
                    <div className="font-bold text-blood-red hidden sm:block">Herói morto</div>
                    <div className="text-stone-light text-xs sm:text-sm leading-tight">
                      Abandone todos os tesouros. Pegue seu guerreiro e comece novamente.
                    </div>
                  </div>
                </div>
                
                {/* Ferimento grave */}
                <div className="bg-red-900/10 rounded p-1.5 sm:p-3 border-l-4 border-red-400">
                  <div className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-4 gap-0.5">
                    <div className="flex items-center gap-2 sm:block">
                      <span className="font-bold text-red-400 text-sm sm:text-lg">3</span>
                      <span className="font-bold text-red-400 text-xs sm:hidden">- Ferimento grave</span>
                    </div>
                    <div className="font-bold text-red-400 hidden sm:block">Ferimento grave</div>
                    <div className="text-stone-light text-xs sm:text-sm leading-tight">
                      Abandone metade de seu tesouro em quantidade de cartas (arredonde o número) e volte para a Escadaria Principal.
                    </div>
                  </div>
                </div>
                
                {/* Ferimento leve */}
                <div className="bg-orange-900/10 rounded p-1.5 sm:p-3 border-l-4 border-orange-400">
                  <div className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-4 gap-0.5">
                    <div className="flex items-center gap-2 sm:block">
                      <span className="font-bold text-orange-400 text-sm sm:text-lg">4 a 6</span>
                      <span className="font-bold text-orange-400 text-xs sm:hidden">- Ferimento leve</span>
                    </div>
                    <div className="font-bold text-orange-400 hidden sm:block">Ferimento leve</div>
                    <div className="text-stone-light text-xs sm:text-sm leading-tight">
                      Abandone um de seus tesouros (livre escolha) e volte uma casa em relação ao monstro. Pule uma jogada.
                    </div>
                  </div>
                </div>
                
                {/* Atordoado */}
                <div className="bg-yellow-900/10 rounded p-1.5 sm:p-3 border-l-4 border-yellow-400">
                  <div className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-4 gap-0.5">
                    <div className="flex items-center gap-2 sm:block">
                      <span className="font-bold text-yellow-400 text-sm sm:text-lg">7 a 8</span>
                      <span className="font-bold text-yellow-400 text-xs sm:hidden">- Atordoado</span>
                    </div>
                    <div className="font-bold text-yellow-400 hidden sm:block">Atordoado</div>
                    <div className="text-stone-light text-xs sm:text-sm leading-tight">
                      Abandone um dos tesouros.
                    </div>
                  </div>
                </div>
                
                {/* Ileso */}
                <div className="bg-green-900/10 rounded p-1.5 sm:p-3 border-l-4 border-green-400">
                  <div className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-4 gap-0.5">
                    <div className="flex items-center gap-2 sm:block">
                      <span className="font-bold text-green-400 text-sm sm:text-lg">9 ou +</span>
                      <span className="font-bold text-green-400 text-xs sm:hidden">- Ileso</span>
                    </div>
                    <div className="font-bold text-green-400 hidden sm:block">Ileso</div>
                    <div className="text-stone-light text-xs sm:text-sm leading-tight">
                      Não lhe acontece nada.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-stone-light text-xs leading-tight">
              Use esta tabela como referência durante os combates.
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0 pt-2 border-t border-stone-light/20">
          <Button 
            onClick={handleClose}
            className="w-full bg-crystal-blue hover:bg-frost-blue text-white font-bold text-sm sm:text-base min-h-[40px] sm:min-h-[48px]"
            autoFocus
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
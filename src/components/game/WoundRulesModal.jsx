// src/components/game/WoundRulesModal.jsx - Modal Mobile Completamente Funcional
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function WoundRulesModal({ isOpen, onClose }) {
  // Função para fechar o modal (múltiplas formas)
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Interceptar tecla ESC
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
        className="bg-stone-charcoal border-stone-light/30 text-white max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header Fixo */}
        <DialogHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl text-blood-red text-center flex-1">
              ⚔️ Regras de Combate
            </DialogTitle>
            {/* Botão X no canto superior direito */}
            <button
              onClick={handleClose}
              className="ml-4 p-2 hover:bg-stone-light/20 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <span className="text-xl text-stone-light hover:text-white">✕</span>
            </button>
          </div>
        </DialogHeader>
        
        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto py-2 sm:py-4 scroll-container">
          <div className="bg-dungeon-black/50 rounded-lg p-3 sm:p-4 mb-4">
            <h3 className="text-base sm:text-lg font-bold text-ethereal-blue mb-3">📋 Jogo Básico</h3>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Header da Tabela */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-frost-blue border-b border-stone-light/20 pb-2">
                <div>Dados</div>
                <div>Efeito</div>
                <div>Penalidade</div>
              </div>
              
              {/* Linhas da Tabela */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm p-2 bg-blood-red/10 rounded">
                  <div className="font-bold text-blood-red">2</div>
                  <div className="font-bold text-blood-red">Herói morto</div>
                  <div className="text-stone-light">
                    Abandone todos os tesouros. Pegue seu guerreiro e comece novamente.
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm p-2 bg-red-900/10 rounded">
                  <div className="font-bold text-red-400">3</div>
                  <div className="font-bold text-red-400">Ferimento grave</div>
                  <div className="text-stone-light">
                    Abandone metade de seu tesouro em quantidade de cartas (arredonde o número) e volte para a Escadaria Principal.
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm p-2 bg-orange-900/10 rounded">
                  <div className="font-bold text-orange-400">4 a 6</div>
                  <div className="font-bold text-orange-400">Ferimento leve</div>
                  <div className="text-stone-light">
                    Abandone um de seus tesouros (livre escolha) e volte uma casa em relação ao monstro. Pule uma jogada.
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm p-2 bg-yellow-900/10 rounded">
                  <div className="font-bold text-yellow-400">7 a 8</div>
                  <div className="font-bold text-yellow-400">Atordoado</div>
                  <div className="text-stone-light">
                    Abandone um dos tesouros.
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm p-2 bg-green-900/10 rounded">
                  <div className="font-bold text-green-400">9 ou +</div>
                  <div className="font-bold text-green-400">Ileso</div>
                  <div className="text-stone-light">
                    Não lhe acontece nada.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-stone-light text-xs sm:text-sm mb-4">
              Use esta tabela como referência durante os combates para aplicar os efeitos corretos.
            </p>
          </div>
        </div>
        
        {/* Botões de Ação Fixos */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-light/20">
          <Button 
            onClick={handleClose}
            className="w-full bg-crystal-blue hover:bg-frost-blue text-white font-bold text-sm sm:text-base min-h-[48px]"
            autoFocus
          >
            Entendi - Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
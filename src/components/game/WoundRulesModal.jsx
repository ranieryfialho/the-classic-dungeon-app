import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function WoundRulesModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl text-blood-red text-center">
            ⚔️ Tabela de Ataques Monstros
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-dungeon-black/50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-ethereal-blue mb-3">📋 Jogo Básico</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm font-bold text-frost-blue border-b border-stone-light/20 pb-2">
                <div>Resultado dos Dados</div>
                <div>Efeito</div>
                <div>Penalidade</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm p-2 bg-blood-red/10 rounded">
                <div className="font-bold text-blood-red">2</div>
                <div className="font-bold text-blood-red">Herói morto</div>
                <div className="text-stone-light">
                  Abandone todos os tesouros. Pegue seu guerreiro e comece novamente.
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm p-2 bg-red-900/10 rounded">
                <div className="font-bold text-red-400">3</div>
                <div className="font-bold text-red-400">Ferimento grave</div>
                <div className="text-stone-light">
                  Abandone metade de seu tesouro em quantidade de cartas (arredonde o número) e volte para a Escadaria Principal.
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm p-2 bg-orange-900/10 rounded">
                <div className="font-bold text-orange-400">4 a 6</div>
                <div className="font-bold text-orange-400">Ferimento leve</div>
                <div className="text-stone-light">
                  Abandone um de seus tesouros (livre escolha) e volte uma casa em relação ao monstro. Pule uma jogada.
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm p-2 bg-yellow-900/10 rounded">
                <div className="font-bold text-yellow-400">7 a 8</div>
                <div className="font-bold text-yellow-400">Atordoado</div>
                <div className="text-stone-light">
                  Abandone um dos tesouros.
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm p-2 bg-green-900/10 rounded">
                <div className="font-bold text-green-400">9 ou +</div>
                <div className="font-bold text-green-400">Ileso</div>
                <div className="text-stone-light">
                  Não lhe acontece nada.
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-stone-light text-sm mb-4">
              Use esta tabela como referência durante os combates para aplicar os efeitos corretos.
            </p>
            <Button 
              onClick={onClose}
              className="bg-crystal-blue hover:bg-frost-blue"
            >
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
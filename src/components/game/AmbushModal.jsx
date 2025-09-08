import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AmbushModal({ isOpen, onClose, thief, target, onStealGold, onStealItem }) {
  const [step, setStep] = useState('successCheck'); // successCheck | loot
  const [goldToSteal, setGoldToSteal] = useState(0);

  // Reseta o estado quando o modal é fechado ou o alvo muda
  useEffect(() => {
    if (isOpen) {
      setStep('successCheck');
      setGoldToSteal(0);
    }
  }, [isOpen]);

  if (!isOpen || !thief || !target) return null;

  const handleSuccess = () => setStep('loot');
  const handleFailure = () => onClose();

  const handleStealGold = () => {
    if (goldToSteal > 0) {
      onStealGold(thief.id, target.id, goldToSteal);
    }
    onClose();
  };

  const handleStealItem = (item, index) => {
    onStealItem(thief.id, target.id, item, index);
    onClose();
  };
  
  const handleAdjustGold = (amount) => {
    const newAmount = Math.min(target.gold, Math.max(0, goldToSteal + amount));
    setGoldToSteal(newAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white max-w-md">
        {step === 'successCheck' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-ethereal-blue">Emboscada em {target.character.name}</DialogTitle>
              <DialogDescription className="text-stone-light pt-2">
                A emboscada foi bem-sucedida? (Lembre-se da regra: +2 no ataque para o Ladrão).
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center space-x-4 pt-4">
              <Button onClick={handleSuccess} className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
                Sim, Sucesso!
              </Button>
              <Button onClick={handleFailure} variant="destructive" className="text-lg px-8 py-6">
                Não, Falhou
              </Button>
            </div>
          </>
        )}

        {step === 'loot' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-treasure-gold">Saquear {target.character.name}</DialogTitle>
              <DialogDescription className="text-stone-light pt-2">
                Escolha o que roubar: ouro ou um item especial.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Seção de Ouro */}
              <div>
                <h4 className="font-bold text-treasure-gold">Ouro de {target.name}: {target.gold.toLocaleString('pt-BR')}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" value={goldToSteal} onChange={(e) => setGoldToSteal(Math.min(target.gold, Math.max(0, parseInt(e.target.value) || 0)))} className="w-full bg-dungeon-black border-ancient-stone rounded p-2 text-center" />
                  <Button onClick={handleStealGold} disabled={goldToSteal <= 0}>Roubar Ouro</Button>
                </div>
                 <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button onClick={() => handleAdjustGold(100)}>+100</Button>
                    <Button onClick={() => handleAdjustGold(500)}>+500</Button>
                    <Button onClick={() => handleAdjustGold(1000)}>+1000</Button>
                 </div>
              </div>

              {/* Seção de Itens */}
              <div>
                <h4 className="font-bold text-frost-blue">Itens Especiais</h4>
                {target.inventory && target.inventory.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {target.inventory.map((item, index) => (
                      <Button 
                        key={index} 
                        onClick={() => handleStealItem(item, index)} 
                        variant="outline" 
                        className="w-full justify-start gap-4 bg-ancient-stone hover:bg-weathered-gray border-stone-light/30 text-white"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-semibold">{item.name}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-light/70 text-sm italic mt-2">Nenhum item para roubar.</p>
                )}
              </div>
            </div>
             <Button onClick={onClose} variant="destructive" className="w-full mt-4">
                Cancelar Saque
             </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
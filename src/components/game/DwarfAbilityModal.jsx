import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DwarfAbilityModal({ isOpen, onClose, onConfirm }) {

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-treasure-gold">🔨 Mestre do Machado</DialogTitle>
          <DialogDescription className="text-stone-light pt-2 text-base">
            Você rolou 12 (6+6) nos dados de ataque?
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 text-center">
            <p className="text-stone-light mb-4">Confirmar para adicionar o bônus de +1.000 de ouro.</p>

            <div className="flex justify-center space-x-4 pt-2">
                <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
                    Sim, confirmo!
                </Button>
                <Button onClick={onClose} variant="destructive" className="text-lg px-8 py-6">
                    Não
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
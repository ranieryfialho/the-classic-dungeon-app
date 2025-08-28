import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ItemDetailsModal({ item, isOpen, onClose }) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="
          bg-stone-charcoal/30 backdrop-filter backdrop-blur-md border-stone-light/40 text-white 
          shadow-lg rounded-xl max-w-sm p-6
        "
      >
        <DialogHeader className="mb-4">
          <DialogTitle className="text-3xl font-bold text-ethereal-blue mb-2 flex items-center gap-2">
            <span className="text-4xl">{item.icon}</span> {item.name}
          </DialogTitle>
          <DialogDescription className="text-lg text-stone-light leading-relaxed">
            {item.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} className="bg-crystal-blue hover:bg-frost-blue text-white">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
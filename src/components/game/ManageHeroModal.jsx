import { useState, useEffect } from "react";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { specialTreasures } from "@/config/specialTreasures";

export function ManageHeroModal({ player, isOpen, onClose }) {
  const { updatePlayerStats, addItemToInventory, removeItemFromInventory } =
    useMultiplayerGame();
  const [gold, setGold] = useState(0);

  useEffect(() => {
    if (player) {
      setGold(player.gold);
    }
  }, [player]);

  const handleSave = () => {
    updatePlayerStats(player.id, {
      gold: parseInt(gold, 10) || 0, // Garante que o ouro seja um número
    });
    onClose();
  };

  const handleAddItem = (itemId) => {
    if (itemId) {
      addItemToInventory(player.id, itemId);
    }
  };

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-ethereal-blue">
            Gerenciar {player.character.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* SEÇÃO DO OURO */}
          <div className="space-y-2">
            <Label
              htmlFor="gold"
              className="text-left text-treasure-gold font-bold text-lg"
            >
              Ouro
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="gold"
                type="number"
                value={gold}
                onChange={(e) => setGold(e.target.value)}
                className="col-span-3 bg-dungeon-black border-stone-light/30"
              />
              <Button onClick={handleSave} className="bg-treasure-gold hover:bg-yellow-600 text-black font-bold">
                Salvar Ouro
              </Button>
            </div>
          </div>

          {/* SEÇÃO DO INVENTÁRIO E ADIÇÃO DE ITENS */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-frost-blue border-b border-stone-light/20 pb-2">
              Inventário
            </h4>
            {/* Itens Atuais */}
            <div className="space-y-2 max-h-24 overflow-y-auto pr-2">
              {player.inventory && player.inventory.length > 0 ? (
                player.inventory.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-dungeon-black/50 p-2 rounded"
                  >
                    <span title={item.description}>
                      {item.icon} {item.name}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItemFromInventory(player.id, index)}
                      className="w-6 h-6 p-0"
                    >
                      X
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-stone-light/70 text-sm italic">O inventário está vazio.</p>
              )}
            </div>

            {/* ===== INÍCIO DA MELHORIA: SELEÇÃO VISUAL ===== */}
            <h5 className="font-semibold text-base text-frost-blue pt-2">
              Adicionar Tesouro Especial
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {specialTreasures.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleAddItem(item.id)}
                  variant="outline"
                  className="bg-ancient-stone hover:bg-weathered-gray border-stone-light/30 justify-start h-auto text-left p-2"
                >
                  <span className="text-2xl mr-2">{item.icon}</span>
                  <span className="flex-1 text-xs font-semibold whitespace-normal">{item.name}</span>
                </Button>
              ))}
            </div>
            {/* ===== FIM DA MELHORIA ===== */}

          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-crystal-blue hover:bg-frost-blue text-white w-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
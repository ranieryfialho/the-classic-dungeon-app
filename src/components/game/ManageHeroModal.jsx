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
      gold: parseInt(gold, 10) || 0,
    });
    onClose();
  };

  const handleAddItem = (itemId) => {
    if (itemId) {
      addItemToInventory(player.id, itemId);
    }
  };

  const adjustGold = (amount) => {
    const currentGold = parseInt(gold, 10) || 0;
    const newGold = Math.max(0, currentGold + amount);
    setGold(newGold);
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
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2">
                <Button onClick={() => adjustGold(100)} variant="outline" className="bg-treasure-gold/20 border-treasure-gold/50 hover:bg-treasure-gold/30 text-treasure-gold font-bold">+100</Button>
                <Button onClick={() => adjustGold(250)} variant="outline" className="bg-treasure-gold/20 border-treasure-gold/50 hover:bg-treasure-gold/30 text-treasure-gold font-bold">+250</Button>
                <Button onClick={() => adjustGold(500)} variant="outline" className="bg-treasure-gold/20 border-treasure-gold/50 hover:bg-treasure-gold/30 text-treasure-gold font-bold">+500</Button>
                <Button onClick={() => adjustGold(-100)} variant="outline" className="bg-blood-red/20 border-blood-red/50 hover:bg-blood-red/30 text-blood-red font-bold">-100</Button>
            </div>
            {/* ===== FIM DA MELHORIA ===== */}
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-lg text-frost-blue border-b border-stone-light/20 pb-2">
              Inventário
            </h4>
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
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            className="bg-crystal-blue hover:bg-frost-blue text-white w-full"
          >
            Salvar e Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
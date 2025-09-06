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

  const handleAddItem = (itemId) => {
    if (itemId) {
      addItemToInventory(player.id, itemId);
    }
  };

  const adjustGold = (amount) => {
    const currentGold = parseInt(gold, 10) || 0;
    const newGold = Math.max(0, currentGold + amount);
    setGold(newGold);
    updatePlayerStats(player.id, { gold: newGold });
  };

  if (!player) return null;
  
  const goldAmounts = [250, 500, 750, 1000, 2000, 2500, 4000, 5000, 6000, 7000, 8000, 10000];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-ethereal-blue">
            Gerenciar {player.character.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[80vh] overflow-y-auto pr-4"> 
          <div className="space-y-2">
            <Label
              htmlFor="gold"
              className="text-left text-treasure-gold font-bold text-lg"
            >
              Ouro
            </Label>
            <div className="flex items-center justify-center p-3 bg-dungeon-black rounded-lg border border-stone-light/30 text-center">
              <p id="gold" className="text-3xl font-bold text-treasure-gold">
                {gold.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {goldAmounts.map((amount) => (
                <Button 
                  key={amount} 
                  onClick={() => adjustGold(amount)} 
                  variant="outline" 
                  className="bg-treasure-gold/20 border-treasure-gold/50 hover:bg-treasure-gold/30 text-treasure-gold hover:text-white font-bold flex items-center justify-center gap-1 text-xs"
                >
                  <span>💰</span>
                  <span>{`+${amount.toLocaleString('pt-BR')}`}</span>
                </Button>
              ))}
            </div>
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
        <DialogFooter className="pt-4">
          <Button
            onClick={onClose}
            variant="destructive"
            className="w-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
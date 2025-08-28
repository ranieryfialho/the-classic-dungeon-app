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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { specialTreasures } from "@/config/specialTreasures";

export function ManageHeroModal({ player, isOpen, onClose }) {
  const { updatePlayerStats, addItemToInventory, removeItemFromInventory } =
    useMultiplayerGame();
  const [gold, setGold] = useState(0);
  // Removido: const [isWounded, setIsWounded] = useState(false);
  const [selectedItem, setSelectedItem] = useState("");

  useEffect(() => {
    if (player) {
      setGold(player.gold);
      // Removido: setIsWounded(player.isWounded);
    }
  }, [player]);

  const handleSave = () => {
    updatePlayerStats(player.id, {
      gold: parseInt(gold, 10),
      // Removido: isWounded: isWounded,
    });
    onClose();
  };

  const handleAddItem = () => {
    if (selectedItem) {
      addItemToInventory(player.id, selectedItem);
      setSelectedItem("");
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
          {/* Seção de Status */}
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="gold"
                className="text-right text-treasure-gold font-bold"
              >
                Ouro
              </Label>
              <Input
                id="gold"
                type="number"
                value={gold}
                onChange={(e) => setGold(e.target.value)}
                className="col-span-3 bg-dungeon-black border-stone-light/30"
              />
            </div>
            {/* Removido: Switch de Status */}
          </div>
          {/* Seção de Inventário */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-frost-blue border-b border-stone-light/20 pb-2">
              Inventário
            </h4>
            <div className="flex space-x-2">
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger className="bg-dungeon-black border-stone-light/30">
                  <SelectValue placeholder="Selecione um tesouro..." />
                </SelectTrigger>
                <SelectContent className="bg-stone-charcoal text-white border-stone-light/30">
                  {specialTreasures.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddItem}
                className="bg-arcane-blue hover:bg-crystal-blue"
              >
                Adicionar
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {player.inventory &&
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
                    >
                      X
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            className="bg-crystal-blue hover:bg-frost-blue text-white"
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

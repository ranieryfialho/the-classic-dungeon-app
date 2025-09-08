import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const availableSpells = [
  { name: "Bola de Fogo", icon: "🔥", description: "Ataca usando o valor Amarelo do monstro." },
  { name: "Relâmpago", icon: "⚡️", description: "Ataca usando o valor Cinza do monstro." },
  { name: "Teleporte", icon: "🌀", description: "Move-se para qualquer casa já revelada no tabuleiro." },
];

export function SpellbookModal({ player, isOpen, onClose, onSave }) {
  const [selectedSpells, setSelectedSpells] = useState(Array(6).fill({ name: null, used: false }));

  useEffect(() => {
    if (isOpen && player) {
      // Verifica se o motivo da abertura é para recarregar (todas as magias usadas)
      const isRecharging = player.spells?.length > 0 && player.spells.every(s => s.used);

      // Se for para recarregar ou se o grimório estiver vazio, começa do zero.
      if (isRecharging || !player.spells || player.spells.length === 0) {
        const initialSpells = Array(6).fill(null).map(() => ({ name: null, used: false }));
        setSelectedSpells(initialSpells);
      } else {
        // Caso contrário, carrega as magias atuais para edição.
        const currentSpells = Array(6).fill(null).map((_, index) => player.spells[index] || { name: null, used: false });
        setSelectedSpells(currentSpells);
      }
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const handleSpellChange = (index, spellName) => {
    const newSpells = [...selectedSpells];
    if (spellName === "empty") {
      newSpells[index] = { name: null, used: false };
    } else {
      const spellData = availableSpells.find(s => s.name === spellName);
      newSpells[index] = { name: spellName, used: false, icon: spellData.icon, description: spellData.description };
    }
    setSelectedSpells(newSpells);
  };

  const handleSaveSpells = () => {
    // Filtra apenas os slots que foram preenchidos para não salvar entradas nulas
    const finalSpells = selectedSpells.filter(s => s && s.name);
    onSave(player.id, finalSpells);
    onClose();
  };

  const filledSlots = selectedSpells.filter(s => s && s.name).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-stone-charcoal border-stone-light/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-ethereal-blue">Grimório Arcano</DialogTitle>
          <DialogDescription className="text-stone-light">
            Escolha até 6 feitiços para sua aventura. ({filledSlots}/6 selecionados)
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {selectedSpells.map((spell, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="text-xl font-mono text-stone-light">{index + 1}.</span>
              <Select
                value={spell?.name || ""}
                onValueChange={(value) => handleSpellChange(index, value)}
              >
                <SelectTrigger className="w-full bg-dungeon-black border-ancient-stone">
                  <SelectValue placeholder="Escolha uma magia..." />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="empty">-- Vazio --</SelectItem>
                  {availableSpells.map(s => (
                    <SelectItem key={s.name} value={s.name}>
                      <span className="mr-2">{s.icon}</span> {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-stone-light/20">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button className="bg-crystal-blue hover:bg-frost-blue" onClick={handleSaveSpells}>Salvar Grimório</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
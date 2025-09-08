import { useState, useEffect } from "react";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { characterClasses } from "@/config/characterClasses";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollText, Wand2, Swords } from "lucide-react";

// --- SUB-COMPONENTES PARA ORGANIZAÇÃO ---

const CardStatusBadge = ({ player, isCurrentUser, onClick }) => {
  let statusText = "NORMAL";
  let statusColor = "text-green-400";
  let statusBg = "";

  if (player.skipTurn) {
    statusText = "PULANDO TURNO";
    statusColor = "text-orange-400";
    statusBg = "bg-orange-900/30";
  } else if (player.isDead) {
    statusText = "MORTO";
    statusColor = "text-red-600";
    statusBg = "bg-red-900/30";
  } else if (player.woundType === "grave") {
    statusText = "FERIMENTO GRAVE";
    statusColor = "text-red-400";
    statusBg = "bg-red-900/30";
  } else if (player.woundType === "leve") {
    statusText = "FERIMENTO LEVE";
    statusColor = "text-orange-400";
    statusBg = "bg-orange-900/30";
  } else if (player.isStunned) {
    statusText = "ATORDOADO";
    statusColor = "text-yellow-400";
    statusBg = "bg-yellow-800/20";
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "font-bold text-xs sm:text-sm px-2 py-1 rounded whitespace-nowrap flex-shrink-0",
        isCurrentUser &&
          "cursor-pointer hover:bg-stone-charcoal/50 transition-colors"
      )}
      title={isCurrentUser ? "Clique para alterar status" : ""}
    >
      <span className={cn(statusColor, statusBg, "p-1")}>{statusText}</span>
    </div>
  );
};

const GoldDisplay = ({ player, isCurrentUser, onToggleGoldVisibility }) => {
  // CORREÇÃO APLICADA AQUI:
  // O ouro só deve ser visível se for o card do próprio jogador (isCurrentUser).
  // Para todos os outros, o valor será "???".
  const shouldShowGold = isCurrentUser;

  return (
    <div>
      <span className="text-xs sm:text-sm text-stone-light flex items-center gap-2 flex-wrap">
        <span>Ouro</span>
        {isCurrentUser && (
          <button
            className="cursor-pointer text-lg sm:text-xl hover:scale-110 transition-transform flex-shrink-0"
            onClick={onToggleGoldVisibility}
            title={
              player.isGoldHidden ? "Mostrar Meu Ouro" : "Esconder Meu Ouro"
            }
          >
            {player.isGoldHidden ? "👁️" : "👁️‍🗨️"}
          </button>
        )}
      </span>
      <p className="text-xl sm:text-3xl font-bold text-treasure-gold gold-amount">
        {shouldShowGold && !player.isGoldHidden
          ? player.gold.toLocaleString("pt-BR")
          : "???"}
      </p>
    </div>
  );
};

const SpellDisplay = ({ player, isCurrentUser }) => {
  const { toggleSpellState } = useMultiplayerGame();

  if (
    player.character.className !== "Feiticeiro" ||
    !player.spells ||
    player.spells.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-3 sm:mt-4 pt-3 border-t border-stone-light/10">
      <h5 className="text-xs sm:text-sm text-stone-light mb-2">Grimório</h5>
      <div className="grid grid-cols-3 gap-2">
        {player.spells.map((spell, index) => (
          <button
            key={index}
            disabled={!isCurrentUser}
            onClick={(e) => {
              e.stopPropagation();
              toggleSpellState(player.id, index);
            }}
            title={spell.description}
            className={cn(
              "p-2 rounded-md flex flex-col items-center justify-center text-center transition-opacity duration-200",
              spell.used ? "bg-stone-800 opacity-40" : "bg-dungeon-black/50",
              isCurrentUser && !spell.used && "hover:bg-dungeon-black/80"
            )}
          >
            <span className="text-2xl">{spell.icon}</span>
            <span className="text-xs text-white font-semibold truncate w-full">
              {spell.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ActionButtons = ({
  player,
  currentUser,
  onInfoClick,
  onManageSpells,
  onHeal,
  onSelfHeal,
  onAmbush,
}) => {
  const { setPlayerSpells } = useMultiplayerGame();
  const isCurrentUser = player.id === currentUser?.id;

  const allSpellsUsed =
    player.spells?.every((s) => s.used) && player.spells?.length > 0;
  const isSpellbookFull = player.spells?.length === 6;

  const isManageSpellsDisabled = isSpellbookFull && !allSpellsUsed;

  const handleManageSpellsClick = (e) => {
    e.stopPropagation();
    if (allSpellsUsed) {
      if (
        window.confirm(
          "Recarregar o grimório? Você poderá escolher uma nova combinação de 6 magias."
        )
      ) {
        setPlayerSpells(player.id, []);
        onManageSpells();
      }
    } else {
      onManageSpells();
    }
  };

  let spellButtonText = "Escolher Magias";
  if (allSpellsUsed) {
    spellButtonText = "Recarregar Magias";
  } else if (player.spells?.length > 0) {
    spellButtonText = "Gerenciar Magias";
  }

  const isWoundedState =
    player.isWounded ||
    player.woundType === "grave" ||
    player.woundType === "leve";
  const canSelfHeal =
    isCurrentUser &&
    player.character.className === "Paladino" &&
    isWoundedState;
  const canHealOthers =
    !isCurrentUser &&
    isWoundedState &&
    currentUser?.character?.className === "Paladino";

  const isThief = currentUser?.character?.className === "Ladrão";
  const canAmbush = isThief && !isCurrentUser;

  return (
    <>
      {canAmbush && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onAmbush(player);
          }}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold mt-3 sm:mt-4 text-xs sm:text-sm"
        >
          <Swords className="mr-2 h-4 w-4" /> Emboscar {player.character.name}
        </Button>
      )}

      {isCurrentUser && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick();
          }}
          className="w-full mt-3 sm:mt-4 bg-void-purple/80 hover:bg-void-purple text-white font-bold text-xs sm:text-sm"
        >
          <ScrollText className="mr-2 h-4 w-4" /> Mais Detalhes
        </Button>
      )}

      {isCurrentUser && player.character.className === "Feiticeiro" && (
        <Button
          onClick={handleManageSpellsClick}
          disabled={isManageSpellsDisabled}
          className="w-full mt-2 bg-arcane-blue/80 hover:bg-arcane-blue font-bold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            isManageSpellsDisabled
              ? "Você deve usar todas as suas magias antes de recarregar."
              : ""
          }
        >
          <Wand2 className="mr-2 h-4 w-4" />
          {spellButtonText}
        </Button>
      )}

      {canHealOthers && (
        <Button
          onClick={onHeal}
          className="w-full bg-ethereal-blue/80 hover:bg-ethereal-blue text-dungeon-black font-bold mt-3 sm:mt-4 text-xs sm:text-sm"
        >
          🛡️ Curar {player.character.name}
        </Button>
      )}

      {canSelfHeal && (
        <div className="mt-3 sm:mt-4 text-center">
          <Button
            onClick={onSelfHeal}
            className="w-full bg-ethereal-blue/80 hover:bg-ethereal-blue text-dungeon-black font-bold text-xs sm:text-sm"
          >
            🛡️ Curar-se (Pula 1 Turno)
          </Button>
        </div>
      )}
    </>
  );
};

// --- COMPONENTE PRINCIPAL ---

export function HeroStatusCard({
  player,
  onClick,
  isCurrentUser,
  onItemClick,
  onInfoClick,
  onManageSpells,
  onAmbush,
}) {
  const { currentUser, updatePlayerStats } = useMultiplayerGame();

  const [showWoundModal, setShowWoundModal] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [selectedWoundType, setSelectedWoundType] = useState(null);
  const [itemsToDiscard, setItemsToDiscard] = useState([]);
  const [goldToRemove, setGoldToRemove] = useState(0);

  const classData = characterClasses.find(
    (c) => c.name === player.character.className
  );
  const isWoundedState =
    player.isWounded ||
    player.woundType === "grave" ||
    player.woundType === "leve";

  // --- Handlers ---

  const handleHeal = (e) => {
    e.stopPropagation();
    updatePlayerStats(player.id, {
      isWounded: false,
      woundType: null,
      skipTurn: false,
      isStunned: false,
    });
  };

  const handleSelfHeal = (e) => {
    e.stopPropagation();
    updatePlayerStats(player.id, {
      isWounded: false,
      woundType: null,
      skipTurn: true,
      isStunned: false,
    });
  };

  const handleWoundClick = (e) => {
    e.stopPropagation();
    if (isCurrentUser) {
      if (player.skipTurn) {
        updatePlayerStats(player.id, { skipTurn: false });
        return;
      }
      if (player.isDead) return;
      if (isWoundedState) {
        updatePlayerStats(player.id, {
          isWounded: false,
          woundType: null,
          skipTurn: false,
        });
      } else if (player.isStunned) {
        updatePlayerStats(player.id, { isStunned: false });
      } else {
        setShowWoundModal(true);
      }
    }
  };

  const handleGoldToggle = (e) => {
    e.stopPropagation();
    updatePlayerStats(player.id, { isGoldHidden: !player.isGoldHidden });
  };

  const handleWoundTypeSelect = (woundType) => {
    setShowWoundModal(false);
    if (woundType === "morto") {
      updatePlayerStats(player.id, {
        isDead: true,
        isWounded: false,
        isStunned: false,
        inventory: [],
        gold: 0,
        woundType: null,
        skipTurn: false,
      });
      setTimeout(() => {
        updatePlayerStats(player.id, { isDead: false });
      }, 5000);
    } else {
      setSelectedWoundType(woundType);
      setShowItemSelection(true);
    }
  };

  const handleConfirmPenalty = () => {
    const finalInventory = player.inventory.filter(
      (_, index) => !itemsToDiscard.includes(index)
    );
    const finalGold = Math.max(0, player.gold - goldToRemove);
    const newStats = { inventory: finalInventory, gold: finalGold };

    if (selectedWoundType === "ferimento_grave") {
      newStats.isWounded = true;
      newStats.isStunned = false;
      newStats.woundType = "grave";
      newStats.skipTurn = false;
    } else if (selectedWoundType === "ferimento_leve") {
      newStats.isWounded = true;
      newStats.isStunned = false;
      newStats.woundType = "leve";
      newStats.skipTurn = true;
    } else if (selectedWoundType === "atordoado") {
      newStats.isWounded = false;
      newStats.isStunned = true;
      newStats.woundType = null;
      newStats.skipTurn = false;
    }

    updatePlayerStats(player.id, newStats);
    cancelItemSelection();
  };

  const cancelItemSelection = () => {
    setShowItemSelection(false);
    setSelectedWoundType(null);
    setItemsToDiscard([]);
    setGoldToRemove(0);
  };

  return (
    <>
      <Card
        onClick={isCurrentUser ? onClick : null}
        className={cn(
          "bg-stone-charcoal/80 border-l-4 sm:border-l-8 text-white flex flex-col h-full relative hero-status-card",
          isCurrentUser &&
            "cursor-pointer hover:bg-stone-charcoal transition-colors",
          (isWoundedState || player.isDead) && "shadow-lg shadow-blood-red/20",
          (player.isStunned || player.skipTurn) &&
            "shadow-lg shadow-yellow-400/20"
        )}
        style={{ borderColor: player.color }}
      >
        {(isWoundedState || player.isDead) && (
          <div className="absolute inset-0 bg-blood-red/10 pointer-events-none rounded-md" />
        )}
        {(player.isStunned || player.skipTurn) && (
          <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none rounded-md" />
        )}

        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle
                className="text-lg sm:text-2xl character-name truncate"
                style={{ color: player.color }}
              >
                {player.character.name}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-stone-light truncate">
                {player.character.className} - ({player.name})
              </CardDescription>
            </div>
            <CardStatusBadge
              player={player}
              isCurrentUser={isCurrentUser}
              onClick={handleWoundClick}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col justify-between p-3 sm:p-6 pt-0">
          <div className="flex-grow flex items-center justify-center my-2 sm:my-4">
            {classData?.gifUrl && (
              <img
                src={classData.gifUrl}
                alt={`${player.character.name} pixel art`}
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain pixelated"
              />
            )}
          </div>

          <div className="space-y-2 sm:space-y-4">
            <GoldDisplay
              player={player}
              isCurrentUser={isCurrentUser}
              onToggleGoldVisibility={handleGoldToggle}
            />
          </div>

          <div className="mt-3 sm:mt-4 pt-3 border-t border-stone-light/10">
            <h5 className="text-xs sm:text-sm text-stone-light mb-2">
              Itens Especiais
            </h5>
            <div className="flex flex-wrap gap-1 sm:gap-2 min-h-[28px]">
              {player.inventory && player.inventory.length > 0 ? (
                player.inventory.map((item, index) => (
                  <button
                    key={index}
                    title={item.description}
                    className="text-lg sm:text-2xl cursor-pointer hover:scale-110 transition-transform p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                    }}
                  >
                    {item.icon}
                  </button>
                ))
              ) : (
                <p className="text-xs text-stone-light/50 italic">
                  Nenhum item
                </p>
              )}
            </div>
          </div>

          <SpellDisplay player={player} isCurrentUser={isCurrentUser} />

          <ActionButtons
            player={player}
            currentUser={currentUser}
            onInfoClick={onInfoClick}
            onManageSpells={onManageSpells}
            onHeal={handleHeal}
            onSelfHeal={handleSelfHeal}
            onAmbush={onAmbush}
          />
        </CardContent>
      </Card>

      <WoundSelectionModal
        isOpen={showWoundModal}
        onClose={() => setShowWoundModal(false)}
        onSelect={handleWoundTypeSelect}
      />
      <PenaltyModal
        isOpen={showItemSelection}
        onClose={cancelItemSelection}
        player={player}
        woundType={selectedWoundType}
        onConfirm={handleConfirmPenalty}
        itemsToDiscard={itemsToDiscard}
        onItemToggle={setItemsToDiscard}
        goldToRemove={goldToRemove}
        onAdjustGold={setGoldToRemove}
      />
    </>
  );
}

function WoundSelectionModal({ isOpen, onClose, onSelect }) {
  const woundTypes = [
    {
      id: "morto",
      label: "Herói Morto",
      description: "Abandone todos os tesouros e comece novamente.",
      icon: "💀",
      style:
        "from-red-900/30 to-red-800/30 hover:from-red-800/50 hover:to-red-700/50 border-red-600/40 hover:border-red-500/60",
      text: "text-red-400 group-hover:text-red-300",
    },
    {
      id: "ferimento_grave",
      label: "Ferimento Grave",
      description: "Abandone metade de seu tesouro e volte para a escada.",
      icon: "🩸",
      style:
        "from-red-800/25 to-red-700/25 hover:from-red-700/40 hover:to-red-600/40 border-red-500/40 hover:border-red-400/60",
      text: "text-red-300",
    },
    {
      id: "ferimento_leve",
      label: "Ferimento Leve",
      description: "Abandone um tesouro, volte uma casa. Pule uma jogada.",
      icon: "🤕",
      style:
        "from-orange-800/25 to-orange-700/25 hover:from-orange-700/40 hover:to-orange-600/40 border-orange-500/40 hover:border-orange-400/60",
      text: "text-orange-300",
    },
    {
      id: "atordoado",
      label: "Atordoado",
      description: "Abandone um dos tesouros.",
      icon: "😵",
      style:
        "from-yellow-800/25 to-yellow-700/25 hover:from-yellow-700/40 hover:to-yellow-600/40 border-yellow-500/40 hover:border-yellow-400/60",
      text: "text-yellow-300",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-stone-600/50 text-white w-[95vw] max-w-[400px] shadow-2xl p-4 sm:p-6">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-lg sm:text-2xl font-bold text-blood-red flex items-center justify-center gap-2">
            ⚔️ Resultado do Combate
          </DialogTitle>
          <DialogDescription className="text-stone-300 text-sm mt-1">
            Escolha o resultado do ataque sofrido pelo herói
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {woundTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`w-full group relative overflow-hidden rounded-lg bg-gradient-to-r p-3 sm:p-4 border-2 transition-all duration-200 ${type.style}`}
            >
              <div className="flex items-start gap-3 text-left">
                <div className="text-xl sm:text-2xl">{type.icon}</div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-bold text-sm sm:text-base ${type.text}`}
                  >
                    {type.label}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {type.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PenaltyModal({
  isOpen,
  onClose,
  player,
  woundType,
  onConfirm,
  itemsToDiscard,
  onItemToggle,
  goldToRemove,
  onAdjustGold,
}) {
  if (!woundType) return null;

  const titles = {
    ferimento_grave: "🩸 Ferimento Grave",
    ferimento_leve: "🤕 Ferimento Leve",
    atordoado: "😵 Atordoado",
  };
  const descriptions = {
    ferimento_grave:
      "Abandone metade de seus tesouros (arredondado para cima) entre itens e ouro.",
    ferimento_leve: "Abandone um de seus tesouros e/ou ouro.",
    atordoado: "Abandone um dos tesouros e/ou ouro.",
  };

  const isPenaltySelected = itemsToDiscard.length > 0 || goldToRemove > 0;

  const handleItemToggle = (itemIndex) => {
    const newItems = itemsToDiscard.includes(itemIndex)
      ? itemsToDiscard.filter((i) => i !== itemIndex)
      : [...itemsToDiscard, itemIndex];
    onItemToggle(newItems);
  };

  const handleAdjustGold = (amount) => {
    const newAmount = Math.min(player.gold, Math.max(0, goldToRemove + amount));
    onAdjustGold(newAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-stone-600/50 text-white w-[95vw] max-w-sm shadow-2xl p-4 sm:p-6 flex flex-col max-h-[90vh]">
        <DialogHeader className="text-center pb-2 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-bold text-blood-red">
            {titles[woundType]}
          </DialogTitle>
          <DialogDescription className="text-stone-300 text-xs sm:text-sm">
            {descriptions[woundType]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2 py-4">
          <div className="bg-dungeon-black/50 p-3 sm:p-4 rounded-lg border-2 border-stone-600/30">
            <label className="text-sm font-semibold text-yellow-200 block mb-3">
              💰 Ouro a remover (atual: {player.gold.toLocaleString("pt-BR")})
            </label>
            <div className="flex items-center justify-center p-2 bg-stone-900 rounded-lg text-center mb-3">
              <p className="text-2xl font-bold text-red-400">
                -{goldToRemove.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleAdjustGold(100)}
                variant="outline"
                className="bg-red-900/40 border-red-500/50 hover:bg-red-800/60 text-red-300 font-bold"
              >
                +100
              </Button>
              <Button
                onClick={() => handleAdjustGold(500)}
                variant="outline"
                className="bg-red-900/40 border-red-500/50 hover:bg-red-800/60 text-red-300 font-bold"
              >
                +500
              </Button>
              <Button
                onClick={() => handleAdjustGold(1000)}
                variant="outline"
                className="bg-red-900/40 border-red-500/50 hover:bg-red-800/60 text-red-300 font-bold"
              >
                +1000
              </Button>
            </div>
          </div>

          {player.inventory.length > 0 && (
            <div className="bg-dungeon-black/50 p-3 sm:p-4 rounded-lg border-2 border-stone-600/30">
              <h4 className="text-sm font-semibold text-stone-300 mb-3">
                🎒 Itens a abandonar ({itemsToDiscard.length} selecionado(s)):
              </h4>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                {player.inventory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleItemToggle(index)}
                    className={cn(
                      "w-full group bg-gradient-to-r from-stone-700/30 to-stone-600/30 border-2 rounded-lg p-3 transition-all duration-200 text-left min-h-[44px] flex items-center gap-2",
                      itemsToDiscard.includes(index)
                        ? "border-red-500/80 ring-2 ring-red-500/50 bg-red-900/30"
                        : "border-stone-600/40 hover:border-stone-400/50"
                    )}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">
                        {item.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-600/30 flex-shrink-0">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!isPenaltySelected}
            className="flex-1 bg-blood-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Penalidade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

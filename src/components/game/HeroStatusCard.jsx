import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { characterClasses } from "@/config/characterClasses";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ScrollText } from "lucide-react";

export function HeroStatusCard({
  player,
  onClick,
  isCurrentUser,
  onItemClick,
  onInfoClick,
}) {
  const { currentUser, updatePlayerStats } = useMultiplayerGame();
  const [showWoundModal, setShowWoundModal] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [selectedWoundType, setSelectedWoundType] = useState(null);
  const [itemsToDiscard, setItemsToDiscard] = useState([]);
  const [goldToRemove, setGoldToRemove] = useState(0);
  const [hideMyGold, setHideMyGold] = useState(false);

  const classData = characterClasses.find(
    (c) => c.name === player.character.className
  );
  const goldTarget = classData ? classData.goldTarget : 0;

  const canHeal =
    currentUser?.character?.className === "Paladino" &&
    player.isWounded &&
    !isCurrentUser;

  const shouldShowTarget = isCurrentUser;

  const handleHeal = (e) => {
    e.stopPropagation();
    updatePlayerStats(player.id, { isWounded: false, woundType: null, skipTurn: false });
  };

  const handleWoundClick = (e) => {
    e.stopPropagation();
    if (isCurrentUser) {
      if (player.isDead) {
        return;
      }
      if (player.isWounded) {
        updatePlayerStats(player.id, { isWounded: false, woundType: null, skipTurn: false });
      } else if (player.isStunned) {
        updatePlayerStats(player.id, { isStunned: false });
      } else {
        setShowWoundModal(true);
      }
    }
  };

  const handleGoldToggle = (e) => {
    e.stopPropagation();
    setHideMyGold(prev => !prev);
  };
  
  const handleWoundTypeSelect = (woundType) => {
    setSelectedWoundType(woundType);
    setShowWoundModal(false);

    switch (woundType) {
      case "morto":
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
        break;

      case "ferimento_grave":
      case "ferimento_leve":
      case "atordoado":
        setShowItemSelection(true);
        break;

      default:
        break;
    }
  };

  const handleItemToggleForDiscard = (itemIndex) => {
    setItemsToDiscard((prev) => {
      if (prev.includes(itemIndex)) {
        return prev.filter((i) => i !== itemIndex);
      }
      return [...prev, itemIndex];
    });
  };

  const handleConfirmPenalty = () => {
    const finalInventory = player.inventory.filter(
      (_, index) => !itemsToDiscard.includes(index)
    );
    const finalGold = Math.max(0, player.gold - goldToRemove);

    const newStats = {
      inventory: finalInventory,
      gold: finalGold,
    };

    if (selectedWoundType === 'ferimento_grave') {
        newStats.isWounded = true;
        newStats.isStunned = false;
        newStats.woundType = 'grave';
        newStats.skipTurn = false;
    } else if (selectedWoundType === 'ferimento_leve') {
        newStats.isWounded = true;
        newStats.isStunned = false;
        newStats.woundType = 'leve';
        newStats.skipTurn = true;
    } else if (selectedWoundType === 'atordoado') {
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

  const isPenaltySelected = itemsToDiscard.length > 0 || goldToRemove > 0;

  const adjustGoldToRemove = (amount) => {
    const currentAmount = goldToRemove;
    const newAmount = Math.min(player.gold, Math.max(0, currentAmount + amount));
    setGoldToRemove(newAmount);
  }

  const renderItemSelectionModal = () => {
    if (!selectedWoundType) return null;

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

    return (
      <Dialog open={showItemSelection} onOpenChange={cancelItemSelection}>
        <DialogContent className="bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-stone-600/50 text-white w-[95vw] max-w-[400px] sm:max-w-md lg:max-w-lg h-[85vh] max-h-[700px] sm:max-h-[90vh] shadow-2xl p-3 sm:p-6 overflow-hidden flex flex-col">
          <DialogHeader className="text-center pb-2 flex-shrink-0">
            <DialogTitle className="text-base sm:text-xl font-bold text-blood-red">
              {titles[selectedWoundType]}
            </DialogTitle>
            <DialogDescription className="text-stone-300 text-xs sm:text-sm">
              {descriptions[selectedWoundType]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto pr-2">
            <div className="bg-dungeon-black/50 p-2 sm:p-4 rounded-lg border-2 border-stone-600/30">
                <label className="text-xs sm:text-sm font-semibold text-yellow-200 block mb-2 sm:mb-3">
                    💰 Ouro a remover (atual: {player.gold.toLocaleString("pt-BR")})
                </label>
                <div className="flex items-center justify-center p-2 bg-stone-900 rounded-lg text-center mb-3">
                    <p className="text-2xl font-bold text-red-400">
                        -{goldToRemove.toLocaleString('pt-BR')}
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => adjustGoldToRemove(100)} variant="outline" className="bg-red-900/40 border-red-500/50 hover:bg-red-800/60 text-red-300 font-bold">+100</Button>
                    <Button onClick={() => adjustGoldToRemove(500)} variant="outline" className="bg-red-900/40 border-red-500/50 hover:bg-red-800/60 text-red-300 font-bold">+500</Button>
                    <Button onClick={() => adjustGoldToRemove(1000)} variant="outline" className="bg-red-900/40 border-red-500/50 hover:bg-red-800/60 text-red-300 font-bold">+1000</Button>
                </div>
            </div>

            {player.inventory.length > 0 && (
              <div className="bg-dungeon-black/50 p-2 sm:p-4 rounded-lg border-2 border-stone-600/30">
                <h4 className="text-xs sm:text-sm font-semibold text-stone-300 mb-2 sm:mb-3">
                  🎒 Itens a abandonar ({itemsToDiscard.length} selecionado(s)):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 scroll-container">
                  {player.inventory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleItemToggleForDiscard(index)}
                      className={cn(
                        "w-full group bg-gradient-to-r from-stone-700/30 to-stone-600/30 border-2 border-stone-600/40 rounded-lg p-2 sm:p-3 transition-all duration-200 text-left min-h-[44px] flex items-center gap-2",
                        itemsToDiscard.includes(index)
                          ? "border-red-500/80 ring-2 ring-red-500/50 bg-red-900/30"
                          : "hover:border-stone-400/50"
                      )}
                    >
                      <span className="text-lg sm:text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-white truncate">
                          {item.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-stone-600/30 flex-shrink-0">
            <Button
              onClick={cancelItemSelection}
              variant="secondary"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPenalty}
              disabled={!isPenaltySelected}
              className="flex-1 bg-blood-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Penalidade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <>
      <Card
        onClick={isCurrentUser ? onClick : null}
        className={cn(
          "bg-stone-charcoal/80 border-l-4 sm:border-l-8 text-white flex flex-col h-full relative hero-status-card",
          isCurrentUser &&
            "cursor-pointer hover:bg-stone-charcoal transition-colors",
          (player.isWounded || player.isDead) && "shadow-lg shadow-blood-red/20",
          player.isStunned && "shadow-lg shadow-yellow-400/20"
        )}
        style={{ borderColor: player.color }}
      >
        {(player.isWounded || player.isDead) && (
          <div className="absolute inset-0 bg-blood-red/10 pointer-events-none rounded-md" />
        )}
        {player.isStunned && (
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
            <div
              onClick={handleWoundClick}
              className={cn( "font-bold text-xs sm:text-sm px-2 py-1 rounded whitespace-nowrap flex-shrink-0", isCurrentUser && "cursor-pointer hover:bg-blood-red/30 transition-colors" )}
              title={isCurrentUser ? "Toque para alterar status" : ""}
            >
              {player.isDead ? ( <span className="text-red-600 bg-red-900/30 p-1">MORTO</span> ) : 
               player.woundType === 'grave' ? ( <span className="text-red-400 bg-red-900/30 p-1">FERIMENTO GRAVE</span> ) : 
               player.woundType === 'leve' ? ( <span className="text-orange-400 bg-orange-900/30 p-1">FERIMENTO LEVE</span> ) : 
               player.isStunned ? ( <span className="text-yellow-400 bg-yellow-800/20 p-1">ATORDOADO</span> ) : 
               ( <span className="text-green-400">NORMAL</span> )}
            </div>
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
            <div>
              <span className="text-xs sm:text-sm text-stone-light flex items-center gap-2 flex-wrap">
                <span> Ouro {shouldShowTarget && `(Meta: ${goldTarget.toLocaleString("pt-BR")})`} </span>
                {isCurrentUser && (
                  <button
                    className="cursor-pointer text-lg sm:text-xl hover:scale-110 transition-transform flex-shrink-0"
                    onClick={handleGoldToggle}
                    title={hideMyGold ? "Mostrar Meu Ouro" : "Esconder Meu Ouro"}
                  >
                    {hideMyGold ? "👁️‍🗨️" : "👁️"}
                  </button>
                )}
              </span>
              <p className="text-xl sm:text-3xl font-bold text-treasure-gold gold-amount">
                  {isCurrentUser && hideMyGold ? "???" : player.gold.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
          {player.woundType === 'leve' && (
            <div className="text-orange-400 text-sm font-bold mt-2">
              Volta 1 Casa / Pula 1 Turno
            </div>
          )}

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
                    onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
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

          {isCurrentUser && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick();
              }}
              className="w-full mt-3 sm:mt-4 bg-void-purple/80 hover:bg-void-purple text-white font-bold text-xs sm:text-sm"
            >
              <ScrollText className="mr-2 h-4 w-4" />
              Ver Vantagens
            </Button>
          )}
          
          {canHeal && (
            <Button
              onClick={handleHeal}
              className="w-full bg-ethereal-blue/80 hover:bg-ethereal-blue text-dungeon-black font-bold mt-3 sm:mt-4 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]"
            >
              🛡️ Curar {player.character.name}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showWoundModal} onOpenChange={setShowWoundModal}>
        <DialogContent className="bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-stone-600/50 text-white w-[95vw] max-w-[400px] sm:max-w-md lg:max-w-lg h-[80vh] max-h-[600px] sm:max-h-[90vh] shadow-2xl p-3 sm:p-6 overflow-hidden flex flex-col">
          <DialogHeader className="text-center pb-2 flex-shrink-0">
            <DialogTitle className="text-base sm:text-2xl font-bold text-blood-red flex items-center justify-center gap-2">
              ⚔️ Resultado do Combate
            </DialogTitle>
            <DialogDescription className="text-stone-300 text-xs sm:text-sm mt-1">
              Escolha o resultado do ataque sofrido pelo herói
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto">
            <button
              onClick={() => handleWoundTypeSelect("morto")}
              className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-900/30 to-red-800/30 hover:from-red-800/50 hover:to-red-700/50 border-2 border-red-600/40 hover:border-red-500/60 transition-all duration-200 p-2 sm:p-4"
            >
              <div className="flex items-start gap-2 sm:gap-3 text-left">
                <div className="text-lg sm:text-2xl">💀</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-red-400 text-sm sm:text-base group-hover:text-red-300">
                    Herói Morto
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Abandone todos os tesouros e comece novamente.
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleWoundTypeSelect("ferimento_grave")}
              className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-800/25 to-red-700/25 hover:from-red-700/40 hover:to-red-600/40 border-2 border-red-500/40 hover:border-red-400/60 transition-all duration-200 p-2 sm:p-4"
            >
              <div className="flex items-start gap-2 sm:gap-3 text-left">
                <div className="text-lg sm:text-2xl">🩸</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-red-300 text-sm sm:text-base">
                    Ferimento Grave
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Abandone metade de seu tesouro e volte para a escada.
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleWoundTypeSelect("ferimento_leve")}
              className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-800/25 to-orange-700/25 hover:from-orange-700/40 hover:to-orange-600/40 border-2 border-orange-500/40 hover:border-orange-400/60 transition-all duration-200 p-2 sm:p-4"
            >
              <div className="flex items-start gap-2 sm:gap-3 text-left">
                <div className="text-lg sm:text-2xl">🤕</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-orange-300 text-sm sm:text-base">
                    Ferimento Leve
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Abandone um tesouro, volte uma casa em relação ao monstro. Pule uma jogada.
                  </div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleWoundTypeSelect("atordoado")}
              className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-yellow-800/25 to-yellow-700/25 hover:from-yellow-700/40 hover:to-yellow-600/40 border-2 border-yellow-500/40 hover:border-yellow-400/60 transition-all duration-200 p-2 sm:p-4"
            >
              <div className="flex items-start gap-2 sm:gap-3 text-left">
                <div className="text-lg sm:text-2xl">😵</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-yellow-300 text-sm sm:text-base">
                    Atordoado
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Abandone um dos tesouros.
                  </div>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {renderItemSelectionModal()}
    </>
  );
}
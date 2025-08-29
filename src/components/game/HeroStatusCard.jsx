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
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function HeroStatusCard({
  player,
  onClick,
  isCurrentUser,
  onItemClick,
}) {
  const { currentUser, updatePlayerStats } = useMultiplayerGame();
  const [showWoundModal, setShowWoundModal] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [selectedWoundType, setSelectedWoundType] = useState(null);
  const [goldToRemove, setGoldToRemove] = useState(0);
  
  const classData = characterClasses.find(
    (c) => c.name === player.character.className
  );
  const goldTarget = classData ? classData.goldTarget : 0;

  const canHeal =
    currentUser?.character?.className === "Paladino" &&
    player.isWounded &&
    !isCurrentUser;

  const handleHeal = (e) => {
    e.stopPropagation();
    updatePlayerStats(player.id, { isWounded: false });
  };

  const toggleGoldVisibility = (e) => {
    e.stopPropagation();
    updatePlayerStats(player.id, { isGoldHidden: !player.isGoldHidden });
  };

  const handleWoundClick = (e) => {
    e.stopPropagation();
    if (isCurrentUser) {
      if (player.isWounded) {
        updatePlayerStats(player.id, { isWounded: false });
      } else {
        setShowWoundModal(true);
      }
    }
  };

  const handleWoundTypeSelect = (woundType) => {
    setSelectedWoundType(woundType);
    setGoldToRemove(0);
    
    switch (woundType) {
      case 'morto':
        updatePlayerStats(player.id, { 
          isWounded: true,
          inventory: [],
          gold: 0
        });
        setShowWoundModal(false);
        break;
        
      case 'ferimento_grave':
        const halfCards = Math.floor(player.inventory.length / 2);
        const newInventory = player.inventory.slice(halfCards);
        updatePlayerStats(player.id, { 
          isWounded: true,
          inventory: newInventory
        });
        setShowWoundModal(false);
        break;
        
      case 'ferimento_leve':
      case 'atordoado':
        if (player.inventory.length > 0) {
          setShowItemSelection(true);
        } else {
          updatePlayerStats(player.id, { isWounded: true });
        }
        setShowWoundModal(false);
        break;
        
      default:
        setShowWoundModal(false);
    }
  };

  const handleItemRemoval = (itemIndex) => {
    const newInventory = player.inventory.filter((_, index) => index !== itemIndex);
    const newGold = Math.max(0, player.gold - goldToRemove);
    
    updatePlayerStats(player.id, { 
      isWounded: true,
      inventory: newInventory,
      gold: newGold
    });
    setShowItemSelection(false);
    setSelectedWoundType(null);
    setGoldToRemove(0);
  };

  const handleGoldOnlyRemoval = () => {
    const newGold = Math.max(0, player.gold - goldToRemove);
    updatePlayerStats(player.id, { 
      isWounded: true,
      gold: newGold
    });
    setShowItemSelection(false);
    setSelectedWoundType(null);
    setGoldToRemove(0);
  };

  const cancelItemSelection = () => {
    setShowItemSelection(false);
    setSelectedWoundType(null);
    setGoldToRemove(0);
  };

  return (
    <>
      <Card
        onClick={isCurrentUser ? onClick : null}
        className={`
          bg-stone-charcoal/80 border-l-8 text-white flex flex-col h-full relative
          ${
            isCurrentUser
              ? "cursor-pointer hover:bg-stone-charcoal transition-colors"
              : ""
          }
          ${player.isWounded ? "shadow-lg shadow-blood-red/20" : ""}
        `}
        style={{ borderColor: player.color }}
      >
        {player.isWounded && (
          <div className="absolute inset-0 bg-blood-red/10 pointer-events-none rounded-md" />
        )}

        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl" style={{ color: player.color }}>
                {player.character.name}
              </CardTitle>
              <CardDescription className="text-stone-light">
                {player.character.className} - ({player.name})
              </CardDescription>
            </div>
            <div
              onClick={handleWoundClick}
              className={`font-bold text-sm px-2 py-1 rounded ${
                isCurrentUser ? "cursor-pointer hover:bg-blood-red/30 transition-colors" : ""
              }`}
              title={isCurrentUser ? "Clique para alterar status de ferimento" : ""}
            >
              {player.isWounded ? (
                <span className="text-blood-red bg-blood-red/20">FERIDO</span>
              ) : (
                <span className="text-green-400">NORMAL</span>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col justify-between">
          {classData?.gifUrl && (
            <div className="flex justify-center my-4">
              <img
                src={classData.gifUrl}
                alt={`${player.character.name} pixel art`}
                className="w-24 h-24 object-contain pixelated"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <span className="text-sm text-stone-light flex items-center gap-2">
                Ouro (Meta: {goldTarget.toLocaleString("pt-BR")})
                {isCurrentUser && (
                  <span
                    className="cursor-pointer text-xl hover:scale-110 transition-transform"
                    onClick={toggleGoldVisibility}
                    title={player.isGoldHidden ? "Mostrar Ouro" : "Ocultar Ouro"}
                  >
                    {player.isGoldHidden ? "👁️‍🗨️" : "👁️"}
                  </span>
                )}
              </span>
              {player.isGoldHidden && !isCurrentUser ? (
                <p className="text-3xl font-bold text-treasure-gold">???</p>
              ) : (
                <p className="text-3xl font-bold text-treasure-gold">
                  {player.gold.toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-2 border-t border-stone-light/10">
            <h5 className="text-sm text-stone-light mb-2">Itens Especiais</h5>
            <div className="flex flex-wrap gap-2">
              {player.inventory && player.inventory.length > 0 ? (
                player.inventory.map((item, index) => (
                  <span
                    key={index}
                    title={item.description}
                    className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                    }}
                  >
                    {item.icon}
                  </span>
                ))
              ) : (
                <p className="text-xs text-stone-light/50 italic">Nenhum item</p>
              )}
            </div>
          </div>
          
          {canHeal && (
            <Button
              onClick={handleHeal}
              className="w-full bg-ethereal-blue/80 hover:bg-ethereal-blue text-dungeon-black font-bold mt-4"
            >
              🛡️ Curar {player.character.name}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showWoundModal} onOpenChange={setShowWoundModal}>
        <DialogContent className="bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-stone-600/50 text-white max-w-md sm:max-w-lg shadow-2xl">
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-2xl font-bold text-blood-red flex items-center justify-center gap-2">
              ⚔️ Resultado do Combate
            </DialogTitle>
            <DialogDescription className="text-stone-300 text-sm mt-1">
              Escolha o resultado do ataque sofrido pelo herói
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            <button
              onClick={() => handleWoundTypeSelect('morto')}
              className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-900/30 to-red-800/30 hover:from-red-800/50 hover:to-red-700/50 border-2 border-red-600/40 hover:border-red-500/60 transition-all duration-200 p-4"
            >
              <div className="flex items-start gap-3 text-left">
                <div className="text-2xl">💀</div>
                <div className="flex-1">
                  <div className="font-bold text-red-400 text-base group-hover:text-red-300">
                    Herói Morto
                  </div>
                  <div className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Abandone todos os tesouros. Pegue seu guerreiro e comece novamente.
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleWoundTypeSelect('ferimento_grave')}
              className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-800/25 to-red-700/25 hover:from-red-700/40 hover:to-red-600/40 border-2 border-red-500/40 hover:border-red-400/60 transition-all duration-200 p-4"
            >
              <div className="flex items-start gap-3 text-left">
                <div className="text-2xl">🩸</div>
                <div className="flex-1">
                  <div className="font-bold text-red-300 text-base group-hover:text-red-200">
                    Ferimento Grave
                  </div>
                  <div className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Abandone metade de seu tesouro em quantidade de cartas e volte para a Escadaria Principal.
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleWoundTypeSelect('ferimento_leve')}
              className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-800/25 to-orange-700/25 hover:from-orange-700/40 hover:to-orange-600/40 border-2 border-orange-500/40 hover:border-orange-400/60 transition-all duration-200 p-4"
            >
              <div className="flex items-start gap-3 text-left">
                <div className="text-2xl">🤕</div>
                <div className="flex-1">
                  <div className="font-bold text-orange-300 text-base group-hover:text-orange-200">
                    Ferimento Leve
                  </div>
                  <div className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Abandone um de seus tesouros (livre escolha) e volte uma casa em relação ao monstro. Pule uma jogada.
                  </div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleWoundTypeSelect('atordoado')}
              className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-r from-yellow-800/25 to-yellow-700/25 hover:from-yellow-700/40 hover:to-yellow-600/40 border-2 border-yellow-500/40 hover:border-yellow-400/60 transition-all duration-200 p-4"
            >
              <div className="flex items-start gap-3 text-left">
                <div className="text-2xl">😵</div>
                <div className="flex-1">
                  <div className="font-bold text-yellow-300 text-base group-hover:text-yellow-200">
                    Atordoado
                  </div>
                  <div className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Abandone um dos tesouros.
                  </div>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showItemSelection} onOpenChange={cancelItemSelection}>
        <DialogContent className="bg-gradient-to-b from-stone-800 to-stone-900 border-2 border-stone-600/50 text-white max-w-md sm:max-w-lg shadow-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-xl font-bold text-blood-red flex items-center justify-center gap-2">
              {selectedWoundType === 'ferimento_leve' ? '🤕 Ferimento Leve' : '😵 Atordoado'}
            </DialogTitle>
            <DialogDescription className="text-stone-300 text-sm">
              Escolha um item para abandonar e/ou defina a quantidade de ouro a perder
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[60vh] px-1">
            {/* Input para remoção de ouro */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 p-4 rounded-lg border-2 border-yellow-600/30">
              <label className="text-sm font-semibold text-yellow-200 block mb-3 flex items-center gap-2">
                💰 Ouro a remover
                <span className="text-xs text-stone-400 font-normal">
                  (atual: {player.gold.toLocaleString("pt-BR")})
                </span>
              </label>
              <Input
                type="number"
                min="0"
                max={player.gold}
                value={goldToRemove}
                onChange={(e) => setGoldToRemove(Math.min(player.gold, Math.max(0, parseInt(e.target.value) || 0)))}
                className="bg-stone-800/70 border-2 border-stone-600/50 text-white placeholder:text-stone-400 focus:border-yellow-500/50 transition-colors"
                placeholder="Quantidade de ouro"
              />
            </div>

            {/* Lista de itens */}
            {player.inventory && player.inventory.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-stone-300 mb-3 flex items-center gap-2">
                  🎒 Itens disponíveis:
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {player.inventory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleItemRemoval(index)}
                      className="w-full group bg-gradient-to-r from-stone-700/30 to-stone-600/30 hover:from-red-800/30 hover:to-red-700/30 border-2 border-stone-600/40 hover:border-red-500/50 rounded-lg p-3 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-white group-hover:text-red-200">
                            {item.name}
                          </div>
                          <div className="text-xs text-stone-400 mt-1 leading-relaxed">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botão para remover apenas ouro (quando não há itens) */}
            {(!player.inventory || player.inventory.length === 0) && (
              <button
                onClick={handleGoldOnlyRemoval}
                disabled={goldToRemove === 0}
                className="w-full bg-gradient-to-r from-yellow-800/30 to-yellow-700/30 hover:from-yellow-700/50 hover:to-yellow-600/50 disabled:from-stone-700/20 disabled:to-stone-600/20 border-2 border-yellow-500/40 hover:border-yellow-400/60 disabled:border-stone-600/30 rounded-lg p-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2 font-semibold">
                  💰 Remover apenas ouro ({goldToRemove.toLocaleString("pt-BR")})
                </div>
              </button>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4 border-t border-stone-600/30">
            <button
              onClick={cancelItemSelection}
              className="flex-1 bg-gradient-to-r from-stone-600/50 to-stone-500/50 hover:from-stone-500/60 hover:to-stone-400/60 border-2 border-stone-500/50 hover:border-stone-400/60 rounded-lg py-2.5 px-4 font-semibold transition-all duration-200"
            >
              Cancelar
            </button>
            
            {player.inventory && player.inventory.length > 0 && goldToRemove > 0 && (
              <button
                onClick={handleGoldOnlyRemoval}
                className="flex-1 bg-gradient-to-r from-yellow-800/40 to-yellow-700/40 hover:from-yellow-700/60 hover:to-yellow-600/60 border-2 border-yellow-500/50 hover:border-yellow-400/60 rounded-lg py-2.5 px-4 font-semibold transition-all duration-200"
              >
                💰 Só remover ouro
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
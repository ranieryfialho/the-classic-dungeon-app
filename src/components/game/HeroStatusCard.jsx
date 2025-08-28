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

export function HeroStatusCard({
  player,
  onClick,
  isCurrentUser,
  onItemClick,
}) {
  const { currentUser, updatePlayerStats } = useMultiplayerGame();
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

  const toggleWoundedStatus = (e) => {
    e.stopPropagation();
    if (isCurrentUser) {
      updatePlayerStats(player.id, { isWounded: !player.isWounded });
    }
  };

  return (
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
            onClick={toggleWoundedStatus}
            className={`font-bold text-sm px-2 py-1 rounded ${
              isCurrentUser ? "cursor-pointer" : ""
            }`}
            title={isCurrentUser ? "Clique para alterar status" : ""}
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
        {/* --- NOVO: IMAGEM DO PERSONAGEM EM PIXEL ART --- */}
        {classData?.gifUrl && (
          <div className="flex justify-center my-4">
            <img
              src={classData.gifUrl}
              alt={`${player.character.name} pixel art`}
              className="w-24 h-24 object-contain pixelated" // w-24 h-24 é um tamanho bom, 'pixelated' para manter a nitidez
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
  );
}

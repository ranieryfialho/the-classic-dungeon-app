import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { useEffect, useRef } from "react"; // Importar useRef e useEffect

// Função auxiliar para formatar o timestamp
const formatLogTime = (timestamp) => {
  if (!timestamp || !timestamp.toDate) {
    return "";
  }
  const date = timestamp.toDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function GameLog() {
  const { gameState } = useMultiplayerGame();
  const { log } = gameState;
  const logContainerRef = useRef(null); // Criar a ref para o contêiner

  // Efeito para rolar para o final sempre que o log for atualizado
  useEffect(() => {
    if (logContainerRef.current) {
      const { scrollHeight, clientHeight } = logContainerRef.current;
      // Rola para o final
      logContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [log]); // A dependência é o próprio array de logs

  // Invertemos a ordem aqui para a renderização (o mais antigo primeiro)
  const sortedLog = [...log].reverse();

  return (
    <Card className="bg-stone-charcoal/80 border-stone-light/20 text-white h-full flex flex-col max-h-[520px]">
      <CardHeader className="p-4 flex-shrink-0">
        <CardTitle className="text-lg text-frost-blue flex items-center gap-2">
          <ScrollText size={20} />
          Histórico da Partida
        </CardTitle>
      </CardHeader>
      {/* Adicionar a ref ao CardContent */}
      <CardContent ref={logContainerRef} className="p-4 pt-0 flex-grow overflow-y-auto">
        {sortedLog.length > 0 ? (
          // Remover flex-col-reverse
          <ul className="space-y-2 text-sm">
            {sortedLog.map((entry) => (
              <li key={entry.id} className="text-stone-light leading-snug flex items-start gap-2">
                <span className="font-mono text-xs text-stone-light/50 flex-shrink-0 mt-px">
                  [{formatLogTime(entry.timestamp)}]
                </span>
                <span>{entry.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-stone-light/70 italic text-center pt-4">
            A aventura está para começar...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
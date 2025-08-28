import { Card } from "@/components/ui/card";

export function PlayerCard({ player }) {
  return (
    <Card 
      className="p-4 bg-white/10 border-2" 
      style={{ borderColor: player.color }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: player.color }} 
        />
        <span className="text-white font-medium text-lg">{player.name}</span>
        {player.isHost && <span className="text-yellow-400 text-lg">👑</span>}
      </div>
    </Card>
  );
}
import { useEffect, useMemo } from 'react';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';

export function EndGameModal() {
  const { gameState, currentUser, voteOnEndGame, processEndGameVotes } = useMultiplayerGame();
  const { room, players } = gameState;
  const proposal = room?.endGameProposal;

  useEffect(() => {
    if (proposal && currentUser?.isHost) {
      processEndGameVotes();
    }
  }, [proposal, players, currentUser, processEndGameVotes]);

  const { acceptVotes, rejectVotes } = useMemo(() => {
    if (!proposal?.votes) return { acceptVotes: 0, rejectVotes: 0 };

    const votes = Object.values(proposal.votes);
    return {
      acceptVotes: votes.filter(v => v === 'accept').length,
      rejectVotes: votes.filter(v => v === 'reject').length,
    };
  }, [proposal?.votes]);


  if (!proposal || !currentUser || proposal.proposerId === currentUser.id) {
    return null;
  }

  const myVote = proposal.votes[currentUser.id];
  const isOpen = proposal.status === 'pending' && !myVote;
  const totalPlayers = Object.keys(players).length;
  const proposerName = players[proposal.proposerId]?.name || 'O anfitrião';


  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-stone-charcoal text-white border-stone-light/20">
        <DialogHeader>
          <DialogTitle className="text-2xl text-ethereal-blue">Proposta para Finalizar o Jogo</DialogTitle>
          <DialogDescription className="text-stone-light text-lg pt-2">
            O jogador <span className="font-bold text-white">{proposerName}</span> acredita ter cumprido o objetivo e propôs o fim da partida.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 text-center">
            <p className="text-stone-light mb-4">Você concorda em finalizar a aventura para conferir os resultados?</p>

            <div className="my-4 flex justify-center items-center gap-6">
              <div className="flex items-center gap-2 text-green-400">
                <Check size={24} />
                <span className="text-xl font-bold">{acceptVotes} Voto(s)</span>
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <X size={24} />
                <span className="text-xl font-bold">{rejectVotes} Voto(s)</span>
              </div>
            </div>
            <p className="text-xs text-stone-light/70 mb-4">
              Total de jogadores na sala: {totalPlayers}. O jogo termina se ninguém votar 'Não'.
            </p>

            <div className="flex justify-center space-x-4">
                <Button onClick={() => voteOnEndGame('accept')} className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6">
                    Sim, Aceito
                </Button>
                <Button onClick={() => voteOnEndGame('reject')} variant="destructive" className="text-lg px-8 py-6">
                    Não, Continuar
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
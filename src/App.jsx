import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { AuthPage } from './pages/AuthPage';
import { MainMenu } from './pages/MainMenu';
import { RoomLobby } from './pages/RoomLobby';
import { CharacterSelection } from './pages/CharacterSelection';
import { GameDashboard } from './pages/GameDashboard';
import { PlayerProfile } from './pages/PlayerProfile';
import { JoinRoom } from './pages/JoinRoom';
import Meteors from "@/components/magicui/meteors";
import Sparkles from "@/components/magicui/sparkles";
import Footer from "@/components/Footer";

function App() {
  const { currentUser } = useAuth();
  const { gameState, joinRoom } = useMultiplayerGame();
  const { gamePhase } = gameState;
  const phasesWithMobileBar = ['lobby', 'selection', 'playing'];
  const hasMobileBar = phasesWithMobileBar.includes(gamePhase);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get('room');

    if (roomIdFromUrl && currentUser && !gameState.room) {
      joinRoom(roomIdFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser, gameState.room, joinRoom]);

  const renderGameScreen = () => {
    switch (gameState.gamePhase) {
      case 'lobby': return <RoomLobby />;
      case 'selection': return <CharacterSelection />;
      case 'playing': return <GameDashboard />;
      case 'profile': return <PlayerProfile />;
      case 'joining': return <JoinRoom />;
      case 'menu': default: return <MainMenu />;
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-dungeon-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ancient-stone via-stone-charcoal to-dungeon-black flex flex-col">
      <Meteors number={30} />
      <div className="absolute inset-x-0 bottom-0 h-1/2">
        <Sparkles background="transparent" minSize={0.6} maxSize={1.4} particleDensity={150} particleColor="#FFFFFF" />
      </div>

      <main className="relative z-10 flex-grow">
        {currentUser ? renderGameScreen() : <AuthPage />}
      </main>

      <Footer className={hasMobileBar ? 'hidden sm:block' : ''} />
    </div>
  );
}

export default App;
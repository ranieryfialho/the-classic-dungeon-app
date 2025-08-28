import { useAuth } from './context/AuthContext';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { AuthPage } from './pages/AuthPage';
import { MainMenu } from './pages/MainMenu';
import { RoomLobby } from './pages/RoomLobby';
import { CharacterSelection } from './pages/CharacterSelection';
import { GameDashboard } from './pages/GameDashboard';
import { PlayerProfile } from './pages/PlayerProfile';
import { JoinRoom } from './pages/JoinRoom';

function App() {
  const { currentUser } = useAuth();
  const { gameState } = useMultiplayerGame();

  const renderGameScreen = () => {
    switch (gameState.gamePhase) {
      case 'lobby':
        return <RoomLobby />;
      case 'selection':
        return <CharacterSelection />;
      case 'playing':
        return <GameDashboard />;
      case 'profile':
        return <PlayerProfile />;
      case 'joining':
        return <JoinRoom />;
      case 'menu':
      default:
        return <MainMenu />;
    }
  };

  return (
    <>
      {currentUser ? (
        renderGameScreen()
      ) : (
        <AuthPage />
      )}
    </>
  );
}

export default App;
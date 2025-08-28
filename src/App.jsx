import { useAuth } from './context/AuthContext';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { AuthPage } from './pages/AuthPage';
import { MainMenu } from './pages/MainMenu';
import { RoomLobby } from './pages/RoomLobby';
import { CharacterSelection } from './pages/CharacterSelection';
import { GameDashboard } from './pages/GameDashboard';

function App() {
  const { currentUser, logout } = useAuth();
  const { gameState } = useMultiplayerGame();

  const renderGameScreen = () => {
    switch (gameState.gamePhase) {
      case 'lobby':
        return <RoomLobby />;
      case 'selection':
        return <CharacterSelection />;
      case 'playing':
        return <GameDashboard />;
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
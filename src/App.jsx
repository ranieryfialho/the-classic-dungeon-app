import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { CharacterSelection } from './pages/CharacterSelection';

function App() {
  const { currentUser, logout } = useAuth();

  return (
    <>
      {currentUser ? (
        <div>
          <header style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#282c34', color: 'white' }}>
            <p>Bem-vindo, {currentUser.email}!</p>
            <button onClick={logout} style={{ background: 'none', border: '1px solid #FF7043', color: '#FF7043', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>Sair</button>
          </header>
          <CharacterSelection />
        </div>
      ) : (
        <AuthPage />
      )}
    </>
  );
}

export default App;
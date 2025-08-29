import { useState } from 'react';
import { Login } from './Login';
import { SignUp } from './SignUp';
import './AuthScreen.css';

export function AuthScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    // Removido 'min-h-screen' daqui também
    <div className="h-full w-full flex items-center justify-center bg-transparent p-4">
      <div className="auth-card">
        <div className="auth-welcome-section">
          <h1>Bem-vindo!</h1>
          <p className='text-justify'>
            Embarque em uma jornada épica, junte-se a seus amigos e explore masmorras cheias de perigos e tesouros. O destino de The Classic Dungeon espera por você.
          </p>
        </div>

        <div className="auth-form-section">
          <h2>{isLoginMode ? 'Entrar' : 'Cadastre-se'}</h2>
          
          {isLoginMode ? <Login /> : <SignUp />}

          <p className="auth-toggle-mode">
            {isLoginMode ? "Não tem uma conta?" : "Já tem uma conta?"}
            <button onClick={() => setIsLoginMode(!isLoginMode)}>
              {isLoginMode ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

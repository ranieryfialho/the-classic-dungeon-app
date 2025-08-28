// src/components/auth/AuthScreen.jsx

import { useState } from 'react';
import { Login } from './Login'; // Importe seu componente Login
import { SignUp } from './SignUp'; // Importe seu componente SignUp
import './AuthScreen.css'; // Importe o CSS para esta tela

export function AuthScreen() {
  // Estado para alternar entre "login" e "signup"
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Seção de Boas-vindas (lado esquerdo) */}
        <div className="auth-welcome-section">
          <h1>Bem-vindo!</h1>
          <p>
            Embarque em uma jornada épica, junte-se a seus amigos e explore masmorras cheias de perigos e tesouros. O destino de The Classic Dungeon espera por você.
          </p>
          <button className="learn-more-button">Learn More</button>
        </div>

        {/* Seção do Formulário (lado direito) */}
        <div className="auth-form-section">
          <h2>{isLoginMode ? 'Sign In' : 'Sign Up'}</h2>
          
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
import { useState } from 'react';
import { auth } from '../../lib/firebase'; // Importa a configuração do Firebase
import { signInWithEmailAndPassword } from 'firebase/auth'; // Importa a função de login do Firebase

export function Login() {
  // Estados para controlar os valores dos inputs e a mensagem de erro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Função chamada quando o formulário é enviado
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o recarregamento da página
    setError(null); // Limpa erros anteriores

    try {
      // Tenta fazer o login com o email e senha fornecidos
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuário logado com sucesso!');
      // O redirecionamento será feito automaticamente pelo onAuthStateChanged no App.jsx
    } catch (error) {
      // Em caso de erro, exibe no console e guarda uma mensagem amigável no estado
      console.error("Erro no login:", error);
      setError("Email ou senha inválidos. Por favor, tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      <button type="submit">Entrar</button>
      {/* Exibe a mensagem de erro se o estado 'error' não for nulo */}
      {error && <p className="auth-error-message">{error}</p>}
    </form>
  );
}
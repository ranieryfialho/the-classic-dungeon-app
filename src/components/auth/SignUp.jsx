import { useState } from 'react';
import { auth } from '../../lib/firebase'; // Importa a configuração do Firebase
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Importa a função de cadastro do Firebase

export function SignUp() {
  // Estados para controlar os valores dos inputs e a mensagem de erro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Função chamada quando o formulário é enviado
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o recarregamento da página
    setError(null); // Limpa erros anteriores

    try {
      // Tenta criar um novo usuário com o email e senha fornecidos
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('Usuário cadastrado com sucesso!');
      // O redirecionamento também será feito automaticamente pelo onAuthStateChanged
    } catch (error) {
      // Em caso de erro, exibe no console e guarda a mensagem de erro no estado
      console.error("Erro no cadastro:", error);
      // A mensagem de erro do Firebase é muitas vezes informativa (ex: senha fraca, email já em uso)
      setError(error.message);
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
        placeholder="Senha (mínimo 6 caracteres)"
        required
      />
      <button type="submit">Cadastrar</button>
      {/* Exibe a mensagem de erro se o estado 'error' não for nulo */}
      {error && <p className="auth-error-message">{error}</p>}
    </form>
  );
}
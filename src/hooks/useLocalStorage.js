// src/hooks/useLocalStorage.js - Hook puro para localStorage
import { useState, useEffect } from "react";

export const useLocalStorage = (key, initialValue) => {
  // Função para ler do localStorage de forma segura
  const readFromStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage para key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(readFromStorage);

  // Função para salvar no localStorage
  const setValue = (value) => {
    try {
      // Permitir que value seja uma função como useState padrão
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Erro ao salvar localStorage para key "${key}":`, error);
    }
  };

  // Recarregar do localStorage quando a janela ganha foco (para sincronizar entre abas)
  useEffect(() => {
    const handleStorageChange = () => {
      const newValue = readFromStorage();
      if (JSON.stringify(newValue) !== JSON.stringify(storedValue)) {
        setStoredValue(newValue);
      }
    };

    const handleFocus = () => {
      handleStorageChange();
    };

    // Escutar mudanças no localStorage de outras abas
    window.addEventListener('storage', handleStorageChange);
    // Escutar quando a janela ganha foco
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [key, storedValue]);

  return [storedValue, setValue];
};
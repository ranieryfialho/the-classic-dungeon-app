import { useState, useEffect } from "react";

const mockCurrentUser = {
  id: "user_1",
  name: "Raniery (Host)",
  color: "#3B82F6",
};
export const useUser = () => mockCurrentUser;

const mockFriends = [
  {
    id: "user_2",
    name: "Cundara",
    color: "#EF4444",
    character: { name: "Thosia", className: "Ladrão" }, // Personagem pré-selecionado
    ready: true, // Status pronto
  },
  {
    id: "user_3",
    name: "Perninha",
    color: "#22C55E",
    character: { name: "Pricilla", className: "Anão" }, // Personagem pré-selecionado
    ready: true, // Status pronto
  },
  {
    id: "user_4",
    name: "Palhaço Carequinha",
    color: "#F59E0B",
    character: { name: "Nook", className: "Feiticeiro" }, // Personagem pré-selecionado
    ready: true, // Status pronto
  },
];

export const useCollaborators = () => {
  const [collaborators, setCollaborators] = useState([mockCurrentUser]);

  useEffect(() => {
    const friendIntervals = mockFriends.map((friend, index) =>
      setTimeout(() => {
        setCollaborators((prev) => [...prev, friend]);
      }, (index + 1) * 2000)
    );

    return () => friendIntervals.forEach(clearInterval);
  }, []);

  return collaborators;
};

export const useStoredState = (key, initialValue) => {
  return useState(initialValue);
};

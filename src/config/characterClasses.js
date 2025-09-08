export const characterClasses = [
    {
      name: 'Guerreiro',
      description: 'Ótimo lutador, ataca com força bruta.',
      icon: '⚔️',
      color: 'text-red-500',
      heroes: ['Aragorn'],
      goldTarget: 20000,
      movement: 5,
      gifUrl: './assets/characters/guerreiro.gif',
      advantages: [
        { 
          title: 'Mestre das Armas', 
          description: 'Pode usar até duas Espadas Mágicas ao mesmo tempo.'
        },
        { 
          title: 'Ataque Crítico', 
          description: 'Se rolar dois números iguais no 2d6, derrota automaticamente o monstro.'
        },
        { 
          title: 'Fôlego de Batalha', 
          description: 'Se o contra-ataque do monstro resultar em morte (2), pode rolar 1d6; com 6, sobrevive, sai da sala, fica ferido e perde o turno.'
        },
      ]
    },
    {
      name: 'Elfo',
      description: 'Ágil e rápido, mestre em encontrar passagens.',
      icon: '🏹',
      color: 'text-green-400',
      heroes: ['Legolas'],
      goldTarget: 20000,
      movement: 5,
      gifUrl: './assets/characters/elfo.gif',
      advantages: [
        { 
          title: 'Explorador de Túneis', 
          description: 'Abre portas secretas com 1-4 em 1d6.'
        },
        { 
          title: 'Flechas Élficas', 
          description: 'Pode atacar à distância. Se um dos dados for 5 ou 6, soma os dois. Se falhar, não sofre contra-ataque.'
        },
        { 
          title: 'Esquiva Élfica', 
          description: 'Em combate corpo a corpo, se sofrer contra-ataque, rola 1d6; com 5 ou 6, escapa ileso.'
        },
      ]
    },
    {
      name: 'Anão',
      description: 'Robusto e resistente, mas lento.',
      icon: '🔨',
      color: 'text-sky-400',
      heroes: ['Gimli'], // Apenas um herói
      goldTarget: 20000,
      movement: 4,
      gifUrl: './assets/characters/anao.gif',
      advantages: [
        { 
          title: 'Defesa de Pedra', 
          description: 'Ao sofrer um contra-ataque, pode rolar 1d6; com 6, ignora o efeito.'
        },
        { 
          title: 'Mestre do Machado', 
          description: 'Se rolar 12 natural (6+6), derrota o monstro e ganha +1.000 p.o. extras.'
        },
        { 
          title: 'Inabalável', 
          description: 'Nunca perde turno por ferimento leve ou efeitos como Enjaulamento.'
        },
      ]
    },
    {
      name: 'Feiticeiro',
      description: 'Poderoso com magias, mas frágil em combate.',
      icon: '🔮',
      color: 'text-purple-400',
      heroes: ['Gandalf'],
      goldTarget: 20000,
      movement: 5,
      gifUrl: './assets/characters/feiticeiro.gif',
      advantages: [
        {
          title: 'Magias Arcanas',
          description: 'Começa com 6 feitiços (Bola de Fogo, Relâmpago, Teleporte) e pode lançar à distância.'
        },
        {
          title: 'Frágil em Combate',
          description: 'Se lutar corpo a corpo, sempre usa o valor de defesa verde da carta de monstro.'
        },
        {
          title: 'Restrição',
          description: 'Não pode usar Espadas Mágicas à distância, apenas em combate corpo a corpo.'
        }
      ]
    },
    {
      name: 'Paladino',
      description: 'Guerreiro sagrado com o poder da cura.',
      icon: '🛡️',
      color: 'text-yellow-300',
      heroes: ['Sir Aminta'],
      goldTarget: 20000,
      movement: 5,
      gifUrl: './assets/characters/paladino.gif',
      advantages: [
        {
          title: 'Cura Sagrada',
          description: 'Pode curar um herói adjacente sem perder a jogada, ou curar a si mesmo perdendo a jogada.'
        },
        {
          title: 'Golpe Divino',
          description: 'Recebe +1 em combate contra mortos-vivos e demônios.'
        }
      ]
    },
    {
      name: 'Ladrão',
      description: 'Especialista em emboscadas e ataques em grupo.',
      icon: '🗡️',
      color: 'text-gray-400',
      heroes: ['Bilbo'],
      goldTarget: 20000,
      movement: 5,
      gifUrl: './assets/characters/ladrao.gif',
      advantages: [
        {
          title: 'Sombra Letal',
          description: 'Ao entrar em uma sala, role 1d6: com 6, rouba o tesouro sem lutar.'
        },
        {
          title: 'Emboscada',
          description: 'Ganha +2 no ataque ao emboscar outro herói.'
        }
      ]
    }
];
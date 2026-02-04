/**
 * Duplicity Logic
 * Implementa a lógica de inversão baseada na Mnemonica de Tamariz
 * e o sistema de sorteio de imagens manuscritas.
 */

const DUPLICITY = (() => {
  // Mnemonica de Juan Tamariz
  const STACK = ["4C","2H","7D","3C","4H","6D","AS","5H","9S","2S","QH","3D","QC","8H","6S","5S","9H","KC","2D","JH","3S","8S","6H","10C","5D","KD","2C","3H","8D","5C","KS","JD","8C","10S","KH","JC","7S","10H","AD","4S","7H","4D","AC","9C","JS","QD","7C","QS","10D","6C","AH","9D"];
  
  // Estado atual da stack (pode ser alterado pelo botão amarelo)
  let currentStack = [...STACK];
  let currentPosMap = {}; 
  STACK.forEach((c, i) => currentPosMap[c] = i + 1);

  /**
   * Atualiza a stack baseada na nova carta do topo (Botão Amarelo)
   * @param {string} topCard - Ex: "3C"
   */
  const setTopCard = (topCard) => {
    const idx = STACK.indexOf(topCard);
    if (idx === -1) return;
    
    // Rotaciona a stack original para que topCard seja o índice 0
    currentStack = [...STACK.slice(idx), ...STACK.slice(0, idx)];
    
    // Atualiza o mapeamento de posição baseado na nova ordem
    currentPosMap = {};
    currentStack.forEach((c, i) => currentPosMap[c] = i + 1);
  };

  /**
   * Calcula a inversão Duplicity
   * @param {string} inputCard - Carta informada (Ex: "3C")
   * @param {number} inputPos - Posição informada (Ex: 42)
   * @returns {Object} - { line1: { card, pos }, line2: { card, pos } }
   */
  const calculateInversion = (inputCard, inputPos) => {
    // Linha 1: A carta informada e a posição informada
    const line1 = { card: inputCard, pos: inputPos };

    // Linha 2: A lógica de inversão
    // A carta que está na posição informada (na stack atual)
    const cardAtInputPos = currentStack[inputPos - 1];
    // A posição que a carta informada ocupa (na stack atual)
    const posOfInputCard = currentPosMap[inputCard];

    const line2 = { card: cardAtInputPos, pos: posOfInputCard };

    return { line1, line2 };
  };

  /**
   * Sorteia uma imagem aleatória (0-4) para um caractere
   * @param {string} char - O caractere (Ex: "3", "C", "H", "D", "S", "A", "J", "Q", "K", "T" para 10)
   * @returns {string} - Caminho da imagem
   */
  const getRandomImage = (char) => {
    // Mapeamento de caracteres especiais para nomes de arquivos
    const map = {
      '10': 'T',
      'S': 'S', // Espadas
      'H': 'H', // Copas
      'C': 'C', // Paus
      'D': 'D', // Ouros
    };
    
    let fileNamePart = map[char] || char;
    const variant = Math.floor(Math.random() * 5); // 0 a 4
    return `font_assets/${fileNamePart}-${variant}.png`;
  };

  /**
   * Converte uma string (Ex: "3C 42") em uma lista de caminhos de imagens
   * @param {string} text - Texto para converter
   * @returns {Array} - Lista de objetos { char, path }
   */
  const textToImages = (text) => {
    const result = [];
    const chars = text.split('');
    
    for (let i = 0; i < chars.length; i++) {
      let char = chars[i];
      
      // Tratar o "10" como um único caractere "T" na fonte
      if (char === '1' && chars[i+1] === '0') {
        char = '10';
        i++;
      }
      
      if (char === ' ') {
        result.push({ char: ' ', path: null });
      } else {
        result.push({ char: char, path: getRandomImage(char) });
      }
    }
    return result;
  };

  return {
    setTopCard,
    calculateInversion,
    textToImages,
    getCurrentStack: () => currentStack
  };
})();

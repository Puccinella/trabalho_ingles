const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const backgroundImage = new Image();
backgroundImage.src = "bck.jpg"; // Coloque o caminho da sua imagem de fundo

const spaceshipImage = new Image();
spaceshipImage.src = "navep.png"; // Coloque o caminho da sua imagem de nave

canvas.width = 700;
canvas.height = window.innerHeight;

let explosions = [];
let words = [];
let spaceshipX, spaceshipY, spaceshipWidth, spaceshipHeight;
let bullets = [];
let score = 10; // Pontuação inicial
document.getElementById("score").textContent = "Points: " + score; // Exibe a pontuação inicial
let activeWord = null;
const usedWords = new Set(); // ⛔ impede repetição no dicionário
let gameOver = false; // Variável para controlar se o jogo terminou
let spawnIntervalId; // Adicionando a variável para controlar o intervalo de spawn
let isPaused = false;

const backgroundMusic = new Audio('lofi.mp3'); // Caminho para sua música de fundo
backgroundMusic.loop = true; // Habilita a repetição da música
backgroundMusic.volume = 0.3; // Ajuste o volume conforme necessário
backgroundMusic.play(); // Inicia a música

const explosionSound = new Audio('explosion-sound.MP3'); // Caminho para o som de explosão
explosionSound.volume = 0.5; // Volume do som

window.addEventListener('keydown', () => {
  if (backgroundMusic.paused) {
    backgroundMusic.play(); // Toca a música ao pressionar qualquer tecla
  }
});

// Lista de palavras
const wordList = [
  "cpu", "click", "gadgets", "software", "mouse", "object", "internet", "function", "hardware",
  "keyboard", "monitor", "cloud", "server", "network", "device", "variable", "loop",
  "array", "input", "output", "debug", "compile", "router", "screen", "mobile", "access",
  "frame", "binary", "cursor", "pixel", "domain", "syntax", "code", "cache", "logic"
];

// Traduções
const translations = {
  cpu: "unidade central de processamento",
  click: "clique",
  gadgets: "dispositivos",
  software: "programa de computador",
  mouse: "mouse",
  object: "objeto",
  internet: "internet",
  function: "função",
  hardware: "hardware",
  keyboard: "teclado",
  monitor: "monitor",
  cloud: "nuvem",
  server: "servidor",
  network: "rede",
  device: "dispositivo",
  variable: "variável",
  loop: "laço",
  array: "vetor",
  input: "entrada",
  output: "saída",
  debug: "depurar",
  compile: "compilar",
  router: "roteador",
  screen: "tela",
  mobile: "celular",
  access: "acesso",
  frame: "quadro",
  binary: "binário",
  cursor: "cursor",
  pixel: "pixel",
  domain: "domínio",
  syntax: "sintaxe",
  code: "código",
  cache: "cache",
  logic: "lógica"
};

let backgroundY = 0; // Posição inicial do fundo

function getRandomWord() {
  return wordList[Math.floor(Math.random() * wordList.length)];
}

function spawnWord() {
  const word = {
    text: getRandomWord(),
    x: Math.random() * (canvas.width - 100),
    y: 0,
    speed: 1 + Math.random() * 1.5,  // Pode ajustar essa faixa para um valor mais lento
    progress: 0
  };
  words.push(word);
}

function endGame(won = false) {
  gameOver = true;

  // Para a música
  backgroundMusic.pause();

  // Para o loop do jogo
  cancelAnimationFrame(animationId);

  if (won) {
    // Exibe o modal de vitória
    const victoryModal = document.getElementById("victoryModal");
    const victoryTranslations = document.getElementById("victoryTranslations");

    // Limpa o conteúdo do modal
    victoryTranslations.innerHTML = '';

    // Adiciona as palavras traduzidas ao modal
    usedWords.forEach(word => {
      const listItem = document.createElement("li");
      listItem.textContent = `${word} → ${translations[word] || "tradução não encontrada"}`;
      victoryTranslations.appendChild(listItem);
    });

    // Exibe o modal
    victoryModal.style.display = "block";
  } else {
    // Tela de derrota
    const gameOverMessage = document.createElement('div');
    gameOverMessage.classList.add('game-over-message');
    gameOverMessage.innerHTML = `<h2 style="color: red;">You Lose!</h2>`;
    gameOverMessage.style.position = 'absolute';
    gameOverMessage.style.top = '50%';
    gameOverMessage.style.left = '50%';
    gameOverMessage.style.transform = 'translate(-50%, -50%)';
    gameOverMessage.style.fontSize = '32px';
    gameOverMessage.style.background = 'white';
    gameOverMessage.style.color = 'black';
    gameOverMessage.style.padding = '20px';
    gameOverMessage.style.borderRadius = '10px';
    gameOverMessage.style.zIndex = 100;
    document.body.appendChild(gameOverMessage);

    // Redirecionar depois de 2 segundos
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 2000);
  }
}



function restartGame() {
  score = 10;
  words = [];
  explosions = [];
  usedWords.clear();
  gameOver = false;

  document.getElementById("score").textContent = "Pontos: " + score;
  document.getElementById("dictionaryList").innerHTML = "";

  // Remove a mensagem "Você Perdeu", se existir
  const gameOverMessage = document.querySelector('.game-over-message');
  if (gameOverMessage) {
    gameOverMessage.remove();
  }

  backgroundY = 0;

  // Limpa o intervalo de spawn e reinicia
  clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(spawnWord, 1700);

  // 🔥 Mata o loop de animação anterior
  cancelAnimationFrame(animationId);

  // Reinicia música
  backgroundMusic.currentTime = 0;
  backgroundMusic.play();

  // 🔥 Começa o novo loop
  gameLoop();


}

function updateWords() {
  if (gameOver) return; // Se o jogo acabou, não faz mais atualizações

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenha o fundo
  ctx.drawImage(backgroundImage, 0, backgroundY, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, backgroundY - canvas.height, canvas.width, canvas.height);

  backgroundY += 1;
  if (backgroundY >= canvas.height) {
    backgroundY = 0;
  }

  // Desenha a nave
  if (spaceshipImage.complete) {
    const spaceshipScale = 0.3;
    spaceshipWidth = spaceshipImage.width * spaceshipScale;
    spaceshipHeight = spaceshipImage.height * spaceshipScale;
    spaceshipX = canvas.width / 2 - spaceshipWidth / 2;
    spaceshipY = canvas.height * 0.9 - spaceshipHeight / 2;
    ctx.drawImage(spaceshipImage, spaceshipX, spaceshipY, spaceshipWidth, spaceshipHeight);
  }

  ctx.font = "16px Courier New";

  // Atualiza as balas
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    const target = words.find(w => w === bullet.targetWord);

    if (target) {
      const targetX = target.x + ctx.measureText(target.text.substring(0, target.progress)).width / 2;
      const targetY = target.y;
      const dx = targetX - bullet.x;
      const dy = targetY - bullet.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      bullet.x += (dx / dist) * bullet.speed;
      bullet.y += (dy / dist) * bullet.speed;

      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.x - dx * 0.1, bullet.y - dy * 0.1);
      ctx.stroke();

      if (dist < 10) {
        bullets.splice(i, 1);
      }
    } else {
      bullets.splice(i, 1);
    }
  }

  // Atualiza as palavras
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    word.y += word.speed;

    ctx.fillStyle = "lime";
    ctx.fillText(word.text.substring(0, word.progress), word.x, word.y);

    ctx.fillStyle = "white";
    ctx.fillText(
      word.text.substring(word.progress),
      word.x + ctx.measureText(word.text.substring(0, word.progress)).width,
      word.y
    );

    if (word.y > canvas.height) {
      words.splice(i, 1);
      if (activeWord === word) activeWord = null;
      score -= 20;
      if (score <= 0) {
        score = 0;
        endGame(); // Chama a função de fim de jogo
      }
      document.getElementById("score").textContent = "Pontos: " + score;
      // Se chegar em 30 pontos, vencer o jogo
      if (!gameOver && score >= 350) {
        endGame(true); // true significa que venceu
      }
    }    
  }

  // Atualiza as explosões
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    ctx.fillStyle = `rgba(255, ${Math.floor(Math.random() * 255)}, 0, ${1 - explosion.frame / 10})`;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.frame * 5, 0, Math.PI * 2);
    ctx.fill();
    explosion.frame++;

    if (explosion.frame > 10) {
      explosions.splice(i, 1);
    }
  }
}

function handleKeyPress(e) {
  const char = e.key.toLowerCase();

  if (!activeWord) {
    activeWord = words.find(w => w.text.startsWith(char));
    if (activeWord) activeWord.progress = 1;
  } else {
    const expectedChar = activeWord.text[activeWord.progress];
    if (char === expectedChar) {

      activeWord.progress++;
      bullets.push({
        x: spaceshipX + spaceshipWidth / 2,
        y: spaceshipY,
        targetWord: activeWord,
        speed: 6
      });

if (activeWord.progress === activeWord.text.length) {
  // Toca o som de explosão
  explosionSound.play();

  // Adiciona a animação de explosão
  explosions.push({
    x: activeWord.x,
    y: activeWord.y,
    frame: 0
  });

  // Remove a palavra destruída da tela
  words = words.filter(w => w !== activeWord);

  score += 10; // Adiciona 10 pontos
  document.getElementById("score").textContent = "Points: " + score;

  // Adiciona ao dicionário
  const word = activeWord.text;
  if (!usedWords.has(word)) {
    usedWords.add(word);
    const li = document.createElement("li");
    li.textContent = `${word} → ${translations[word] || "tradução não encontrada"}`;
    document.getElementById("dictionaryList").appendChild(li);
  }

  activeWord = null;

  // 🔥 Aqui checa se ganhou
  if (!gameOver && score >= 350) {
    endGame(true); // Chama vitória
  }
}

    }
    else {
      const errorSound = document.getElementById("errorSound");
      if (errorSound) {
        errorSound.currentTime = 0; // Reinicia o som
        errorSound.play();          // Toca o som de erro
      }
    }
  }
}
window.addEventListener("keydown", function (e) {
  // Se o jogo terminou e a tecla 'Escape' for pressionada, reinicia o jogo
  if (e.key === "Escape" && gameOver) {
    restartGame(); // Reinicia o jogo se estiver no estado de "game over"
    return; // Evita chamar handleKeyPress, pois estamos lidando com a tecla Escape aqui
  }

  handleKeyPress(e); // Continua com o comportamento normal de pressionar teclas
});

setInterval(spawnWord, 1700);

function gameLoop() {
  if (!isPaused) {
    updateWords();
  }
  animationId = requestAnimationFrame(gameLoop);
}
spaceshipImage.onload = function() {
  gameLoop(); // Só começa o jogo depois da imagem carregar
};

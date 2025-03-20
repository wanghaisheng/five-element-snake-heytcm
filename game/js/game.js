// Game configuration
const config = {
  gridSize: 20,
  mapWidth: 30,
  mapHeight: 20,
  initialSnakeLength: 5,
  minPlayers: 2,
  foodCount: 10,
  gameSpeed: 15, // updates per second
  elements: {
    gold: { color: '#ffd700' },
    wood: { color: '#4caf50' },
    water: { color: '#2196f3' },
    fire: { color: '#f44336' },
    earth: { color: '#8d6e63' }
  },
  colors: {
    background: '#0f0f1b',
    grid: '#1a1a2e'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Game canvas setup
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size to match container
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // Update grid dimensions based on canvas size
    config.mapWidth = Math.floor(canvas.width / config.gridSize);
    config.mapHeight = Math.floor(canvas.height / config.gridSize);
  }
  
  // Call resize on load and on window resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Game state
  let gameState = {
    running: false,
    food: {},
    currentPlayerId: '', // Will be set when connected
    selectedElement: 'gold'
  };
  
  // Websocket setup
  let room;
  
  async function initializeGame() {
    room = new WebsimSocket();
    await room.initialize();
    
    // Set current player ID
    gameState.currentPlayerId = room.clientId;
    
    // Subscribe to presence updates (players joining/leaving)
    room.subscribePresence((currentPresence) => {
      updatePlayersList();
      checkGameStart();
    });
    
    // Subscribe to room state updates (food, obstacles, etc.)
    room.subscribeRoomState((currentRoomState) => {
      if (currentRoomState.food) {
        gameState.food = currentRoomState.food;
      }
      if (currentRoomState.gameRunning !== undefined) {
        gameState.running = currentRoomState.gameRunning;
        if (gameState.running) {
          document.getElementById('waiting-screen').classList.add('hidden');
        } else {
          document.getElementById('waiting-screen').classList.remove('hidden');
        }
      }
    });
    
    // Subscribe to presence update requests (collisions, etc.)
    room.subscribePresenceUpdateRequests((updateRequest, fromClientId) => {
      if (updateRequest.type === 'collision') {
        const mySnake = room.presence[room.clientId];
        if (mySnake) {
          // Handle collision
          if (updateRequest.fatal) {
            // Game over for this player
            showGameOver(mySnake.score);
            
            // Reset snake
            room.updatePresence({
              dead: true,
              score: mySnake.score
            });
          } else {
            // Non-fatal collision, maybe reduce length
            room.updatePresence({
              segments: mySnake.segments.slice(0, -3),
              score: Math.max(0, mySnake.score - 10)
            });
          }
        }
      }
    });
    
    // Initialize player's snake with the selected element
    initializePlayer();
    
    // Start updating player list
    updatePlayersList();
    
    // Check if game should start
    checkGameStart();
  }
  
  function initializePlayer() {
    const element = gameState.selectedElement;
    const spawnX = Math.floor(Math.random() * (config.mapWidth - 10)) + 5;
    const spawnY = Math.floor(Math.random() * (config.mapHeight - 10)) + 5;
    
    // Create initial snake segments
    const segments = [];
    for (let i = 0; i < config.initialSnakeLength; i++) {
      segments.push({ x: spawnX - i, y: spawnY });
    }
    
    // Set initial direction (right)
    const direction = { x: 1, y: 0 };
    
    // Update presence with initial snake state
    room.updatePresence({
      element,
      segments,
      direction,
      score: 0,
      dead: false,
      username: room.peers[room.clientId].username
    });
    
    // Update element indicator
    updateElementIndicator(element);
  }
  
  function updatePlayersList() {
    const playersList = document.getElementById('players-list');
    const playerCount = document.getElementById('player-count');
    
    // Clear existing list
    playersList.innerHTML = '';
    
    // Count active players
    let activePlayers = 0;
    
    // Add each player to the list
    for (const clientId in room.presence) {
      const player = room.presence[clientId];
      const peer = room.peers[clientId];
      
      if (player && player.element && !player.dead) {
        activePlayers++;
        
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        const playerColor = document.createElement('div');
        playerColor.className = 'player-color';
        playerColor.style.backgroundColor = config.elements[player.element].color;
        
        const playerName = document.createElement('span');
        playerName.textContent = peer.username;
        
        playerItem.appendChild(playerColor);
        playerItem.appendChild(playerName);
        playersList.appendChild(playerItem);
      }
    }
    
    // Update player count
    playerCount.textContent = activePlayers;
  }
  
  function checkGameStart() {
    // Count active players
    let activePlayers = 0;
    for (const clientId in room.presence) {
      const player = room.presence[clientId];
      if (player && player.element && !player.dead) {
        activePlayers++;
      }
    }
    
    // Start game if we have enough players
    if (activePlayers >= config.minPlayers && !gameState.running) {
      // If this client is the "host" (first joined), start the game
      if (room.clientId === Object.keys(room.peers)[0]) {
        // Initialize food
        initializeFood();
        
        // Set game as running
        room.updateRoomState({
          gameRunning: true
        });
      }
    } else if (activePlayers < config.minPlayers && gameState.running) {
      // Stop game if not enough players
      if (room.clientId === Object.keys(room.peers)[0]) {
        room.updateRoomState({
          gameRunning: false
        });
      }
    }
  }
  
  function initializeFood() {
    const food = {};
    
    // Generate food items
    for (let i = 0; i < config.foodCount; i++) {
      const foodId = `food-${i}`;
      food[foodId] = {
        x: Math.floor(Math.random() * config.mapWidth),
        y: Math.floor(Math.random() * config.mapHeight),
        value: Math.floor(Math.random() * 3) + 1, // 1-3 points
        element: ['gold', 'wood', 'water', 'fire', 'earth'][Math.floor(Math.random() * 5)]
      };
    }
    
    // Update room state with food
    room.updateRoomState({
      food
    });
  }
  
  function respawnFood(foodId) {
    const food = {...room.roomState.food};
    
    food[foodId] = {
      x: Math.floor(Math.random() * config.mapWidth),
      y: Math.floor(Math.random() * config.mapHeight),
      value: Math.floor(Math.random() * 3) + 1,
      element: ['gold', 'wood', 'water', 'fire', 'earth'][Math.floor(Math.random() * 5)]
    };
    
    room.updateRoomState({
      food
    });
  }
  
  function updateGame() {
    if (!gameState.running || !room) return;
    
    const mySnake = room.presence[room.clientId];
    
    // Skip if player is dead
    if (!mySnake || mySnake.dead) return;
    
    // Get current head position
    const head = mySnake.segments[0];
    const direction = mySnake.direction;
    
    // Calculate new head position
    const newHead = {
      x: head.x + direction.x,
      y: head.y + direction.y
    };
    
    // Check wall collision
    if (newHead.x < 0 || newHead.x >= config.mapWidth ||
        newHead.y < 0 || newHead.y >= config.mapHeight) {
      handleDeath();
      return;
    }
    
    // Check self collision
    for (let i = 0; i < mySnake.segments.length; i++) {
      const segment = mySnake.segments[i];
      if (segment.x === newHead.x && segment.y === newHead.y) {
        handleDeath();
        return;
      }
    }
    
    // Check collision with other players
    for (const clientId in room.presence) {
      if (clientId !== room.clientId) {
        const otherSnake = room.presence[clientId];
        if (otherSnake && otherSnake.segments && !otherSnake.dead) {
          for (const segment of otherSnake.segments) {
            if (segment.x === newHead.x && segment.y === newHead.y) {
              handleDeath();
              return;
            }
          }
        }
      }
    }
    
    // Check food collision
    let ate = false;
    let extraGrowth = 0;
    let extraPoints = 0;
    
    if (room.roomState.food) {
      for (const foodId in room.roomState.food) {
        const food = room.roomState.food[foodId];
        if (food.x === newHead.x && food.y === newHead.y) {
          // Element bonus
          const elementMultiplier = food.element === mySnake.element ? 2 : 1;
          extraPoints = food.value * elementMultiplier;
          extraGrowth = food.value;
          
          // Respawn food
          respawnFood(foodId);
          ate = true;
          break;
        }
      }
    }
    
    // Create new segments array with new head
    const newSegments = [newHead, ...mySnake.segments];
    
    // If we didn't eat, remove the tail (unless we have growth from eating)
    if (!ate && extraGrowth === 0) {
      newSegments.pop();
    } else if (extraGrowth > 0) {
      // Keep extra segments for growth
      for (let i = 1; i < extraGrowth; i++) {
        const lastSegment = newSegments[newSegments.length - 1];
        newSegments.push({...lastSegment});
      }
    }
    
    // Update player state
    room.updatePresence({
      segments: newSegments,
      score: mySnake.score + extraPoints
    });
    
    // Update UI
    updateStats(newSegments.length, mySnake.score + extraPoints);
  }
  
  function handleDeath() {
    const mySnake = room.presence[room.clientId];
    
    // Show game over screen
    showGameOver(mySnake.score);
    
    // Update presence
    room.updatePresence({
      dead: true
    });
  }
  
  function showGameOver(score) {
    const gameOverScreen = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    
    finalScore.textContent = score;
    gameOverScreen.classList.remove('hidden');
  }
  
  function resetGame() {
    const gameOverScreen = document.getElementById('game-over');
    gameOverScreen.classList.add('hidden');
    
    // Reinitialize player
    initializePlayer();
  }
  
  // Drawing functions
  function drawGame() {
    if (!room) return;
    
    // Clear canvas
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw food
    drawFood();
    
    // Draw all snakes
    drawSnakes();
    
    // Request next frame
    requestAnimationFrame(drawGame);
  }
  
  function drawGrid() {
    ctx.strokeStyle = config.colors.grid;
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= config.mapWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * config.gridSize, 0);
      ctx.lineTo(x * config.gridSize, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= config.mapHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * config.gridSize);
      ctx.lineTo(canvas.width, y * config.gridSize);
      ctx.stroke();
    }
  }
  
  function drawFood() {
    if (!room.roomState.food) return;
    
    for (const foodId in room.roomState.food) {
      const food = room.roomState.food[foodId];
      const element = food.element;
      
      // Draw food
      ctx.fillStyle = config.elements[element].color;
      ctx.beginPath();
      ctx.arc(
        (food.x + 0.5) * config.gridSize,
        (food.y + 0.5) * config.gridSize,
        config.gridSize / 2 * (0.5 + food.value * 0.15), // Size based on value
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Draw glow effect
      ctx.shadowColor = config.elements[element].color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(
        (food.x + 0.5) * config.gridSize,
        (food.y + 0.5) * config.gridSize,
        config.gridSize / 2 * (0.5 + food.value * 0.15),
        0, Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  function drawSnakes() {
    for (const clientId in room.presence) {
      const snake = room.presence[clientId];
      
      if (snake && snake.segments && !snake.dead) {
        const isCurrentPlayer = clientId === room.clientId;
        const element = snake.element;
        
        // Draw snake
        for (let i = 0; i < snake.segments.length; i++) {
          const segment = snake.segments[i];
          
          // Different style for head vs body
          if (i === 0) {
            // Draw snake head
            ctx.fillStyle = config.elements[element].color;
            ctx.beginPath();
            ctx.arc(
              (segment.x + 0.5) * config.gridSize,
              (segment.y + 0.5) * config.gridSize,
              config.gridSize / 2 * 0.9,
              0, Math.PI * 2
            );
            ctx.fill();
            
            // Draw eyes
            ctx.fillStyle = 'white';
            
            // Calculate eye positions based on direction
            const dir = snake.direction;
            const eyeOffset = config.gridSize * 0.2;
            
            // Left eye
            ctx.beginPath();
            ctx.arc(
              (segment.x + 0.5 + dir.y * 0.3) * config.gridSize - dir.x * eyeOffset,
              (segment.y + 0.5 - dir.x * 0.3) * config.gridSize - dir.y * eyeOffset,
              config.gridSize * 0.1,
              0, Math.PI * 2
            );
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            ctx.arc(
              (segment.x + 0.5 - dir.y * 0.3) * config.gridSize - dir.x * eyeOffset,
              (segment.y + 0.5 + dir.x * 0.3) * config.gridSize - dir.y * eyeOffset,
              config.gridSize * 0.1,
              0, Math.PI * 2
            );
            ctx.fill();
          } else {
            // Draw snake body segment
            let alpha = isCurrentPlayer ? 1 : 0.7;
            ctx.fillStyle = `${config.elements[element].color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            
            // Rounded segments with different sizes
            const size = 0.8 - (i / snake.segments.length) * 0.3;
            
            ctx.beginPath();
            ctx.roundRect(
              (segment.x + 0.5 - size/2) * config.gridSize,
              (segment.y + 0.5 - size/2) * config.gridSize,
              config.gridSize * size,
              config.gridSize * size,
              config.gridSize * 0.3
            );
            ctx.fill();
          }
        }
        
        // Draw player name above snake
        const head = snake.segments[0];
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          room.peers[clientId]?.username || 'Player',
          (head.x + 0.5) * config.gridSize,
          (head.y - 0.5) * config.gridSize
        );
      }
    }
  }
  
  function updateStats(length, score) {
    document.getElementById('length-value').textContent = length;
    document.getElementById('score-value').textContent = score;
  }
  
  function updateElementIndicator(element) {
    const elementIndicator = document.getElementById('current-element');
    elementIndicator.style.backgroundColor = config.elements[element].color;
  }
  
  // Input handling
  function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!gameState.running || !room) return;
      
      const mySnake = room.presence[room.clientId];
      if (!mySnake || mySnake.dead) return;
      
      const key = e.key.toLowerCase();
      const currentDir = mySnake.direction;
      let newDirection = {...currentDir};
      
      // Change direction based on key press
      switch (key) {
        case 'arrowup':
        case 'w':
          if (currentDir.y !== 1) { // Not going down
            newDirection = { x: 0, y: -1 };
          }
          break;
        case 'arrowdown':
        case 's':
          if (currentDir.y !== -1) { // Not going up
            newDirection = { x: 0, y: 1 };
          }
          break;
        case 'arrowleft':
        case 'a':
          if (currentDir.x !== 1) { // Not going right
            newDirection = { x: -1, y: 0 };
          }
          break;
        case 'arrowright':
        case 'd':
          if (currentDir.x !== -1) { // Not going left
            newDirection = { x: 1, y: 0 };
          }
          break;
        case ' ':
          // Use skill (to be implemented)
          useSkill();
          break;
      }
      
      // Update direction if changed
      if (newDirection.x !== currentDir.x || newDirection.y !== currentDir.y) {
        room.updatePresence({
          direction: newDirection
        });
      }
    });
    
    // Element selection
    const elementOptions = document.querySelectorAll('.element-option');
    elementOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Only allow changing element in waiting screen
        if (gameState.running) return;
        
        const element = option.getAttribute('data-element');
        gameState.selectedElement = element;
        
        // Update UI
        elementOptions.forEach(opt => {
          opt.classList.remove('active');
        });
        option.classList.add('active');
        
        // Update indicator
        updateElementIndicator(element);
        
        // Reinitialize player with new element
        if (room) {
          initializePlayer();
        }
      });
    });
    
    // Play again button
    document.getElementById('play-again-btn').addEventListener('click', resetGame);
  }
  
  function useSkill() {
    // To be implemented: use the skill of the current element
    console.log(`Using ${gameState.selectedElement} skill!`);
  }
  
  // Game loop
  let lastUpdate = 0;
  const updateInterval = 1000 / config.gameSpeed;
  
  function gameLoop(timestamp) {
    // Check if it's time to update
    if (timestamp - lastUpdate > updateInterval) {
      updateGame();
      lastUpdate = timestamp;
    }
    
    // Request next frame
    requestAnimationFrame(gameLoop);
  }
  
  // Initialize game
  initializeGame().then(() => {
    // Setup controls
    setupControls();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Start drawing
    drawGame();
  });
});
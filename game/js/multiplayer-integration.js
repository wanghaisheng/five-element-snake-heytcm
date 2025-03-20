// 五行蛇 Online - 多人集成模块

class MultiplayerManager {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.room = null;
    this.initialized = false;
  }
  
  async initialize() {
    if (window.WebsimSocket) {
      this.room = new WebsimSocket();
      await this.room.initialize();
      this.initialized = true;
      
      // 设置订阅
      this.setupSubscriptions();
      
      // 初始化玩家状态
      this.initializePlayerState();
      
      return true;
    } else {
      console.error('WebsimSocket not available, falling back to single player mode');
      return false;
    }
  }
  
  setupSubscriptions() {
    // 订阅玩家状态更新
    this.room.subscribePresence((presenceData) => {
      this.handlePresenceUpdate(presenceData);
    });
    
    // 订阅房间状态更新
    this.room.subscribeRoomState((roomState) => {
      this.handleRoomStateUpdate(roomState);
    });
    
    // 订阅玩家状态更新请求
    this.room.subscribePresenceUpdateRequests((request, fromClientId) => {
      this.handlePresenceUpdateRequest(request, fromClientId);
    });
  }
  
  initializePlayerState() {
    const element = this.game.getSelectedElement();
    const spawnPosition = this.getRandomSpawnPosition();
    
    // 创建初始蛇段
    const segments = [];
    for (let i = 0; i < this.game.config.initialSnakeLength; i++) {
      segments.push({
        x: spawnPosition.x - i,
        y: spawnPosition.y
      });
    }
    
    // 更新玩家状态
    this.room.updatePresence({
      element: element,
      segments: segments,
      direction: { x: 1, y: 0 },
      score: 0,
      dead: false,
      username: this.room.peers[this.room.clientId]?.username || '玩家'
    });
    
    // 初始化食物（如果是房主）
    if (this.isRoomOwner()) {
      this.initializeFood();
    }
  }
  
  isRoomOwner() {
    return this.initialized && 
           this.room.clientId === Object.keys(this.room.peers)[0];
  }
  
  initializeFood() {
    const food = {};
    const { mapWidth, mapHeight } = this.game.config;
    
    // 生成食物
    for (let i = 0; i < this.game.config.foodCount; i++) {
      const foodId = `food-${i}`;
      food[foodId] = {
        x: Math.floor(Math.random() * mapWidth),
        y: Math.floor(Math.random() * mapHeight),
        value: Math.floor(Math.random() * 3) + 1, // 1-3分
        element: ['gold', 'wood', 'water', 'fire', 'earth'][Math.floor(Math.random() * 5)]
      };
    }
    
    // 更新房间状态
    this.room.updateRoomState({
      food: food,
      gameRunning: Object.keys(this.room.presence).length >= this.game.config.minPlayers
    });
  }
  
  handlePresenceUpdate(presenceData) {
    // 更新游戏中的玩家数据
    this.game.updatePlayers(presenceData);
    
    // 检查游戏是否应该开始或结束
    this.checkGameState();
  }
  
  handleRoomStateUpdate(roomState) {
    // 更新食物
    if (roomState.food) {
      this.game.updateFood(roomState.food);
    }
    
    // 更新游戏运行状态
    if (roomState.gameRunning !== undefined) {
      this.game.setGameRunning(roomState.gameRunning);
    }
  }
  
  handlePresenceUpdateRequest(request, fromClientId) {
    // 处理碰撞
    if (request.type === 'collision') {
      const myPresence = this.room.presence[this.room.clientId];
      if (!myPresence) return;
      
      if (request.fatal) {
        // 致命碰撞
        this.game.handleDeath();
        
        // 更新状态
        this.room.updatePresence({
          dead: true
        });
      } else {
        // 非致命碰撞
        const newSegments = [...myPresence.segments];
        // 减少尾部几个段
        const reducedSegments = newSegments.slice(0, Math.max(newSegments.length - 3, 1));
        
        // 更新状态
        this.room.updatePresence({
          segments: reducedSegments,
          score: Math.max(0, myPresence.score - 10)
        });
      }
    }
  }
  
  updatePlayerPosition(direction) {
    if (!this.initialized) return;
    
    const myPresence = this.room.presence[this.room.clientId];
    if (!myPresence || myPresence.dead) return;
    
    const head = myPresence.segments[0];
    const newHead = {
      x: head.x + direction.x,
      y: head.y + direction.y
    };
    
    // 检查边界碰撞
    const { mapWidth, mapHeight } = this.game.config;
    if (newHead.x < 0 || newHead.x >= mapWidth ||
        newHead.y < 0 || newHead.y >= mapHeight) {
      this.handleSelfCollision();
      return;
    }
    
    // 检查自身碰撞
    for (let i = 1; i < myPresence.segments.length; i++) {
      const segment = myPresence.segments[i];
      if (newHead.x === segment.x && newHead.y === segment.y) {
        this.handleSelfCollision();
        return;
      }
    }
    
    // 检查与其他玩家的碰撞
    for (const clientId in this.room.presence) {
      if (clientId === this.room.clientId) continue;
      
      const otherSnake = this.room.presence[clientId];
      if (!otherSnake || !otherSnake.segments || otherSnake.dead) continue;
      
      for (const segment of otherSnake.segments) {
        if (newHead.x === segment.x && newHead.y === segment.y) {
          // 请求对方更新我们的碰撞
          this.room.requestPresenceUpdate(clientId, {
            type: 'collision',
            fatal: false,
            fromClientId: this.room.clientId
          });
          return;
        }
      }
    }
    
    // 检查食物碰撞
    let ate = false;
    let foodId = null;
    let foodValue = 0;
    let elementBonus = false;
    
    if (this.room.roomState.food) {
      for (const id in this.room.roomState.food) {
        const food = this.room.roomState.food[id];
        if (newHead.x === food.x && newHead.y === food.y) {
          ate = true;
          foodId = id;
          foodValue = food.value;
          elementBonus = food.element === myPresence.element;
          break;
        }
      }
    }
    
    // 创建新的蛇段数组
    const newSegments = [newHead, ...myPresence.segments];
    
    // 如果没吃到食物，删除尾部
    if (!ate) {
      newSegments.pop();
    }
    
    // 更新玩家状态
    this.room.updatePresence({
      segments: newSegments,
      direction: direction,
      score: myPresence.score + (ate ? foodValue * (elementBonus ? 2 : 1) : 0)
    });
    
    // 如果吃到食物且是房主，重新生成食物
    if (ate && this.isRoomOwner() && foodId) {
      this.respawnFood(foodId);
    }
  }
  
  respawnFood(foodId) {
    const { mapWidth, mapHeight } = this.game.config;
    const foodUpdate = {};
    
    foodUpdate[foodId] = {
      x: Math.floor(Math.random() * mapWidth),
      y: Math.floor(Math.random() * mapHeight),
      value: Math.floor(Math.random() * 3) + 1,
      element: ['gold', 'wood', 'water', 'fire', 'earth'][Math.floor(Math.random() * 5)]
    };
    
    // 更新房间状态中的食物
    this.room.updateRoomState({
      food: foodUpdate
    });
  }
  
  handleSelfCollision() {
    // 处理自身碰撞导致的死亡
    this.game.handleDeath();
    
    // 更新状态
    this.room.updatePresence({
      dead: true
    });
  }
  
  useSkill() {
    // 技能使用逻辑
    const myPresence = this.room.presence[this.room.clientId];
    if (!myPresence || myPresence.dead) return;
    
    // 技能效果根据属性不同而不同
    switch (myPresence.element) {
      case 'gold':
        this.useGoldSkill();
        break;
      case 'wood':
        this.useWoodSkill();
        break;
      case 'water':
        this.useWaterSkill();
        break;
      case 'fire':
        this.useFireSkill();
        break;
      case 'earth':
        this.useEarthSkill();
        break;
    }
  }
  
  useGoldSkill() {
    // 金蛇技能：锋刃突刺
    // 短距离加速并留下锋利残影，触碰敌人造成伤害
    const myPresence = this.room.presence[this.room.clientId];
    if (!myPresence) return;
    
    // 更新状态，添加技能标记
    this.room.updatePresence({
      usingSkill: true,
      skillType: 'gold',
      skillDuration: 3 // 持续3秒
    });
    
    // 技能结束后恢复
    setTimeout(() => {
      this.room.updatePresence({
        usingSkill: false,
        skillType: null
      });
    }, 3000);
  }
  
  useWoodSkill() {
    // 木蛇技能：藤蔓缠绕
    // 发射藤蔓束缚前方敌人，使其减速
    const myPresence = this.room.presence[this.room.clientId];
    if (!myPresence) return;
    
    // 计算技能目标区域
    const head = myPresence.segments[0];
    const direction = myPresence.direction;
    const targetArea = [];
    
    // 在前方一定范围内产生藤蔓
    for (let i = 1; i <= 5; i++) {
      targetArea.push({
        x: head.x + direction.x * i,
        y: head.y + direction.y * i
      });
    }
    
    // 更新状态，添加技能标记和目标区域
    this.room.updatePresence({
      usingSkill: true,
      skillType: 'wood',
      skillTargetArea: targetArea,
      skillDuration: 5 // 持续5秒
    });
    
    // 技能结束后恢复
    setTimeout(() => {
      this.room.updatePresence({
        usingSkill: false,
        skillType: null,
        skillTargetArea: null
      });
    }, 5000);
  }
  
  useWaterSkill() {
    // 水蛇技能：寒冰路径
    // 在身后留下一段冰冻路径，减速触碰的敌人
    const myPresence = this.room.presence[this.room.clientId];
    if (!myPresence) return;
    
    // 更新状态，添加技能标记
    this.room.updatePresence({
      usingSkill: true,
      skillType: 'water',
      skillDuration: 8 // 持续8秒
    });
    
    // 技能结束后恢复
    setTimeout(() => {
      this.room.updatePresence({
        usingSkill: false,
        skillType: null
      });
    }, 8000);
  }
  
  useFireSkill() {
    // 火蛇技能：火焰喷射
    // 向前方喷射火焰，持续对敌人造成伤害
    const myPresence = this.room.presence[this.room.clientId];
    if (!myPresence) return;
    
    // 计算技能目标区域
    const head = myPresence.segments[0];
    const direction = myPresence.direction;
    const targetArea = [];
    
    // 在前方一定范围内产生火焰
    for (let i = 1; i <= 3; i++) {
      for (let j = -1; j <= 1; j++) {
        if (direction.x !== 0) { // 水平方向
          targetArea.push({
            x: head.x + direction.x * i,
            y: head.y + j
          });
        } else { // 垂直方向
          targetArea.push({
            x: head.x + j,
            y: head.y + direction.y * i
          });
        }
      }
    }
    
    // 更新状态，添加技能标记和目标区域
    this.room.updatePresence({
      usingSkill: true,
      skillType: 'fire',
      skillTargetArea: targetArea,
      skillDuration: 3 // 持续3秒
    });
    
    // 技能结束后恢复
    setTimeout(() => {
      this.room.updatePresence({
        usingSkill: false,
        skillType: null,
        skillTargetArea: null
      });
    }, 3000);
  }
  
  useEarthSkill() {
    // 土蛇技能：地刺突起
    // 在前方召唤地刺，阻挡敌人并造成伤害
    const myPresence = this.room.presence[this.room.clientId];
    if (!myPresence) return;
    
    // 计算技能目标区域
    const head = myPresence.segments[0];
    const direction = myPresence.direction;
    const targetArea = [];
    
    // 在前方一定范围内产生地刺
    if (direction.x !== 0) { // 水平方向
      for (let j = -2; j <= 2; j++) {
        targetArea.push({
          x: head.x + direction.x * 2,
          y: head.y + j
        });
      }
    } else { // 垂直方向
      for (let j = -2; j <= 2; j++) {
        targetArea.push({
          x: head.x + j,
          y: head.y + direction.y * 2
        });
      }
    }
    
    // 更新状态，添加技能标记和目标区域
    this.room.updatePresence({
      usingSkill: true,
      skillType: 'earth',
      skillTargetArea: targetArea,
      skillDuration: 6 // 持续6秒
    });
    
    // 更新房间状态，添加障碍物
    if (this.isRoomOwner()) {
      const obstacles = {};
      targetArea.forEach((pos, index) => {
        obstacles[`obstacle-${Date.now()}-${index}`] = {
          x: pos.x,
          y: pos.y,
          type: 'earth',
          duration: 6 // 持续6秒
        };
      });
      
      this.room.updateRoomState({
        obstacles: obstacles
      });
      
      // 障碍物结束后移除
      setTimeout(() => {
        const removeObstacles = {};
        Object.keys(obstacles).forEach(key => {
          removeObstacles[key] = null; // 设置为null来移除
        });
        
        this.room.updateRoomState({
          obstacles: removeObstacles
        });
      }, 6000);
    }
    
    // 技能结束后恢复
    setTimeout(() => {
      this.room.updatePresence({
        usingSkill: false,
        skillType: null,
        skillTargetArea: null
      });
    }, 6000);
  }
  
  checkGameState() {
    if (!this.initialized || !this.isRoomOwner()) return;
    
    // 统计活跃玩家数量
    let activePlayers = 0;
    for (const clientId in this.room.presence) {
      const player = this.room.presence[clientId];
      if (player && !player.dead) {
        activePlayers++;
      }
    }
    
    // 更新游戏状态
    const shouldGameRun = activePlayers >= this.game.config.minPlayers;
    if (shouldGameRun !== this.room.roomState.gameRunning) {
      this.room.updateRoomState({
        gameRunning: shouldGameRun
      });
    }
    
    // 检查游戏是否结束（只剩一个玩家）
    if (activePlayers === 1 && Object.keys(this.room.presence).length > 1) {
      // 找到获胜者
      for (const clientId in this.room.presence) {
        const player = this.room.presence[clientId];
        if (player && !player.dead) {
          // 更新房间状态，宣布获胜者
          this.room.updateRoomState({
            gameWinner: clientId,
            winnerName: this.room.peers[clientId]?.username || '玩家',
            winnerScore: player.score
          });
          break;
        }
      }
    }
  }
  
  getRandomSpawnPosition() {
    const { mapWidth, mapHeight } = this.game.config;
    const margin = 5; // 距离边缘的安全距离
    
    return {
      x: Math.floor(Math.random() * (mapWidth - 2 * margin)) + margin,
      y: Math.floor(Math.random() * (mapHeight - 2 * margin)) + margin
    };
  }
  
  getPeersInfo() {
    return this.room ? this.room.peers : {};
  }
  
  getCurrentClientId() {
    return this.room ? this.room.clientId : null;
  }
}

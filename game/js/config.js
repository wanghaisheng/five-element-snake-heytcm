const config = {
  // Game settings
  gameSpeed: 15,
  gridSize: 20,
  initialSnakeLength: 5,
  
  // Colors
  colors: {
    gold: '#FFD700',
    wood: '#4CAF50',
    water: '#2196F3',
    fire: '#F44336',
    earth: '#8D6E63',
    food: '#FFFFFF',
    background: '#0f0f1b',
    grid: '#1a1a2e'
  },
  
  // Element properties
  elements: {
    gold: {
      color: '#FFD700',
      speed: 1.0,
      growthRate: 1.2,
      skillName: "金刚护体",
      skillEffect: "短时间内提高防御力"
    },
    wood: {
      color: '#4CAF50',
      speed: 1.1,
      growthRate: 1.0,
      skillName: "藤蔓缠绕",
      skillEffect: "向前发射藤蔓减缓敌人速度"
    },
    water: {
      color: '#2196F3',
      speed: 1.2,
      growthRate: 0.9,
      skillName: "水流冲击",
      skillEffect: "短时间内大幅提升速度"
    },
    fire: {
      color: '#F44336',
      speed: 1.3,
      growthRate: 0.8,
      skillName: "火焰喷射",
      skillEffect: "向前喷射火焰伤害敌人"
    },
    earth: {
      color: '#8D6E63',
      speed: 0.9,
      growthRate: 1.3,
      skillName: "岩石护盾",
      skillEffect: "生成岩石护盾抵挡伤害"
    }
  },
  
  // Map dimensions
  mapWidth: 40,
  mapHeight: 25,
  
  // Multiplayer settings
  minPlayers: 2,
  maxPlayers: 8,
  foodCount: 20
};
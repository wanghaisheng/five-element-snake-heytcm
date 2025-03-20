document.addEventListener('DOMContentLoaded', () => {
  // 蛇选择轮播
  const snakeCards = document.querySelectorAll('.snake-card');
  const snakeDots = document.querySelectorAll('.dot');
  
  snakeCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      // 移除所有卡片的active类
      snakeCards.forEach(c => c.classList.remove('active'));
      snakeDots.forEach(d => d.classList.remove('active'));
      
      // 为当前卡片添加active类
      card.classList.add('active');
      snakeDots[index].classList.add('active');
      
      // 设置选择的蛇属性
      const element = card.getAttribute('data-element');
      document.documentElement.style.setProperty('--selected-element', element);
      
      // 更新蛇属性描述和技能信息（可以在这里扩展）
    });
  });
  
  // 滑动切换蛇
  let startX;
  const snakeCarousel = document.querySelector('.snake-carousel');
  
  snakeCarousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });
  
  snakeCarousel.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    // 获取当前活跃的蛇索引
    let activeIndex = 0;
    snakeCards.forEach((card, index) => {
      if (card.classList.contains('active')) {
        activeIndex = index;
      }
    });
    
    // 向左滑动，显示下一个蛇
    if (diff > 50 && activeIndex < snakeCards.length - 1) {
      snakeCards[activeIndex + 1].click();
    }
    // 向右滑动，显示上一个蛇
    else if (diff < -50 && activeIndex > 0) {
      snakeCards[activeIndex - 1].click();
    }
  });
  
  // 游戏模式选择效果
  const modeButtons = document.querySelectorAll('.mode-button');
  
  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 可以在这里添加选择模式的逻辑
      
      // 添加点击反馈效果
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 100);
    });
  });
  
  // 开始游戏按钮点击效果
  const playButton = document.querySelector('.play-button');
  
  playButton.addEventListener('click', () => {
    // 添加点击效果
    playButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
      playButton.style.transform = '';
    }, 100);
    
    // 选择当前激活的蛇属性
    let selectedElement = null;
    snakeCards.forEach(card => {
      if (card.classList.contains('active')) {
        selectedElement = card.getAttribute('data-element');
      }
    });
    
    // 模拟游戏开始，可以在这里添加实际的游戏启动逻辑
    alert(`准备开始游戏！你选择了 ${getElementName(selectedElement)} 蛇`);
  });
  
  // 底部导航栏链接处理
  const tabs = document.querySelectorAll('.tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      // 如果已经是激活状态的标签，阻止导航
      if (tab.classList.contains('active')) {
        e.preventDefault();
        return;
      }
      
      // 可以在这里添加页面跳转前的动画或过渡效果
    });
  });
  
  // 添加一些动画效果，增加游戏化体验
  animateElements();
  
  // 显示今日游戏提示
  showGameTip();
});

// 获取元素中文名称
function getElementName(element) {
  const names = {
    gold: '金',
    wood: '木',
    water: '水',
    fire: '火',
    earth: '土'
  };
  return names[element] || element;
}

// 添加动画效果
function animateElements() {
  // 为统计数字添加计数动画
  const statValues = document.querySelectorAll('.stat-value');
  
  statValues.forEach(stat => {
    const finalValue = parseInt(stat.textContent);
    let startValue = 0;
    const duration = 1500; // 动画持续1.5秒
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    
    stat.textContent = '0';
    
    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const currentValue = Math.round(progress * finalValue);
      
      stat.textContent = currentValue;
      
      if (frame === totalFrames) {
        clearInterval(counter);
        stat.textContent = finalValue;
      }
    }, frameDuration);
  });
  
  // 为蛇卡片添加淡入效果
  const snakeCards = document.querySelectorAll('.snake-card');
  
  snakeCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = index === 0 ? 'scale(1.05)' : 'translateY(0)';
    }, 100 + index * 100);
  });
  
  // 为游戏模式按钮添加淡入效果
  const modeButtons = document.querySelectorAll('.mode-button');
  
  modeButtons.forEach((button, index) => {
    button.style.opacity = '0';
    button.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      button.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      button.style.opacity = '1';
      button.style.transform = 'translateY(0)';
    }, 500 + index * 100);
  });
  
  // 为开始游戏按钮添加脉冲动画
  const playButton = document.querySelector('.play-button');
  
  setTimeout(() => {
    playButton.classList.add('pulse');
  }, 1000);
}

// 显示游戏提示
function showGameTip() {
  const tips = [
    "提示：金蛇可以破解木蛇的藤蔓缠绕技能",
    "提示：木蛇对土蛇的障碍物有额外的破坏效果",
    "提示：水蛇在水域中移动速度会大幅提升",
    "提示：火蛇可以快速清除木蛇施放的障碍物",
    "提示：土蛇对金蛇的冲刺攻击有较强的抵抗力"
  ];
  
  // 随机选择一个提示
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  // 创建提示元素
  const tipElement = document.createElement('div');
  tipElement.className = 'game-tip';
  tipElement.textContent = randomTip;
  
  // 添加到DOM中
  document.querySelector('.app-container').appendChild(tipElement);
  
  // 添加样式
  tipElement.style.position = 'fixed';
  tipElement.style.bottom = '70px';
  tipElement.style.left = '10px';
  tipElement.style.right = '10px';
  tipElement.style.padding = '10px 15px';
  tipElement.style.backgroundColor = 'rgba(140, 96, 255, 0.9)';
  tipElement.style.color = 'white';
  tipElement.style.borderRadius = '5px';
  tipElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
  tipElement.style.zIndex = '100';
  tipElement.style.transform = 'translateY(100px)';
  tipElement.style.opacity = '0';
  tipElement.style.transition = 'all 0.5s ease';
  
  // 显示提示
  setTimeout(() => {
    tipElement.style.transform = 'translateY(0)';
    tipElement.style.opacity = '1';
    
    // 几秒后自动隐藏
    setTimeout(() => {
      tipElement.style.transform = 'translateY(100px)';
      tipElement.style.opacity = '0';
      
      // 完全移除元素
      setTimeout(() => {
        tipElement.parentNode.removeChild(tipElement);
      }, 500);
    }, 5000);
  }, 2000);
}


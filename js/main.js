document.addEventListener('DOMContentLoaded', () => {
  // Import the new CSS file for the game section
  const gameStylesheet = document.createElement('link');
  gameStylesheet.rel = 'stylesheet';
  gameStylesheet.href = 'css/game-section.css';
  document.head.appendChild(gameStylesheet);

  // 语言选择器
  const languageSelect = document.getElementById('language-select');
  
  // 监听语言选择变化
  languageSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    changeLanguage(lang);
  });
  
  // 初始加载语言 - 默认为中文
  loadTranslations('zh').then(() => {
    updatePageContent('zh');
  });
  
  // 平滑滚动效果
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
  
  // 添加导航栏滚动效果
  const mainNav = document.querySelector('.main-nav');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      mainNav.style.background = '#281f3e';
      mainNav.style.position = 'fixed';
      mainNav.style.padding = '0.75rem 2rem';
      mainNav.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    } else {
      mainNav.style.background = 'transparent';
      mainNav.style.position = 'absolute';
      mainNav.style.padding = '1rem 2rem';
      mainNav.style.boxShadow = 'none';
    }
  });
  
  // 为动态元素添加动画效果
  const animateOnScroll = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        observer.unobserve(entry.target);
      }
    });
  };
  
  const observer = new IntersectionObserver(animateOnScroll, {
    root: null,
    threshold: 0.1
  });
  
  document.querySelectorAll('.pain-point, .solution-feature, .feature-card, .testimonial').forEach(element => {
    element.classList.add('fade-in');
    observer.observe(element);
  });
  
  // 添加演示视频的替代方案
  const videoElement = document.querySelector('.hero-video video');
  if (videoElement) {
    videoElement.addEventListener('error', () => {
      const fallbackImage = document.createElement('img');
      fallbackImage.src = 'img/gameplay-preview.gif';
      fallbackImage.alt = '五行蛇Online游戏演示';
      
      videoElement.parentNode.replaceChild(fallbackImage, videoElement);
    });
  }
  
  // 订阅表单处理
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (email) {
        // 这里添加实际的订阅处理逻辑，如API调用
        // 示例：显示成功消息
        newsletterForm.innerHTML = '<p class="success-message">谢谢订阅！我们会及时为您发送游戏更新信息。</p>';
      }
    });
  }
  
  // 五行元素动画效果
  createElementalAnimations();
});

// 创建五行元素动画效果
function createElementalAnimations() {
  const hero = document.querySelector('.hero');
  
  // 创建五行元素粒子
  const elements = ['gold', 'wood', 'water', 'fire', 'earth'];
  const colors = ['#FFD700', '#4CAF50', '#2196F3', '#F44336', '#8D6E63'];
  
  elements.forEach((element, index) => {
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.classList.add('elemental-particle', `${element}-particle`);
      particle.style.backgroundColor = colors[index];
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${5 + Math.random() * 15}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      
      hero.appendChild(particle);
    }
  });
}
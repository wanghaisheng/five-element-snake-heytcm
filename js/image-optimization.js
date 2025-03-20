document.addEventListener('DOMContentLoaded', () => {
  // 懒加载图片
  const lazyLoadImages = () => {
    const lazyImages = document.querySelectorAll('img.lazy-load');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target;
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.classList.add('loaded');
            imageObserver.unobserve(lazyImage);
          }
        });
      });
      
      lazyImages.forEach(image => imageObserver.observe(image));
    } else {
      // 回退方案，用于不支持IntersectionObserver的浏览器
      let lazyLoadThrottleTimeout;
      
      const lazyLoad = () => {
        if (lazyLoadThrottleTimeout) {
          clearTimeout(lazyLoadThrottleTimeout);
        }
        
        lazyLoadThrottleTimeout = setTimeout(() => {
          const scrollTop = window.pageYOffset;
          
          lazyImages.forEach(lazyImage => {
            if (lazyImage.offsetTop < window.innerHeight + scrollTop) {
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.classList.add('loaded');
            }
          });
          
          if (lazyImages.length === 0) {
            document.removeEventListener('scroll', lazyLoad);
            window.removeEventListener('resize', lazyLoad);
            window.removeEventListener('orientationChange', lazyLoad);
          }
        }, 20);
      };
      
      document.addEventListener('scroll', lazyLoad);
      window.addEventListener('resize', lazyLoad);
      window.addEventListener('orientationChange', lazyLoad);
    }
  };
  
  // 图片错误处理
  const handleImageErrors = () => {
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
      img.addEventListener('error', () => {
        // 替换为默认图片
        img.src = 'img/placeholder.svg';
        img.alt = '图片加载失败';
      });
    });
  };
  
  // 优化图片尺寸
  const optimizeImageSize = () => {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth;
    
    document.querySelectorAll('img[data-sizes]').forEach(img => {
      const sizes = JSON.parse(img.dataset.sizes);
      const originalSrc = img.dataset.originalSrc;
      
      // 选择最合适的图片尺寸
      let selectedSize = sizes[0];
      for (const size of sizes) {
        if (size.width * devicePixelRatio >= viewportWidth) {
          selectedSize = size;
          break;
        }
      }
      
      // 设置最适合当前设备的图片
      img.src = originalSrc.replace('{size}', selectedSize.name);
    });
  };
  
  // 执行优化
  lazyLoadImages();
  handleImageErrors();
  optimizeImageSize();
  
  // 窗口大小改变时重新优化图片尺寸
  window.addEventListener('resize', optimizeImageSize);
});

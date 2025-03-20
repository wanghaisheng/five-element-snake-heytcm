// 用于存储当前语言的翻译数据
let translations = {};

// 加载指定语言的翻译数据
async function loadTranslations(lang) {
  try {
    const response = await fetch(`locale/${lang}.json`);
    translations = await response.json();
    return translations;
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
    return {}; // 返回空对象作为后备
  }
}

// 根据翻译数据更新页面内容
function updatePageContent(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const text = getTranslation(key);
    
    if (text) {
      // 对于简单元素，直接更新文本内容
      if (!element.tagName.toLowerCase().match(/input|textarea/i)) {
        element.textContent = text;
      } else {
        // 对于表单元素，更新placeholder或value
        if (element.hasAttribute('placeholder')) {
          element.setAttribute('placeholder', text);
        } else {
          element.value = text;
        }
      }
    }
  });
}

// 从嵌套的翻译对象中获取指定键的值
function getTranslation(key) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      return null; // 如果在任何级别找不到键，则返回null
    }
  }
  
  return value;
}

// 切换语言
function changeLanguage(lang) {
  loadTranslations(lang).then(() => {
    updatePageContent(lang);
  });
}


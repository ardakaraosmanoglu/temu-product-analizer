/**
 * Fabric Finder - Content Script v2.0
 * Enhanced with Temu optimization, allergy warnings, favorites, and seasonal ratings
 */

(function() {
  'use strict';

  const FABRIC_KEYWORDS = [
    'material', 'fabric', 'composition', 'component', 'malzeme', 'kumaş',
    'bileşen', 'dokuma', 'season', 'mevsim', 'polyester', 'cotton', 'wool',
    'silk', 'linen', 'nylon', 'spandex', 'elastane', 'viscose', 'rayon',
    'acrylic', 'modal', 'tencel', 'velvet', 'denim', 'fleece', 'satin'
  ];

  const FABRIC_TYPES = {
    'polyester': { name: 'Polyester', breathability: 2, warmth: 3, sensitivity: 'medium', warning: 'Synthetic fabric with low breathability' },
    'cotton': { name: 'Cotton', breathability: 5, warmth: 3, sensitivity: 'low', warning: null },
    'wool': { name: 'Wool', breathability: 3, warmth: 5, sensitivity: 'medium', warning: 'May cause irritation for sensitive skin' },
    'silk': { name: 'Silk', breathability: 4, warmth: 2, sensitivity: 'low', warning: null },
    'linen': { name: 'Linen', breathability: 5, warmth: 2, sensitivity: 'low', warning: null },
    'nylon': { name: 'Nylon', breathability: 3, warmth: 3, sensitivity: 'medium', warning: 'Synthetic fabric' },
    'spandex': { name: 'Spandex', breathability: 3, warmth: 2, sensitivity: 'medium', warning: 'Synthetic blend' },
    'elastane': { name: 'Elastane', breathability: 3, warmth: 2, sensitivity: 'medium', warning: 'Synthetic blend' },
    'viscose': { name: 'Viscose', breathability: 4, warmth: 2, sensitivity: 'low', warning: null },
    'rayon': { name: 'Rayon', breathability: 4, warmth: 2, sensitivity: 'low', warning: null },
    'acrylic': { name: 'Acrylic', breathability: 2, warmth: 4, sensitivity: 'high', warning: 'May cause skin irritation, not recommended for sensitive skin' },
    'modal': { name: 'Modal', breathability: 4, warmth: 2, sensitivity: 'low', warning: null },
    'tencel': { name: 'Tencel', breathability: 5, warmth: 2, sensitivity: 'low', warning: null },
    'velvet': { name: 'Velvet', breathability: 2, warmth: 4, sensitivity: 'medium', warning: null },
    'denim': { name: 'Denim', breathability: 3, warmth: 4, sensitivity: 'low', warning: null },
    'fleece': { name: 'Fleece', breathability: 2, warmth: 5, sensitivity: 'medium', warning: 'Synthetic, may trap heat' },
    'satin': { name: 'Satin', breathability: 3, warmth: 2, sensitivity: 'low', warning: null },
    'microfiber': { name: 'Microfiber', breathability: 3, warmth: 3, sensitivity: 'medium', warning: 'Synthetic fabric' },
    'polyamide': { name: 'Polyamide', breathability: 3, warmth: 3, sensitivity: 'medium', warning: 'Synthetic fabric' }
  };

  const SEASON_KEYWORDS = ['summer', 'winter', 'spring', 'autumn', 'fall', 'all seasons', 'mevsim', 'yaz', 'kış', 'ilkbahar', 'sonbahar'];
  const STRETCH_KEYWORDS = ['stretch', 'elastic', 'flexible', 'strech'];
  const WEAVE_KEYWORDS = ['knit', 'knitted', 'woven', 'dokuma', 'örme'];

  // Fabric breathability ratings for seasonal recommendations
  const SEASONALITY = {
    summer: { minBreathability: 4, label: 'Best for Summer', icon: '☀️' },
    winter: { minBreathability: 1, label: 'Best for Winter', icon: '❄️' },
    allSeason: { minBreathability: 3, label: 'All Seasons', icon: '🌍' }
  };

  let widget = null;

  function init() {
    const fabricData = scanPage();
    if (fabricData && Object.keys(fabricData).length > 0) {
      showWidget(fabricData);
    } else {
      showNotFound();
    }
  }

  function scanPage() {
    const data = {};

    // 1. Scan Temu-specific data structures (highest priority)
    if (window.location.hostname.includes('temu.com')) {
      scanTemuSpecific(data);
    }

    // 2. Scan JSON-LD structured data
    scanJsonLd(data);

    // 3. Scan embedded scripts for product data
    scanEmbeddedScripts(data);

    // 4. Scan meta tags
    scanMetaTags(data);

    // 5. Scan visible page content
    scanVisibleContent(data);

    // 6. Calculate seasonal recommendation
    calculateSeasonality(data);

    // 7. Generate allergy/sensitivity warning
    generateWarning(data);

    return data;
  }

  function scanTemuSpecific(data) {
    // Temu uses __INITIAL_STATE__ for SSR data
    const temuState = findGlobalVar('__INITIAL_STATE__');
    if (temuState) {
      extractFromObject(temuState, data);
    }

    // Temu also uses window.__UNIVERSAL_DATA__
    const universalData = findGlobalVar('__UNIVERSAL_DATA__');
    if (universalData) {
      extractFromObject(universalData, data);
    }

    // Look for goodsProperty in window对象
    const goodsProperty = findGlobalVar('goodsProperty');
    if (goodsProperty) {
      extractFromObject(goodsProperty, data);
    }

    // Scan all script tags for Temu-specific patterns
    document.querySelectorAll('script').forEach(script => {
      const text = script.textContent;
      if (text.includes('fabric') || text.includes('material') || text.includes('polyester')) {
        extractFromText(text, data);
      }
    });
  }

  function findGlobalVar(name) {
    try {
      if (window[name]) {
        return typeof window[name] === 'string' ? JSON.parse(window[name]) : window[name];
      }
    } catch (e) {}
    return null;
  }

  function extractFromObject(obj, data, depth = 0) {
    if (depth > 10 || !obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();

      if (value && typeof value === 'object') {
        if (keyLower.includes('material') || keyLower.includes('fabric') || keyLower.includes('component')) {
          if (typeof value === 'string') {
            extractFromText(value, data);
          } else {
            extractFromObject(value, data, depth + 1);
          }
        } else {
          extractFromObject(value, data, depth + 1);
        }
      } else if (typeof value === 'string') {
        if (keyLower.includes('material') || keyLower.includes('fabric')) {
          extractFromText(value, data);
        }
      }
    }
  }

  function scanJsonLd(data) {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    scripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent);
        processJsonLd(json, data);
      } catch (e) {}
    });
  }

  function processJsonLd(json, data) {
    if (json['@graph']) {
      json['@graph'].forEach(item => extractMaterialInfo(item, data));
    } else if (json['@type'] === 'Product') {
      extractMaterialInfo(json, data);
    } else if (Array.isArray(json)) {
      json.forEach(item => processJsonLd(item, data));
    } else if (typeof json === 'object') {
      extractMaterialInfo(json, data);
    }
  }

  function extractMaterialInfo(obj, data) {
    if (!obj || typeof obj !== 'object') return;

    const materialFields = ['material', 'fabric', 'composition', 'materials', 'fabricComposition'];

    materialFields.forEach(field => {
      if (obj[field] && !data.material) {
        const value = extractFabricValue(obj[field]);
        if (value) data.material = value;
      }
    });

    if (obj.additionalProperty) {
      obj.additionalProperty.forEach(prop => {
        if (prop.name && FABRIC_KEYWORDS.some(k => prop.name.toLowerCase().includes(k))) {
          const value = extractFabricValue(prop.value);
          if (value && !data.material) data.material = value;
        }
      });
    }
  }

  function scanEmbeddedScripts(data) {
    const scripts = document.querySelectorAll('script');

    scripts.forEach(script => {
      const text = script.textContent;

      if (text.includes('goodsProperty') || text.includes('productProperty') ||
          text.includes('productInfo') || text.includes('productData')) {

        FABRIC_KEYWORDS.forEach(keyword => {
          const regex = new RegExp(`${keyword}[\\s:]+[^"',}\\]]{1,100}`, 'gi');
          const matches = text.match(regex);
          if (matches && !data.material) {
            const cleaned = cleanFabricString(matches[0]);
            if (cleaned) data.material = cleaned;
          }
        });
      }
    });
  }

  function scanMetaTags(data) {
    const metaTags = document.querySelectorAll('meta[name*="material"], meta[name*="fabric"], meta[property*="material"]');

    metaTags.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content) {
        const value = extractFabricValue(content);
        if (value && !data.material) {
          data.material = value;
        }
      }
    });
  }

  function scanVisibleContent(data) {
    const selectors = [
      '[class*="material"]', '[class*="fabric"]', '[class*="composition"]',
      '[class*="detail"]', '[class*="spec"]', '[class*="product"]',
      '[id*="material"]', '[id*="fabric"]', '[id*="detail"]',
      '[data-testid*="material"]', '[data-testid*="fabric"]'
    ];

    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent || '';
          extractFromText(text, data);
        });
      } catch (e) {}
    });

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const text = node.textContent || '';
          if (FABRIC_KEYWORDS.some(k => text.toLowerCase().includes(k))) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node.textContent);
    }

    textNodes.forEach(text => extractFromText(text, data));
  }

  function extractFromText(text, data) {
    // Extract fabric composition
    const compositionRegex = /(\d+\s*%\s*)?(polyester|cotton|wool|silk|linen|nylon|spandex|elastane|viscose|rayon|acrylic|modal|tencel|velvet|fleece|satin|microfiber|polyamide)/gi;
    const matches = text.match(compositionRegex);

    if (matches && !data.composition) {
      const composition = matches.map(m => m.trim()).join(', ');
      if (composition.length > 2) {
        data.composition = capitalizeFirstLetter(composition);
      }
    }

    // Extract material
    if (!data.material) {
      FABRIC_TYPES.forEach((info, keyword) => {
        if (text.toLowerCase().includes(keyword)) {
          data.material = info.name;
        }
      });
    }

    // Extract season
    if (!data.season) {
      SEASON_KEYWORDS.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          data.season = capitalizeFirstLetter(keyword);
        }
      });
    }

    // Extract stretch
    if (!data.stretch) {
      STRETCH_KEYWORDS.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          data.stretch = 'Stretch Fabric';
        }
      });
    }

    // Extract weave method
    if (!data.weave) {
      WEAVE_KEYWORDS.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          data.weave = capitalizeFirstLetter(keyword) + ' Fabric';
        }
      });
    }
  }

  function extractFabricValue(value) {
    if (!value) return null;
    const str = String(value).toLowerCase();

    for (const [keyword, info] of Object.entries(FABRIC_TYPES)) {
      if (str.includes(keyword)) {
        return info.name;
      }
    }

    if (FABRIC_KEYWORDS.some(k => str.includes(k))) {
      return capitalizeFirstLetter(cleanFabricString(str));
    }

    return null;
  }

  function cleanFabricString(str) {
    return str
      .replace(/[":{}\\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function calculateSeasonality(data) {
    if (!data.material) return;

    const fabricInfo = Object.values(FABRIC_TYPES).find(f => f.name === data.material);
    if (!fabricInfo) return;

    const breathability = fabricInfo.breathability;

    if (breathability >= 4) {
      data.seasonalRating = { label: 'Best for Summer', icon: '☀️', score: breathability };
    } else if (breathability >= 2) {
      data.seasonalRating = { label: 'All Seasons', icon: '🌍', score: breathability };
    } else {
      data.seasonalRating = { label: 'Best for Winter', icon: '❄️', score: breathability };
    }
  }

  function generateWarning(data) {
    if (!data.material) return;

    const fabricInfo = Object.values(FABRIC_TYPES).find(f => f.name === data.material);
    if (fabricInfo && fabricInfo.warning) {
      data.warning = fabricInfo.warning;
      data.sensitivity = fabricInfo.sensitivity;
    }
  }

  function getProductUrl() {
    return window.location.href;
  }

  function getProductTitle() {
    // Try to find product title
    const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]') || document.querySelector('title');
    return titleEl ? titleEl.textContent.trim().substring(0, 100) : 'Unknown Product';
  }

  function saveToFavorites(data) {
    const favorites = JSON.parse(localStorage.getItem('fabricFinder_favorites') || '[]');

    const entry = {
      url: getProductUrl(),
      title: getProductTitle(),
      material: data.material,
      composition: data.composition,
      stretch: data.stretch,
      weave: data.weave,
      season: data.season,
      seasonalRating: data.seasonalRating,
      warning: data.warning,
      savedAt: new Date().toISOString()
    };

    // Avoid duplicates
    const existingIndex = favorites.findIndex(f => f.url === entry.url);
    if (existingIndex >= 0) {
      favorites[existingIndex] = entry;
    } else {
      favorites.unshift(entry);
    }

    // Keep only last 50
    if (favorites.length > 50) {
      favorites.pop();
    }

    localStorage.setItem('fabricFinder_favorites', JSON.stringify(favorites));
    return favorites.length;
  }

  function createRow(label, value, icon) {
    const row = document.createElement('div');
    row.className = 'fabric-finder-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'fabric-finder-label';
    labelSpan.textContent = label + ':';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'fabric-finder-value';
    valueSpan.textContent = icon ? `${icon} ${value}` : value;

    row.appendChild(labelSpan);
    row.appendChild(valueSpan);
    return row;
  }

  function showWidget(data) {
    removeWidget();

    widget = document.createElement('div');
    widget.id = 'fabric-finder-widget';
    widget.className = 'fabric-finder-widget';

    // Header
    const header = document.createElement('div');
    header.className = 'fabric-finder-header';

    const title = document.createElement('span');
    title.className = 'fabric-finder-title';
    title.textContent = 'Fabric Finder';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fabric-finder-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', removeWidget);

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content
    const content = document.createElement('div');
    content.className = 'fabric-finder-content';

    if (data.material) {
      content.appendChild(createRow('Material', data.material));
    }
    if (data.composition) {
      content.appendChild(createRow('Composition', data.composition));
    }
    if (data.stretch) {
      content.appendChild(createRow('Fabric', data.stretch));
    }
    if (data.weave) {
      content.appendChild(createRow('Weaving', data.weave));
    }
    if (data.seasonalRating) {
      content.appendChild(createRow('Best For', data.seasonalRating.label, data.seasonalRating.icon));
    }
    if (data.season) {
      content.appendChild(createRow('Season', data.season));
    }

    // Warning section
    if (data.warning) {
      const warningDiv = document.createElement('div');
      warningDiv.className = 'fabric-finder-warning';
      warningDiv.textContent = '⚠️ ' + data.warning;
      content.appendChild(warningDiv);
    }

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'fabric-finder-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'fabric-finder-btn';
    saveBtn.textContent = 'Save to Favorites';
    saveBtn.addEventListener('click', () => {
      const count = saveToFavorites(data);
      saveBtn.textContent = 'Saved! ✓';
      saveBtn.disabled = true;
      setTimeout(() => {
        saveBtn.textContent = 'Save to Favorites';
        saveBtn.disabled = false;
      }, 2000);
    });

    actions.appendChild(saveBtn);
    content.appendChild(actions);

    widget.appendChild(header);
    widget.appendChild(content);
    document.body.appendChild(widget);
  }

  function showNotFound() {
    removeWidget();

    widget = document.createElement('div');
    widget.id = 'fabric-finder-widget';
    widget.className = 'fabric-finder-widget';

    // Header
    const header = document.createElement('div');
    header.className = 'fabric-finder-header';

    const title = document.createElement('span');
    title.className = 'fabric-finder-title';
    title.textContent = 'Fabric Finder';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fabric-finder-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', removeWidget);

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content
    const content = document.createElement('div');
    content.className = 'fabric-finder-content';

    const notFound = document.createElement('div');
    notFound.className = 'fabric-finder-not-found';
    notFound.textContent = 'Fabric info not found on this page.';

    content.appendChild(notFound);

    widget.appendChild(header);
    widget.appendChild(content);
    document.body.appendChild(widget);
  }

  function removeWidget() {
    const existing = document.getElementById('fabric-finder-widget');
    if (existing) {
      existing.remove();
    }
    widget = null;
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000);
  }
})();

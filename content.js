/**
 * Fabric Finder - Content Script
 * Scans e-commerce product pages for fabric/material information
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
    'polyester': 'Polyester',
    'cotton': 'Cotton',
    'wool': 'Wool',
    'silk': 'Silk',
    'linen': 'Linen',
    'nylon': 'Nylon',
    'spandex': 'Spandex',
    'elastane': 'Elastane',
    'viscose': 'Viscose',
    'rayon': 'Rayon',
    'acrylic': 'Acrylic',
    'modal': 'Modal',
    'tencel': 'Tencel',
    'velvet': 'Velvet',
    'denim': 'Denim',
    'fleece': 'Fleece',
    'satin': 'Satin',
    'microfiber': 'Microfiber',
    'polyamide': 'Polyamide'
  };

  const SEASON_KEYWORDS = ['summer', 'winter', 'spring', 'autumn', 'fall', 'all seasons', 'mevsim', 'yaz', 'kış', 'ilkbahar', 'sonbahar'];
  const STRETCH_KEYWORDS = ['stretch', 'elastic', 'flexible', 'strech'];
  const WEAVE_KEYWORDS = ['knit', 'knitted', 'woven', 'dokuma', 'örme'];

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

    // 1. Scan JSON-LD structured data
    scanJsonLd(data);

    // 2. Scan embedded scripts for product data
    scanEmbeddedScripts(data);

    // 3. Scan meta tags
    scanMetaTags(data);

    // 4. Scan visible page content
    scanVisibleContent(data);

    return data;
  }

  function scanJsonLd(data) {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    scripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent);
        processJsonLd(json, data);
      } catch (e) {
        // Invalid JSON, skip
      }
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
      } catch (e) {
        // Invalid selector, skip
      }
    });

    // Scan text nodes
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
      FABRIC_TYPES.forEach((name, keyword) => {
        if (text.toLowerCase().includes(keyword)) {
          data.material = name;
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

    for (const [keyword, name] of Object.entries(FABRIC_TYPES)) {
      if (str.includes(keyword)) {
        return name;
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

  function createRow(label, value) {
    const row = document.createElement('div');
    row.className = 'fabric-finder-row';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'fabric-finder-label';
    labelSpan.textContent = label + ':';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'fabric-finder-value';
    valueSpan.textContent = value;

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
      content.appendChild(createRow('Weaving Method', data.weave));
    }
    if (data.season) {
      content.appendChild(createRow('Season', data.season));
    }

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

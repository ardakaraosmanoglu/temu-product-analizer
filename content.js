/**
 * Fabric Finder - Content Script v3.0
 * Enhanced with i18n (TR/EN), fabric explanations, quality grades, and review analysis
 */

(function() {
  'use strict';

  // ============================================
  // i18n System
  // ============================================
  const I18N = {
    currentLang: 'en',

    translations: {
      en: {
        title: 'Fabric Finder',
        material: 'Material',
        composition: 'Composition',
        fabric: 'Fabric',
        weaving: 'Weaving',
        bestFor: 'Best For',
        season: 'Season',
        quality: 'Quality',
        reviews: 'Reviews',
        gradeA: 'A Grade',
        gradeB: 'B Grade',
        gradeC: 'C Grade',
        gradeD: 'D Grade',
        bestForSummer: 'Best for Summer',
        bestForWinter: 'Best for Winter',
        allSeasons: 'All Seasons',
        stretchFabric: 'Stretch Fabric',
        savedToFavorites: 'Saved!',
        saveToFavorites: 'Save to Favorites',
        notFound: 'Fabric info not found on this page.',
        basedOnReviews: 'Based on {count} reviews',
        noReviews: 'No reviews found',
        sensitivity: {
          low: 'Low sensitivity',
          medium: 'Medium sensitivity',
          high: 'High sensitivity'
        }
      },
      tr: {
        title: 'Kumaş Bulucu',
        material: 'Malzeme',
        composition: 'Bileşim',
        fabric: 'Kumaş',
        weaving: 'Dokuma',
        bestFor: 'En Uygun',
        season: 'Mevsim',
        quality: 'Kalite',
        reviews: 'Yorumlar',
        gradeA: 'A Sınıfı',
        gradeB: 'B Sınıfı',
        gradeC: 'C Sınıfı',
        gradeD: 'D Sınıfı',
        bestForSummer: 'Yaz İçin Uygun',
        bestForWinter: 'Kış İçin Uygun',
        allSeasons: 'Her Mevsim',
        stretchFabric: 'Esnek Kumaş',
        savedToFavorites: 'Kaydedildi!',
        saveToFavorites: 'Favorilere Kaydet',
        notFound: 'Bu sayfada kumaş bilgisi bulunamadı.',
        basedOnReviews: '{count} yoruma göre',
        noReviews: 'Yorum bulunamadı',
        sensitivity: {
          low: 'Düşük hassasiyet',
          medium: 'Orta hassasiyet',
          high: 'Yüksek hassasiyet'
        }
      }
    },

    init() {
      // Detect language from browser
      const browserLang = navigator.language.toLowerCase();
      this.currentLang = browserLang.startsWith('tr') ? 'tr' : 'en';
    },

    t(key, params) {
      let text = this.translations[this.currentLang][key] || this.translations['en'][key] || key;
      if (params) {
        Object.keys(params).forEach(k => {
          text = text.replace(`{${k}}`, params[k]);
        });
      }
      return text;
    }
  };

  // Initialize i18n
  I18N.init();

  // ============================================
  // Fabric Database with Explanations
  // ============================================
  const FABRIC_KEYWORDS = [
    'material', 'fabric', 'composition', 'component', 'malzeme', 'kumaş',
    'bileşen', 'dokuma', 'season', 'mevsim', 'polyester', 'cotton', 'wool',
    'silk', 'linen', 'nylon', 'spandex', 'elastane', 'viscose', 'rayon',
    'acrylic', 'modal', 'tencel', 'velvet', 'denim', 'fleece', 'satin'
  ];

  const FABRIC_TYPES = {
    'polyester': {
      name: { en: 'Polyester', tr: 'Polyester' },
      breathability: 2, warmth: 3, durability: 4,
      sensitivity: 'medium',
      warning: { en: 'Synthetic fabric with low breathability', tr: 'Düşük hava geçirgenliğine sahip sentetik kumaş' },
      explanation: { en: 'Durable synthetic fiber, quick-drying but less breathable. Common in budget clothing.', tr: 'Dayanıklı sentetik lif, çabuk kurur ancak az hava geçirgen. Bütçe giyimde yaygın.' }
    },
    'cotton': {
      name: { en: 'Cotton', tr: 'Pamuk' },
      breathability: 5, warmth: 3, durability: 3,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Natural breathable fiber, soft and comfortable. Good for sensitive skin.', tr: 'Doğal nefes alan lif, yumuşak ve konforlu. Hassas ciltler için iyi.' }
    },
    'wool': {
      name: { en: 'Wool', tr: 'Yün' },
      breathability: 3, warmth: 5, durability: 3,
      sensitivity: 'medium',
      warning: { en: 'May cause irritation for sensitive skin', tr: 'Hassas ciltlerde tahrişe neden olabilir' },
      explanation: { en: 'Natural insulator, excellent for cold weather. Natural moisture-wicking.', tr: 'Doğal yalıtkan, soğuk hava için mükemmel. Doğal nem alma özelliği.' }
    },
    'silk': {
      name: { en: 'Silk', tr: 'İpek' },
      breathability: 4, warmth: 2, durability: 2,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Luxurious natural fiber with smooth texture. Temperature regulating.', tr: 'Düzgün dokuya sahip lüks doğal lif. Sıcaklık düzenleyici.' }
    },
    'linen': {
      name: { en: 'Linen', tr: 'Keten' },
      breathability: 5, warmth: 2, durability: 3,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Lightweight natural fiber, excellent for hot weather. Gets softer with washing.', tr: 'Hafif doğal lif, sıcak hava için mükemmel. Yıkandıkça yumuşar.' }
    },
    'nylon': {
      name: { en: 'Nylon', tr: 'Naylon' },
      breathability: 3, warmth: 3, durability: 5,
      sensitivity: 'medium',
      warning: { en: 'Synthetic fabric', tr: 'Sentetik kumaş' },
      explanation: { en: 'Strong synthetic, resistant to tears and abrasion. Often used in activewear.', tr: 'Güçlü sentetik, yırtılmaya ve aşınmaya dayanıklı. Genellikle spor giyimde kullanılır.' }
    },
    'spandex': {
      name: { en: 'Spandex', tr: 'Spanks' },
      breathability: 3, warmth: 2, durability: 3,
      sensitivity: 'medium',
      warning: { en: 'Synthetic blend', tr: 'Sentetik karışım' },
      explanation: { en: 'Highly elastic fiber, provides stretch and flexibility. Common in leggings and sportswear.', tr: 'Yüksek esnek lif, esneklik sağlar. Tayt ve spor giyimde yaygın.' }
    },
    'elastane': {
      name: { en: 'Elastane', tr: 'Elastan' },
      breathability: 3, warmth: 2, durability: 3,
      sensitivity: 'medium',
      warning: { en: 'Synthetic blend', tr: 'Sentetik karışım' },
      explanation: { en: 'Elastic fiber similar to spandex. Provides shape retention.', tr: 'Spanks benzeri esnek lif. Form koruma sağlar.' }
    },
    'viscose': {
      name: { en: 'Viscose', tr: 'Viskoz' },
      breathability: 4, warmth: 2, durability: 2,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Semi-synthetic fiber from wood pulp. Soft drape, breathable.', tr: 'Odun selülozundan elde edilen yarı sentetik lif. Yumuşak akış, nefes alan.' }
    },
    'rayon': {
      name: { en: 'Rayon', tr: 'Rayon' },
      breathability: 4, warmth: 2, durability: 2,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Semi-synthetic, silky feel. Good drape but weaker when wet.', tr: 'Yarı sentetik, ipek gibi his. İyi akış ancak ıslakken zayıf.' }
    },
    'acrylic': {
      name: { en: 'Acrylic', tr: 'Akrilik' },
      breathability: 2, warmth: 4, durability: 3,
      sensitivity: 'high',
      warning: { en: 'May cause skin irritation, not recommended for sensitive skin', tr: 'Cilt tahrişine neden olabilir, hassas ciltler için önerilmez' },
      explanation: { en: 'Synthetic wool alternative, lightweight and warm. May pill over time.', tr: 'Sentetik yün alternatifi, hafif ve sıcak. Zamanla tüylenme yapabilir.' }
    },
    'modal': {
      name: { en: 'Modal', tr: 'Modal' },
      breathability: 4, warmth: 2, durability: 3,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Semi-synthetic from beech wood. Very soft, breathable, shrink-resistant.', tr: 'Kayın ağacından yarı sentetik. Çok yumuşak, nefes alan, çekmez.' }
    },
    'tencel': {
      name: { en: 'Tencel', tr: 'Tencel' },
      breathability: 5, warmth: 2, durability: 4,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Eco-friendly lyocell fiber. Excellent moisture management, silky feel.', tr: 'Çevre dostu liyosel lifi. Mükemmel nem yönetimi, ipek gibi his.' }
    },
    'velvet': {
      name: { en: 'Velvet', tr: 'Kadife' },
      breathability: 2, warmth: 4, durability: 3,
      sensitivity: 'medium',
      warning: { en: null, tr: null },
      explanation: { en: 'Soft woven fabric with dense pile. Luxurious feel but requires care.', tr: 'Yoğun yığına sahip yumuşak dokuma kumaş. Lüks his ama özen gerektirir.' }
    },
    'denim': {
      name: { en: 'Denim', tr: 'Kot' },
      breathability: 3, warmth: 4, durability: 5,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Sturdy cotton twill weave. Durable and versatile, softens with wear.', tr: 'Güçlü pamuklu çarşaf dokuma. Dayanıklı ve çok yönlü, giyildikçe yumuşar.' }
    },
    'fleece': {
      name: { en: 'Fleece', tr: 'Polar' },
      breathability: 2, warmth: 5, durability: 4,
      sensitivity: 'medium',
      warning: { en: 'Synthetic, may trap heat', tr: 'Sentetik, ısı hapsedebilir' },
      explanation: { en: 'Synthetic brushed fabric. Excellent insulator, lightweight and quick-drying.', tr: 'Fırçalanmış sentetik kumaş. Mükemmel yalıtkan, hafif ve çabuk kurur.' }
    },
    'satin': {
      name: { en: 'Satin', tr: 'Saten' },
      breathability: 3, warmth: 2, durability: 3,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      explanation: { en: 'Smooth weave with glossy surface. Often polyester or silk blend.', tr: 'Parlak yüzeyli düzgün dokuma. Genellikle polyester veya ipek karışımı.' }
    },
    'microfiber': {
      name: { en: 'Microfiber', tr: 'Mikro fiber' },
      breathability: 3, warmth: 3, durability: 4,
      sensitivity: 'medium',
      warning: { en: 'Synthetic fabric', tr: 'Sentetik kumaş' },
      explanation: { en: 'Ultra-fine synthetic fibers. Soft, lightweight, good stain resistance.', tr: 'Ultra ince sentetik lifler. Yumuşak, hafif, iyi leke direnci.' }
    },
    'polyamide': {
      name: { en: 'Polyamide', tr: 'Poliamid' },
      breathability: 3, warmth: 3, durability: 5,
      sensitivity: 'medium',
      warning: { en: 'Synthetic fabric', tr: 'Sentetik kumaş' },
      explanation: { en: 'Strong synthetic similar to nylon. Good elasticity and shape retention.', tr: 'Naylona benzer güçlü sentetik. İyi esneklik ve form koruma.' }
    }
  };

  // Weave types with explanations
  const WEAVE_TYPES = {
    'knit': {
      name: { en: 'Knit', tr: 'Örme' },
      explanation: { en: 'Flexible looped structure, stretchy and comfortable. Common in t-shirts and underwear.', tr: 'Esnek döngülü yapı, esnek ve rahat. Tişört ve iç giyimde yaygın.' }
    },
    'woven': {
      name: { en: 'Woven', tr: 'Dokuma' },
      explanation: { en: 'Interlaced threads creating sturdy fabric. Less stretch, more durable.', tr: 'Düğümlü ipliklerle oluşan sağlam kumaş. Daha az esnek, daha dayanıklı.' }
    },
    'knitted': {
      name: { en: 'Knitted', tr: 'Örme' },
      explanation: { en: 'Flexible looped structure, stretchy and comfortable. Common in t-shirts and underwear.', tr: 'Esnek döngülü yapı, esnek ve rahat. Tişört ve iç giyimde yaygın.' }
    }
  };

  const SEASON_KEYWORDS = {
    summer: { en: ['summer'], tr: ['yaz'] },
    winter: { en: ['winter'], tr: ['kış'] },
    spring: { en: ['spring'], tr: ['ilkbahar'] },
    autumn: { en: ['autumn', 'fall'], tr: ['sonbahar'] },
    allSeason: { en: ['all seasons'], tr: ['her mevsim', '4 mevsim'] }
  };

  const STRETCH_KEYWORDS = ['stretch', 'elastic', 'flexible', 'strech', 'esnek'];

  // ============================================
  // Quality Grade Calculation
  // ============================================
  function calculateQualityGrade(data) {
    if (!data.material) return null;

    const fabricInfo = Object.values(FABRIC_TYPES).find(f => f.name[I18N.currentLang] === data.material ||
                                                             f.name.en === data.material);
    if (!fabricInfo) return null;

    // Calculate score out of 10
    const breathabilityScore = fabricInfo.breathability * 1.5;  // max 7.5
    const warmthScore = fabricInfo.warmth * 0.5;                 // max 2.5
    const durabilityScore = fabricInfo.durability * 0.5;          // max 2.5

    const sensitivityPenalty = {
      low: 0,
      medium: -1.5,
      high: -3
    }[fabricInfo.sensitivity] || 0;

    const totalScore = Math.min(10, Math.max(1, breathabilityScore + warmthScore + durabilityScore + sensitivityPenalty));

    // Determine grade
    let grade, gradeLabel;
    if (totalScore >= 8.5) {
      grade = 'A';
      gradeLabel = I18N.t('gradeA');
    } else if (totalScore >= 7) {
      grade = 'B';
      gradeLabel = I18N.t('gradeB');
    } else if (totalScore >= 5) {
      grade = 'C';
      gradeLabel = I18N.t('gradeC');
    } else {
      grade = 'D';
      gradeLabel = I18N.t('gradeD');
    }

    return {
      grade,
      gradeLabel,
      score: totalScore.toFixed(1),
      label: I18N.t('quality') + ': ' + gradeLabel
    };
  }

  // ============================================
  // Review Analysis
  // ============================================
  function scanReviews() {
    const reviewData = {
      count: 0,
      averageRating: 0,
      keywords: []
    };

    // Common review selectors on e-commerce sites
    const reviewSelectors = [
      '[class*="review"]',
      '[class*="comment"]',
      '[data-testid*="review"]',
      '.ratings',
      '[class*="rating"]'
    ];

    let allReviewText = '';

    reviewSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent || '';
          // Only get text from visible review sections
          if (text.length > 20 && text.length < 500) {
            allReviewText += ' ' + text;
          }
        });
      } catch (e) {}
    });

    // Extract star ratings
    const starMatches = allReviewText.match(/([\d.]+)\s*(?:star|yıldız)/gi);
    if (starMatches) {
      const ratings = starMatches.map(s => parseFloat(s.match(/[\d.]+/)[0])).filter(r => r <= 5 && r > 0);
      if (ratings.length > 0) {
        reviewData.averageRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
        reviewData.count = ratings.length;
      }
    }

    // Extract review count
    const countMatch = allReviewText.match(/(\d+)\s*(?:review|comment|yorum)/i);
    if (countMatch) {
      reviewData.count = parseInt(countMatch[1]) || reviewData.count;
    }

    // Common positive keywords
    const positiveKeywords = {
      en: ['soft', 'comfortable', 'quality', 'good', 'nice', 'warm', 'fit', 'great'],
      tr: ['yumuşak', 'rahat', 'kaliteli', 'iyi', 'güzel', 'sıcak', 'beden', 'harika']
    };

    // Common negative keywords
    const negativeKeywords = {
      en: ['thin', 'cheap', 'scratchy', 'poor', 'bad', 'cold'],
      tr: ['ince', 'ucuz', 'kaşıntılı', 'kötü', 'beraber', 'soğuk']
    };

    const textLower = allReviewText.toLowerCase();
    const foundPositive = positiveKeywords[I18N.currentLang].filter(k => textLower.includes(k));
    const foundNegative = negativeKeywords[I18N.currentLang].filter(k => textLower.includes(k));

    if (foundPositive.length > 0) {
      reviewData.keywords = foundPositive.slice(0, 3);
    }
    if (foundNegative.length > 0) {
      reviewData.negative = foundNegative.slice(0, 2);
    }

    return reviewData.count > 0 ? reviewData : null;
  }

  // ============================================
  // Main Scanning Logic
  // ============================================
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

    // 8. Calculate quality grade
    data.qualityGrade = calculateQualityGrade(data);

    // 9. Scan reviews
    data.reviews = scanReviews();

    return data;
  }

  function scanTemuSpecific(data) {
    const temuState = findGlobalVar('__INITIAL_STATE__');
    if (temuState) extractFromObject(temuState, data);

    const universalData = findGlobalVar('__UNIVERSAL_DATA__');
    if (universalData) extractFromObject(universalData, data);

    const goodsProperty = findGlobalVar('goodsProperty');
    if (goodsProperty) extractFromObject(goodsProperty, data);

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
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
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
    document.querySelectorAll('script').forEach(script => {
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
    document.querySelectorAll('meta[name*="material"], meta[name*="fabric"], meta[property*="material"]').forEach(meta => {
      const content = meta.getAttribute('content');
      if (content) {
        const value = extractFabricValue(content);
        if (value && !data.material) data.material = value;
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
        document.querySelectorAll(selector).forEach(el => {
          extractFromText(el.textContent || '', data);
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
          data.material = info.name[I18N.currentLang] || info.name.en;
        }
      });
    }

    // Extract season
    if (!data.season) {
      Object.entries(SEASON_KEYWORDS).forEach(([season, keywords]) => {
        const langKeywords = keywords[I18N.currentLang] || keywords.en;
        langKeywords.forEach(keyword => {
          if (text.toLowerCase().includes(keyword)) {
            if (season === 'allSeason') {
              data.season = I18N.t('allSeasons');
            } else {
              data.season = capitalizeFirstLetter(keyword);
            }
          }
        });
      });
    }

    // Extract stretch
    if (!data.stretch) {
      STRETCH_KEYWORDS.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          data.stretch = I18N.t('stretchFabric');
        }
      });
    }

    // Extract weave method
    if (!data.weave) {
      Object.entries(WEAVE_TYPES).forEach(([keyword, weaveInfo]) => {
        if (text.toLowerCase().includes(keyword)) {
          data.weave = weaveInfo.name[I18N.currentLang] || weaveInfo.name.en;
          data.weaveExplanation = weaveInfo.explanation[I18N.currentLang] || weaveInfo.explanation.en;
        }
      });
    }
  }

  function extractFabricValue(value) {
    if (!value) return null;
    const str = String(value).toLowerCase();

    for (const [keyword, info] of Object.entries(FABRIC_TYPES)) {
      if (str.includes(keyword)) {
        return info.name[I18N.currentLang] || info.name.en;
      }
    }

    return null;
  }

  function cleanFabricString(str) {
    return str.replace(/[":{}\\]/g, '').replace(/\s+/g, ' ').trim().substring(0, 100);
  }

  function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function calculateSeasonality(data) {
    if (!data.material) return;

    const fabricInfo = Object.values(FABRIC_TYPES).find(f =>
      f.name[I18N.currentLang] === data.material || f.name.en === data.material);
    if (!fabricInfo) return;

    const breathability = fabricInfo.breathability;

    if (breathability >= 4) {
      data.seasonalRating = { label: I18N.t('bestForSummer'), icon: '☀️', score: breathability };
    } else if (breathability >= 2) {
      data.seasonalRating = { label: I18N.t('allSeasons'), icon: '🌍', score: breathability };
    } else {
      data.seasonalRating = { label: I18N.t('bestForWinter'), icon: '❄️', score: breathability };
    }
  }

  function generateWarning(data) {
    if (!data.material) return;

    const fabricInfo = Object.values(FABRIC_TYPES).find(f =>
      f.name[I18N.currentLang] === data.material || f.name.en === data.material);
    if (fabricInfo && fabricInfo.warning) {
      data.warning = fabricInfo.warning[I18N.currentLang] || fabricInfo.warning.en;
      data.sensitivity = fabricInfo.sensitivity;
    }
    if (fabricInfo && fabricInfo.explanation) {
      data.explanation = fabricInfo.explanation[I18N.currentLang] || fabricInfo.explanation.en;
    }
  }

  function getProductUrl() {
    return window.location.href;
  }

  function getProductTitle() {
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
      qualityGrade: data.qualityGrade,
      warning: data.warning,
      savedAt: new Date().toISOString()
    };

    const existingIndex = favorites.findIndex(f => f.url === entry.url);
    if (existingIndex >= 0) {
      favorites[existingIndex] = entry;
    } else {
      favorites.unshift(entry);
    }

    if (favorites.length > 50) favorites.pop();

    localStorage.setItem('fabricFinder_favorites', JSON.stringify(favorites));
    return favorites.length;
  }

  // ============================================
  // Widget Rendering
  // ============================================
  function createRow(label, value, icon, className) {
    const row = document.createElement('div');
    row.className = 'fabric-finder-row' + (className ? ' ' + className : '');

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
    title.textContent = I18N.t('title');

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
      content.appendChild(createRow(I18N.t('material'), data.material));
    }
    if (data.composition) {
      content.appendChild(createRow(I18N.t('composition'), data.composition));
    }
    if (data.stretch) {
      content.appendChild(createRow(I18N.t('fabric'), data.stretch));
    }
    if (data.weave) {
      content.appendChild(createRow(I18N.t('weaving'), data.weave));
    }
    if (data.qualityGrade) {
      const gradeClass = 'grade-' + data.qualityGrade.grade.toLowerCase();
      content.appendChild(createRow(I18N.t('quality'), data.qualityGrade.gradeLabel + ' (' + data.qualityGrade.score + '/10)', null, gradeClass));
    }
    if (data.seasonalRating) {
      content.appendChild(createRow(I18N.t('bestFor'), data.seasonalRating.label, data.seasonalRating.icon));
    }

    // Weave explanation
    if (data.weaveExplanation) {
      const explainDiv = document.createElement('div');
      explainDiv.className = 'fabric-finder-explanation';
      explainDiv.textContent = 'ℹ️ ' + data.weaveExplanation;
      content.appendChild(explainDiv);
    }

    // Material explanation
    if (data.explanation) {
      const explainDiv = document.createElement('div');
      explainDiv.className = 'fabric-finder-explanation';
      explainDiv.textContent = 'ℹ️ ' + data.explanation;
      content.appendChild(explainDiv);
    }

    // Warning section
    if (data.warning) {
      const warningClass = data.sensitivity === 'high' ? 'fabric-finder-warning high-sensitivity' : 'fabric-finder-warning';
      const warningDiv = document.createElement('div');
      warningDiv.className = warningClass;
      warningDiv.textContent = '⚠️ ' + data.warning;
      content.appendChild(warningDiv);
    }

    // Reviews section
    if (data.reviews && data.reviews.count > 0) {
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'fabric-finder-reviews';
      const ratingStars = '⭐'.repeat(Math.round(parseFloat(data.reviews.averageRating)));
      reviewDiv.textContent = `${I18N.t('basedOnReviews', { count: data.reviews.count })} ${ratingStars} ${data.reviews.averageRating}`;
      if (data.reviews.keywords && data.reviews.keywords.length > 0) {
        reviewDiv.textContent += ` | ${data.reviews.keywords.join(', ')}`;
      }
      content.appendChild(reviewDiv);
    }

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'fabric-finder-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'fabric-finder-btn';
    saveBtn.textContent = I18N.t('saveToFavorites');
    saveBtn.addEventListener('click', () => {
      saveToFavorites(data);
      saveBtn.textContent = I18N.t('savedToFavorites');
      saveBtn.disabled = true;
      setTimeout(() => {
        saveBtn.textContent = I18N.t('saveToFavorites');
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

    const header = document.createElement('div');
    header.className = 'fabric-finder-header';

    const title = document.createElement('span');
    title.className = 'fabric-finder-title';
    title.textContent = I18N.t('title');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fabric-finder-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', removeWidget);

    header.appendChild(title);
    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.className = 'fabric-finder-content';

    const notFound = document.createElement('div');
    notFound.className = 'fabric-finder-not-found';
    notFound.textContent = I18N.t('notFound');

    content.appendChild(notFound);

    widget.appendChild(header);
    widget.appendChild(content);
    document.body.appendChild(widget);
  }

  function removeWidget() {
    const existing = document.getElementById('fabric-finder-widget');
    if (existing) existing.remove();
    widget = null;
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000);
  }
})();

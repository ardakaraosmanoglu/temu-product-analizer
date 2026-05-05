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
      warning: { en: 'Synthetic fabric with low breathability', tr: 'Az hava geçirgenliği' },
      pros: {
        en: ['Dayanıklı', 'Çabuk kurur', 'Kolay ütülenir', 'Ucuz'],
        tr: ['Dayanıklı', 'Çabuk kurur', 'Kolay ütülenir', 'Ucuz']
      },
      cons: {
        en: ['Az nefes alır', 'Kötü koku alır', 'Statik yapar', 'Çevre dostu değil'],
        tr: ['Az nefes alır', 'Kötü koku alır', 'Statik yapar', 'Çevre dostu değil']
      }
    },
    'cotton': {
      name: { en: 'Cotton', tr: 'Pamuk' },
      breathability: 5, warmth: 3, durability: 3,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['Nefes alır', 'Yumuşak', 'Ter emici', 'Cilt dostu', 'Doğal'],
        tr: ['Nefes alır', 'Yumuşak', 'Ter emici', 'Cilt dostu', 'Doğal']
      },
      cons: {
        en: ['Çabuk kırışır', 'Geç kurur', 'Düşük dayanım', 'Çeker'],
        tr: ['Çabuk kırışır', 'Geç kurur', 'Düşük dayanım', 'Çeker']
      }
    },
    'wool': {
      name: { en: 'Wool', tr: 'Yün' },
      breathability: 3, warmth: 5, durability: 3,
      sensitivity: 'medium',
      warning: { en: 'May irritate sensitive skin', tr: 'Hassas ciltlerde tahriş edebilir' },
      pros: {
        en: ['Sıcak tutar', 'Doğal yalıtkan', 'Nem alır', 'Kötü koku yapmaz'],
        tr: ['Sıcak tutar', 'Doğal yalıtkan', 'Nem alır', 'Kötü koku yapmaz']
      },
      cons: {
        en: ['Kaşındırabilir', 'Tüylenebilir', 'Elégi dikkatli bakım', 'Pahalı'],
        tr: ['Kaşındırabilir', 'Tüylenebilir', 'Dikkatli bakım gerekli', 'Pahalı']
      }
    },
    'silk': {
      name: { en: 'Silk', tr: 'İpek' },
      breathability: 4, warmth: 2, durability: 2,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['Lüks his', 'Sıcaklık düzenler', 'Parıltılı görünüm', 'Hafif'],
        tr: ['Lüks his', 'Sıcaklık düzenler', 'Parıltılı görünüm', 'Hafif']
      },
      cons: {
        en: ['Çok hassas', 'Pahalı', 'El dikimi gerekli', 'Statik yapar'],
        tr: ['Çok hassas', 'Pahalı', 'El dikimi gerekli', 'Statik yapar']
      }
    },
    'linen': {
      name: { en: 'Linen', tr: 'Keten' },
      breathability: 5, warmth: 2, durability: 3,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['Mükemmel nefes alır', 'Sıcak hava ideal', 'Doğal', 'Yıkandıkça yumuşar'],
        tr: ['Mükemmel nefes alır', 'Sıcak hava ideal', 'Doğal', 'Yıkandıkça yumuşar']
      },
      cons: {
        en: ['Kolay kırışır', 'Çeker', 'Sert olabilir başlangıçta'],
        tr: ['Kolay kırışır', 'Çeker', 'Başlangıçta sert olabilir']
      }
    },
    'nylon': {
      name: { en: 'Nylon', tr: 'Naylon' },
      breathability: 3, warmth: 3, durability: 5,
      sensitivity: 'medium',
      warning: { en: 'Synthetic fabric', tr: 'Sentetik kumaş' },
      pros: {
        en: ['Çok dayanıklı', 'Hafif', 'Çabuk kurur', 'Kolor tutar'],
        tr: ['Çok dayanıklı', 'Hafif', 'Çabuk kurur', 'Renk tutar']
      },
      cons: {
        en: ['Az nefes alır', 'Statik yapar', 'Sıcak tutabilir'],
        tr: ['Az nefes alır', 'Statik yapar', 'Sıcak tutabilir']
      }
    },
    'spandex': {
      name: { en: 'Spandex', tr: 'Spanks' },
      breathability: 3, warmth: 2, durability: 3,
      sensitivity: 'medium',
      warning: { en: 'Synthetic blend', tr: 'Sentetik karışım' },
      pros: {
        en: ['Yüksek esneklik', 'Forma uyum', 'Hafif', 'Hızlı kurur'],
        tr: ['Yüksek esneklik', 'Forma uyum', 'Hafif', 'Hızlı kurur']
      },
      cons: {
        en: ['Az nefes alır', 'Ter kokusu yapar', 'Bakımı zor'],
        tr: ['Az nefes alır', 'Ter kokusu yapar', 'Bakımı zor']
      }
    },
    'elastane': {
      name: { en: 'Elastane', tr: 'Elastan' },
      breathability: 3, warmth: 2, durability: 3,
      sensitivity: 'medium',
      warning: { en: 'Synthetic blend', tr: 'Sentetik karışım' },
      pros: {
        en: ['Esnek', 'Form koruyucu', 'Rahatsız etmez'],
        tr: ['Esnek', 'Form koruyucu', 'Rahatsız etmez']
      },
      cons: {
        en: ['Sentetik', 'Sıcak tutar', 'Klor zarar verir'],
        tr: ['Sentetik', 'Sıcak tutar', 'Klor zarar verir']
      }
    },
    'viscose': {
      name: { en: 'Viscose', tr: 'Viskoz' },
      breathability: 4, warmth: 2, durability: 2,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['İpek gibi yumuşak', 'Nefes alır', 'Akışkan', 'Uygun fiyat'],
        tr: ['İpek gibi yumuşak', 'Nefes alır', 'Akışkan', 'Uygun fiyat']
      },
      cons: {
        en: ['Islakken zayıf', 'Çabuk kırışır', 'Dikkatli yıkama gerekli'],
        tr: ['Islakken zayıf', 'Çabuk kırışır', 'Dikkatli yıkama gerekli']
      }
    },
    'rayon': {
      name: { en: 'Rayon', tr: 'Rayon' },
      breathability: 4, warmth: 2, durability: 2,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['İpek hissi', 'Nefes alır', 'Parlak görünüm', 'Ucuz'],
        tr: ['İpek hissi', 'Nefes alır', 'Parlak görünüm', 'Ucuz']
      },
      cons: {
        en: ['Islakken çok zayıf', 'Çabuk kırışır', 'Ömrü kısa'],
        tr: ['Islakken çok zayıf', 'Çabuk kırışır', 'Ömrü kısa']
      }
    },
    'acrylic': {
      name: { en: 'Acrylic', tr: 'Akrilik' },
      breathability: 2, warmth: 4, durability: 3,
      sensitivity: 'high',
      warning: { en: 'May irritate sensitive skin', tr: 'Cilt tahrişi yapabilir' },
      pros: {
        en: ['Yün gibi sıcak', 'Hafif', 'Makinede yıkanabilir', 'Uygun fiyat'],
        tr: ['Yün gibi sıcak', 'Hafif', 'Makinede yıkanabilir', 'Uygun fiyat']
      },
      cons: {
        en: ['Tüylenme yapar', 'Kaşındırabilir', 'Kötü koku yapar', 'Çevre dostu değil'],
        tr: ['Tüylenme yapar', 'Kaşındırabilir', 'Kötü koku yapar', 'Çevre dostu değil']
      }
    },
    'modal': {
      name: { en: 'Modal', tr: 'Modal' },
      breathability: 4, warmth: 2, durability: 3,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['Çok yumuşak', 'Nefes alır', 'Çekmez', 'Renkler solmaz'],
        tr: ['Çok yumuşak', 'Nefes alır', 'Çekmez', 'Renkler solmaz']
      },
      cons: {
        en: ['Pahalı', 'Hassas', 'Sıcak hava da sıcak'],
        tr: ['Pahalı', 'Hassas', 'Sıcak hava da sıcak']
      }
    },
    'tencel': {
      name: { en: 'Tencel', tr: 'Tencel' },
      breathability: 5, warmth: 2, durability: 4,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['Eco dostu', 'Mükemmel nefes alır', 'İpek gibi yumuşak', 'Nem yönetimi iyi'],
        tr: ['Çevre dostu', 'Mükemmel nefes alır', 'İpek gibi yumuşak', 'Nem yönetimi iyi']
      },
      cons: {
        en: ['Pahalı', 'Sınırlı seçenek', 'Bakım gerektirir'],
        tr: ['Pahalı', 'Sınırlı seçenek', 'Bakım gerektirir']
      }
    },
    'velvet': {
      name: { en: 'Velvet', tr: 'Kadife' },
      breathability: 2, warmth: 4, durability: 3,
      sensitivity: 'medium',
      warning: { en: null, tr: null },
      pros: {
        en: ['Lüks görünüm', 'Yumuşak', 'Sıcak tutar', 'Derin renkler'],
        tr: ['Lüks görünüm', 'Yumuşak', 'Sıcak tutar', 'Derin renkler']
      },
      cons: {
        en: ['Toz tutar', 'Özenli bakım gerekli', 'Az dayanıklı', 'Pahalı temizlik'],
        tr: ['Toz tutar', 'Özenli bakım gerekli', 'Az dayanıklı', 'Pahalı temizlik']
      }
    },
    'denim': {
      name: { en: 'Denim', tr: 'Kot' },
      breathability: 3, warmth: 4, durability: 5,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['Çok dayanıklı', 'Şık', 'Giyildikçe güzelleşir', 'Evrensel'],
        tr: ['Çok dayanıklı', 'Şık', 'Giyildikçe güzelleşir', 'Her ortamda giyilir']
      },
      cons: {
        en: ['Ağır', 'Geç kurur', 'Sıcak tutar', 'Çeker'],
        tr: ['Ağır', 'Geç kurur', 'Sıcak tutar', 'Çeker']
      }
    },
    'fleece': {
      name: { en: 'Fleece', tr: 'Polar' },
      breathability: 2, warmth: 5, durability: 4,
      sensitivity: 'medium',
      warning: { en: 'May trap heat', tr: 'Isı hapsedebilir' },
      pros: {
        en: ['Mükemmel sıcak tutar', 'Hafif', 'Çabuk kurur', 'Makinede yıkanabilir'],
        tr: ['Mükemmel sıcak tutar', 'Hafif', 'Çabuk kurur', 'Makinede yıkanabilir']
      },
      cons: {
        en: ['Az nefes alır', 'Statik yapar', 'Tüylenme yapar', 'Çevre dostu değil'],
        tr: ['Az nefes alır', 'Statik yapar', 'Tüylenme yapar', 'Çevre dostu değil']
      }
    },
    'satin': {
      name: { en: 'Satin', tr: 'Saten' },
      breathability: 3, warmth: 2, durability: 3,
      sensitivity: 'low',
      warning: { en: null, tr: null },
      pros: {
        en: ['Parlak görünüm', 'Yumuşak', 'Drape iyi', 'Lüks his'],
        tr: ['Parlak görünüm', 'Yumuşak', 'İyi akış', 'Lüks his']
      },
      cons: {
        en: ['Kolay kırışır', 'Kayabilir', 'Özenli bakım gerekli'],
        tr: ['Kolay kırışır', 'Kayabilir', 'Özenli bakım gerekli']
      }
    },
    'microfiber': {
      name: { en: 'Microfiber', tr: 'Mikro fiber' },
      breathability: 3, warmth: 3, durability: 4,
      sensitivity: 'medium',
      warning: { en: 'Synthetic fabric', tr: 'Sentetik kumaş' },
      pros: {
        en: ['Çok yumuşak', 'Leke tutmaz', 'Hafif', 'Dayanıklı'],
        tr: ['Çok yumuşak', 'Leke tutmaz', 'Hafif', 'Dayanıklı']
      },
      cons: {
        en: ['Az nefes alır', 'Statik yapar', 'Kötü koku yapabilir'],
        tr: ['Az nefes alır', 'Statik yapar', 'Kötü koku yapabilir']
      }
    },
    'polyamide': {
      name: { en: 'Polyamide', tr: 'Poliamid' },
      breathability: 3, warmth: 3, durability: 5,
      sensitivity: 'medium',
      warning: { en: 'Synthetic fabric', tr: 'Sentetik kumaş' },
      pros: {
        en: ['Dayanıklı', 'Esnek', 'Hafif', 'Şekil koruyucu'],
        tr: ['Dayanıklı', 'Esnek', 'Hafif', 'Şekil koruyucu']
      },
      cons: {
        en: ['Sentetik', 'Az nefes alır', 'Sıcak tutabilir'],
        tr: ['Sentetik', 'Az nefes alır', 'Sıcak tutabilir']
      }
    }
  };

  // Weave types with pros/cons
  const WEAVE_TYPES = {
    'knit': {
      name: { en: 'Knit', tr: 'Örme' },
      pros: {
        en: ['Esnek ve rahat', 'Vücuda oturur', 'Hareket özgürlüğü'],
        tr: ['Esnek ve rahat', 'Vücuda oturur', 'Hareket özgürlüğü']
      },
      cons: {
        en: ['Daha az dayanıklı', 'Şekil bozabilir', 'Tüylenme yapabilir'],
        tr: ['Daha az dayanıklı', 'Şekil bozabilir', 'Tüylenme yapabilir']
      }
    },
    'woven': {
      name: { en: 'Woven', tr: 'Dokuma' },
      pros: {
        en: ['Dayanıklı', 'Şekil korur', 'Düzgün görünüm'],
        tr: ['Dayanıklı', 'Şekil korur', 'Düzgün görünüm']
      },
      cons: {
        en: ['Az esnek', 'Daha sert', 'Sıcak tutabilir'],
        tr: ['Az esnek', 'Daha sert', 'Sıcak tutabilir']
      }
    },
    'knitted': {
      name: { en: 'Knitted', tr: 'Örme' },
      pros: {
        en: ['Esnek ve rahat', 'Vücuda oturur', 'Hareket özgürlüğü'],
        tr: ['Esnek ve rahat', 'Vücuda oturur', 'Hareket özgürlüğü']
      },
      cons: {
        en: ['Daha az dayanıklı', 'Şekil bozabilir', 'Tüylenme yapabilir'],
        tr: ['Daha az dayanıklı', 'Şekil bozabilir', 'Tüylenme yapabilir']
      }
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
      Object.entries(FABRIC_TYPES).forEach(([keyword, info]) => {
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
          data.weavePros = weaveInfo.pros[I18N.currentLang] || weaveInfo.pros.en;
          data.weaveCons = weaveInfo.cons[I18N.currentLang] || weaveInfo.cons.en;
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
    if (fabricInfo && fabricInfo.pros) {
      data.pros = fabricInfo.pros[I18N.currentLang] || fabricInfo.pros.en;
      data.cons = fabricInfo.cons[I18N.currentLang] || fabricInfo.cons.en;
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

    // Pros/Cons table
    if (data.pros || data.cons || data.weavePros || data.weaveCons) {
      const prosConsDiv = document.createElement('div');
      prosConsDiv.className = 'fabric-finder-proscons';

      if (data.pros || data.cons) {
        const title = document.createElement('div');
        title.className = 'proscons-title';
        title.textContent = data.material;
        prosConsDiv.appendChild(title);
      }

      if (data.pros && data.pros.length > 0) {
        const prosList = document.createElement('div');
        prosList.className = 'pros-list';
        data.pros.forEach(pro => {
          const item = document.createElement('div');
          item.className = 'pros-item';
          item.textContent = '+ ' + pro;
          prosList.appendChild(item);
        });
        prosConsDiv.appendChild(prosList);
      }

      if (data.cons && data.cons.length > 0) {
        const consList = document.createElement('div');
        consList.className = 'cons-list';
        data.cons.forEach(con => {
          const item = document.createElement('div');
          item.className = 'cons-item';
          item.textContent = '- ' + con;
          consList.appendChild(item);
        });
        prosConsDiv.appendChild(consList);
      }

      if (data.weavePros && data.weavePros.length > 0) {
        const weaveTitle = document.createElement('div');
        weaveTitle.className = 'proscons-title';
        weaveTitle.textContent = data.weave;
        prosConsDiv.appendChild(weaveTitle);
      }

      if (data.weavePros && data.weavePros.length > 0) {
        const prosList = document.createElement('div');
        prosList.className = 'pros-list';
        data.weavePros.forEach(pro => {
          const item = document.createElement('div');
          item.className = 'pros-item';
          item.textContent = '+ ' + pro;
          prosList.appendChild(item);
        });
        prosConsDiv.appendChild(prosList);
      }

      if (data.weaveCons && data.weaveCons.length > 0) {
        const consList = document.createElement('div');
        consList.className = 'cons-list';
        data.weaveCons.forEach(con => {
          const item = document.createElement('div');
          item.className = 'cons-item';
          item.textContent = '- ' + con;
          consList.appendChild(item);
        });
        prosConsDiv.appendChild(consList);
      }

      content.appendChild(prosConsDiv);
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

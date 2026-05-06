/**
 * Favorites Page - Full screen view with images and AI review
 */

document.addEventListener('DOMContentLoaded', function() {
  const favoritesListEl = document.getElementById('favorites-list');
  const totalCountEl = document.getElementById('total-count');
  const clearAllBtn = document.getElementById('clear-all');

  function loadFavorites() {
    chrome.storage.local.get(['favorites', 'apiKey'], (result) => {
      const favorites = result.favorites || [];
      renderFavorites(favorites, result.apiKey);
      updateStats(favorites);
    });
  }

  function updateStats(favorites) {
    totalCountEl.textContent = favorites.length;
  }

  function renderFavorites(favorites, apiKey) {
    favoritesListEl.innerHTML = '';

    if (favorites.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<div class="empty-icon">♡</div><div class="empty-title">No saved products yet</div><div class="empty-text">Save products from Temu using the extension widget to see them here</div>';
      favoritesListEl.appendChild(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'favorites-grid';
    favoritesListEl.appendChild(grid);

    favorites.forEach((fav, index) => {
      const card = createFavoriteCard(fav, index, apiKey);
      grid.appendChild(card);
    });
  }

  function createFavoriteCard(fav, index, apiKey) {
    const card = document.createElement('div');
    card.className = 'favorite-card';

    // Header with image
    const header = document.createElement('div');
    header.className = 'card-header';

    if (fav.image) {
      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = fav.image;
      img.alt = fav.title || 'Product image';
      img.onerror = function() { this.style.display = 'none'; };
      card.appendChild(img);
    }

    const headerContent = document.createElement('div');
    headerContent.className = 'card-header-content';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = fav.title || 'Unknown Product';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete';
    deleteBtn.dataset.index = index;

    headerContent.appendChild(title);
    headerContent.appendChild(deleteBtn);
    header.appendChild(headerContent);

    // Body
    const body = document.createElement('div');
    body.className = 'card-body';

    if (fav.material) {
      body.appendChild(createRow('Material', fav.material, 'material'));
    }
    if (fav.composition) {
      body.appendChild(createRow('Composition', fav.composition));
    }
    if (fav.seasonalRating) {
      body.appendChild(createRow('Season', fav.seasonalRating.label || '', 'season'));
    }
    if (fav.qualityGrade) {
      body.appendChild(createRow('Quality', fav.qualityGrade.gradeLabel || fav.qualityGrade.grade || ''));
    }
    if (fav.warning) {
      body.appendChild(createRow('Warning', '⚠️ ' + fav.warning, 'warning'));
    }

    // Meta
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const savedDate = fav.savedAt ? new Date(fav.savedAt).toLocaleDateString() : 'Unknown';

    const dateSpan = document.createElement('span');
    dateSpan.textContent = '📅 ' + savedDate;

    const linkSpan = document.createElement('span');
    const link = document.createElement('a');
    link.href = fav.url;
    link.textContent = '🔗 View URL';
    link.target = '_blank';
    link.style.cssText = 'color:inherit;text-decoration:none;';
    linkSpan.appendChild(link);

    meta.appendChild(dateSpan);
    meta.appendChild(linkSpan);
    body.appendChild(meta);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    // Show AI Review if available (generated at save time)
    console.log('[DEBUG] Checking aiReview for:', fav.title, 'aiReview:', fav.aiReview);
    if (fav.aiReview && fav.aiReview.quality) {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'ai-result';
      let html = '<table>';
      const ratings = ['quality', 'breathability', 'durability', 'comfort'];
      const labelMap = {
        quality: 'Kalite',
        breathability: 'Nefes Alanlık',
        durability: 'Dayanıklılık',
        comfort: 'Konfor'
      };
      ratings.forEach(key => {
        if (fav.aiReview[key] !== undefined) {
          const val = fav.aiReview[key];
          const stars = '⭐'.repeat(Math.round(val / 2));
          html += `<tr><td><strong>${labelMap[key] || key}</strong></td><td class="rating">${stars} ${val}/10</td></tr>`;
        }
      });
      if (fav.aiReview.for) {
        html += `<tr><td><strong>İdeal</strong></td><td class="for-item">👤 ${fav.aiReview.for}</td></tr>`;
      }
      if (fav.aiReview.pros && fav.aiReview.pros.length > 0) {
        html += `<tr><td><strong>Artılar</strong></td><td class="pros">${fav.aiReview.pros.join('<br>')}</td></tr>`;
      }
      if (fav.aiReview.cons && fav.aiReview.cons.length > 0) {
        html += `<tr><td><strong>Eksiler</strong></td><td class="cons">${fav.aiReview.cons.join('<br>')}</td></tr>`;
      }
      html += '</table>';
      resultDiv.innerHTML = html;
      body.appendChild(resultDiv); // Insert before actions (inside body)
    } else if (apiKey) {
      const aiBtn = document.createElement('button');
      aiBtn.className = 'card-btn ai-review';
      aiBtn.textContent = '🤖 AI Review';
      aiBtn.dataset.index = index;
      aiBtn.addEventListener('click', () => {
        getAiReview(fav, aiBtn, index);
      });
      actions.appendChild(aiBtn);
    }

    const openBtn = document.createElement('button');
    openBtn.className = 'card-btn open';
    openBtn.textContent = 'Open Product';
    openBtn.dataset.url = fav.url;

    const delBtn = document.createElement('button');
    delBtn.className = 'card-btn delete';
    delBtn.textContent = 'Delete';
    delBtn.dataset.index = index;

    actions.appendChild(openBtn);
    actions.appendChild(delBtn);
    body.appendChild(actions);

    card.appendChild(header);
    card.appendChild(body);

    // Events
    delBtn.addEventListener('click', () => deleteFavorite(index));
    openBtn.addEventListener('click', () => chrome.tabs.create({ url: fav.url }));

    return card;
  }

  function createRow(label, value, className) {
    const row = document.createElement('div');
    row.className = 'card-row';

    const lbl = document.createElement('span');
    lbl.className = 'card-label';
    lbl.textContent = label;

    const val = document.createElement('span');
    val.className = 'card-value' + (className ? ' ' + className : '');
    val.textContent = value;

    row.appendChild(lbl);
    row.appendChild(val);
    return row;
  }

  function deleteFavorite(index) {
    if (!confirm('Delete this saved product?')) return;
    chrome.storage.local.get(['favorites'], (result) => {
      const favorites = result.favorites || [];
      favorites.splice(index, 1);
      chrome.storage.local.set({ favorites });
      loadFavorites();
    });
  }

  async function getAiReview(fav, btn, index) {
    // Get settings including language preference
    const settings = await new Promise(resolve => {
      chrome.storage.local.get(['apiKey', 'aiModel', 'lang'], r => resolve({
        apiKey: r.apiKey,
        aiModel: r.aiModel || 'google/gemini-2.5-flash-lite',
        lang: r.lang || 'en'
      }));
    });

    if (!settings.apiKey) {
      alert('Please set your OpenRouter API key in the extension popup settings first.');
      return;
    }

    btn.textContent = '⏳...';
    btn.disabled = true;

    try {
      const langInstruction = settings.lang === 'tr'
        ? 'Respond in Turkish (Türkçe).'
        : 'Respond in English.';

      const productInfo = `Product: ${fav.title || 'Unknown'}
Material: ${fav.material || 'Unknown'}
Composition: ${fav.composition || 'Unknown'}
Quality Grade: ${fav.qualityGrade?.gradeLabel || 'N/A'}
Season Rating: ${fav.seasonalRating?.label || 'N/A'}`;

      const prompt = `Analyze this product and return JSON only:

${productInfo}

${langInstruction}

Return this exact JSON format (replace X with your assessment 1-10):
{
  "quality": X,
  "breathability": X,
  "durability": X,
  "comfort": X,
  "for": "who should buy",
  "pros": ["+ point"],
  "cons": ["- point"]
}

Return ONLY valid JSON, no explanation.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
          'HTTP-Referer': fav.url,
          'X-Title': 'Temu Product Analyzer'
        },
        body: JSON.stringify({
          model: settings.aiModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';

      // Parse JSON response
      let analysis;
      try {
        // Try to extract JSON from response (handle markdown code blocks)
        let jsonStr = aiResponse;
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
        jsonStr = jsonStr.trim();
        // Find JSON object in string
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        }
        analysis = JSON.parse(jsonStr);
      } catch (e) {
        analysis = null;
      }

      // Show result in card - replace existing or insert new
      const card = btn.closest('.favorite-card');
      let resultDiv = card.querySelector('.ai-result');
      if (resultDiv) {
        resultDiv.remove();
      }

      resultDiv = document.createElement('div');
      resultDiv.className = 'ai-result';

      if (analysis) {
        let html = '<table>';
        const ratings = ['quality', 'breathability', 'durability', 'comfort'];
        ratings.forEach(key => {
          if (analysis[key] !== undefined) {
            const val = analysis[key];
            const stars = '⭐'.repeat(Math.round(val / 2));
            html += `<tr><td><strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong></td><td class="rating">${stars} ${val}/10</td></tr>`;
          }
        });
        if (analysis.for) {
          html += `<tr><td><strong>For</strong></td><td class="for-item">👤 ${analysis.for}</td></tr>`;
        }
        if (analysis.pros && analysis.pros.length > 0) {
          html += `<tr><td><strong>Pros</strong></td><td class="pros">✓ ${analysis.pros.join(', ')}</td></tr>`;
        }
        if (analysis.cons && analysis.cons.length > 0) {
          html += `<tr><td><strong>Cons</strong></td><td class="cons">✗ ${analysis.cons.join(', ')}</td></tr>`;
        }
        html += '</table>';
        resultDiv.innerHTML = html;
      } else {
        resultDiv.innerHTML = '<pre>' + aiResponse.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
      }

      // Insert result before actions div
      const actionsDiv = card.querySelector('.card-actions');
      if (actionsDiv) {
        actionsDiv.parentNode.insertBefore(resultDiv, actionsDiv);
      } else {
        card.querySelector('.card-body').appendChild(resultDiv);
      }

      // Save AI review to storage - use URL to find correct favorite
      try {
        chrome.storage.local.get(['favorites'], (result) => {
          try {
            const favorites = result.favorites || [];
            const favIndex = favorites.findIndex(f => f.url === fav.url);
            if (favIndex !== -1) {
              favorites[favIndex].aiReview = analysis;
              favorites[favIndex].aiReviewRaw = aiResponse;
              chrome.storage.local.set({ favorites });
              // Update local fav object too
              fav.aiReview = analysis;
              fav.aiReviewRaw = aiResponse;
            }
          } catch (e) {
            console.error('Error updating favorites:', e);
          }
        });
      } catch (e) {
        console.error('Storage error:', e);
      }

      // Re-enable button
      btn.disabled = false;
      btn.textContent = '🤖 AI Review';

    } catch (error) {
      alert('AI Review Error: ' + error.message);
      btn.disabled = false;
    }
  }

  clearAllBtn.addEventListener('click', () => {
    if (confirm('Clear ALL saved products?')) {
      chrome.storage.local.set({ favorites: [] });
      loadFavorites();
    }
  });

  const toggleInfoBtn = document.getElementById('toggle-info');
  const infoBox = document.getElementById('info-box');
  if (toggleInfoBtn && infoBox) {
    toggleInfoBtn.addEventListener('click', () => {
      const isHidden = infoBox.style.display === 'none';
      infoBox.style.display = isHidden ? 'block' : 'none';
      toggleInfoBtn.textContent = isHidden ? '🔼 Info' : 'ℹ️ Info';
    });
  }

  loadFavorites();

  // Auto-refresh when AI review is generated and saved (after initial page load)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.favorites) {
      loadFavorites();
    }
  });
});

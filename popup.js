/**
 * Fabric Finder - Popup Script v3.0
 * Uses chrome.storage.local for shared storage with content script
 */

document.addEventListener('DOMContentLoaded', function() {
  const statusEl = document.getElementById('status');
  const favoritesListEl = document.getElementById('favorites-list');
  const clearAllBtn = document.getElementById('clear-all');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const countrySelect = document.getElementById('country-select');
  const langSelect = document.getElementById('lang-select');

  // Load saved settings from chrome.storage
  chrome.storage.local.get(['country', 'lang', 'apiKey', 'aiModel'], (result) => {
    const savedCountry = result.country || 'CY';
    const savedLang = result.lang || 'tr';
    const savedApiKey = result.apiKey || '';
    const savedAiModel = result.aiModel || 'google/gemini-2.5-flash-lite';
    if (countrySelect) countrySelect.value = savedCountry;
    if (langSelect) langSelect.value = savedLang;
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) apiKeyInput.value = savedApiKey;
    const aiModelInput = document.getElementById('ai-model');
    if (aiModelInput) aiModelInput.value = savedAiModel;
  });

  // Country selection handler
  if (countrySelect) {
    countrySelect.addEventListener('change', function() {
      chrome.storage.local.set({ country: this.value });
    });
  }

  // Language selection handler
  if (langSelect) {
    langSelect.addEventListener('change', function() {
      chrome.storage.local.set({ lang: this.value });
    });
  }

  // API key input handler
  const apiKeyInput = document.getElementById('api-key');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('change', function() {
      chrome.storage.local.set({ apiKey: this.value });
    });
  }

  // AI model input handler
  const aiModelInput = document.getElementById('ai-model');
  if (aiModelInput) {
    aiModelInput.addEventListener('change', function() {
      chrome.storage.local.set({ aiModel: this.value });
    });
  }

  // Check current tab and update status
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      const url = tabs[0].url || '';
      const supportedSites = ['temu.com', 'trendyol.com', 'shein.com', 'amazon.com', 'aliexpress.com'];
      const isSupported = supportedSites.some(site => url.includes(site));

      if (isSupported) {
        statusEl.textContent = 'Active on this page';
        statusEl.classList.remove('inactive');
      } else {
        statusEl.textContent = 'Navigate to a supported site';
        statusEl.classList.add('inactive');
      }
    }
  });

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById('tab-' + tabName).classList.add('active');

      if (tabName === 'favorites') {
        loadFavorites();
      }
    });
  });

  // Load favorites from chrome.storage.local
  function loadFavorites() {
    chrome.storage.local.get(['favorites'], (result) => {
      const favorites = result.favorites || [];
      const openFullBtn = document.getElementById('open-full-page');

      if (favorites.length === 0) {
        favoritesListEl.innerHTML = '';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        const iconSpan = document.createElement('div');
        iconSpan.className = 'empty-state-icon';
        iconSpan.textContent = '♡';
        const msgDiv = document.createElement('div');
        msgDiv.textContent = 'No saved products yet';
        const hintDiv = document.createElement('div');
        hintDiv.style.marginTop = '4px';
        hintDiv.style.fontSize = '10px';
        hintDiv.textContent = 'Save products from the widget to see them here';
        emptyDiv.appendChild(iconSpan);
        emptyDiv.appendChild(msgDiv);
        emptyDiv.appendChild(hintDiv);
        favoritesListEl.appendChild(emptyDiv);
        clearAllBtn.style.display = 'none';
        if (openFullBtn) openFullBtn.style.display = 'none';
        return;
      }

      clearAllBtn.style.display = 'block';
      if (openFullBtn) openFullBtn.style.display = 'block';
      favoritesListEl.innerHTML = '';

      favorites.forEach((fav, index) => {
        const item = createFavoriteItem(fav, index);
        favoritesListEl.appendChild(item);
      });
    });
  }

  // Open full favorites page
  const openFullBtn = document.getElementById('open-full-page');
  if (openFullBtn) {
    openFullBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('favorites.html') });
    });
  }

  function createFavoriteItem(fav, index) {
    const item = document.createElement('div');
    item.className = 'favorite-item';

    const title = document.createElement('div');
    title.className = 'favorite-title';
    title.textContent = fav.title || 'Unknown Product';
    title.title = fav.title || '';

    const material = document.createElement('div');
    material.className = 'favorite-material';
    material.textContent = fav.material || 'Unknown material';

    const meta = document.createElement('div');
    meta.className = 'favorite-meta';

    if (fav.seasonalRating) {
      const seasonSpan = document.createElement('span');
      seasonSpan.textContent = fav.seasonalRating.icon + ' ' + fav.seasonalRating.label;
      meta.appendChild(seasonSpan);
    }

    if (fav.composition) {
      const compSpan = document.createElement('span');
      compSpan.textContent = fav.composition;
      meta.appendChild(compSpan);
    }

    if (fav.qualityGrade && fav.qualityGrade.gradeLabel) {
      const gradeSpan = document.createElement('span');
      gradeSpan.textContent = fav.qualityGrade.gradeLabel;
      meta.appendChild(gradeSpan);
    }

    const actions = document.createElement('div');
    actions.className = 'favorite-actions';

    const openBtn = document.createElement('button');
    openBtn.className = 'favorite-btn open';
    openBtn.textContent = 'Open';
    openBtn.dataset.url = fav.url;
    openBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: fav.url });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'favorite-btn delete';
    deleteBtn.textContent = 'Remove';
    deleteBtn.dataset.index = index;
    deleteBtn.addEventListener('click', () => {
      deleteFavorite(index);
    });

    actions.appendChild(openBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(title);
    item.appendChild(material);
    item.appendChild(meta);
    item.appendChild(actions);

    return item;
  }

  function deleteFavorite(index) {
    chrome.storage.local.get(['favorites'], (result) => {
      const favorites = result.favorites || [];
      favorites.splice(index, 1);
      chrome.storage.local.set({ favorites });
      loadFavorites();
    });
  }

  // Clear all favorites
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all saved products?')) {
      chrome.storage.local.set({ favorites: [] });
      loadFavorites();
    }
  });
});

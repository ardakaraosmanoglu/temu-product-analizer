/**
 * Fabric Finder - Popup Script v2.0
 * Handles tab switching and favorites management
 */

document.addEventListener('DOMContentLoaded', function() {
  const statusEl = document.getElementById('status');
  const favoritesListEl = document.getElementById('favorites-list');
  const clearAllBtn = document.getElementById('clear-all');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

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

  // Load favorites from localStorage
  function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem('fabricFinder_favorites') || '[]');

    if (favorites.length === 0) {
      favoritesListEl.innerHTML = '';
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.innerHTML = `
        <div class="empty-state-icon">♡</div>
        <div>No saved products yet</div>
        <div style="margin-top: 4px; font-size: 10px;">Save products from the widget to see them here</div>
      `;
      favoritesListEl.appendChild(emptyDiv);
      clearAllBtn.style.display = 'none';
      return;
    }

    clearAllBtn.style.display = 'block';
    favoritesListEl.innerHTML = '';

    favorites.forEach((fav, index) => {
      const item = createFavoriteItem(fav, index);
      favoritesListEl.appendChild(item);
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
    const favorites = JSON.parse(localStorage.getItem('fabricFinder_favorites') || '[]');
    favorites.splice(index, 1);
    localStorage.setItem('fabricFinder_favorites', JSON.stringify(favorites));
    loadFavorites();
  }

  // Clear all favorites
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all saved products?')) {
      localStorage.removeItem('fabricFinder_favorites');
      loadFavorites();
    }
  });
});

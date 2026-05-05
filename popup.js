/**
 * Fabric Finder - Popup Script
 */

document.addEventListener('DOMContentLoaded', function() {
  const statusEl = document.getElementById('status');

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
});

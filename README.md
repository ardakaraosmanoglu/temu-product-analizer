# 👁️ Temu Vision

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/ardakaraosmanoglu/temu-product-analizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Shop Smarter, Not Harder.** Temu Vision is a powerful browser extension designed to help you decode e-commerce product listings, understand material quality, and make informed purchasing decisions on Temu and beyond.

### 🚀 Quick Install Guide / Hızlı Kurulum Rehberi

| 🇬🇧 English | 🇹🇷 Türkçe |
| :--- | :--- |
| 1. **Download** this repo as a ZIP & extract. | 1. Bu projeyi ZIP olarak **indirin** ve çıkartın. |
| 2. Open `chrome://extensions/` in Chrome. | 2. Chrome'da `chrome://extensions/` açın. |
| 3. Enable **Developer mode** (top right). | 3. **Geliştirici modu**nu aktif edin (sağ üst). |
| 4. Click **Load unpacked** & select `chrome-extension` folder. | 4. **Paketlenmemiş öğe yükle** diyerek `chrome-extension` klasörünü seçin. |

<sub>**Note:** For AI features, you must register on [OpenRouter](https://openrouter.ai/) and enter your API key in the extension settings.</sub>  
<sub>**Not:** AI özellikleri için OpenRouter üzerinden kayıt olarak ayarlardan API girişi sağlamalısınız.</sub>

![Project Preview](chrome-extension/temu-analizer-logo.png)

## 🌟 Why Use Temu Vision?

Have you ever wondered if that "Cotton" shirt is actually 100% cotton, or if it will shrink after the first wash? Our extension analyzes hidden data and user reviews to give you the real story behind every product.

### ✨ Key Features

*   **🔍 Automatic Fabric Detection**: Instantly identifies the material composition (Polyester, Cotton, Wool, etc.) from product descriptions and hidden metadata.
*   **⭐ Quality Grading (A-D)**: Automatically calculates a quality score based on breathability, warmth, durability, and skin sensitivity.
*   **🤖 AI Review Summaries**: Powered by **OpenRouter (Google Gemini)**, the extension scans hundreds of reviews to give you a concise table of pros and cons—specifically focusing on the fabric and fit.
*   **🌍 Country-Specific Recommendations**: Select your country (Cyprus, Turkey, Germany, USA, and more) to receive smart recommendations on whether the product is suitable for the current season in your region.
*   **⚠️ Allergy & Sensitivity Alerts**: Get notified if a fabric might irritate sensitive skin or trap too much heat.
*   **📋 Favorites & Comparison**: Save products to your personal favorites list to compare materials and quality side-by-side before you buy.
*   **🌐 Multi-Language Support**: Fully localized in **English** and **Türkçe**.

## 🛠️ Setup (Optional AI Features)

To unlock the full power of AI Review Analysis:
1.  Click the extension icon and go to the **Settings** tab.
2.  Enter your **OpenRouter API Key** (get one at [openrouter.ai](https://openrouter.ai/keys)).
3.  Choose your preferred **AI Model** (default: `google/gemini-2.5-flash-lite`).
4.  Select your **Country** for accurate seasonal advice.

## 📱 Supported Platforms

## 📱 Supported Platforms
 
 Temu Vision works seamlessly on:
 *   ✅ **Temu** (Fully Optimized)
 *   ✅ **Trendyol**
 *   ✅ **SHEIN**
 *   ✅ **Amazon** (.com, .com.tr, .de, .co.uk)
 *   ✅ **AliExpress**

## 🛡️ Privacy & Safety

We care about your data. The extension only runs on supported e-commerce sites and uses your API key only for analyzing product reviews. Read our full [Privacy Policy](chrome-extension/PRIVACY.md) for more details.

## 👨‍💻 For Developers

Built with modern web standards:
- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Platform**: Chrome Extension Manifest V3
- **AI**: OpenRouter API Integration
- **Localization**: Custom i18n system for TR/EN support

---

*Disclaimer: This extension is an independent tool and is not affiliated with, authorized, maintained, sponsored, or endorsed by Temu or any other mentioned e-commerce platform.*

# NutriScan Pro – Smart Nutrition Analyzer 🥗🔍

NutriScan Pro is an intelligent, AI-powered food nutrition analyzer and dietary assistant built for real-time camera capture and gallery uploads. It combines **Google Gemini Multimodal Vision AI** with an on-device neural classifier to accurately identify South Indian, Indian, and international dishes, distinguish food from non-food items, and retrieve comprehensive nutritional metrics.

---

## 🌟 Key Features

- **📸 Camera & Gallery Recognition:** Seamlessly analyze food photos captured live through your phone camera or uploaded from your photo gallery.
- **🛡️ Strict Food vs Non-Food Detection:** Classifies and rejects human portraits, selfies, vehicles, buildings, documents, screenshots, and objects with clear feedback.
- **🍛 South Indian & Global Cuisine Specialization:** Accurately recognizes Dosa, Masala Dosa, Idli, Sambar, Coconut Chutney, Curd Rice, Pongal, Poori, Chapati, Parotta, Chicken Biryani, Roasted Chicken, Fish Fry, Chicken 65, and worldwide dishes.
- **🍱 Multi-Item Plate Detection:** Recognizes all distinct food items present on a single plate or banana leaf (e.g., Idli + Sambar + Chutney) and computes combined meal nutrition.
- **📊 Comprehensive Nutrition Dashboard:**
  - Calories (kcal) & Energy (kJ)
  - Macronutrients: Protein, Carbohydrates, Total Fat
  - Fat Breakdown: Good Fat (Unsaturated) vs Bad Fat (Saturated)
  - Dietary Fiber, Sugar, and Sodium
  - Serving Portions: Small, Medium, and Large with automatic scaling
- **🌐 Multilingual & Accessibility:** Full Tamil and English localization with text-to-speech (TTS) voice readout.
- **📄 PDF Export & Tracker:** Export full dietary health reports and log meals into a daily tracker.

---

## 🏗️ AI & Vision Pipeline

1. **Stage 1 (Image Optimization):** Client-side intelligent canvas compression downscaling high-resolution photos for ultra-fast transport (<100KB).
2. **Stage 2 (Multimodal Vision Analysis):** High-speed model cascade (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.6-flash`) with structured JSON schema verification.
3. **Stage 3 (Food / Non-Food Rejection):** Rejects invalid images with `"Sorry! No food detected. Please upload a valid food image."`
4. **Stage 4 (Nutritional Database Mapping):** Matches detected dishes against verified nutrition datasets with customizable serving size calculations.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/gowtham75330/nutriscan-pro.git
cd nutriscan-pro

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** Get a free Google Gemini API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### Development Server

```bash
npm run dev
```

Visit `http://localhost:8080/` in your browser.

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

---

## 🔒 Security & Privacy

- Sensitive API keys are protected through environment variables and excluded via `.gitignore`.
- Image processing is performed securely with strict client-side validation.

---

## 📄 License

This project is licensed under the MIT License.

# 🛡️ NutriGuard — Personalized Food Decision System

> "Should THIS user eat THIS food?" — A disease-oriented food risk analysis system.

**NOT** a calorie tracker. NutriGuard analyzes food products against your specific health conditions (diabetes, hypertension, heart disease, kidney disease) and provides personalized risk scores, warnings, and recommendations.

---

## 🏗️ Architecture

```
food-app-V2/
├── backend/          # Express + MongoDB API
│   └── src/
│       ├── config/   # DB connection, thresholds, constants
│       ├── controllers/
│       ├── middlewares/
│       ├── models/   # User, FoodCache, ScanHistory
│       ├── routes/
│       └── services/ # AuthService, HealthProfileService,
│                     # OpenFoodFactsService, IntelligenceEngineService
│
├── mobile/           # React Native (Expo) App
│   └── src/
│       ├── api/      # Axios client with JWT
│       ├── components/
│       ├── context/  # Auth state management
│       ├── navigation/
│       ├── screens/  # 8 screens
│       └── theme/    # Colors, typography
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **MongoDB Atlas** account ([signup](https://www.mongodb.com/atlas))
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

---

### 1. Clone & Install

```bash
# Clone the repo
cd food-app-V2

# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

---

### 2. Configure Backend

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas — replace with your connection string
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/nutriguard?retryWrites=true&w=majority

# JWT secret — change this!
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Open Food Facts
OFF_BASE_URL=https://world.openfoodfacts.org
```

**Getting your MongoDB Atlas URI:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string and replace `<password>` with your password

---

### 3. Configure Mobile App

Edit `mobile/src/api/client.js`:

```js
// For physical device: use your machine's local IP
const BASE_URL = 'http://YOUR_LOCAL_IP:5000';

// For Android emulator:
const BASE_URL = 'http://10.0.2.2:5000';

// For iOS simulator:
const BASE_URL = 'http://localhost:5000';
```

Find your local IP: `hostname -I` (Linux) or `ifconfig` (Mac)

---

### 4. Start the Backend

```bash
cd backend
npm run dev    # with hot reload (nodemon)
# OR
npm start      # production
```

You should see:
```
🛡️  NutriGuard API Server
   Environment: development
   Port:        5000
   URL:         http://localhost:5000
✅ MongoDB Connected: ...
```

---

### 5. Start the Mobile App

```bash
cd mobile
npx expo start
```

- Scan the QR code with Expo Go
- Or press `a` for Android emulator / `i` for iOS simulator

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | ❌ | Create account |
| POST | `/auth/login` | ❌ | Login |
| GET | `/user/profile` | ✅ | Get user profile |
| PUT | `/user/profile` | ✅ | Update health profile |
| GET | `/food/barcode/:code` | ✅ | Lookup food by barcode |
| GET | `/food/search?q=` | ✅ | Search products |
| POST | `/analyze` | ✅ | Analyze food for user |
| GET | `/analyze/history` | ✅ | Get scan history |

---

## 🧠 Intelligence Engine

The core of NutriGuard. A **rule-based** (no ML) engine that:

1. **Resolves thresholds** — picks strictest limits across all user diseases
2. **Scores nutrients** — 0 (safe), 1 (moderate), 2 (high risk)
3. **Applies weights** — sugar is 2× for diabetes, sodium 2× for hypertension, etc.
4. **Detects additives** — checks against blacklist of harmful E-numbers
5. **Aggregates risk** — normalized 0-100 score → SAFE / MODERATE / HIGH RISK
6. **Generates output** — recommendations, warnings, and explanations

### Example:

**Nutella (56g sugar/100g) + Diabetic user:**
- Sugar score: HIGH RISK (limit is 12g for diabetes)
- Sugar weight: 2× (diabetes amplifier)
- Result: **HIGH RISK** (score ~78/100)
- Warning: "High sugar (56.3g/100g) — not suitable for diabetes"

**Same product + Healthy user:**
- Sugar score: HIGH RISK (limit is 22.5g for healthy)
- Sugar weight: 1× (no amplification)
- Result: **MODERATE** (score ~45/100)

---

## 📱 App Screens

1. **Login / Signup** — Email + password auth
2. **Profile Setup** — 3-step: body metrics → diseases → diet
3. **Home** — Scan button + search + recent scans
4. **Scanner** — Camera barcode scanning
5. **Result** ⭐ — Risk level, explanation, recommendations, warnings
6. **Profile Edit** — Update health conditions
7. **History** — Past scan results

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt |
| Mobile | React Native (Expo SDK 52) |
| Navigation | React Navigation 7 |
| Scanner | expo-camera |
| Food Data | Open Food Facts API v2 |
| HTTP | Axios |

---

## 📝 License

MIT

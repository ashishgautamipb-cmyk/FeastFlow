# 🍔 FeastFlow — Gourmet Food Delivery & AI Restaurant Platform

<p align="center"><strong>An enterprise-grade, modern MERN food delivery and restaurant network combining Google Gemini AI intent discovery, real-time GPS routing, role-based workflows (Customer, Restaurant Owner, Delivery Partner), verified payments, and transactional notifications.</strong></p>

<p align="center">
  <strong>Brand: FeastFlow</strong> ·
  <a href="https://github.com/duttasirius/vingo-Food-Delivery">💻 Source Repository</a> ·
  <strong>Development Branch: dev</strong>
</p>

---

## ⚡ Architecture & Tech Stack

| Domain | Technology / Library |
|---|---|
| 🖥️ **Frontend** | React 19, Vite 7, Tailwind CSS v4, React Router 7, Redux Toolkit |
| 🧠 **AI Search** | Google Gemini (Gemini 2.5 Flash) + Deterministic Catalog Fallback |
| ⚙️ **Backend** | Node.js, Express 5, RESTful API Architecture |
| 🗄️ **Database** | MongoDB & Mongoose (GeoJSON 2dsphere indexing) |
| 🔐 **Authentication** | JWT (HTTP-only cookies), Google OAuth (Firebase Auth), Bcrypt password hashing, OTP reset |
| 📍 **Maps & Geolocation** | Leaflet, React Leaflet, Geoapify API, Geolocation API |
| 🔄 **Realtime Engine** | Socket.IO (live orders, dispatch broadcasting, status sync) |
| 💳 **Payments** | Razorpay (Prepaid UPI/Cards/Netbanking) + Cash on Delivery (COD) |
| ☁️ **Media Cloud** | Cloudinary (Multi-part upload with Multer disk cleanup) |
| ✉️ **Transactional Mail** | Nodemailer (HTML OTPs for password recovery & safe delivery handoff) |

---

## 🚀 Key Platform Features

```text
Discovery & AI Chat → Restaurant Menu → Cart Management → Geocoded Checkout → Payment → Kitchen Queue → Rider Dispatch → Live GPS Tracking → OTP Handover
```

### 1. 🤖 AI-Powered Food Discovery
- Conversational food assistant widget available across the application.
- Powered by **Google Gemini 2.5 Flash** with strict catalog-grounded prompts.
- **Fail-Safe Fallback:** If Gemini is unreachable or unconfigured, the deterministic scoring engine computes keyword, synonym, and fuzzy matches against MongoDB.

### 2. 🏪 Three-Sided Role Ecosystem
- **Customer:**
  - Dynamic city discovery with auto-geocoding.
  - Dietary filtering (Pure Veg & Non-Veg FSSAI badges).
  - Redux cart with real-time bill calculations (subtotal, delivery fee waiver thresholds, platform fees).
  - Live order tracking with progress bar and map route.
- **Restaurant Owner:**
  - Storefront onboarding with cover photo upload.
  - Menu catalog management with instant dish add/edit/delete.
  - Interactive Kitchen Display System (KDS) order queue with 1-click status transitions (`Pending` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered`).
- **Delivery Partner:**
  - Real-time order dispatch feed with earnings per trip.
  - Live GPS route navigation between restaurant, rider, and customer.
  - Tamper-evident delivery verification with 4-digit customer OTP.

---

## 🔑 Environment Variables Setup

Both backend and frontend contain pre-configured `.env` files and `.env.example` templates.

### Backend (`/backend/.env`)
Create `/backend/.env` with the following variables:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URL=mongodb://localhost:27017/feastflow
JWT_SECRET=feastflow_jwt_secret_key_change_in_production_2026

# Cloudinary (Restaurant & Food Dish Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Nodemailer / Email Service (OTP verification emails)
EMAIL=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Google Gemini AI (Smart food search)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### Frontend (`/frontend/.env`)
Create `/frontend/.env` with the following variables:

```env
VITE_SERVER_URL=http://localhost:5000
VITE_GEOAPIKEY=your_geoapify_key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id

# Firebase Google Authentication
VITE_FIREBASE_APIKEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📦 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone -b dev https://github.com/duttasirius/vingo-Food-Delivery.git
cd vingo-Food-Delivery

# Setup Backend
cd backend
npm install
npm run dev

# Setup Frontend (in a separate terminal)
cd ../frontend
npm install
npm run dev
```

### 2. Access the Application
- **Frontend:** 
- **Backend API:**
- **Backend Health Check:** 

---

## 🛡️ License & Trademarks
All rights reserved © 2026 FeastFlow Inc.

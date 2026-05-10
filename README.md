# Chrica CMS & Engine

A high-performance manuscript management system and digital storefront.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker (optional, for containerization)
- A Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd chrica-cms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the result.

### 🐳 Running with Docker

To run the production-ready container:

```bash
docker-compose up --build
```

The app will be available at `http://localhost:3000`.

## 🛠 Features

- **MANUSCRIPT MESH**: Modular content blocks with real-time editing.
- **AI ENGINE**: Automated ingestion and metadata extraction.
- **AD TARGETING**: Category-aware advertisement serving for deep engagement.
- **API MONITORING**: Real-time status tracking for backend microservices.

## 🔒 Security

This project uses Firebase Security Rules to protect your data. Ensure you deploy the `firestore.rules` file to your Firebase console before going live.

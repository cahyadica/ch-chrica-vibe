
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
  console.log("Checking Posts...");
  const postSnap = await getDocs(collection(db, "posts"));
  console.log(`Found ${postSnap.size} posts.`);
  postSnap.forEach(doc => {
    console.log(`- ${doc.data().title} (${doc.data().category})`);
  });

  console.log("\nChecking Categories...");
  const catSnap = await getDocs(collection(db, "categories"));
  console.log(`Found ${catSnap.size} categories.`);
  catSnap.forEach(doc => {
    console.log(`- ${doc.data().name}`);
  });
}

checkData().catch(console.error);

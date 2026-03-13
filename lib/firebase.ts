import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyClr8lTqrxktycHfhByWgQ2gmDJr61WWy8",
  authDomain: "legolineup.firebaseapp.com",
  projectId: "legolineup",
  storageBucket: "legolineup.firebasestorage.app",
  messagingSenderId: "128608708645",
  appId: "1:128608708645:web:c6957a8c873229a6e2b7cc"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

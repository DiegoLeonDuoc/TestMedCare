import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { setLogLevel } from "https://esm.sh/firebase/firestore"; // For debugging

const firebaseConfig = {
    apiKey: "AIzaSyC9yqipXCN_ALWZFrFUaBbMG4LznCgt4MM", // Replace with your actual config
    authDomain: "medcare-app-9678b.firebaseapp.com",
    projectId: "medcare-app-9678b",
    storageBucket: "medcare-app-9678b.firebasestorage.app",
    messagingSenderId: "805339182842",
    appId: "1:805339182842:web:c4bab764c2c8b40527bb43",
    measurementId: "G-L8444GNX38" // Optional
};

// This is the custom application ID used for Firestore paths, NOT the Firebase appId
export const customAppId = 'medcare-app-9678b';

let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // setLogLevel('debug'); // For Firestore debugging
    console.log("Firebase initialized successfully.");
} catch (e) {
    console.error("Error initializing Firebase:", e);
    if (!db) {
        console.warn("Firestore (db) is not initialized. App may run with mock data and limited persistence.");
    }
    // Ensure auth and db are explicitly undefined or null if initialization fails
    auth = undefined;
    db = undefined;
}

export { app, auth, db };

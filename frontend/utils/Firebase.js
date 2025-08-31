import {getAuth, GoogleAuthProvider} from "firebase/auth"
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "ecommerceonecart-4f642.firebaseapp.com",
  projectId: "ecommerceonecart-4f642",
  storageBucket: "ecommerceonecart-4f642.firebasestorage.app",
  messagingSenderId: "641694950334",
  appId: "1:641694950334:web:50e59ffb7864093af94fef"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app)
const provider = new GoogleAuthProvider()


export {auth , provider}

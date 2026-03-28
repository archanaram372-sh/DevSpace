import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNNNA9Uh9OUkagwoNO0QLkS_VUvF8T30E",
  authDomain: "devspace-3c65a.firebaseapp.com",
  projectId: "devspace-3c65a",
  storageBucket: "devspace-3c65a.firebasestorage.app",
  messagingSenderId: "622604950319",
  appId: "1:622604950319:web:f13243b7635e42c6ba5fda",
  measurementId: "G-SGHJ6SV4B0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
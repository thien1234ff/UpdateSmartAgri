import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyA6WyGsOeOlct2BcOeQSZ6ogo2aGUa_MyQ",
  authDomain: "nongnghiepxanh-f6689.firebaseapp.com",
  projectId: "nongnghiepxanh-f6689",
  storageBucket: "nongnghiepxanh-f6689.appspot.com",
  messagingSenderId: "846834085038",
  appId: "1:846834085038:web:cfac519e025896626d113f",
  measurementId: "G-619BFYRKGT"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

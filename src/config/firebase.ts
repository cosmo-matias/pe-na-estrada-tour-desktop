import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Configurações do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAiPPHK06XNgBKruXH8veC7tDx0SSr6PY8",
  authDomain: "pe-na-estrada-tour.firebaseapp.com",
  projectId: "pe-na-estrada-tour",
  storageBucket: "pe-na-estrada-tour.firebasestorage.app",
  messagingSenderId: "814607424540",
  appId: "1:814607424540:web:2866f25c94627d21b6d3d9"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Lista de e-mails com permissão de acesso administrativo
export const EMAILS_AUTORIZADOS = ['ducosmotdl@gmail.com']

export default app

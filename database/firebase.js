import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Tambahan import Auth

// Mengambil config dari Environment Variables Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debugging Config (Bisa dihapus nanti)
if (!firebaseConfig.apiKey) {
  console.error("🔥 Firebase Config Error: API Key tidak terbaca dari .env!");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Init Auth

window.adminDB = window.adminDB || {};
window.firebaseAuth = auth; // Simpan Auth ke window agar bisa diakses file lain

Object.assign(window.adminDB, {
  // 1. Listen Data Realtime
  listenList: (colName, callback) => {
    // Return unsubscribe function biar rapi memory leak
    return onSnapshot(collection(db, colName), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(data);
    }, (error) => {
      console.error("Error fetching data:", error.message);
    });
  },

  // 2. Cek Eksistensi ID
  checkExists: async (col, id) => {
    const docSnap = await getDoc(doc(db, col, id));
    return docSnap.exists();
  },

  // 3. Simpan/Update Data
  saveWithId: async (col, id, data) => {
    try {
      await setDoc(doc(db, col, id), data, { merge: true });
    } catch (error) {
      throw new Error("Gagal menyimpan ke Database: " + error.message);
    }
  },

  // 4. Hapus Dokumen
  delete: async (col, id) => {
    try {
      await deleteDoc(doc(db, col, id));
    } catch (error) {
      throw new Error("Gagal menghapus dari Database: " + error.message);
    }
  },
});
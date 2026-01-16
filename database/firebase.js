import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Mengambil config dari Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.adminDB = window.adminDB || {};

Object.assign(window.adminDB, {
  // 1. Listen Data Realtime (Berita/Dokumentasi)
  listenList: (colName, callback) => {
    onSnapshot(collection(db, colName), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(data);
    });
  },

  // 2. Cek Eksistensi ID
  checkExists: async (col, id) => {
    const docSnap = await getDoc(doc(db, col, id));
    return docSnap.exists();
  },

  // 3. Simpan/Update Data (Termasuk field gdrive)
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
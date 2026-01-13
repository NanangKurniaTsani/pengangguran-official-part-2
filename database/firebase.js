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

// --- CONFIG FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyC-icrsoC6U2yYMLD4Ac1EpApJNtXdFW6I",
  authDomain: "btmfilkomunucirebon-acd50.firebaseapp.com",
  projectId: "btmfilkomunucirebon-acd50",
  appId: "1:711860527628:web:b62fc4bcf1c77672e54429",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.adminDB = window.adminDB || {};

Object.assign(window.adminDB, {
  // 1. Listen Data Realtime
  listenList: (colName, callback) => {
    onSnapshot(collection(db, colName), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(data);
    });
  },

  // 2. Cek Apakah ID Sudah Ada (Untuk Validasi)
  checkExists: async (col, id) => {
    const docSnap = await getDoc(doc(db, col, id));
    return docSnap.exists();
  },

  // 3. Simpan Data (Merge)
  saveWithId: async (col, id, data) => {
    try {
      await setDoc(doc(db, col, id), data, { merge: true });
    } catch (error) {
      throw new Error("Gagal menyimpan ke Database: " + error.message);
    }
  },

  // 4. Hapus Data
  delete: async (col, id) => {
    try {
      await deleteDoc(doc(db, col, id));
    } catch (error) {
      throw new Error("Gagal menghapus dari Database: " + error.message);
    }
  },
});

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-icrsoC6U2yYMLD4Ac1EpApJNtXdFW6I",
  authDomain: "btmfilkomunucirebon-acd50.firebaseapp.com",
  projectId: "btmfilkomunucirebon-acd50",
  storageBucket: "btmfilkomunucirebon-acd50.firebasestorage.app",
  messagingSenderId: "711860527628",
  appId: "1:711860527628:web:b62fc4bcf1c77672e54429"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const pengurus = [
  // --- BPH ---
  { id: "fajar-ardiansyah", nama: "Fajar Ardiansyah", departemen: "BPH", jabatan: "Ketua Umum" },
  { id: "muhammad-cahaya-mentari", nama: "Muhammad Cahaya Mentari", departemen: "BPH", jabatan: "Wakil Ketua Umum" },
  { id: "saskia-arrahma", nama: "Saskia Arrahma", departemen: "BPH", jabatan: "Sekretaris Umum" },
  { id: "bagus-imannudin", nama: "Bagus Imannudin", departemen: "BPH", jabatan: "Bendahara Umum" },
  { id: "piona-rohmatul-ajijah", nama: "Piona Rohmatul Ajijah", departemen: "BPH", jabatan: "Wakil Bendahara Umum" },

  // --- DEPARTEMEN PI ---
  { id: "faqih-ahmad-fawaiz", nama: "Faqih Ahmad Fawaiz", departemen: "PI", jabatan: "Koordinator" },
  { id: "renaldi-gempar-caepudin", nama: "Renaldi Gempar Caepudin", departemen: "PI", jabatan: "Sekretaris" },
  { id: "abdul-madjid-haqie", nama: "Abdul Madjid Haqie", departemen: "PI", jabatan: "Anggota" },
  { id: "rohmat-habibullah-mustofa", nama: "Rohmat Habibullah Mustofa", departemen: "PI", jabatan: "Anggota" },
  { id: "haekal-wibiyansyah", nama: "Haekal Wibiyansyah", departemen: "PI", jabatan: "Anggota" },

  // --- DEPARTEMEN PJK ---
  { id: "sandi-idwan", nama: "Sandi Idwan", departemen: "PJK", jabatan: "Koordinator" },
  { id: "alip-agus-taptiana", nama: "Alip Agus Taptiana", departemen: "PJK", jabatan: "Sekretaris" },
  { id: "jagat-nasution", nama: "Jagat Nasution", departemen: "PJK", jabatan: "Anggota" },
  { id: "frea-iollana", nama: "Frea Iollana", departemen: "PJK", jabatan: "Anggota" },
  { id: "muhammad-agna-aqil", nama: "Muhammad Agna Aqil", departemen: "PJK", jabatan: "Anggota" },

  // --- DEPARTEMEN HUMAS ---
  { id: "sahrul-ramdhani", nama: "Sahrul Ramdhani", departemen: "Humas", jabatan: "Koordinator" },
  { id: "aliyah-nurfazidah", nama: "Aliyah Nurfazidah", departemen: "Humas", jabatan: "Sekretaris" },
  { id: "hisyam-majdy-farid", nama: "Hisyam Majdy Farid", departemen: "Humas", jabatan: "Anggota" },
  { id: "nanang-kurnia-tsani", nama: "Nanang Kurnia Tsani", departemen: "Humas", jabatan: "Anggota" },
  { id: "rio-fernando", nama: "Rio Fernando", departemen: "Humas", jabatan: "Anggota" },

  // --- DEPARTEMEN PO ---
  { id: "ridho-fauzi-nata", nama: "Ridho Fauzi Nata", departemen: "PO", jabatan: "Koordinator" },
  { id: "rahima-maulidya", nama: "Rahima Maulidya", departemen: "PO", jabatan: "Sekretaris" },
  { id: "bima-prasetia", nama: "Bima Prasetia", departemen: "PO", jabatan: "Anggota" },
  { id: "dendi-permana", nama: "Dendi Permana", departemen: "PO", jabatan: "Anggota" },
  { id: "muhammad-aggi-fadillah", nama: "Muhammad Aggi Fadillah", departemen: "PO", jabatan: "Anggota" },

  // --- DEPARTEMEN SB ---
  { id: "muhammad-khoirul", nama: "Muhammad Khoirul", departemen: "SB", jabatan: "Koordinator" },
  { id: "amalia-isfarayinni", nama: "Amalia Isfarayinni", departemen: "SB", jabatan: "Sekretaris" },
  { id: "karina-syach-putri", nama: "Karina Syach Putri", departemen: "SB", jabatan: "Anggota" },
  { id: "arya-pamungkas", nama: "Arya Pamungkas", departemen: "SB", jabatan: "Anggota" },
  { id: "alip-ramadan", nama: "Alip Ramadan", departemen: "SB", jabatan: "Anggota" }
];

const departemen = [
  { id: "BPH", nama: "Badan Pengurus Harian", tugas: "Mengatur jalannya administrasi, keuangan, dan koordinasi internal seluruh departemen di BTM FILKOM." },
  { id: "PI", nama: "Pers & Informasi", tugas: "Mengelola informasi dan komunikasi internal serta eksternal organisasi, termasuk publikasi berita dan media sosial." },
  { id: "PJK", nama: "Perluasan Jaringan & Kerjasama", tugas: "Membangun dan memelihara hubungan dengan pihak eksternal, institusi, dan mitra strategis." },
  { id: "Humas", nama: "Hubungan Masyarakat", tugas: "Membangun citra positif organisasi melalui komunikasi eksternal dan hubungan media." },
  { id: "PO", nama: "Pemuda dan Olahraga", tugas: "Mengorganisir kegiatan kepemudaan dan olahraga bagi anggota BTM FILKOM." },
  { id: "SB", nama: "Seni dan Budaya", tugas: "Mengembangkan dan melestarikan seni dan budaya melalui berbagai kegiatan kreatif." }
];

async function runSeeder() {
  try {
    console.log("Memproses data ke Firestore...");

    // Upload Data Pengurus
    for (const p of pengurus) {
      const { id, ...payload } = p;
      await setDoc(doc(db, "pengurus", id), {
        ...payload,
        foto: "",
        updatedAt: new Date().toISOString()
      });
    }
    console.log("✅ 30 Data Pengurus berhasil dibuat.");

    // Upload Data Departemen
    for (const d of departemen) {
      const { id, ...payload } = d;
      await setDoc(doc(db, "departemen_data", id), {
        ...payload,
        updatedAt: new Date().toISOString()
      });
    }
    console.log("✅ 6 Data Departemen berhasil dibuat.");

    console.log("\nSukses! Semua ID menggunakan nama lengkap.");
    process.exit();
  } catch (err) {
    console.error("Gagal:", err);
    process.exit(1);
  }
}

runSeeder();
# 🚀 Panduan Developer Filkomers

**Halo, devFilkomers!** 👋

Selamat datang di dapur kodingan ini. Kalau kamu baca file ini, berarti tongkat estafet sekarang ada di tangan kamu. Dokumen ini dibuat biar kamu **nggak pusing** saat mau *maintenance* atau update sistem.

Project ini pakai **Firebase** (Auth) dan **Supabase** (Database). Simak panduannya pelan-pelan ya!

---

## 📋 Daftar Isi
1. [Setup Kunci Rahasia (.env)](#1-setup-kunci-rahasia-env)
2. [Logic Login Admin (PENTING)](#2-logic-login-admin-penting)
3. [Tutorial Ganti Password/Kabinet](#3-tutorial-ganti-passwordkabinet)

---

## 1. Setup Kunci Rahasia (.env)

⚠️ **PENTING:** Saat kamu download (clone) project ini dari GitHub, file `.env` **TIDAK AKAN ADA** (karena demi keamanan, file itu tidak di-upload).

Kamu **WAJIB** membuat file baru bernama `.env` di folder paling luar (root), lalu isi dengan kredensial di bawah ini (minta value aslinya ke kating/pengurus sebelumnya):

```env
# Firebase Config
VITE_FIREBASE_API_KEY=MINTA_KE_ADMIN_LAMA_JANGAN_DIKOSONGIN
VITE_FIREBASE_AUTH_DOMAIN=btmfilkomunucirebon-acd50.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=btmfilkomunucirebon-acd50
VITE_FIREBASE_APP_ID=1:711860527628:web:b62fc4bcf1c77672e54429

# Supabase Config
VITE_SUPABASE_URL=[https://sxunwemosiaiodlgdkuo.supabase.co](https://sxunwemosiaiodlgdkuo.supabase.co)
VITE_SUPABASE_KEY=MINTA_KEY_SUPABASE_KE_ADMIN_LAMA
```
*tanpa file ini, website gak akan bisa jalan.*

## 2. Logic Login Admin (PENTING)

Kita **TIDAK** menggunakan password biasa. Password admin di-generate otomatis berdasarkan NIM.

Saat kamu menambah admin baru di [Firebase Console](https://console.firebase.google.com/):
1. Masukkan Email.
2. **Password HARUS mengikuti rumus ini:**

> **RUMUS:** `PREFIX` + `@` + `NIM` + `SUFFIX`

**Contoh Kasus:**
* **Prefix (Tetap):** `BTMFILKOM`
* **NIM Admin:** `nimadmin`
* **Suffix (Nama Kabinet):** `#kabinetbaru`

Maka Password di Firebase: `BTMFILKOM@nimadmin#kabinetbaru`

---

## 3. Tutorial Ganti Password/Kabinet

*"Bro, ganti periode nih! Nama kabinet baru, suffix password harus ganti dong?"*

Betul! Kamu harus update **SUFFIX**.

**Caranya gampang (Gak perlu buka web converter):**

1. Buka browser -> Klik Kanan -> **Inspect** -> Tab **Console**.
2. **Copy-Paste** script "Generator" ini ke Console & tekan Enter:

```javascript
// --- SCRIPT GENERATOR HEX FILKOMERS ---
function buatHex(text) {
    let hasil = "";
    for (let i = 0; i < text.length; i++) {
        hasil += "\\x" + text.charCodeAt(i).toString(16).toUpperCase();
    }
    console.log(`%cHasil Hex untuk "${text}":`, "color: green; font-weight: bold;");
    console.log(`"${hasil}"`);
    return hasil;
}

buatHex("#contohkabinetBaru");
```
3. **Copy hasilnya** *(Misal: "\x23\b26\x61...").*
4. Buka Code (file login.html), cari variabel _0x4f2a (bagian suffix/paling bawah), lalu Paste kode baru tersebut di sana yang kalian ganti.

---

## 📜 Warisan & Credits
Panduan dan sistem ini adalah warisan dan dedikasi dari :

<div align="center">
  <img src="./images/logo-kabinet.png" width="120" alt="Logo Nawasena Pradipta" style="margin-bottom: 10px;">
  
  <h3>
    Kabinet 
    <span style="color: #CC3625;">Nawasena</span> 
    <span style="color: #ED8921;">Pradipta</span>
  </h3>
  
  <p><em>Sengaja kami buat terdokumentasi rapi biar kalian yang melanjutkan perjuangan ini nggak kebingungan.<br>
  Kalau ada error atau bingung soal logic, silakan cek <strong>Contributors</strong> atau tanya ke demisioner tahun periode 25/26.</em></p>
  
  <br>
  <p>🔥 <strong>Estafet perjuangan tidak boleh berhenti. Teruskan semangat ini, Filkomers!</strong> 🔥</p>
</div>

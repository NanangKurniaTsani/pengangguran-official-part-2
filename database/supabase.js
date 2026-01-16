import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

window.adminDB = window.adminDB || {};

// 1. UPLOAD FILE KE SUPABASE STORAGE
window.adminDB.uploadFile = async (file, bucketName, fullPath) => {
    if (!file) return null;
    try {
        const ext = file.name.split('.').pop();
        const fileName = `${fullPath}.${ext}`;

        // Upsert true agar menimpa file lama dengan ID yang sama
        const { error } = await supabase.storage.from(bucketName).upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        });

        if (error) throw error;

        const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        // Tambahkan timestamp (?t=...) untuk menghindari caching browser saat gambar diupdate
        return `${data.publicUrl}?t=${Date.now()}`;

    } catch (error) {
        throw new Error("Gagal Upload: " + error.message);
    }
};

// 2. DELETE FILE (Pembersih saat data dihapus/diupdate)
window.adminDB.deleteFile = async (bucketName, publicUrl) => {
    if (!publicUrl) return;
    
    // Keamanan: Hanya hapus jika URL berasal dari supabase kita
    if (!publicUrl.includes("supabase.co")) return;

    try {
        // Ekstrak path file dari URL publik
        const path = publicUrl.split(`${bucketName}/`)[1].split('?')[0];

        if (path) {
            const { error } = await supabase.storage.from(bucketName).remove([path]);
            if (error) throw error;
            console.log("✅ File fisik berhasil dihapus dari storage");
        }
    } catch (error) {
        console.warn("⚠️ File tidak ditemukan atau gagal dihapus:", error.message);
    }
};
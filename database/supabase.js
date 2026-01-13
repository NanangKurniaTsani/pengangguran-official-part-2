import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- CONFIG SUPABASE ---
const SUPABASE_URL = "https://sxunwemosiaiodlgdkuo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW53ZW1vc2lhaW9kbGdka3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzY1MDYsImV4cCI6MjA4MzYxMjUwNn0.UL6L7AjHgNve9SxDpjDJJrNh925uEYSaIztNML6BYgU"; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

window.adminDB = window.adminDB || {};

// 1. Upload File
window.adminDB.uploadFile = async (file, bucketName, fullPath) => {
    if (!file) return null;
    try {
        const ext = file.name.split('.').pop();
        const fileName = `${fullPath}.${ext}`;

        // Upsert = True (Timpa file lama jika nama sama)
        const { error } = await supabase.storage.from(bucketName).upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        });

        if (error) throw error;

        const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        return `${data.publicUrl}?t=${Date.now()}`;

    } catch (error) {
        throw new Error("Gagal Upload: " + error.message);
    }
};

// 2. HAPUS FILE (PEMBERSIH SAMPAH)
window.adminDB.deleteFile = async (bucketName, publicUrl) => {
    if (!publicUrl) return;
    
    // Cek dulu, kalau bukan link supabase (misal link avatar default), jangan dihapus
    if (!publicUrl.includes("supabase.co")) return;

    try {
        console.log("🗑️ Menghapus file fisik:", publicUrl);

        // URL: https://.../storage/v1/object/public/bucket-name/folder/file.jpg
        // Kita potong url biar sisa: folder/file.jpg
        const path = publicUrl.split(`${bucketName}/`)[1].split('?')[0];

        if (path) {
            const { error } = await supabase.storage.from(bucketName).remove([path]);
            if (error) throw error;
            console.log("✅ File Storage Bersih!");
        }
    } catch (error) {
        console.warn("⚠️ Gagal hapus file (Mungkin sudah hilang):", error.message);
    }
};
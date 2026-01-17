import Swal from 'sweetalert2';
import { onAuthStateChanged } from "firebase/auth";

// --- LOGIKA GENERATE ID OTOMATIS ---
function generateSequentialID(prefix, allData) {
    const now = new Date();
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    let maxNo = 0;
    const relevantData = allData.filter(item => item.id && item.id.startsWith(`${prefix}_`));

    relevantData.forEach(item => {
        const parts = item.id.split('_');
        const lastPart = parts[parts.length - 1];
        const no = parseInt(lastPart);
        if (!isNaN(no) && no > maxNo) maxNo = no;
    });

    const nextNo = String(maxNo + 1).padStart(4, '0');
    return `${prefix}_${dateCode}_${nextNo}`;
}

// --- HAPUS DATA + FOTO ---
window.hapusItem = async function (id) {
    const item = window.currentData.find(x => x.id === id);
    if (!item) return;

    const result = await Swal.fire({
        title: 'Hapus Publikasi?',
        text: "Data & Foto akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!'
    });

    if (!result.isConfirmed) return;

    try {
        Swal.fire({ title: 'Membersihkan...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
        const koleksi = document.getElementById("inp-kategori").value || "berita";
        const bucket = koleksi === "berita" ? "berita-images" : "dokumentasi-images";

        if (item.img) await window.adminDB.deleteFile(bucket, item.img);
        await window.adminDB.delete(koleksi, id);

        Swal.fire({ title: 'Bersih!', icon: 'success', timer: 1000, showConfirmButton: false });
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    }
};

// --- EDIT DATA ---
window.editItem = function (id) {
    const item = window.currentData.find(x => x.id === id);
    if (!item) return;

    document.getElementById("data-id").value = item.id;
    document.getElementById("inp-judul").value = item.judul;
    document.getElementById("inp-date").value = item.tanggal;
    document.getElementById("inp-desc").value = item.deskripsi || "";
    document.getElementById("inp-img-url").value = item.img || "";

    // GDrive field
    const inpGDrive = document.getElementById("inp-gdrive");
    const containerGDrive = document.getElementById("container-gdrive");
    if (inpGDrive) inpGDrive.value = item.gdrive || "";

    if (item.kategori === "dokumentasi" && containerGDrive) {
        containerGDrive.classList.remove("hidden");
    } else if (containerGDrive) {
        containerGDrive.classList.add("hidden");
    }

    if (item.img) {
        document.getElementById("img-preview").src = item.img;
        document.getElementById("preview-container").classList.remove("hidden");
        document.getElementById("upload-placeholder").classList.add("hidden");
    }

    const btn = document.getElementById("btn-submit");
    btn.innerText = "UPDATE DATA";
    btn.classList.replace("bg-slate-900", "bg-blue-600");
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- MAIN LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    window.currentData = [];
    const dateInput = document.getElementById("inp-date");
    if (dateInput) dateInput.valueAsDate = new Date();

    const kategoriSelect = document.getElementById("inp-kategori");
    const labelKoleksi = document.getElementById("lbl-koleksi");
    const inpFile = document.getElementById("inp-file");
    const form = document.getElementById("form-publikasi");
    const containerGDrive = document.getElementById("container-gdrive");
    const inpGDrive = document.getElementById("inp-gdrive");

    // --- FIX START: Menunggu Firebase Auth ---
    const checkDB = setInterval(() => {
        if (window.adminDB && window.firebaseAuth) {
            clearInterval(checkDB);
            
            onAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    console.log("✅ Auth OK. Mengambil Data Publikasi...");
                    loadData(); // Load data hanya jika sudah login
                } else {
                    console.warn("⚠️ User tidak login. Redirecting...");
                    sessionStorage.removeItem("isLoggedIn");
                    window.location.href = "login";
                }
            });
        }
    }, 500);
    // --- FIX END ---

    if (kategoriSelect) {
        kategoriSelect.addEventListener("change", () => {
            if (labelKoleksi) labelKoleksi.innerText = kategoriSelect.value.toUpperCase();
            if (kategoriSelect.value === "dokumentasi") {
                containerGDrive.classList.remove("hidden");
            } else {
                containerGDrive.classList.add("hidden");
                if (inpGDrive) inpGDrive.value = "";
            }
            loadData();
        });
    }

    function loadData() {
        const koleksi = kategoriSelect ? kategoriSelect.value : "berita";
        window.adminDB.listenList(koleksi, (data) => {
            window.currentData = data;
            renderList(data);
        });
    }

    function renderList(data) {
        const listContainer = document.getElementById("list-data");
        listContainer.innerHTML = "";
        data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

        if (data.length === 0) {
            listContainer.innerHTML = `<p class="text-center text-slate-400 text-xs py-10">Belum ada data.</p>`;
            return;
        }

        data.forEach(item => {
            const imgSrc = item.img || 'https://via.placeholder.com/150';
            const noUrut = (item.id && item.id.includes('_')) ? "#" + item.id.split('_').pop() : "#New";
            const gdriveBtn = item.gdrive ?
                `<a href="${item.gdrive}" target="_blank" class="px-3 py-1 bg-green-50 text-green-600 rounded text-[10px] font-bold hover:bg-green-600 hover:text-white transition">G-DRIVE</a>`
                : '';

            listContainer.innerHTML += `
                <div class="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 mb-3 hover:shadow-md transition">
                    <div class="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <img src="${imgSrc}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-slate-800 text-sm line-clamp-2 pr-2">${item.judul}</h4>
                            <span class="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">${noUrut}</span>
                        </div>
                        <p class="text-[10px] text-slate-400 mt-1">${item.tanggal}</p>
                        <div class="flex gap-2 mt-3">
                            ${gdriveBtn}
                            <button onclick="window.editItem('${item.id}')" class="px-3 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold hover:bg-blue-600 hover:text-white transition">EDIT</button>
                            <button onclick="window.hapusItem('${item.id}')" class="px-3 py-1 bg-red-50 text-red-600 rounded text-[10px] font-bold hover:bg-red-600 hover:text-white transition">HAPUS</button>
                        </div>
                    </div>
                </div>`;
        });
    }

    if (inpFile) {
        inpFile.addEventListener("change", function () {
            if (this.files[0]) {
                if (this.files[0].size > 2 * 1024 * 1024) {
                    Swal.fire('File Terlalu Besar', 'Maksimal ukuran foto adalah 2MB', 'warning');
                    this.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById("img-preview").src = e.target.result;
                    document.getElementById("preview-container").classList.remove("hidden");
                    document.getElementById("upload-placeholder").classList.add("hidden");
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById("btn-submit");
        const judul = document.getElementById("inp-judul").value.trim();
        const tglVal = document.getElementById("inp-date").value;
        const deskripsi = document.getElementById("inp-desc").value.trim();
        const gdrive = document.getElementById("inp-gdrive").value.trim();
        const file = inpFile.files[0];
        const currentID = document.getElementById("data-id").value;
        const koleksi = kategoriSelect.value;

        if (!judul) return Swal.fire('Input Kosong', 'Judul tidak boleh kosong!', 'warning');
        if (!tglVal) return Swal.fire('Input Kosong', 'Tanggal harus dipilih!', 'warning');
        if (!deskripsi) return Swal.fire('Input Kosong', 'Deskripsi konten harus diisi!', 'warning');

        if (koleksi === "dokumentasi" && gdrive) {
            const gdrivePattern = /^(https?:\/\/)?(www\.)?(drive\.google\.com|goo\.gl)\/.+$/;
            if (!gdrivePattern.test(gdrive)) {
                return Swal.fire('Link Tidak Valid', 'Mohon masukkan link Google Drive yang benar!', 'error');
            }
        }

        btnSubmit.innerText = "⏳ MENYIMPAN...";
        btnSubmit.disabled = true;

        try {
            let docID = currentID || generateSequentialID(koleksi, window.currentData);
            const dateObj = new Date(tglVal);
            const yearStr = dateObj.getFullYear().toString();
            const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');

            let finalUrl = document.getElementById("inp-img-url").value;

            if (file) {
                const bucket = koleksi === "berita" ? "berita-images" : "dokumentasi-images";
                if (currentID && finalUrl) {
                    try { await window.adminDB.deleteFile(bucket, finalUrl); } catch (e) { }
                }
                const folderPath = `${yearStr}/${monthStr}/${docID}`;
                finalUrl = await window.adminDB.uploadFile(file, bucket, folderPath);
            }

            const data = {
                kategori: koleksi,
                judul: judul,
                tanggal: tglVal,
                deskripsi: deskripsi,
                gdrive: gdrive || "",
                img: finalUrl || "",
                tahun: yearStr,
                bulan: monthStr,
                updatedAt: new Date().toISOString()
            };

            await window.adminDB.saveWithId(koleksi, docID, data);
            Swal.fire({ title: 'Sukses', text: 'Data berhasil disimpan di database.', icon: 'success', timer: 1500, showConfirmButton: false });
            window.resetForm();

        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            btnSubmit.innerText = currentID ? "UPDATE DATA" : "SIMPAN DATA";
            btnSubmit.disabled = false;
        }
    });

    window.resetForm = () => {
        form.reset();
        document.getElementById("data-id").value = "";
        document.getElementById("inp-img-url").value = "";
        if (inpGDrive) inpGDrive.value = "";
        if (containerGDrive) containerGDrive.classList.add("hidden");
        if (dateInput) dateInput.valueAsDate = new Date();
        document.getElementById("preview-container").classList.add("hidden");
        document.getElementById("upload-placeholder").classList.remove("hidden");
        document.getElementById("img-preview").src = "";
        const btn = document.getElementById("btn-submit");
        btn.innerText = "SIMPAN DATA";
        btn.classList.add("bg-slate-900");
        btn.classList.remove("bg-blue-600");
    };
});
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';

// --- ID AUTO NUMBER ---
function generateSequentialID(prefix, allData) {
    const now = new Date();
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const prefixHariIni = `${prefix}_${dateCode}`;
    
    let maxNo = 0;
    allData.filter(i => i.id && i.id.startsWith(prefixHariIni)).forEach(item => {
        const no = parseInt(item.id.split('_').pop());
        if (!isNaN(no) && no > maxNo) maxNo = no;
    });

    return `${prefixHariIni}_${String(maxNo + 1).padStart(4, '0')}`;
}

// --- HAPUS PUBLIKASI + FILE ---
window.hapusItem = async function(id) {
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
        Swal.fire({ title: 'Membersihkan...', didOpen: () => Swal.showLoading() });
        
        const koleksi = document.getElementById("inp-kategori").value || "berita";
        const bucket = koleksi === "berita" ? "berita-images" : "dokumentasi-images";

        // 1. HAPUS FOTO DI SUPABASE
        if (item.img) {
            await window.adminDB.deleteFile(bucket, item.img);
        }

        // 2. HAPUS DATA DI FIREBASE
        await window.adminDB.delete(koleksi, id);
        
        Swal.fire('Bersih!', 'Data berhasil dihapus.', 'success');
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    }
};

// --- EDIT ---
window.editItem = function(id) {
    const item = window.currentData.find(x => x.id === id);
    if (!item) return;

    document.getElementById("data-id").value = item.id;
    document.getElementById("inp-judul").value = item.judul;
    document.getElementById("inp-date").value = item.tanggal;
    document.getElementById("inp-desc").value = item.deskripsi || "";
    document.getElementById("inp-img-url").value = item.img || "";

    if (item.img) {
        document.getElementById("img-preview").src = item.img;
        document.getElementById("preview-container").classList.remove("hidden");
        document.getElementById("upload-placeholder").classList.add("hidden");
    }

    const btn = document.getElementById("btn-submit");
    btn.innerText = "UPDATE DATA";
    btn.classList.remove("bg-slate-900");
    btn.classList.add("bg-blue-600");
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- MAIN LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    window.currentData = [];
    const dateInput = document.getElementById("inp-date");
    if(dateInput) dateInput.valueAsDate = new Date();

    const checkDB = setInterval(() => {
        if (window.adminDB) {
            clearInterval(checkDB);
            loadData();
        }
    }, 500);

    const kategoriSelect = document.getElementById("inp-kategori");
    const labelKoleksi = document.getElementById("lbl-koleksi");

    if(kategoriSelect) {
        kategoriSelect.addEventListener("change", () => {
            if(labelKoleksi) labelKoleksi.innerText = kategoriSelect.value.toUpperCase();
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
            let noUrut = "#New";
            if (item.id && item.id.includes('_')) noUrut = "#" + item.id.split('_').pop();

            listContainer.innerHTML += `
                <div class="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 mb-3 relative group hover:shadow-md transition">
                    <div class="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <img src="${imgSrc}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-slate-800 text-sm line-clamp-2 pr-2">${item.judul}</h4>
                            <span class="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">${noUrut}</span>
                        </div>
                        <p class="text-[10px] text-slate-400 mt-1">📅 ${item.tanggal}</p>
                        <div class="flex gap-2 mt-3 relative z-10">
                            <button onclick="window.editItem('${item.id}')" class="cursor-pointer px-3 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold hover:bg-blue-600 hover:text-white transition">EDIT</button>
                            <button onclick="window.hapusItem('${item.id}')" class="cursor-pointer px-3 py-1 bg-red-50 text-red-600 rounded text-[10px] font-bold hover:bg-red-600 hover:text-white transition">HAPUS</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    const inpFile = document.getElementById("inp-file");
    if(inpFile) {
        inpFile.addEventListener("change", function() {
            if(this.files[0]) {
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

    const form = document.getElementById("form-publikasi");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById("btn-submit");
        const judul = document.getElementById("inp-judul").value.trim();
        const file = inpFile.files[0];
        const currentID = document.getElementById("data-id").value;
        
        if(!judul) return Swal.fire('Gagal', 'Judul wajib diisi!', 'warning');
        
        btnSubmit.innerText = "⏳ MENYIMPAN...";
        btnSubmit.disabled = true;

        try {
            const koleksi = kategoriSelect.value;
            let docID = currentID;

            if (!docID) docID = generateSequentialID(koleksi, window.currentData);

            const tglVal = document.getElementById("inp-date").value;
            const dateObj = new Date(tglVal);
            const yearStr = dateObj.getFullYear().toString();
            const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
            
            let finalUrl = document.getElementById("inp-img-url").value;

            if (file) {
                const bucket = koleksi === "berita" ? "berita-images" : "dokumentasi-images";
                // Jika edit & ganti foto, hapus yg lama
                if (currentID && finalUrl) await window.adminDB.deleteFile(bucket, finalUrl);
                
                const folderPath = `${yearStr}/${monthStr}/${docID}`;
                finalUrl = await window.adminDB.uploadFile(file, bucket, folderPath);
            }

            const data = {
                kategori: koleksi,
                judul: judul,
                tanggal: tglVal,
                deskripsi: document.getElementById("inp-desc").value,
                img: finalUrl,
                tahun: yearStr,
                bulan: monthStr,
                tanggal_upload: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await window.adminDB.saveWithId(koleksi, docID, data);
            
            Swal.fire('Sukses', `Data tersimpan.\nID: ${docID}`, 'success');
            window.resetForm();

        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            btnSubmit.innerText = "SIMPAN DATA";
            btnSubmit.disabled = false;
        }
    });

    window.resetForm = () => {
        form.reset();
        document.getElementById("data-id").value = "";
        document.getElementById("inp-img-url").value = "";
        document.getElementById("inp-date").valueAsDate = new Date();
        document.getElementById("preview-container").classList.add("hidden");
        document.getElementById("upload-placeholder").classList.remove("hidden");
        document.getElementById("img-preview").src = "";
        const btn = document.getElementById("btn-submit");
        btn.innerText = "SIMPAN DATA";
        btn.classList.add("bg-slate-900");
        btn.classList.remove("bg-blue-600");
    };
});
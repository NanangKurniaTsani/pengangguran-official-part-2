import Swal from 'sweetalert2';
import { onAuthStateChanged } from "firebase/auth";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=f1f5f9&color=64748b&size=128";

/**
 * ==========================================
 * 1. CRUD ACTIONS
 * ==========================================
 */

window.hapusItem = async function(id) {
    const result = await Swal.fire({
        title: 'Hapus Pengurus?',
        text: "Data akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e293b',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Ya, Hapus'
    });
    if (!result.isConfirmed) return;
    try {
        const item = window.currentData.find(x => x.id === id);
        Swal.fire({ title: 'Membersihkan...', didOpen: () => Swal.showLoading() });
        if (item.foto && item.foto.includes("supabase")) {
            await window.adminDB.deleteFile("pengurus-images", item.foto);
        }
        await window.adminDB.delete("pengurus", id);
        Swal.fire({ title: 'Terhapus', icon: 'success', timer: 1000, showConfirmButton: false });
    } catch (e) { Swal.fire('Error', e.message, 'error'); }
};

window.editItem = function(id) {
    const item = window.currentData.find(x => x.id === id);
    if (!item) return;
    if (window.innerWidth < 1024 && typeof window.toggleListMobile === 'function') window.toggleListMobile();
    document.getElementById("data-id").value = item.id;
    document.getElementById("inp-nama").value = item.nama;
    document.getElementById("inp-dept").value = item.departemen;
    document.getElementById("inp-jabatan").value = item.jabatan;
    document.getElementById("inp-foto-url").value = item.foto || "";
    document.getElementById("img-preview").src = item.foto || DEFAULT_AVATAR;
    document.getElementById("btn-submit").innerText = "Simpan Perubahan";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = () => {
    document.getElementById("form-struktur").reset();
    document.getElementById("data-id").value = "";
    document.getElementById("inp-foto-url").value = "";
    document.getElementById("img-preview").src = DEFAULT_AVATAR;
    document.getElementById("btn-submit").innerText = "Simpan Data";
};

/**
 * ==========================================
 * 2. SEARCH, RESET & SYNC LOGIC
 * ==========================================
 */

let selectedSugIndex = -1;

window.resetSearch = function() {
    const searchBox = document.getElementById("search-box");
    const sugBox = document.getElementById("search-suggestions");
    const listData = document.getElementById("list-data");
    const clearBtn = document.getElementById("clear-search");

    searchBox.value = "";
    clearBtn.classList.add("hidden");
    sugBox.classList.add("hidden");
    listData.classList.remove("searching-mode");
    selectedSugIndex = -1;
    renderList(window.currentData); 
};

window.goToMember = function(id, name) {
    const element = document.getElementById(`card-${id}`);
    const sugBox = document.getElementById("search-suggestions");
    const listData = document.getElementById("list-data");
    const searchBox = document.getElementById("search-box");

    searchBox.value = name; 
    const filtered = window.currentData.filter(i => i.nama.toLowerCase().includes(name.toLowerCase()) || i.departemen.toLowerCase().includes(name.toLowerCase()));
    renderSearchResult(filtered, name.toLowerCase());

    listData.classList.remove("searching-mode");
    sugBox.classList.add("hidden");

    if (element) {
        document.querySelectorAll('[id^="card-"]').forEach(c => c.classList.remove('ring-4', 'ring-blue-500', 'highlight-card'));
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-card', 'ring-4', 'ring-blue-500');
        setTimeout(() => element.classList.remove('ring-4', 'ring-blue-500'), 3000);
    }
};

function handleSearch(keyword, e) {
    const sugBox = document.getElementById("search-suggestions");
    const listData = document.getElementById("list-data");
    const clearBtn = document.getElementById("clear-search");
    const kw = keyword.toLowerCase().trim();

    kw !== "" ? clearBtn.classList.remove("hidden") : clearBtn.classList.add("hidden");

    const items = sugBox.querySelectorAll('.sug-item');
    if (e && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
        if (e.key === "ArrowDown") selectedSugIndex = (selectedSugIndex + 1) % items.length;
        if (e.key === "ArrowUp") selectedSugIndex = (selectedSugIndex - 1 + items.length) % items.length;
        if (e.key === "Enter" && selectedSugIndex > -1) {
            items[selectedSugIndex].click();
            return;
        }
        items.forEach((el, idx) => {
            el.classList.toggle('bg-blue-50', idx === selectedSugIndex);
            if(idx === selectedSugIndex) el.scrollIntoView({ block: 'nearest' });
        });
        return;
    }

    if (kw === "") {
        resetSearch();
        return;
    }

    listData.classList.add("searching-mode");
    const filtered = window.currentData.filter(i => {
        const nama = i.nama.toLowerCase();
        if (kw.length <= 2) return nama.split(" ")[0].startsWith(kw) || i.departemen.toLowerCase().startsWith(kw);
        return nama.includes(kw) || i.departemen.toLowerCase().includes(kw);
    });

    if (filtered.length > 0) {
        const byNama = filtered.filter(item => item.nama.toLowerCase().includes(kw));
        const byDept = filtered.filter(item => item.departemen.toLowerCase().startsWith(kw) && !item.nama.toLowerCase().includes(kw));
        
        let html = "";
        if (byNama.length > 0) {
            html += `<div class="sug-header">Anggota</div>`;
            byNama.forEach(i => {
                html += `<div onclick="window.goToMember('${i.id}', '${i.nama}')" class="sug-item p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 transition-all">
                    <img src="${i.foto || DEFAULT_AVATAR}" class="w-8 h-8 rounded-full object-cover border"><div class="min-w-0">
                    <p class="text-xs font-bold text-slate-800 truncate">${i.nama}</p><p class="text-[9px] text-slate-500 uppercase">${i.jabatan}</p></div></div>`;
            });
        }
        if (byDept.length > 0) {
            html += `<div class="sug-header">Departemen</div>`;
            byDept.forEach(i => {
                html += `<div onclick="window.goToMember('${i.id}', '${i.departemen}')" class="sug-item p-3 hover:bg-amber-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 transition-all">
                    <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">${i.departemen[0]}</div>
                    <div class="min-w-0"><p class="text-xs font-black uppercase text-slate-800">${i.departemen}</p><p class="text-[9px] text-slate-400 truncate">${i.nama}</p></div></div>`;
            });
        }
        sugBox.innerHTML = html;
        sugBox.classList.remove("hidden");
    } else {
        sugBox.innerHTML = `<div class="p-6 text-center text-xs font-bold text-slate-300 italic">Tidak ditemukan</div>`;
        sugBox.classList.remove("hidden");
    }

    renderSearchResult(filtered, kw);
}

function renderSearchResult(data, keyword) {
    const container = document.getElementById("list-data");
    container.innerHTML = `
        <div class="col-span-full mb-6 p-4 bg-blue-50 rounded-2xl flex justify-between items-center fade-in">
            <div class="text-blue-900 font-black text-xs uppercase tracking-widest ml-2">Hasil: ${keyword}</div>
            <button onclick="window.resetSearch()" class="px-3 py-1.5 bg-white text-red-500 text-[9px] font-black rounded-lg shadow-sm border border-red-100 hover:bg-red-50">BATALKAN</button>
        </div>
    `;
    data.forEach(item => container.innerHTML += createCardHTML(item));
}

/**
 * ==========================================
 * 3. RENDER DATA & INIT
 * ==========================================
 */

function createCardHTML(m) {
    const isBPH = m.departemen === "BPH";
    return `
    <div id="card-${m.id}" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 fade-in">
        <div class="flex items-center gap-4 mb-4 text-left">
            <img src="${m.foto || DEFAULT_AVATAR}" class="w-12 h-12 rounded-full object-cover border-2 shadow-sm">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 text-sm truncate">${m.nama}</h4>
                <p class="text-[9px] font-black ${isBPH ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'} px-2 py-0.5 rounded inline-block uppercase mt-1">${m.departemen} • ${m.jabatan}</p>
            </div>
        </div>
        <div class="flex gap-2 border-t border-slate-50 pt-3">
            <button onclick="window.editItem('${m.id}')" class="flex-1 py-2 rounded-xl text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all uppercase">Edit</button>
            <button onclick="window.hapusItem('${m.id}')" class="flex-1 py-2 rounded-xl text-[10px] font-black bg-white border border-slate-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all uppercase">Hapus</button>
        </div>
    </div>`;
}

function renderList(data) {
    const container = document.getElementById("list-data");
    container.innerHTML = "";
    const urutanDept = ["BPH", "PI", "PJK", "Humas", "PO", "SB"];
    const grouped = {};
    data.forEach(i => { if (!grouped[i.departemen]) grouped[i.departemen] = []; grouped[i.departemen].push(i); });

    urutanDept.forEach(dept => {
        const members = grouped[dept];
        if (members && members.length > 0) {
            container.innerHTML += `<div class="col-span-full mt-6 mb-3 flex items-center gap-3 px-1"><span class="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg uppercase">${dept}</span><div class="h-px bg-slate-100 flex-1"></div><span class="text-[9px] text-slate-400 font-bold uppercase">${members.length} Orang</span></div>`;
            members.sort((a,b) => (a.jabatan.toLowerCase().includes("ketua") ? -1 : 1)).forEach(m => container.innerHTML += createCardHTML(m));
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    window.currentData = [];
    
    // --- FIX START: Menunggu Firebase Auth & Database Siap ---
    const checkDB = setInterval(() => {
        if (window.adminDB && window.firebaseAuth) {
            clearInterval(checkDB);
            
            // Cek Status Login Firebase
            onAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    console.log("✅ Auth OK. Mengambil Data...");
                    
                    // Ambil Data Pengurus
                    window.adminDB.listenList("pengurus", (data) => { 
                        window.currentData = data; 
                        renderList(data); 
                    });

                    // Ambil Data Departemen
                    window.adminDB.listenList("departemen_data", (data) => {
                        const s1 = document.getElementById("inp-dept");
                        const s2 = document.getElementById("inp-info-code");
                        if(s1 && s2) {
                            s1.innerHTML = ""; s2.innerHTML = "";
                            data.sort((a,b) => (a.id === 'BPH' ? -1 : 1)).forEach(d => {
                                s1.innerHTML += `<option value="${d.id}">${d.id}</option>`;
                                s2.innerHTML += `<option value="${d.id}">${d.id}</option>`;
                            });
                        }
                    });
                } else {
                    console.warn("⚠️ User tidak login. Redirecting...");
                    sessionStorage.removeItem("isLoggedIn"); // Bersihkan session lokal
                    window.location.href = "login";
                }
            });
        }
    }, 500);
    // --- FIX END ---

    const searchBox = document.getElementById("search-box");
    searchBox.addEventListener("keydown", (e) => {
        if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
            e.preventDefault();
            handleSearch(searchBox.value, e);
        }
    });
    searchBox.addEventListener("keyup", (e) => {
        if (!["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) handleSearch(searchBox.value);
    });

    document.addEventListener("click", (e) => {
        if (!searchBox.contains(e.target)) {
            document.getElementById("search-suggestions").classList.add("hidden");
            document.getElementById("list-data").classList.remove("searching-mode");
        }
    });

    // Validasi Ganda & Simpan
    document.getElementById("form-struktur").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submit");
        const nama = document.getElementById("inp-nama").value.trim();
        const currentID = document.getElementById("data-id").value;
        
        if (window.currentData.some(x => x.nama.toLowerCase() === nama.toLowerCase() && x.id !== currentID)) {
            return Swal.fire('Error', `Nama "${nama}" sudah ada di database!`, 'error');
        }

        btn.disabled = true; btn.innerHTML = "Menyimpan...";
        try {
            const cleanID = currentID || nama.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            let photoUrl = document.getElementById("inp-foto-url").value;
            const file = document.getElementById("inp-file").files[0];
            if (file) photoUrl = await window.adminDB.uploadFile(file, "pengurus-images", `kabinet/${document.getElementById("inp-dept").value}/${cleanID}`);

            await window.adminDB.saveWithId("pengurus", cleanID, {
                nama, departemen: document.getElementById("inp-dept").value,
                jabatan: document.getElementById("inp-jabatan").value,
                foto: photoUrl, updatedAt: new Date().toISOString()
            });
            Swal.fire({ title: 'Berhasil', icon: 'success', timer: 1000 });
            window.resetForm();
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
        finally { btn.disabled = false; btn.innerText = "Simpan Data"; }
    });
});
import Swal from 'sweetalert2';
import { onAuthStateChanged } from "firebase/auth";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=f1f5f9&color=64748b&size=128";

// --- STATE ---
window.currentData = []; 
window.deptData = [];    
window.activeTab = 'pengurus'; 
window.isEditingDept = false;
let selectedSugIndex = -1;

const SINGLE_ROLES = ["ketua umum", "wakil ketua umum", "sekretaris umum", "bendahara umum", "wakil bendahara umum", "koordinator"];
const CONFIG_JABATAN = {
    "BPH": ["Ketua Umum", "Wakil Ketua Umum", "Sekretaris Umum", "Bendahara Umum", "Wakil Bendahara Umum"],
    "DEFAULT": ["Koordinator", "Sekretaris", "Anggota"]
};
const JABATAN_RANK = ["ketua umum", "wakil ketua umum", "sekretaris umum", "bendahara umum", "wakil bendahara umum", "koordinator", "sekretaris", "anggota"];

function getRank(jabatan) {
    if(!jabatan) return 99;
    const lower = jabatan.toLowerCase();
    const index = JABATAN_RANK.findIndex(rank => lower.includes(rank));
    return index === -1 ? 99 : index;
}

// === 1. FORM & SWITCHER ===
window.toggleFormMenu = function() {
    const dropdown = document.getElementById("form-menu-dropdown");
    const arrow = document.getElementById("form-arrow");
    
    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        setTimeout(() => dropdown.classList.add("opacity-100", "scale-100"), 10);
        arrow.classList.add("rotate-180");
    } else {
        dropdown.classList.remove("opacity-100", "scale-100");
        arrow.classList.remove("rotate-180");
        setTimeout(() => dropdown.classList.add("hidden"), 150);
    }
};

document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("form-menu-dropdown");
    const trigger = document.querySelector('[onclick="window.toggleFormMenu()"]');
    if (dropdown && !dropdown.classList.contains("hidden") && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
        window.toggleFormMenu();
    }
});

window.switchTab = function(mode) {
    window.activeTab = mode;
    const bodyP = document.getElementById('form-body-pengurus');
    const bodyD = document.getElementById('form-body-dept');
    const titleText = document.getElementById('form-title-text');
    const listTitle = document.getElementById('list-title');

    // Close Dropdown
    const dropdown = document.getElementById("form-menu-dropdown");
    if(!dropdown.classList.contains("hidden")) window.toggleFormMenu();

    if (mode === 'pengurus') {
        bodyP.classList.remove('hidden');
        bodyD.classList.add('hidden');
        titleText.innerText = "INPUT PENGURUS";
        listTitle.innerText = "Daftar Pengurus";
    } else {
        bodyD.classList.remove('hidden');
        bodyP.classList.add('hidden');
        titleText.innerText = "INPUT DEPARTEMEN";
        listTitle.innerText = "Daftar Departemen";
    }
    
    const searchVal = document.getElementById("search-box") ? document.getElementById("search-box").value : "";
    renderListBasedOnTab(searchVal);
};

window.resetFormCurrent = function() {
    if(window.activeTab === 'pengurus') window.resetForm();
    else window.resetDeptForm();
};

window.updateJabatanOptions = function() {
    const deptId = document.getElementById("inp-dept").value;
    const jabSelect = document.getElementById("inp-jabatan");
    jabSelect.innerHTML = ""; 
    const options = (deptId === "BPH" || deptId === "01") ? CONFIG_JABATAN.BPH : CONFIG_JABATAN.DEFAULT;
    options.forEach(opt => {
        const el = document.createElement("option");
        el.value = opt;
        el.innerText = opt;
        jabSelect.appendChild(el);
    });
};

window.initSemesterOptions = function() {
    const semSelect = document.getElementById("inp-semester");
    semSelect.innerHTML = "";
    for(let i=1; i<=8; i++) {
        const el = document.createElement("option");
        el.value = i;
        el.innerText = `Semester ${i}`;
        semSelect.appendChild(el);
    }
};

// === 2. SEARCH ENGINE ===
const overlay = document.getElementById("search-overlay");

window.resetSearch = function() {
    const searchBox = document.getElementById("search-box");
    searchBox.value = "";
    document.getElementById("clear-search").classList.add("hidden");
    document.getElementById("search-suggestions").classList.add("hidden");
    if(overlay) overlay.classList.add("hidden");
    selectedSugIndex = -1;
    renderListBasedOnTab();
};

window.handleSearch = function(keyword, e) {
    const sugBox = document.getElementById("search-suggestions");
    const clearBtn = document.getElementById("clear-search");
    const kw = keyword ? keyword.toLowerCase().trim() : "";

    if(clearBtn) kw !== "" ? clearBtn.classList.remove("hidden") : clearBtn.classList.add("hidden");

    const items = sugBox.querySelectorAll('.sug-item');
    if (e && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
        if (items.length === 0) return;
        if (e.key === "ArrowDown") {
            selectedSugIndex++;
            if (selectedSugIndex >= items.length) selectedSugIndex = 0; 
        } else if (e.key === "ArrowUp") {
            selectedSugIndex--;
            if (selectedSugIndex < 0) selectedSugIndex = items.length - 1; 
        } else if (e.key === "Enter") {
            if (selectedSugIndex > -1 && items[selectedSugIndex]) { items[selectedSugIndex].click(); return; }
        }
        items.forEach((el, idx) => {
            if (idx === selectedSugIndex) { el.classList.add('is-active'); el.scrollIntoView({ block: 'nearest' }); } 
            else { el.classList.remove('is-active'); }
        });
        return; 
    }

    selectedSugIndex = -1; 
    if (kw === "") { sugBox.classList.add("hidden"); renderListBasedOnTab(); return; }

    const foundMembers = window.currentData.filter(i => {
        const name = i.nama ? i.nama.toLowerCase() : "";
        const words = name.split(" "); 
        return words.some(w => w.startsWith(kw));
    }).slice(0, 5);

    const foundDepts = window.deptData.filter(d => d.id.toLowerCase().startsWith(kw)).slice(0, 2);

    let html = "";
    if (foundMembers.length > 0) {
        html += `<div class="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Anggota</div>`;
        foundMembers.forEach(item => {
            const safeName = item.nama ? item.nama.replace(/'/g, "\\'") : "Tanpa Nama";
            const safeJab = item.jabatan || "-";
            html += `<div data-type="member" onclick="window.applySearch('${safeName}', 'name', '${item.id}')" class="sug-item group">
                <img src="${item.foto || DEFAULT_AVATAR}" class="w-8 h-8 rounded-full object-cover border border-slate-200 group-hover:border-blue-200">
                <div class="min-w-0"><p class="text-xs font-bold text-slate-800 truncate transition-colors">${safeName}</p><p class="text-[9px] text-slate-500 uppercase">${safeJab}</p></div>
            </div>`;
        });
    }
    if (foundDepts.length > 0) {
        html += `<div class="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 border-t">Departemen</div>`;
        foundDepts.forEach(item => {
            html += `<div data-type="dept" onclick="window.applySearch('${item.id}', 'dept', '${item.id}')" class="sug-item group">
                <div class="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-[10px] font-black text-amber-600 group-hover:bg-amber-200">${item.id.substring(0,2)}</div>
                <div class="min-w-0"><p class="text-xs font-bold text-slate-800 truncate transition-colors">Departemen ${item.id}</p></div>
            </div>`;
        });
    }
    if (foundMembers.length === 0 && foundDepts.length === 0) html = `<div class="p-4 text-center text-xs font-bold text-slate-300 italic bg-white">Data tidak ditemukan</div>`;

    sugBox.innerHTML = html;
    sugBox.classList.remove("hidden");
    renderListBasedOnTab(kw);
};

window.applySearch = function(text, type, id) {
    const searchBox = document.getElementById("search-box");
    searchBox.value = text;
    document.getElementById("search-suggestions").classList.add("hidden");
    if(overlay) overlay.classList.add("hidden");
    if (type === 'name') window.switchTab('pengurus'); else window.switchTab('pengurus'); 
    renderListBasedOnTab(text);
    if(id && type === 'name') {
        setTimeout(() => {
            const card = document.getElementById(`card-${id}`);
            if(card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('ring-4', 'ring-blue-200', 'bg-blue-50');
                setTimeout(() => card.classList.remove('ring-4', 'ring-blue-200', 'bg-blue-50'), 2500);
            }
        }, 200);
    }
};

// === 3. RENDER LIST ===
function renderListBasedOnTab(keyword = "") {
    const container = document.getElementById("list-data");
    if(!container) return;
    container.innerHTML = "";
    const kw = keyword ? keyword.toLowerCase().trim() : "";

    if (window.activeTab === 'pengurus') {
        if (kw !== "") {
            const isMultiWord = kw.includes(" ");
            const matchedByName = window.currentData.filter(i => {
                const name = i.nama ? i.nama.toLowerCase() : "";
                if(isMultiWord) return name.includes(kw);
                const words = name.split(" ");
                return words.some(w => w.startsWith(kw));
            });
            if (matchedByName.length > 0) matchedByName.forEach(m => container.innerHTML += createMemberCard(m));

            const matchedDepts = !isMultiWord ? window.deptData.filter(d => d.id.toLowerCase().startsWith(kw)) : [];
            if (matchedDepts.length > 0) {
                if (matchedByName.length > 0) container.innerHTML += `<div class="h-4 border-t border-slate-100 my-2"></div>`; 
                matchedDepts.forEach(dept => {
                    const allMembers = window.currentData.filter(m => m.departemen === dept.id);
                    allMembers.sort((a, b) => getRank(a.jabatan) - getRank(b.jabatan));
                    container.innerHTML += `<div class="relative mt-4 mb-2 px-1 flex items-center justify-between"><div class="flex items-center gap-2"><span class="w-1.5 h-4 bg-slate-800 rounded-full"></span><span class="font-black text-xs text-slate-800 uppercase tracking-wider">${dept.id}</span></div><span class="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">${allMembers.length} Orang</span></div>`;
                    if(allMembers.length === 0) container.innerHTML += `<div class="p-3 mb-2 text-[10px] text-slate-400 bg-slate-50 rounded-xl border border-slate-100 italic text-center">Belum ada anggota</div>`;
                    else allMembers.forEach(m => container.innerHTML += createMemberCard(m));
                });
            }
            if (matchedByName.length === 0 && matchedDepts.length === 0) container.innerHTML = `<div class="text-center text-xs text-slate-400 py-10 italic">Data tidak ditemukan</div>`;
        } else {
            const grouped = {};
            window.currentData.forEach(i => { const deptKey = i.departemen || "Lainnya"; if (!grouped[deptKey]) grouped[deptKey] = []; grouped[deptKey].push(i); });
            const sortedKeys = Object.keys(grouped).sort((a, b) => {
                const da = window.deptData.find(d => d.id === a); const db = window.deptData.find(d => d.id === b);
                return (da ? (da.no_urut || 99) : 100) - (db ? (db.no_urut || 99) : 100);
            });
            if(sortedKeys.length === 0) { container.innerHTML = `<div class="text-center text-xs text-slate-400 py-10 italic">Belum ada data pengurus</div>`; return; }
            sortedKeys.forEach(dept => {
                const members = grouped[dept];
                members.sort((a, b) => getRank(a.jabatan) - getRank(b.jabatan));
                container.innerHTML += `<div class="relative mt-5 mb-2 px-1 flex items-center justify-between"><div class="flex items-center gap-2"><span class="w-1.5 h-4 bg-slate-800 rounded-full"></span><span class="font-black text-xs text-slate-800 uppercase tracking-wider">${dept}</span></div><span class="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">${members.length} Orang</span></div>`;
                members.forEach(m => container.innerHTML += createMemberCard(m));
            });
        }
    } else {
        let filtered = window.deptData.filter(d => d.nama_lengkap.toLowerCase().startsWith(kw) || d.id.toLowerCase().startsWith(kw));
        filtered.sort((a, b) => (a.no_urut || 99) - (b.no_urut || 99));
        if(filtered.length === 0) { container.innerHTML = `<div class="text-center text-xs text-slate-400 py-10 italic">Data departemen tidak ditemukan</div>`; return; }
        
        container.innerHTML += `<div class="col-span-full mb-4 p-3 bg-amber-50 rounded-xl flex justify-between items-center border border-amber-100 mt-2"><div class="text-amber-700 font-bold text-[10px] uppercase tracking-widest ml-1">Total: ${filtered.length} Departemen</div></div>`;

        filtered.forEach(d => {
            const count = window.currentData.filter(p => p.departemen === d.id).length;
            container.innerHTML += `
            <div id="card-${d.id}" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md fade-in group mb-3 relative overflow-hidden">
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-2"><div class="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-black text-[10px] border border-amber-200 shadow-sm">${d.no_urut || '-'}</div><h4 class="font-bold text-slate-800 text-sm uppercase">${d.id}</h4></div>
                    <p class="text-[11px] text-slate-500 font-medium mb-3 line-clamp-1">${d.nama_lengkap}</p>
                    <div class="flex items-center justify-between border-t border-slate-50 pt-3 mt-1">
                        <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1">${count} Anggota</span>
                        <div class="flex gap-2">
                            <button onclick="window.editDept('${d.id}')" class="px-3 py-1 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white text-[10px] font-black rounded-lg transition-colors uppercase border border-amber-100">Edit</button>
                            <button onclick="window.deleteDept('${d.id}', ${count})" class="px-3 py-1 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-500 text-slate-400 text-[10px] font-black rounded-lg transition-colors uppercase">Hapus</button>
                        </div>
                    </div>
                </div>
            </div>`;
        });
    }
}

function createMemberCard(m) {
    const safeDept = m.departemen || "Lainnya";
    const safeJab = m.jabatan || "-";
    const safeName = m.nama || "Tanpa Nama";
    const isBPH = safeDept === "BPH";

    return `
    <div id="card-${m.id}" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md fade-in group relative mb-3">
        <div class="flex items-center gap-4 mb-3 text-left">
            <img src="${m.foto || DEFAULT_AVATAR}" class="w-12 h-12 rounded-full object-cover border-2 border-slate-50 shadow-sm">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">${safeName}</h4>
                <div class="flex flex-wrap gap-1 mt-1">
                    <span class="text-[9px] font-black ${isBPH ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'} px-2 py-0.5 rounded inline-block uppercase truncate max-w-full">${safeJab}</span>
                    <span class="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded inline-block uppercase truncate">${safeDept}</span>
                </div>
            </div>
        </div>
        <div class="flex gap-2 border-t border-slate-50 pt-3">
            <button onclick="window.showDetail('${m.id}')" class="flex-1 py-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
            <button onclick="window.editItem('${m.id}')" class="flex-1 py-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
            <button onclick="window.hapusItem('${m.id}')" class="flex-1 py-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        </div>
    </div>`;
}

// === 4. CRUD LOGIC ===
window.editDept = function(id) {
    const dept = window.deptData.find(d => d.id === id);
    if (!dept) return;
    window.switchTab('departemen');
    window.isEditingDept = true;
    document.getElementById("inp-dept-id").value = dept.id;
    document.getElementById("inp-dept-id").disabled = true; 
    document.getElementById("inp-dept-id").classList.add("bg-slate-100");
    document.getElementById("inp-dept-name").value = dept.nama_lengkap;
    document.getElementById("inp-dept-desc").value = dept.deskripsi || "";
    document.getElementById("inp-dept-order").value = dept.no_urut;
    const btn = document.getElementById("btn-save-dept");
    btn.innerHTML = "Update Dept";
    btn.className = "w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-700 transition-all shadow-md shadow-blue-200";
    if(window.innerWidth < 1024) { window.toggleListMobile(); document.getElementById("form-dept").scrollIntoView({ behavior: 'smooth' }); }
};

window.deleteDept = async function(id, count) {
    if(count > 0) return Swal.fire('Gagal', `Masih ada ${count} anggota!`, 'error');
    const res = await Swal.fire({ title: 'Hapus Departemen?', text: `Data ${id} akan hilang permanen!`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#0f172a', cancelButtonColor: '#94a3b8', confirmButtonText: 'Ya, Hapus!' });
    if(!res.isConfirmed) return;
    try { await window.adminDB.delete("departemen_data", id); Swal.fire({icon:'success', title:'Terhapus', timer:1000, showConfirmButton:false}); } catch(e){ Swal.fire('Error', e.message, 'error'); }
};

window.resetDeptForm = function() {
    window.isEditingDept = false;
    document.getElementById("form-dept").reset();
    const inpId = document.getElementById("inp-dept-id");
    inpId.disabled = false;
    inpId.classList.remove("bg-slate-100");
    const btn = document.getElementById("btn-save-dept");
    btn.innerHTML = "Simpan Dept";
    btn.className = "flex-1 bg-amber-400 text-white py-2 rounded-lg font-bold text-xs uppercase hover:bg-amber-500 transition-all shadow-md shadow-amber-100";
    const max = window.deptData.length > 0 ? Math.max(...window.deptData.map(d=>d.no_urut)) : 0;
    document.getElementById("inp-dept-order").value = max + 1;
};

window.editItem = function(id) {
    const item = window.currentData.find(x => x.id === id);
    if (!item) return;

    window.switchTab('pengurus');
    document.getElementById("data-id").value = item.id;
    document.getElementById("inp-nama").value = item.nama;
    
    // BARU: Set Gender (Default Laki-laki jika kosong)
    document.getElementById("inp-gender").value = item.jenis_kelamin || "Laki-laki"; 

    document.getElementById("inp-jabatan").value = item.jabatan;
    document.getElementById("inp-foto-url").value = item.foto || "";
    document.getElementById("img-preview").src = item.foto || DEFAULT_AVATAR;
    
    const dd = document.getElementById("inp-dept");
    if(dd) dd.value = item.departemen;
    
    window.updateJabatanOptions();
    
    // Pastikan value jabatan diset SETELAH opsi diupdate
    setTimeout(() => {
        document.getElementById("inp-jabatan").value = item.jabatan;
    }, 50);

    document.getElementById("inp-prodi").value = item.prodi || "Teknik Informatika";
    document.getElementById("inp-semester").value = item.semester || "1";
    document.getElementById("inp-periode").value = item.periode || "2025/2026";

    const btn = document.getElementById("btn-submit");
    btn.innerText = "Simpan Perubahan";
    btn.classList.replace("bg-slate-900", "bg-blue-600");

    if(window.innerWidth < 1024) { 
        window.toggleListMobile(); 
        document.getElementById("form-struktur").scrollIntoView({ behavior: 'smooth' }); 
    }
};

window.hapusItem = async function(id) {
    const res = await Swal.fire({ title: 'Hapus Data?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#0f172a', cancelButtonColor: '#94a3b8', confirmButtonText: 'Hapus' });
    if(!res.isConfirmed) return;
    try {
        const item = window.currentData.find(x => x.id === id);
        if(item.foto && item.foto.includes("supabase")) await window.adminDB.deleteFile("pengurus-images", item.foto);
        await window.adminDB.delete("pengurus", id);
        Swal.fire({icon:'success', title:'Terhapus', timer:1000, showConfirmButton:false});
    } catch(e){ Swal.fire('Error', e.message, 'error'); }
};

window.resetForm = function() {
    document.getElementById("form-struktur").reset();
    document.getElementById("data-id").value = "";
    document.getElementById("img-preview").src = DEFAULT_AVATAR;
    const btn = document.getElementById("btn-submit");
    btn.innerText = "Simpan Data";
    btn.classList.replace("bg-blue-600", "bg-slate-900");
};

document.getElementById("form-struktur").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-submit");
    
    // Ambil semua value
    const nama = document.getElementById("inp-nama").value.trim();
    const gender = document.getElementById("inp-gender").value; // BARU
    const departemen = document.getElementById("inp-dept").value || "Lainnya";
    const jabatan = document.getElementById("inp-jabatan").value;
    const prodi = document.getElementById("inp-prodi").value;
    const semester = document.getElementById("inp-semester").value;
    const periode = document.getElementById("inp-periode").value;
    const currentID = document.getElementById("data-id").value;
    
    btn.disabled = true; btn.innerText = "Menyimpan...";
    
    try {
        const deptObj = window.deptData.find(d => d.id === departemen);
        const deptCode = deptObj ? (deptObj.kode || "99") : "99";
        const jabatanClean = jabatan.toLowerCase();
        
        const rankCode = String(getRank(jabatan)+1).padStart(2,'0');
        const slug = jabatanClean.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const prefix = `${deptCode}_${departemen.toLowerCase()}_${rankCode}_${slug}`;
        
        let finalID = currentID;
        let isIdChanged = false;

        // Logic ID Generator (Sama seperti sebelumnya)
        if (!currentID || !currentID.startsWith(prefix)) {
            isIdChanged = true;
            if (SINGLE_ROLES.some(r => jabatanClean.includes(r))) {
                finalID = prefix; 
            } else {
                const relatedIDs = window.currentData
                    .filter(d => d.id && d.id.startsWith(prefix) && d.id !== currentID)
                    .map(d => {
                        const parts = d.id.split("_");
                        const lastPart = parts[parts.length - 1];
                        return !isNaN(lastPart) ? parseInt(lastPart) : 0;
                    });
                const maxCounter = relatedIDs.length > 0 ? Math.max(...relatedIDs) : 0;
                const nextCounter = String(maxCounter + 1).padStart(2, '0');
                finalID = `${prefix}_${nextCounter}`;
            }
        }

        let photoUrl = document.getElementById("inp-foto-url").value;
        const file = document.getElementById("inp-file").files[0];
        
        if (file) {
            photoUrl = await window.adminDB.uploadFile(file, "pengurus-images", `kabinet/${departemen}/${finalID}`);
        }

        // BARU: Masukkan jenis_kelamin ke dataToSave
        const dataToSave = { 
            nama, 
            jenis_kelamin: gender, 
            departemen, jabatan, prodi, semester, periode, 
            foto: photoUrl, 
            updatedAt: new Date().toISOString() 
        };

        if (isIdChanged && currentID) {
            await window.adminDB.delete("pengurus", currentID);
            await window.adminDB.saveWithId("pengurus", finalID, dataToSave);
        } else {
            await window.adminDB.saveWithId("pengurus", finalID, dataToSave);
        }

        Swal.fire({title:'Sukses', icon:'success', timer:1000, showConfirmButton:false}); 
        window.resetForm();

    } catch(e) { 
        Swal.fire('Error', e.message, 'error'); 
    } finally { 
        btn.disabled = false; btn.innerText = currentID ? "Simpan Perubahan" : "Simpan Data"; 
    }
});

document.getElementById("form-dept").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-save-dept");
    const id = document.getElementById("inp-dept-id").value.trim().toUpperCase().replace(/\s+/g, '_');
    const nama = document.getElementById("inp-dept-name").value.trim();
    const desc = document.getElementById("inp-dept-desc").value.trim();
    const urut = parseInt(document.getElementById("inp-dept-order").value);
    const kode = String(urut).padStart(2, '0');

    if (!window.isEditingDept && window.deptData.some(d => d.id === id)) return Swal.fire('Error', `ID ${id} sudah ada!`, 'error');
    
    btn.disabled = true; btn.innerText = "Processing...";
    try {
        await window.adminDB.saveWithId("departemen_data", id, { id, nama_lengkap: nama, deskripsi: desc, no_urut: urut, kode: kode, updatedAt: new Date().toISOString() });
        Swal.fire({title:'Sukses', icon:'success', timer:1000, showConfirmButton:false}); window.resetDeptForm();
    } catch(e){ Swal.fire('Error', e.message, 'error'); }
    finally { btn.disabled = false; btn.innerText = window.isEditingDept ? "Update Dept" : "Simpan Dept"; }
});

// === 5. INIT ===
document.addEventListener("DOMContentLoaded", () => {
    window.initSemesterOptions();
    
    const searchBox = document.getElementById("search-box");
    if(searchBox) {
        searchBox.addEventListener('keyup', (e) => window.handleSearch(searchBox.value, e));
        searchBox.addEventListener('keydown', (e) => {
            if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
                e.preventDefault(); 
                window.handleSearch(searchBox.value, e);
            }
        });
        // FIX: Search overlay logic
        searchBox.addEventListener('focus', () => { 
            if(overlay) overlay.classList.remove("hidden"); 
        });
        document.addEventListener('click', (e) => {
            if (!searchBox.contains(e.target) && overlay && !overlay.contains(e.target)) {
                overlay.classList.add("hidden");
                document.getElementById("search-suggestions").classList.add("hidden");
            }
        });
    }

    const checkDB = setInterval(() => {
        if (window.adminDB && window.firebaseAuth) {
            clearInterval(checkDB);
            onAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    window.adminDB.listenList("departemen_data", (data) => {
                        window.deptData = data.sort((a,b)=>(a.no_urut||99)-(b.no_urut||99));
                        const dd = document.getElementById("inp-dept");
                        if(dd) {
                            const cur = dd.value; dd.innerHTML = "";
                            window.deptData.forEach(d => {
                                const el = document.createElement("option");
                                el.value = d.id;
                                el.innerText = d.nama_lengkap;
                                dd.appendChild(el);
                            });
                            if(window.deptData.length > 0) window.updateJabatanOptions();
                            if(cur) dd.value = cur;
                        }
                        renderListBasedOnTab();
                    });
                    window.adminDB.listenList("pengurus", (data) => { window.currentData = data; renderListBasedOnTab(); });
                } else { window.location.href = "../login/"; }
            });
        }
    }, 500);

    document.getElementById("inp-file").addEventListener("change", function(e) {
        if(e.target.files && e.target.files[0]) { const reader = new FileReader(); reader.onload = function(ev) { document.getElementById("img-preview").src = ev.target.result; }; reader.readAsDataURL(e.target.files[0]); }
    });
});

// === 6. MODAL DETAIL LOGIC (SAFE FLOATING) ===

window.showDetail = function(id) {
    const item = window.currentData.find(x => x.id === id);
    if (!item) return;

    const overlay = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    
    // --- 1. SETTING LAYOUT (SAFE Z-INDEX & SPACING) ---
    
    // OVERLAY:
    // z-[9999] -> Wajib lebih tinggi dari Navbar (z-100)
    // flex items-center justify-center -> Pasti di tengah
    // p-4 -> Padding overlay, menjaga jarak dari tepi layar
    overlay.className = "fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4 transition-all duration-300";
    
    // CONTENT:
    // w-[90%] -> Di HP lebarnya 90% (ada sisa 5% kiri-kanan)
    // max-h-[85vh] -> Tinggi maksimal 85% layar (pasti ada sisa atas-bawah)
    // rounded-2xl -> Sudut membulat
    content.className = "bg-white w-[90%] sm:w-full sm:max-w-md max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col transform scale-95 opacity-0 transition-all duration-300 relative";

    // Data Preparation
    const safeName = item.nama || "Tanpa Nama";
    const safeJab = item.jabatan || "-";
    const safeDept = item.departemen || "-";
    const safeProdi = item.prodi || "-";
    const safeSem = item.semester ? `Semester ${item.semester}` : "-";
    const safePeriode = item.periode || "-";
    const safeFoto = item.foto || DEFAULT_AVATAR;
    const safeGender = item.jenis_kelamin || "-";

    // --- 2. ISI MODAL ---
    content.innerHTML = `
        <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
            <h3 class="font-bold text-slate-800 text-lg">Detail Pengurus</h3>
            <button onclick="window.closeModal()" class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div class="overflow-y-auto custom-scrollbar p-5 bg-slate-50/50">
            
            <div class="flex flex-col items-center mb-6">
                <div class="relative">
                    <img src="${safeFoto}" class="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover">
                    <div class="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full border border-slate-100 flex items-center justify-center shadow-sm text-slate-500">
                         ${safeGender === 'Laki-laki' 
                            ? '<svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>' // Ikon Simpel Lk (Plus)
                            : '<svg class="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>' // Ikon Simpel Pr (Minus/Dash) atau ganti sesuai selera
                         }
                    </div>
                </div>
                <h2 class="mt-3 text-lg font-bold text-slate-800 text-center leading-tight px-4">${safeName}</h2>
                <span class="mt-1 px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-200">${safeJab}</span>
            </div>

            <div class="space-y-3">
                ${createRowItem("Departemen", safeDept)}
                ${createRowItem("Program Studi", safeProdi)}
                
                <div class="grid grid-cols-2 gap-3">
                    ${createRowItem("Semester", safeSem)}
                    ${createRowItem("Periode", safePeriode)}
                </div>
                
                ${createRowItem("Jenis Kelamin", safeGender)}
            </div>

            <div class="mt-5 pt-4 border-t border-slate-200/60 flex justify-between items-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase">System ID</span>
                <code class="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded select-all">${item.id}</code>
            </div>
        </div>

        <div class="p-4 border-t border-slate-100 bg-white shrink-0">
            <button onclick="window.editItem('${item.id}'); window.closeModal();" class="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-sm uppercase shadow-lg shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <svg class="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit Data
            </button>
        </div>
    `;

    // --- 3. ANIMASI MASUK ---
    overlay.classList.remove("hidden");
    overlay.classList.add("flex"); // Flex ini kunci centering
    
    setTimeout(() => {
        content.classList.remove("opacity-0", "scale-95");
        content.classList.add("opacity-100", "scale-100");
    }, 10);
};

function createRowItem(label, value) {
    return `
    <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <span class="text-[10px] text-slate-400 font-bold uppercase mb-0.5">${label}</span>
        <span class="text-sm font-semibold text-slate-700 truncate">${value}</span>
    </div>`;
}
// === 7. FUNGSI TUTUP MODAL (CLOSE) ===

window.closeModal = function() {
    const overlay = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    
    // 1. Animasi Keluar (Fade Out & Scale Down)
    // Kita cabut status 'tampil', kembalikan ke status 'sembunyi'
    content.classList.remove("opacity-100", "scale-100");
    content.classList.add("opacity-0", "scale-95");

    // 2. Tunggu animasi CSS selesai (300ms), baru sembunyikan total
    setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.classList.remove("flex"); // Hapus flex agar tidak menghalangi klik elemen lain
        content.innerHTML = ""; // Bersihkan sisa HTML lama
    }, 300);
};

// Event Listener: Klik area gelap (overlay) untuk menutup
const overlayEl = document.getElementById("modal-overlay");
if(overlayEl) {
    overlayEl.addEventListener("click", (e) => {
        // Pastikan yang diklik benar-benar overlay (bukan isi modalnya)
        if (e.target.id === "modal-overlay") {
            window.closeModal();
        }
    });
}
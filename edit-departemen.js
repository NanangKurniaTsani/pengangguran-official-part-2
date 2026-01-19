import Swal from 'sweetalert2';
import { onAuthStateChanged } from "firebase/auth";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=f1f5f9&color=64748b&size=128";

// --- STATE ---
window.currentData = []; 
window.deptData = [];    
window.activeTab = 'pengurus'; 
window.isEditingDept = false;
let selectedSugIndex = -1;

const JABATAN_RANK = [
    "ketua umum", "wakil ketua umum", "sekretaris umum", "bendahara umum", "wakil bendahara umum",
    "koordinator", "sekretaris", "anggota"
];

function getRank(jabatan) {
    if(!jabatan) return 99;
    const lower = jabatan.toLowerCase();
    const index = JABATAN_RANK.findIndex(rank => lower.includes(rank));
    return index === -1 ? 99 : index;
}


// ==========================================
// 2. SEARCH ENGINE (LOGIC & UI)
// ==========================================
const searchBox = document.getElementById("search-box");
const overlay = document.getElementById("search-overlay");

if(searchBox) {
    searchBox.addEventListener("focus", () => { if(overlay) overlay.classList.remove("hidden"); });
    
    document.addEventListener("click", (e) => {
        const wrapper = searchBox.parentElement;
        if (!wrapper.contains(e.target) && !document.getElementById("search-suggestions").contains(e.target)) {
            if(overlay) overlay.classList.add("hidden");
            document.getElementById("search-suggestions").classList.add("hidden");
        }
    });
}

window.resetSearch = function() {
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
    const kw = keyword.toLowerCase().trim();

    if(clearBtn) kw !== "" ? clearBtn.classList.remove("hidden") : clearBtn.classList.add("hidden");

    // Keyboard Nav
    const items = sugBox.querySelectorAll('.sug-item');
    if (e && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
        if (items.length === 0) return;

        if (e.key === "ArrowDown") {
            selectedSugIndex++;
            if (selectedSugIndex >= items.length) selectedSugIndex = 0; 
        } 
        else if (e.key === "ArrowUp") {
            selectedSugIndex--;
            if (selectedSugIndex < 0) selectedSugIndex = items.length - 1; 
        } 
        else if (e.key === "Enter") {
            if (selectedSugIndex > -1 && items[selectedSugIndex]) {
                items[selectedSugIndex].click(); 
                return;
            }
        }

        items.forEach((el, idx) => {
            if (idx === selectedSugIndex) {
                el.classList.add('is-active'); 
                el.scrollIntoView({ block: 'nearest' });
            } else {
                el.classList.remove('is-active');
            }
        });
        return; 
    }

    selectedSugIndex = -1; 

    if (kw === "") { 
        sugBox.classList.add("hidden");
        renderListBasedOnTab(); 
        return; 
    }

    // Generate Suggestions (Smart Word)
    const foundMembers = window.currentData.filter(i => {
        const words = i.nama.toLowerCase().split(" "); 
        return words.some(w => w.startsWith(kw));
    }).slice(0, 5);

    const foundDepts = window.deptData.filter(d => d.id.toLowerCase().startsWith(kw)).slice(0, 2);

    let html = "";

    if (foundMembers.length > 0) {
        html += `<div class="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Anggota</div>`;
        foundMembers.forEach(item => {
            html += `
            <div data-type="member" onclick="window.applySearch('${item.nama.replace(/'/g, "\\'")}', 'name', '${item.id}')" class="sug-item group">
                <img src="${item.foto || DEFAULT_AVATAR}" class="w-8 h-8 rounded-full object-cover border border-slate-200 group-hover:border-blue-200">
                <div class="min-w-0">
                    <p class="text-xs font-bold text-slate-800 truncate transition-colors">${item.nama}</p>
                    <p class="text-[9px] text-slate-500 uppercase">${item.jabatan}</p>
                </div>
            </div>`;
        });
    }

    if (foundDepts.length > 0) {
        const borderTop = foundMembers.length > 0 ? "border-t border-slate-100" : "";
        html += `<div class="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 ${borderTop}">Departemen</div>`;
        foundDepts.forEach(item => {
            html += `
            <div data-type="dept" onclick="window.applySearch('${item.id}', 'dept', '${item.id}')" class="sug-item group">
                <div class="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-[10px] font-black text-amber-600 group-hover:bg-amber-200">${item.id.substring(0,2)}</div>
                <div class="min-w-0"><p class="text-xs font-bold text-slate-800 truncate transition-colors">${item.id}</p></div>
            </div>`;
        });
    }

    if (foundMembers.length === 0 && foundDepts.length === 0) {
        html = `<div class="p-4 text-center text-xs font-bold text-slate-300 italic bg-white">Data tidak ditemukan</div>`;
    }

    sugBox.innerHTML = html;
    sugBox.classList.remove("hidden");
    
    renderListBasedOnTab(kw);
};

window.applySearch = function(text, type, id) {
    searchBox.value = text;
    document.getElementById("search-suggestions").classList.add("hidden");
    if(overlay) overlay.classList.add("hidden");
    
    if (type === 'name') window.switchTab('pengurus'); 
    else window.switchTab('pengurus'); 

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

// ==========================================
// 3. RENDER LIST (CLEAN)
// ==========================================
function renderListBasedOnTab(keyword = "") {
    const container = document.getElementById("list-data");
    if(!container) return;

    container.innerHTML = "";
    const kw = keyword.toLowerCase().trim();

    if (window.activeTab === 'pengurus') {
        if (kw !== "") {
            const isMultiWord = kw.includes(" ");
            const matchedByName = window.currentData.filter(i => {
                if(isMultiWord) return i.nama.toLowerCase().includes(kw);
                const words = i.nama.toLowerCase().split(" ");
                return words.some(w => w.startsWith(kw));
            });
            
            if (matchedByName.length > 0) {
                matchedByName.forEach(m => container.innerHTML += createMemberCard(m));
            }

            const matchedDepts = !isMultiWord ? window.deptData.filter(d => d.id.toLowerCase().startsWith(kw)) : [];
            
            if (matchedDepts.length > 0) {
                if (matchedByName.length > 0) container.innerHTML += `<div class="h-4 border-t border-slate-100 my-2"></div>`; 

                matchedDepts.forEach(dept => {
                    const allMembers = window.currentData.filter(m => m.departemen === dept.id);
                    allMembers.sort((a, b) => getRank(a.jabatan) - getRank(b.jabatan));

                    container.innerHTML += `
                    <div class="relative mt-4 mb-2 px-1 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-1.5 h-4 bg-slate-800 rounded-full"></span>
                            <span class="font-black text-xs text-slate-800 uppercase tracking-wider">${dept.id}</span>
                        </div>
                        <span class="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">${allMembers.length} Orang</span>
                    </div>`;

                    if(allMembers.length === 0) {
                        container.innerHTML += `<div class="p-3 mb-2 text-[10px] text-slate-400 bg-slate-50 rounded-xl border border-slate-100 italic text-center">Belum ada anggota</div>`;
                    } else {
                        allMembers.forEach(m => container.innerHTML += createMemberCard(m));
                    }
                });
            }

            if (matchedByName.length === 0 && matchedDepts.length === 0) {
                container.innerHTML = `<div class="text-center text-xs text-slate-400 py-10 italic">Data tidak ditemukan</div>`;
            }

        } else {
            const grouped = {};
            window.currentData.forEach(i => { if (!grouped[i.departemen]) grouped[i.departemen] = []; grouped[i.departemen].push(i); });
            const sortedKeys = Object.keys(grouped).sort((a, b) => {
                const da = window.deptData.find(d => d.id === a);
                const db = window.deptData.find(d => d.id === b);
                return (da?.no_urut || 99) - (db?.no_urut || 99);
            });

            if(sortedKeys.length === 0) { container.innerHTML = `<div class="text-center text-xs text-slate-400 py-10 italic">Belum ada data pengurus</div>`; return; }

            sortedKeys.forEach(dept => {
                const members = grouped[dept];
                members.sort((a, b) => getRank(a.jabatan) - getRank(b.jabatan));
                container.innerHTML += `
                <div class="relative mt-5 mb-2 px-1 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-4 bg-slate-800 rounded-full"></span>
                        <span class="font-black text-xs text-slate-800 uppercase tracking-wider">${dept}</span>
                    </div>
                    <span class="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">${members.length} Orang</span>
                </div>`;
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
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-black text-[10px] border border-amber-200 shadow-sm">${d.no_urut}</div>
                        <h4 class="font-bold text-slate-800 text-sm uppercase">${d.id}</h4>
                    </div>
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
    const isBPH = m.departemen === "BPH";
    return `
    <div id="card-${m.id}" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md fade-in group relative mb-3">
        <div class="flex items-center gap-4 mb-3 text-left">
            <img src="${m.foto || DEFAULT_AVATAR}" class="w-11 h-11 rounded-full object-cover border-2 border-slate-50 shadow-sm">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">${m.nama}</h4>
                <p class="text-[9px] font-black ${isBPH ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'} px-2 py-0.5 rounded inline-block uppercase mt-1 truncate max-w-full">${m.jabatan}</p>
            </div>
        </div>
        <div class="flex gap-2 border-t border-slate-50 pt-3">
            <button onclick="window.editItem('${m.id}')" class="flex-1 py-1.5 rounded-lg text-[10px] font-black bg-slate-50 text-slate-600 hover:bg-slate-800 hover:text-white transition-all uppercase">Edit</button>
            <button onclick="window.hapusItem('${m.id}')" class="flex-1 py-1.5 rounded-lg text-[10px] font-black bg-white border border-slate-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all uppercase">Hapus</button>
        </div>
    </div>`;
}

// ==========================================
// 4. CRUD
// ==========================================
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
    document.getElementById("inp-jabatan").value = item.jabatan;
    document.getElementById("inp-foto-url").value = item.foto || "";
    document.getElementById("img-preview").src = item.foto || DEFAULT_AVATAR;
    const dd = document.getElementById("inp-dept");
    if(dd) dd.value = item.departemen;
    const btn = document.getElementById("btn-submit");
    btn.innerText = "Simpan Perubahan";
    btn.classList.replace("bg-slate-900", "bg-blue-600");
    if(window.innerWidth < 1024) { window.toggleListMobile(); document.getElementById("section-pengurus").scrollIntoView({ behavior: 'smooth' }); }
};

window.hapusItem = async function(id) {
    const res = await Swal.fire({ title: 'Hapus Pengurus?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#0f172a', cancelButtonColor: '#94a3b8', confirmButtonText: 'Hapus' });
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

// ==========================================
// 6. INIT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
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
                            window.deptData.forEach(d => dd.innerHTML += `<option value="${d.id}">${d.id} - ${d.nama_lengkap}</option>`);
                            if(cur) dd.value = cur;
                        }
                        renderListBasedOnTab();
                        if(window.activeTab === 'departemen') window.resetDeptForm();
                    });
                    window.adminDB.listenList("pengurus", (data) => { window.currentData = data; renderListBasedOnTab(); });
                } else { window.location.href = "../login/"; }
            });
        }
    }, 500);

    const searchBox = document.getElementById("search-box");
    searchBox.addEventListener("keydown", (e) => {
        if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) { e.preventDefault(); window.handleSearch(searchBox.value, e); }
    });
    searchBox.addEventListener("keyup", (e) => {
        if (!["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) window.handleSearch(searchBox.value);
    });
    document.addEventListener("click", (e) => {
        if (!searchBox.contains(e.target)) document.getElementById("search-suggestions").classList.add("hidden");
    });

    document.getElementById("form-struktur").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submit");
        const nama = document.getElementById("inp-nama").value.trim();
        const jabatan = document.getElementById("inp-jabatan").value.trim();
        const departemen = document.getElementById("inp-dept").value;
        const currentID = document.getElementById("data-id").value;
        btn.disabled = true; btn.innerText = "Menyimpan...";
        try {
            let cleanID = currentID;
            if (!cleanID) {
                const deptObj = window.deptData.find(d => d.id === departemen);
                const deptCode = deptObj ? String(deptObj.kode || "99").padStart(2,'0') : "99";
                const rankCode = String(getRank(jabatan) + 1).padStart(2, '0');
                let slugJabatan = jabatan.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace('departemen', 'dept'); 
                cleanID = `${deptCode}_${departemen}_${rankCode}_${slugJabatan}`;
                const existing = window.currentData.filter(d => d.id && d.id.startsWith(cleanID));
                if (existing.length > 0) cleanID += `_${String(existing.length + 1).padStart(2, '0')}`;
                if(window.currentData.some(d => d.id === cleanID)) cleanID += `_${Date.now()}`;
            }
            let photoUrl = document.getElementById("inp-foto-url").value;
            const file = document.getElementById("inp-file").files[0];
            if (file) photoUrl = await window.adminDB.uploadFile(file, "pengurus-images", `kabinet/${departemen}/${cleanID}`);
            await window.adminDB.saveWithId("pengurus", cleanID, { nama, departemen, jabatan, foto: photoUrl, updatedAt: new Date().toISOString() });
            Swal.fire({title:'Sukses', icon:'success', timer:1000, showConfirmButton:false}); window.resetForm();
        } catch(e){ Swal.fire('Error', e.message, 'error'); } 
        finally { btn.disabled = false; btn.innerText = currentID ? "Simpan Perubahan" : "Simpan Data"; }
    });

    document.getElementById("form-dept").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-save-dept");
        const id = document.getElementById("inp-dept-id").value.trim().toUpperCase().replace(/\s+/g, '_');
        const nama = document.getElementById("inp-dept-name").value.trim();
        const desc = document.getElementById("inp-dept-desc").value.trim();
        const urut = parseInt(document.getElementById("inp-dept-order").value);
        if (!window.isEditingDept && window.deptData.some(d => d.id === id)) return Swal.fire('Error', `ID ${id} sudah ada!`, 'error');
        btn.disabled = true; btn.innerText = "Processing...";
        try {
            await window.adminDB.saveWithId("departemen_data", id, { id, nama_lengkap: nama, deskripsi: desc, no_urut: urut, kode: String(urut).padStart(2, '0'), updatedAt: new Date().toISOString() });
            Swal.fire({title:'Sukses', icon:'success', timer:1000, showConfirmButton:false}); window.resetDeptForm();
        } catch(e){ Swal.fire('Error', e.message, 'error'); }
        finally { btn.disabled = false; btn.innerText = window.isEditingDept ? "Update Dept" : "Simpan Dept"; }
    });

    document.getElementById("inp-file").addEventListener("change", function(e) {
        if(e.target.files && e.target.files[0]) { const reader = new FileReader(); reader.onload = function(ev) { document.getElementById("img-preview").src = ev.target.result; }; reader.readAsDataURL(e.target.files[0]); }
    });
});
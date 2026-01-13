import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=f1f5f9&color=64748b&size=128";

// --- GLOBAL DATABASE ACTIONS ---

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
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    }
};

window.editItem = function(id) {
    const item = window.currentData.find(x => x.id === id);
    if (!item) return;

    // Tutup sidebar di mobile
    if (window.innerWidth < 1024) window.toggleListMobile();

    document.getElementById("data-id").value = item.id;
    document.getElementById("inp-nama").value = item.nama;
    document.getElementById("inp-dept").value = item.departemen;
    document.getElementById("inp-jabatan").value = item.jabatan;
    document.getElementById("inp-foto-url").value = item.foto || "";
    document.getElementById("img-preview").src = item.foto || DEFAULT_AVATAR;

    const btn = document.getElementById("btn-submit");
    btn.innerText = "Simpan Perubahan";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = () => {
    document.getElementById("form-struktur").reset();
    document.getElementById("data-id").value = "";
    document.getElementById("inp-foto-url").value = "";
    document.getElementById("img-preview").src = DEFAULT_AVATAR;
    const btn = document.getElementById("btn-submit");
    btn.innerText = "Simpan Data";
};

// --- MAIN DATABASE LOGIC ---

document.addEventListener("DOMContentLoaded", () => {
    window.currentData = [];
    window.deptInfoData = {};

    const checkDB = setInterval(() => {
        if (window.adminDB) {
            clearInterval(checkDB);
            loadDepartments();
            loadMembers();
        }
    }, 500);

    function loadDepartments() {
        window.adminDB.listenList("departemen_data", (data) => {
            data.sort((a, b) => (a.id === 'BPH' ? -1 : b.id === 'BPH' ? 1 : a.id.localeCompare(b.id)));
            window.deptInfoData = {};
            data.forEach(d => window.deptInfoData[d.id] = d);
            
            // Render Dropdowns
            const selectMember = document.getElementById("inp-dept");
            const selectInfo = document.getElementById("inp-info-code");
            selectMember.innerHTML = "";
            selectInfo.innerHTML = "";
            data.forEach(dept => {
                selectMember.innerHTML += `<option value="${dept.id}">${dept.id} - ${dept.nama || ''}</option>`;
                selectInfo.innerHTML += `<option value="${dept.id}">${dept.id}</option>`;
            });
            fillDeptForm(selectInfo.value);
        });
    }

    function fillDeptForm(code) {
        const info = window.deptInfoData[code];
        if (info) {
            document.getElementById("inp-info-name").value = info.nama || "";
            document.getElementById("inp-info-desc").value = info.tugas || "";
        }
    }

    document.getElementById("inp-info-code").addEventListener("change", (e) => fillDeptForm(e.target.value));

    // Handle Update Info Dept
    document.getElementById("form-info-dept").addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = document.getElementById("inp-info-code").value;
        try {
            Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() });
            await window.adminDB.saveWithId("departemen_data", code, {
                nama: document.getElementById("inp-info-name").value,
                tugas: document.getElementById("inp-info-desc").value,
                updatedAt: new Date().toISOString()
            });
            Swal.fire({ title: 'Berhasil', icon: 'success', timer: 1000, showConfirmButton: false });
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
    });

    function loadMembers() {
        window.adminDB.listenList("pengurus", (data) => {
            window.currentData = data;
            renderList(data);
        });
    }

    function renderList(data) {
        const container = document.getElementById("list-data");
        container.innerHTML = "";
        data.sort((a, b) => (a.departemen === "BPH" ? -1 : b.departemen === "BPH" ? 1 : a.nama.localeCompare(b.nama)));

        data.forEach(item => {
            const isBPH = item.departemen === "BPH";
            container.innerHTML += `
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm fade-in">
                    <div class="flex items-center gap-4 mb-4 text-left">
                        <img src="${item.foto || DEFAULT_AVATAR}" class="w-12 h-12 rounded-full object-cover border border-slate-100">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-800 text-sm truncate">${item.nama}</h4>
                            <p class="text-[10px] font-bold ${isBPH ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'} px-2 py-0.5 rounded inline-block uppercase mt-1">
                                ${item.departemen} • ${item.jabatan}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2 border-t border-slate-50 pt-3">
                        <button onclick="window.editItem('${item.id}')" class="flex-1 py-2 rounded-xl text-[10px] font-extrabold bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">Edit</button>
                        <button onclick="window.hapusItem('${item.id}')" class="flex-1 py-2 rounded-xl text-[10px] font-extrabold bg-white border border-slate-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all uppercase tracking-widest">Hapus</button>
                    </div>
                </div>`;
        });
    }

    // Search Logic
    document.getElementById("search-box").addEventListener("keyup", (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = window.currentData.filter(item => 
            item.nama.toLowerCase().includes(keyword) || item.jabatan.toLowerCase().includes(keyword)
        );
        renderList(filtered);
    });

    // Form Submit Member
    document.getElementById("form-struktur").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submit");
        const nama = document.getElementById("inp-nama").value.trim();
        const dept = document.getElementById("inp-dept").value;
        const currentID = document.getElementById("data-id").value;
        const file = document.getElementById("inp-file").files[0];

        btn.disabled = true;
        btn.innerHTML = "Menyimpan...";

        try {
            const cleanID = nama.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            let photoUrl = document.getElementById("inp-foto-url").value;
            
            if (file) {
                if(currentID && photoUrl) await window.adminDB.deleteFile("pengurus-images", photoUrl);
                photoUrl = await window.adminDB.uploadFile(file, "pengurus-images", `2024/${dept}/${cleanID}`);
            }

            await window.adminDB.saveWithId("pengurus", cleanID, {
                nama, departemen: dept, jabatan: document.getElementById("inp-jabatan").value,
                foto: photoUrl, updatedAt: new Date().toISOString()
            });
            
            Swal.fire({ title: 'Berhasil', icon: 'success', timer: 1000, showConfirmButton: false });
            window.resetForm();
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
        finally { btn.disabled = false; btn.innerText = "Simpan Data"; }
    });
});
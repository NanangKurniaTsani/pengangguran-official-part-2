import Swal from "sweetalert2";
import { onAuthStateChanged } from "firebase/auth";

// --- State ---
window.currentData = [];
window.activeCollection = "berita";
let selectedSugIndex = -1;

// --- Helper: Slug Generator ---
function createSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

// --- Helper: ID Generator ---
// Format: kategori_YYYYMMDD_slug (TANPA ANGKA RANDOM)
function generateSlugID(prefix, title, dateVal) {
  const dateObj = new Date(dateVal);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;
  const slug = createSlug(title);
  
  return `${prefix}_${dateStr}_${slug}`;
}

// --- UI Logic ---
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

// AUTO RESET: Klik di luar form = Reset
document.addEventListener("click", (e) => {
    // Dropdown Menu Logic
    const dropdown = document.getElementById("form-menu-dropdown");
    const trigger = document.querySelector('[onclick="window.toggleFormMenu()"]');
    if (dropdown && !dropdown.classList.contains("hidden") && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
        window.toggleFormMenu();
    }

    // AUTO RESET FORM LOGIC
    const currentID = document.getElementById("data-id")?.value;
    if (currentID) {
        const formCard = document.getElementById("form-container-card");
        const modalContent = document.getElementById("modal-content");
        
        const isClickInsideForm = formCard && formCard.contains(e.target);
        const isClickInsideModal = modalContent && modalContent.contains(e.target);
        const isClickOnEditBtn = e.target.closest('button[onclick^="window.editItem"]');
        const isSwal = e.target.closest('.swal2-container');

        if (!isClickInsideForm && !isClickInsideModal && !isClickOnEditBtn && !isSwal) {
            window.resetForm();
        }
    }
});

window.toggleListMobile = function() {
    const sidebar = document.getElementById("list-container");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar.classList.contains("-translate-x-full")) {
        sidebar.classList.remove("-translate-x-full");
        overlay.classList.remove("hidden");
    } else {
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
    }
};

window.switchMode = function(mode) {
    window.activeCollection = mode;
    document.getElementById("form-title-text").innerText = mode === 'berita' ? "INPUT BERITA" : "INPUT DOKUMENTASI";
    document.getElementById("lbl-koleksi").innerText = mode.toUpperCase();
    document.getElementById("inp-kategori").value = mode;
    
    // UI Reset Total
    window.resetForm();
    window.toggleFormMenu();
    
    window.resetSearch();
    if (typeof window.loadData === "function") window.loadData();
};

// --- Search Logic ---
window.resetSearch = function() {
    const searchBox = document.getElementById("search-box");
    if(searchBox) searchBox.value = "";
    document.getElementById("clear-search").classList.add("hidden");
    document.getElementById("search-suggestions").classList.add("hidden");
    selectedSugIndex = -1;
    renderList(window.currentData);
};

window.handleSearch = function(keyword, e) {
    const sugBox = document.getElementById("search-suggestions");
    const clearBtn = document.getElementById("clear-search");
    if (!sugBox || !clearBtn) return;

    const kw = keyword ? keyword.toLowerCase().trim() : "";
    kw !== "" ? clearBtn.classList.remove("hidden") : clearBtn.classList.add("hidden");

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
            else { sugBox.classList.add("hidden"); applyFilterToList(kw); return; }
        }
        items.forEach((el, idx) => {
            if (idx === selectedSugIndex) { el.classList.add('bg-blue-50', 'text-blue-700'); el.scrollIntoView({ block: 'nearest' }); } 
            else { el.classList.remove('bg-blue-50', 'text-blue-700'); }
        });
        return; 
    }

    selectedSugIndex = -1; 
    if (kw === "") { sugBox.classList.add("hidden"); renderList(window.currentData); return; }

    const foundItems = window.currentData.filter(i => {
        const title = i.judul ? i.judul.toLowerCase() : "";
        const date = i.tanggal ? i.tanggal : "";
        return title.includes(kw) || date.includes(kw);
    }).slice(0, 5);

    let html = "";
    if (foundItems.length > 0) {
        const label = window.activeCollection === 'berita' ? "Berita Ditemukan" : "Dokumentasi Ditemukan";
        html += `<div class="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">${label}</div>`;
        foundItems.forEach(item => {
            html += `<div onclick="window.applySearch('${item.id}')" class="sug-item group cursor-pointer p-3 border-b border-slate-50 hover:bg-blue-50 transition-colors flex items-center gap-3">
                <img src="${item.img || 'https://via.placeholder.com/50'}" class="w-8 h-8 rounded object-cover border border-slate-200">
                <div class="min-w-0"><p class="text-xs font-bold text-slate-700 truncate group-hover:text-blue-700">${item.judul}</p><p class="text-[9px] text-slate-400">${item.tanggal}</p></div>
            </div>`;
        });
    } else { html = `<div class="p-4 text-center text-xs font-bold text-slate-300 italic bg-white">Data tidak ditemukan</div>`; }

    sugBox.innerHTML = html;
    sugBox.classList.remove("hidden");
    applyFilterToList(kw);
};

function applyFilterToList(kw) {
    const filtered = window.currentData.filter(i => {
        const title = i.judul ? i.judul.toLowerCase() : "";
        const date = i.tanggal ? i.tanggal : "";
        return title.includes(kw) || date.includes(kw);
    });
    renderList(filtered);
}

window.applySearch = function(id) {
    const item = window.currentData.find(x => x.id === id);
    if(!item) return;
    document.getElementById("search-box").value = item.judul;
    document.getElementById("search-suggestions").classList.add("hidden");
    renderList([item]);
    setTimeout(() => {
        const card = document.getElementById(`card-${id}`);
        if(card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('ring-4', 'ring-blue-200', 'bg-blue-50');
            setTimeout(() => card.classList.remove('ring-4', 'ring-blue-200', 'bg-blue-50'), 2000);
        }
    }, 200);
};

// --- List Renderer ---
window.renderList = function(data) {
    const listContainer = document.getElementById("list-data");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    
    // Sort: Terbaru (Date) -> Terbaru (UpdatedAt/ID)
    const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        if (dateB - dateA !== 0) return dateB - dateA;
        const updateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
        const updateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
        return updateB - updateA;
    });

    if (sortedData.length === 0) {
      listContainer.innerHTML = `<p class="text-center text-slate-400 text-xs py-10 italic">Tidak ada data.</p>`;
      return;
    }

    sortedData.forEach((item) => {
      const imgSrc = item.img || "https://via.placeholder.com/150?text=No+Img";
      
      const idParts = item.id ? item.id.split("_") : [];
      let shortDisplay = "";
      if (idParts.length >= 3) {
          shortDisplay = idParts[2]; // Slug
          if(shortDisplay.length > 15) shortDisplay = shortDisplay.substring(0, 15) + "...";
      } else {
          shortDisplay = idParts[idParts.length - 1];
      }

      listContainer.innerHTML += `
        <div id="card-${item.id}" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md fade-in group relative mb-3">
            <div class="flex items-start gap-4 mb-3">
                <div class="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                     <img src="${imgSrc}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">${item.judul}</h4>
                        <span class="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 ml-2 shrink-0 truncate max-w-[80px]" title="${item.id}">#${shortDisplay}</span>
                    </div>
                    <div class="flex items-center gap-2 mt-1.5">
                        <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            ${item.tanggal}
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex gap-2 border-t border-slate-50 pt-3">
                <button onclick="window.showDetail('${item.id}')" class="flex-1 py-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                <button onclick="window.editItem('${item.id}')" class="flex-1 py-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <button onclick="window.hapusItem('${item.id}')" class="flex-1 py-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
        </div>`;
    });
};

// --- Modal & CRUD ---
window.showDetail = function(id) {
    const item = window.currentData.find(x => x.id === id);
    if (!item) return;

    document.body.classList.add('modal-open');

    const overlay = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    
    overlay.className = "fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4 transition-all duration-300";
    content.className = "bg-white w-[90%] sm:w-full sm:max-w-md max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col transform scale-95 opacity-0 transition-all duration-300 relative";

    const imgSrc = item.img || "https://via.placeholder.com/600x400?text=No+Image";
    
    const gdriveLink = item.gdrive 
        ? `<a href="${item.gdrive}" target="_blank" class="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition border border-green-200">
             <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 1.485c-2.082 0-3.754.02-4.743.061-.417.017-.79.053-1.127.106-.777.123-1.396.402-1.872.879-.477.476-.756 1.095-.88 1.872-.052.337-.088.71-.105 1.127-.04 1.059-.061 2.822-.061 5.044 0 2.221.02 3.985.061 5.044.017.417.053.79.106 1.127.123.777.402 1.396.879 1.872.476.477.756-1.095.88-1.872.052-.337.088-.71.105-1.127.04-1.059.061-2.822.061-5.044-.061zm-4.743 1.492h9.486c1.059 0 1.936.02 2.604.061.27.017.433.036.52.053.25.04.417.114.58.277.163.163.237.33.277.58.017.087.036.25.053.52.041.668.061 1.545.061 2.604v9.486c0 1.059-.02 1.936-.061 2.604-.017.27-.036.433-.053.52-.04.25-.114.417-.277.58-.163.163-.33.237.58.277.087.017.25.036.52.053.668-.041 1.545-.061 2.604-.061h-9.486c-1.059 0-1.936-.02-2.604-.061-.27-.017-.433-.036-.52-.053-.25-.04-.417-.114-.58-.277-.163-.163-.237-.33-.277-.58-.017-.087-.036-.25-.053-.52-.041-.668-.061-1.545-.061-2.604v-9.486c0-1.059.02-1.936.061-2.604.017-.27.036-.433.053-.52.04-.25.114.417.277.58.163.163.33.237.58.277.087.017.25.036.52.053.668-.041 1.545-.061 2.604-.061zM12 6.945l-4.223 7.555h8.446L12 6.945z"/></svg>
             Buka Dokumentasi G-Drive
           </a>`
        : "";

    // Deskripsi Logic: HANYA TAMPIL JIKA BERITA
    let descHtml = "";
    if (item.kategori === 'berita' && item.deskripsi && item.deskripsi.trim() !== "") {
        descHtml = `<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span class="text-[10px] text-slate-400 font-bold uppercase mb-2 block tracking-widest border-b border-slate-50 pb-2">Deskripsi Konten</span>
                <div class="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line text-xs">${item.deskripsi}</div>
            </div>`;
    }

    content.innerHTML = `
        <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
            <h3 class="font-bold text-slate-800 text-lg">Detail ${item.kategori === 'berita' ? 'Berita' : 'Dokumentasi'}</h3>
            <button onclick="window.closeModal()" class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <div class="overflow-y-auto custom-scrollbar p-5 bg-slate-50/50">
            <div class="flex flex-col items-center mb-6">
                <div class="relative w-full h-48 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group">
                    <img src="${imgSrc}" class="w-full h-full object-contain p-1">
                    <div class="absolute top-3 right-3">
                         <span class="px-3 py-1 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/20 shadow-lg">${item.kategori}</span>
                    </div>
                </div>
                <h2 class="mt-4 text-lg font-bold text-slate-800 text-center leading-tight px-2">${item.judul}</h2>
                <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    ${item.tanggal}
                </div>
            </div>
            ${descHtml}
            ${gdriveLink}
            <div class="mt-5 pt-4 border-t border-slate-200/60 flex justify-between items-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase">System ID</span>
                <code class="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded select-all break-all max-w-[200px] truncate" title="${item.id}">${item.id}</code>
            </div>
        </div>
        <div class="p-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
            <button onclick="window.editItem('${item.id}'); window.closeModal();" class="flex-1 bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold text-sm uppercase shadow-lg shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2">Edit</button>
            <button onclick="window.hapusItem('${item.id}'); window.closeModal();" class="px-5 py-3 bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl font-bold text-sm uppercase transition-all flex items-center justify-center gap-2">Hapus</button>
        </div>
    `;

    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
    setTimeout(() => {
        content.classList.remove("opacity-0", "scale-95");
        content.classList.add("opacity-100", "scale-100");
    }, 10);
};

window.closeModal = function() {
    document.body.classList.remove('modal-open');
    const overlay = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-content");
    content.classList.remove("opacity-100", "scale-100");
    content.classList.add("opacity-0", "scale-95");
    setTimeout(() => {
        overlay.classList.add("hidden");
        overlay.classList.remove("flex");
        content.innerHTML = "";
    }, 300);
};

const overlayEl = document.getElementById("modal-overlay");
if(overlayEl) {
    overlayEl.addEventListener("click", (e) => {
        if (e.target.id === "modal-overlay") window.closeModal();
    });
}

window.hapusItem = async function (id) {
  const item = window.currentData.find((x) => x.id === id);
  if (!item) return;

  const result = await Swal.fire({
    title: "Hapus Publikasi?",
    text: "Data & Foto akan dihapus permanen!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#0f172a", 
    cancelButtonColor: "#94a3b8",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal"
  });

  if (!result.isConfirmed) return;

  try {
    Swal.fire({ title: "Membersihkan...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    const koleksi = window.activeCollection; 
    const bucket = koleksi === "berita" ? "berita-images" : "dokumentasi-images";
    if (item.img) await window.adminDB.deleteFile(bucket, item.img);
    await window.adminDB.delete(koleksi, id);
    Swal.fire({ title: "Bersih!", icon: "success", timer: 1000, showConfirmButton: false });
  } catch (e) {
    Swal.fire("Error", e.message, "error");
  }
};

window.editItem = function (id) {
  const item = window.currentData.find((x) => x.id === id);
  if (!item) return;

  document.getElementById("data-id").value = item.id;
  document.getElementById("inp-judul").value = item.judul;
  document.getElementById("inp-date").value = item.tanggal;
  document.getElementById("inp-desc").value = item.deskripsi || "";
  document.getElementById("inp-img-url").value = item.img || "";

  const inpGDrive = document.getElementById("inp-gdrive");
  if (inpGDrive) inpGDrive.value = item.gdrive || "";

  if (item.img) {
    document.getElementById("img-preview").src = item.img;
    document.getElementById("preview-container").classList.remove("hidden");
    document.getElementById("upload-placeholder").classList.add("hidden");
  }

  const btn = document.getElementById("btn-submit");
  btn.innerText = "UPDATE DATA";
  btn.className = "w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-200";
  
  if(window.innerWidth < 1024) window.toggleListMobile();
  document.getElementById("form-publikasi").scrollIntoView({ behavior: "smooth" });
};

document.addEventListener("DOMContentLoaded", () => {
  window.currentData = [];
  const dateInput = document.getElementById("inp-date");
  if (dateInput) dateInput.valueAsDate = new Date();

  const inpFile = document.getElementById("inp-file");
  const form = document.getElementById("form-publikasi");

  const searchBox = document.getElementById("search-box");
  if(searchBox) {
    searchBox.addEventListener('keyup', (e) => window.handleSearch(searchBox.value, e));
    searchBox.addEventListener('keydown', (e) => {
        if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
            e.preventDefault(); 
            window.handleSearch(searchBox.value, e);
        }
    });
    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.relative.z-search'); 
        if (searchContainer && !searchContainer.contains(e.target)) {
            document.getElementById("search-suggestions").classList.add("hidden");
        }
    });
  }

  const checkDB = setInterval(() => {
    if (window.adminDB && window.firebaseAuth) {
      clearInterval(checkDB);
      onAuthStateChanged(window.firebaseAuth, (user) => {
        if (user) {
          window.loadData(); 
        } else {
          sessionStorage.removeItem("isLoggedIn");
          window.location.href = "login";
        }
      });
    }
  }, 500);

  window.loadData = function() {
    const koleksi = window.activeCollection;
    window.adminDB.listenList(koleksi, (data) => {
      window.currentData = data;
      renderList(data);
    });
  }

  if (inpFile) {
    inpFile.addEventListener("change", function () {
      if (this.files[0]) {
        // Max 5MB
        if (this.files[0].size > 5 * 1024 * 1024) {
          Swal.fire("File Terlalu Besar", "Max 5MB", "warning");
          this.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById("img-preview").src = e.target.result;
          document.getElementById("preview-container").classList.remove("hidden");
          document.getElementById("upload-placeholder").classList.add("hidden");
        };
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
    const koleksi = window.activeCollection;

    if (!judul) return Swal.fire("Input Kosong", "Judul tidak boleh kosong!", "warning");
    if (!tglVal) return Swal.fire("Input Kosong", "Tanggal harus dipilih!", "warning");
    
    // Validasi deskripsi hanya untuk Berita
    if (koleksi === 'berita' && !deskripsi) return Swal.fire("Input Kosong", "Deskripsi konten berita harus diisi!", "warning");

    if (koleksi === "dokumentasi" && gdrive) {
      const gdrivePattern = /^(https?:\/\/)?(www\.)?(drive\.google\.com|goo\.gl)\/.+$/;
      if (!gdrivePattern.test(gdrive)) {
        return Swal.fire("Link Tidak Valid", "Mohon masukkan link Google Drive yang benar!", "error");
      }
    }

    btnSubmit.innerText = "⏳ MENYIMPAN...";
    btnSubmit.disabled = true;

    try {
      // ID Generator tanpa random
      let docID = currentID || generateSlugID(koleksi, judul, tglVal);
      
      const dateObj = new Date(tglVal);
      const yearStr = dateObj.getFullYear().toString();
      const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");

      let finalUrl = document.getElementById("inp-img-url").value;

      if (file) {
        const bucket = koleksi === "berita" ? "berita-images" : "dokumentasi-images";
        if (currentID && finalUrl) {
          try { await window.adminDB.deleteFile(bucket, finalUrl); } catch (e) {}
        }
        const folderPath = `${yearStr}/${monthStr}/${docID}`;
        finalUrl = await window.adminDB.uploadFile(file, bucket, folderPath);
      }

      // --- PEMISAHAN DATA OBJEK YANG KETAT ---
      const data = {
        kategori: koleksi,
        judul: judul,
        tanggal: tglVal,
        img: finalUrl || "",
        tahun: yearStr,
        bulan: monthStr,
        updatedAt: new Date().toISOString(),
      };

      if (koleksi === "berita") {
        // Jika Berita: Simpan Deskripsi, JANGAN simpan GDrive
        data.deskripsi = deskripsi;
      } else {
        // Jika Dokumentasi: Simpan GDrive, JANGAN simpan Deskripsi
        data.gdrive = gdrive || "";
      }

      await window.adminDB.saveWithId(koleksi, docID, data);
      Swal.fire({ title: "Sukses", text: "Data berhasil disimpan.", icon: "success", timer: 1500, showConfirmButton: false });
      window.resetForm();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      btnSubmit.innerText = currentID ? "UPDATE DATA" : "SIMPAN DATA";
      btnSubmit.disabled = false;
    }
  });

  window.resetForm = () => {
    form.reset();
    document.getElementById("data-id").value = "";
    document.getElementById("inp-img-url").value = "";
    
    // Logic Reset UI
    const koleksi = window.activeCollection;
    const containerGDrive = document.getElementById("container-gdrive");
    const containerDesc = document.getElementById("container-desc");
    
    if (koleksi === 'dokumentasi') {
        if(containerGDrive) containerGDrive.classList.remove("hidden");
        if(containerDesc) containerDesc.classList.add("hidden");
    } else {
        if(containerGDrive) containerGDrive.classList.add("hidden");
        if(containerDesc) containerDesc.classList.remove("hidden");
    }
    
    if (dateInput) dateInput.valueAsDate = new Date();
    
    document.getElementById("preview-container").classList.add("hidden");
    document.getElementById("upload-placeholder").classList.remove("hidden");
    document.getElementById("img-preview").src = "";
    
    const btn = document.getElementById("btn-submit");
    btn.innerText = "SIMPAN DATA";
    btn.className = "w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition shadow-lg shadow-slate-200";
  };
});
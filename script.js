import Swal from 'sweetalert2';

// =========================================
// 1. UI LOGIC (Sidebar & Visual)
// =========================================
window.toggleListMobile = function () {
  const list = document.getElementById("list-container");
  const overlay = document.getElementById("sidebar-overlay");

  if (list && overlay) {
    if (list.classList.contains("-translate-x-full")) {
      list.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    } else {
      list.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Setup Tanggal
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    dateEl.innerText = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Setup Copyright
  const yearElement = document.getElementById("copyright-year");
  if (yearElement) yearElement.innerText = `© ${new Date().getFullYear()}`;

  // Preview Foto Global
  const inpFile = document.getElementById("inp-file");
  if (inpFile) {
    inpFile.addEventListener("change", function () {
      if (this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) =>
          (document.getElementById("img-preview").src = e.target.result);
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
});

// =========================================
// 2. SECURITY & AUTH LOGIC
// =========================================

// Cek status login
const statusLogin = sessionStorage.getItem("isLoggedIn");
const isLoginPage = window.location.pathname.includes("login");

if (!statusLogin && !isLoginPage) {
  window.location.href = "login";
}

// Logic Logout dengan SweetAlert2
const btnLogout = document.getElementById("logoutBtn");
if (btnLogout) {
  btnLogout.addEventListener("click", function (e) {
    e.preventDefault();
    
    Swal.fire({
      title: 'Yakin mau logout?',
      text: "Sesi Anda akan diakhiri.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a', // Sesuai warna tema (Slate-900)
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("userEmail");
        
        Swal.fire({
            title: 'Logout Berhasil',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "login";
        });
      }
    });
  });
}
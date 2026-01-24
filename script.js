import Swal from "sweetalert2";

// UI HELPER
window.toggleListMobile = function () {
  const list = document.getElementById("list-container");
  const overlay = document.getElementById("sidebar-overlay");
  const isClosed = list.classList.contains("-translate-x-full");

  if (isClosed) {
    list.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } else {
    list.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
};

// AUTH LOGIC
document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.getElementById("logoutBtn");
  if (btnLogout) {
    btnLogout.addEventListener("click", function (e) {
      e.preventDefault();
      Swal.fire({
        title: "Yakin mau logout?",
        text: "Sesi Anda akan diakhiri.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#0f172a",
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "Ya, Logout",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          // Hapus sesi
          sessionStorage.removeItem("isLoggedIn");
          sessionStorage.removeItem("userEmail");
          sessionStorage.clear();

          // PERBAIKAN DI SINI: Gunakan kurung () karena ini function
          window.location.replace("login.html"); 
        }
      });
    });
  }
});

// WAKTU OTOMATIS
document.addEventListener("DOMContentLoaded", () => {
  const dateElement = document.getElementById("current-date");

  if (dateElement) {
    const today = new Date();

    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    dateElement.textContent = today.toLocaleDateString("id-ID", options);
  }
});
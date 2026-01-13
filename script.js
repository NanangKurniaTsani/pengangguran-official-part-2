window.toggleListMobile = function () {
  const list = document.getElementById("list-container");
  const overlay = document.getElementById("sidebar-overlay");

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
};

document.addEventListener("DOMContentLoaded", () => {
  // Tanggal
  const dateEl = document.getElementById("current-date");
  if (dateEl)
    dateEl.innerText = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Preview Foto
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

// FOOTER
const yearElement = document.getElementById("copyright-year");
const currentYear = new Date().getFullYear();

if (yearElement) {
  yearElement.innerText = currentYear("&copy;");
}

// CLEAN .HTML
if (!statusLogin) {
  window.location.href = "login";
}

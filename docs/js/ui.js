const CATEGORIES = ["RPG", "Action", "Strategy", "Indie", "Adventure", "Simulator", "Sports", "Horror"];

function applyTheme() {
  document.documentElement.setAttribute("data-bs-theme", Store.getTheme());
  document.documentElement.lang = Store.getLang();
}

function showFlash(message, category = "info") {
  const container = document.getElementById("flash-container");
  if (!container) return;
  const alert = document.createElement("div");
  alert.className = `alert alert-${category} alert-dismissible fade show`;
  alert.role = "alert";
  alert.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  container.appendChild(alert);
}

function readFlashFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const message = params.get("msg");
  const type = params.get("type") || "info";
  if (message) showFlash(decodeURIComponent(message), type);
}

function redirectWithFlash(path, message, type = "info") {
  const url = new URL(path, window.location.href);
  url.searchParams.set("msg", message);
  url.searchParams.set("type", type);
  window.location.href = url.pathname + url.search;
}

function renderNavbar() {
  const nav = document.getElementById("navbar");
  if (!nav) return;
  const user = Store.getCurrentUser();
  const theme = Store.getTheme();
  const lang = Store.getLang();
  const nextTheme = theme === "light" ? "dark" : "light";
  const nextLang = lang === "ru" ? "en" : "ru";

  let authLinks = `
    <a class="btn btn-outline-light btn-sm" href="login.html">${t("login")}</a>
    <a class="btn btn-primary btn-sm" href="register.html">${t("register")}</a>`;
  let navItems = "";

  if (user) {
    navItems = `
      <li class="nav-item"><a class="nav-link" href="cart.html">${t("cart")} (${user.cart.length})</a></li>
      <li class="nav-item"><a class="nav-link" href="profile.html">${t("profile")}</a></li>`;
    if (user.isAdmin || Store._state?.adminLoginUserId) {
      navItems += `<li class="nav-item"><a class="nav-link" href="admin.html">${t("admin_panel")}</a></li>`;
      if (Store._state?.adminLoginUserId) {
        navItems += `<li class="nav-item"><a class="nav-link" href="#" id="return-to-admin-btn">Вернуться в админку</a></li>`;
      }
    }
    authLinks = `
      <span class="badge text-bg-success align-self-center">${t("balance")}: ${formatPrice(user.balance)}</span>
      <a class="btn btn-outline-light btn-sm" href="#" id="logout-btn">${t("logout")}</a>`;
  }

  nav.innerHTML = `
    <div class="container">
      <a class="navbar-brand fw-bold" href="index.html">${t("store_name")}</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" href="index.html">${t("catalog")}</a></li>
          ${navItems}
        </ul>
        <div class="d-flex gap-2">
          <a class="btn btn-outline-light btn-sm" href="#" id="theme-btn" title="${t("theme")}">💡</a>
          <a class="btn btn-outline-light btn-sm" href="#" id="lang-btn" title="${t("language")}">🌐 ${lang.toUpperCase()}</a>
          ${authLinks}
        </div>
      </div>
    </div>`;

  document.getElementById("theme-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    Store.setTheme(nextTheme);
    applyTheme();
    renderNavbar();
  });

  document.getElementById("lang-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    Store.setLang(nextLang);
    applyTheme();
    renderNavbar();
    if (typeof window.onLangChange === "function") window.onLangChange();
  });

  document.getElementById("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    const result = Store.logout();
    redirectWithFlash("index.html", result.message, "info");
  });

  document.getElementById("return-to-admin-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    const result = Store.returnToAdmin();
    if (result.ok) {
      redirectWithFlash("admin.html", result.message, "success");
    }
  });
}

function requireAuth() {
  if (!Store.isLoggedIn()) {
    redirectWithFlash("login.html", "Please sign in first.", "warning");
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!requireAuth()) return false;
  const user = Store.getCurrentUser();
  if (!user?.isAdmin) {
    redirectWithFlash("index.html", "Access denied.", "danger");
    return false;
  }
  return true;
}

function avatarUrl(user) {
  if (user.avatarUrl) return user.avatarUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=6c757d&color=ffffff&size=200`;
}

async function initPage(options = {}) {
  await Store.init();
  applyTheme();
  renderNavbar();
  readFlashFromUrl();
  if (options.requireAuth && !requireAuth()) return false;
  if (options.requireAdmin && !requireAdmin()) return false;
  return true;
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

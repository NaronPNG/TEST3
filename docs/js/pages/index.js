const CATEGORIES_LIST = ["RPG", "Action", "Strategy", "Indie", "Adventure", "Simulator", "Sports", "Horror"];

function getFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get("search") || "",
    category: params.get("category") || "",
    min_price: params.get("min_price") || "",
    max_price: params.get("max_price") || "",
    sort: params.get("sort") || "id_asc",
  };
}

function renderCatalog() {
  const filters = getFilters();
  const entries = Store.filterGames(filters);
  const user = Store.getCurrentUser();
  const main = document.getElementById("main");

  const categoryOptions = CATEGORIES_LIST.map(
    (cat) =>
      `<option value="${cat}" ${filters.category === cat ? "selected" : ""}>${cat}</option>`
  ).join("");

  const cards = entries
    .map((entry) => {
      const game = entry.game;
      const priceLabel =
        entry.min_price === entry.max_price
          ? formatPrice(entry.min_price)
          : `от ${formatPrice(entry.min_price)}`;
      const versionsLine =
        entry.versions_count > 1
          ? `<p class="card-text small text-secondary mb-1">Доступно изданий: ${entry.versions_count}</p>`
          : "";

      let actions = "";
      if (user) {
        const owned = user.purchased.includes(game.id);
        if (owned) {
          actions += `<button class="btn btn-success btn-sm" disabled>${t("already_owned")}</button>`;
        } else if (user.balance >= game.price) {
          actions += `<button class="btn btn-success btn-sm w-100 buy-btn" data-id="${game.id}">${t("buy")}</button>`;
        } else {
          actions += `<button class="btn btn-secondary btn-sm" disabled>${t("not_enough_funds")}</button>`;
        }
        if (!owned) {
          actions += `<button class="btn btn-primary btn-sm w-100 cart-btn" data-id="${game.id}">${t("add_to_cart")}</button>`;
        }
      }

      return `
        <div class="card game-card bg-dark-subtle border-secondary">
          <img src="${escapeHtml(game.image_url)}" class="card-img-top game-image" alt="${escapeHtml(entry.base_name)}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fs-6">${escapeHtml(entry.base_name)}</h5>
            <p class="card-text small text-secondary mb-2">${escapeHtml(game.category)} | ${game.release_year}</p>
            ${versionsLine}
            <p class="fw-bold mb-2">${priceLabel}</p>
            <div class="mt-auto d-grid gap-2">
              <a href="game.html?id=${game.id}" class="btn btn-outline-light btn-sm">${t("details")}</a>
              ${actions}
            </div>
          </div>
        </div>`;
    })
    .join("");

  main.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="h3 m-0">${t("game_catalog")}</h1>
      <span class="text-secondary">${t("total")}: ${entries.length}</span>
    </div>
    <form method="get" class="card p-3 mb-4 bg-dark-subtle border-secondary">
      <div class="row g-2">
        <div class="col-12 col-md-4">
          <input type="text" class="form-control" name="search" placeholder="Поиск по названию или разработчику" value="${escapeHtml(filters.search)}">
        </div>
        <div class="col-6 col-md-2">
          <select class="form-select" name="category">
            <option value="">Все категории</option>
            ${categoryOptions}
          </select>
        </div>
        <div class="col-6 col-md-2">
          <input type="number" step="0.01" min="0" class="form-control" name="min_price" placeholder="Цена от" value="${escapeHtml(filters.min_price)}">
        </div>
        <div class="col-6 col-md-2">
          <input type="number" step="0.01" min="0" class="form-control" name="max_price" placeholder="Цена до" value="${escapeHtml(filters.max_price)}">
        </div>
        <div class="col-6 col-md-2">
          <select class="form-select" name="sort">
            <option value="id_asc" ${filters.sort === "id_asc" ? "selected" : ""}>Сначала старые</option>
            <option value="id_desc" ${filters.sort === "id_desc" ? "selected" : ""}>Сначала новые</option>
            <option value="price_asc" ${filters.sort === "price_asc" ? "selected" : ""}>Цена: по возрастанию</option>
            <option value="price_desc" ${filters.sort === "price_desc" ? "selected" : ""}>Цена: по убыванию</option>
            <option value="name_asc" ${filters.sort === "name_asc" ? "selected" : ""}>Название: А-Я</option>
            <option value="name_desc" ${filters.sort === "name_desc" ? "selected" : ""}>Название: Я-А</option>
            <option value="year_desc" ${filters.sort === "year_desc" ? "selected" : ""}>Год: новые</option>
            <option value="year_asc" ${filters.sort === "year_asc" ? "selected" : ""}>Год: старые</option>
          </select>
        </div>
      </div>
      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-primary">${t("apply")}</button>
        <a href="index.html" class="btn btn-outline-light">${t("reset")}</a>
      </div>
    </form>
    <div class="games-grid">${cards || '<p class="text-secondary">Ничего не найдено.</p>'}</div>`;

  main.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const result = Store.buyGame(btn.dataset.id);
      redirectWithFlash("profile.html", result.message, result.type || (result.ok ? "success" : "danger"));
    });
  });

  main.querySelectorAll(".cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const result = Store.addToCart(btn.dataset.id);
      redirectWithFlash("index.html" + window.location.search, result.message, result.type || (result.ok ? "success" : "warning"));
    });
  });
}

window.onLangChange = () => renderCatalog();

document.addEventListener("DOMContentLoaded", async () => {
  if (await initPage()) renderCatalog();
  const adminLoginId = Store._state?.adminLoginUserId;
  if (adminLoginId) {
    const adminLink = document.createElement("li");
    adminLink.className = "nav-item";
    adminLink.innerHTML = '<a class="nav-link" href="#" id="return-to-admin-btn">Вернуться в админку</a>';
    document.querySelector(".navbar-nav").appendChild(adminLink);
    document.getElementById("return-to-admin-btn").addEventListener("click", (e) => {
      e.preventDefault();
      const result = Store.returnToAdmin();
      if (result.ok) {
        redirectWithFlash("admin.html", result.message, "success");
      }
    });
  }
});

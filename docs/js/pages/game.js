function renderGameDetail() {
  const gameId = getQueryParam("id") || getQueryParam("edition_id");
  const editionId = getQueryParam("edition_id");
  const game = Store.getGame(gameId);
  const main = document.getElementById("main");

  if (!game) {
    main.innerHTML = '<p class="text-danger">Игра не найдена.</p>';
    return;
  }

  const [baseName] = splitGameTitle(game.name);
  const versions = getVersionsForBase(Store.getGames(), baseName);
  const selectedId = editionId ? Number(editionId) : game.id;
  const selected = versions.find((v) => v.id === selectedId) || versions[0] || game;
  const user = Store.getCurrentUser();
  const owned = user && user.purchased.includes(selected.id);
  const inCart = user && user.cart.includes(selected.id);

  const editionSelect =
    versions.length > 1
      ? `<label for="edition_id" class="form-label">Версия игры</label>
         <select id="edition_id" class="form-select mb-3">
           ${versions
             .map((v) => {
               const [, label] = splitGameTitle(v.name);
               return `<option value="${v.id}" ${v.id === selected.id ? "selected" : ""}>${escapeHtml(label || v.name)} — ${formatPrice(v.price)}</option>`;
             })
             .join("")}
         </select>`
      : "";

  let actions = '<a class="btn btn-primary" href="login.html">Войдите для покупки</a>';
  if (user) {
    if (owned) {
      actions = '<span class="badge text-bg-success">Уже куплена</span>';
    } else {
      const parts = [];
      if (user.balance >= selected.price) {
        parts.push(`<button class="btn btn-success" id="buy-btn">Купить сейчас</button>`);
      } else {
        parts.push('<button class="btn btn-secondary" disabled>Недостаточно средств</button>');
      }
      if (!inCart) {
        parts.push(`<button class="btn btn-primary" id="cart-btn">Добавить в корзину</button>`);
      }
      actions = `<div class="d-flex gap-2">${parts.join("")}</div>`;
    }
  }

  main.innerHTML = `
    <div class="row g-4">
      <div class="col-md-5">
        <img src="${escapeHtml(selected.image_url)}" class="img-fluid rounded border border-secondary" alt="${escapeHtml(baseName)}">
      </div>
      <div class="col-md-7">
        <h1 class="h3">${escapeHtml(baseName)}</h1>
        <p class="text-secondary">${escapeHtml(selected.category)} | ${escapeHtml(selected.developer)} | ${selected.release_year}</p>
        ${editionSelect}
        <p>${escapeHtml(selected.description)}</p>
        <p class="fs-4 fw-bold">${formatPrice(selected.price)}</p>
        ${actions}
      </div>
    </div>`;

  document.getElementById("edition_id")?.addEventListener("change", (e) => {
    window.location.href = `game.html?id=${game.id}&edition_id=${e.target.value}`;
  });

  document.getElementById("buy-btn")?.addEventListener("click", () => {
    const result = Store.buyGame(selected.id);
    redirectWithFlash("profile.html", result.message, result.type || "success");
  });

  document.getElementById("cart-btn")?.addEventListener("click", () => {
    const result = Store.addToCart(selected.id);
    redirectWithFlash(`game.html?id=${game.id}&edition_id=${selected.id}`, result.message, result.type || "success");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (await initPage()) renderGameDetail();
});

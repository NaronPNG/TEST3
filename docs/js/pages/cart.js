function renderCart() {
  const user = Store.getCurrentUser();
  const main = document.getElementById("main");
  const cartGames = user.cart.map((id) => Store.getGame(id)).filter(Boolean);
  const total = cartGames.reduce((sum, g) => sum + g.price, 0);

  if (!cartGames.length) {
    main.innerHTML = `<h1 class="h3 mb-3">${t("cart_title")}</h1><p class="text-secondary">${t("cart_empty")}</p>`;
    return;
  }

  const rows = cartGames
    .map(
      (game) => `
    <tr>
      <td><input class="form-check-input game-checkbox" type="checkbox" value="${game.id}" data-price="${game.price}"></td>
      <td><a href="game.html?id=${game.id}" class="link-light">${escapeHtml(game.name)}</a></td>
      <td>${formatPrice(game.price)}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-danger remove-btn" data-id="${game.id}">${t("remove")}</button></td>
    </tr>`
    )
    .join("");

  main.innerHTML = `
    <h1 class="h3 mb-3">${t("cart_title")}</h1>
    <div class="d-flex flex-wrap gap-3 align-items-center mb-3">
      <span class="badge text-bg-primary">${t("added_games")}: ${cartGames.length}</span>
      <span class="badge text-bg-info">${t("total_price")}: ${formatPrice(total)}</span>
      <span class="badge text-bg-secondary" id="selectedSummary">${t("selected")}: 0 игр на 0.00 ₽</span>
    </div>
    <form id="checkout-form">
      <div class="card bg-dark-subtle border-secondary">
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style="width:50px;"><input class="form-check-input" type="checkbox" id="selectAll"></th>
                <th>${t("game")}</th>
                <th>${t("price")}</th>
                <th class="text-end">${t("action")}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <h2 class="h5 m-0">${t("total_price")}: ${formatPrice(total)}</h2>
        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-primary" id="buy-selected-btn">${t("buy_selected")}</button>
          <button type="button" class="btn btn-success" id="buy-all-btn">${t("buy_all")}</button>
        </div>
      </div>
    </form>`;

  const selectAll = document.getElementById("selectAll");
  const checkboxes = Array.from(document.querySelectorAll(".game-checkbox"));
  const selectedSummary = document.getElementById("selectedSummary");

  function updateSelectedSummary() {
    const selected = checkboxes.filter((cb) => cb.checked);
    const selectedTotal = selected.reduce((sum, cb) => sum + Number(cb.dataset.price), 0);
    selectedSummary.textContent = `${t("selected")}: ${selected.length} игр на ${selectedTotal.toFixed(2)} ₽`;
    if (selectAll) selectAll.checked = checkboxes.length > 0 && selected.length === checkboxes.length;
  }

  selectAll?.addEventListener("change", () => {
    checkboxes.forEach((cb) => {
      cb.checked = selectAll.checked;
    });
    updateSelectedSummary();
  });

  checkboxes.forEach((cb) => cb.addEventListener("change", updateSelectedSummary));
  updateSelectedSummary();

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const result = Store.removeFromCart(btn.dataset.id);
      redirectWithFlash("cart.html", result.message, "info");
    });
  });

  document.getElementById("buy-all-btn").addEventListener("click", () => {
    const result = Store.checkoutAll();
    redirectWithFlash("profile.html", result.message, result.type || (result.ok ? "success" : "danger"));
  });

  document.getElementById("checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const ids = checkboxes.filter((cb) => cb.checked).map((cb) => cb.value);
    const result = Store.checkoutSelected(ids);
    redirectWithFlash("profile.html", result.message, result.type || (result.ok ? "success" : "danger"));
  });
}

window.onLangChange = () => renderCart();

document.addEventListener("DOMContentLoaded", async () => {
  if (await initPage({ requireAuth: true })) renderCart();
});

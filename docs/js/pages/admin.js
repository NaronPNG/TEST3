function renderAdmin() {
  const games = Store.getGames();
  const cards = buildAdminGameCards(games);
  const users = Store.getUsers();
  const current = Store.getCurrentUser();
  const main = document.getElementById("main");

  const gameRows = cards
    .map((game) => {
      const price =
        game.min_price === game.max_price
          ? formatPrice(game.min_price)
          : `${formatPrice(game.min_price)} - ${formatPrice(game.max_price)}`;
      return `
        <tr>
          <td>${game.card_id}</td>
          <td>${escapeHtml(game.base_name)}</td>
          <td>${game.versions_count}</td>
          <td>${price}</td>
          <td class="text-end">
            <a class="btn btn-sm btn-outline-warning" href="admin-edit-game.html?id=${game.game_id}">Изменить</a>
            <button class="btn btn-sm btn-outline-danger delete-game-btn" data-id="${game.game_id}">Удалить</button>
          </td>
        </tr>`;
    })
    .join("");

  const userItems = users
    .map((user) => {
      const deleteBtn =
        user.id !== current.id
          ? `<button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}">Удалить</button>`
          : "";
      return `
        <li class="list-group-item bg-transparent text-light">
          <div class="d-flex justify-content-between">
            <span>${escapeHtml(user.username)}${user.isAdmin ? " (admin)" : ""}</span>
            <span>${formatPrice(user.balance)}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <small class="text-secondary">${escapeHtml(user.email)}</small>
            <div class="d-flex gap-2">
              <a class="btn btn-sm btn-outline-light" href="admin-user.html?id=${user.id}">Профиль</a>
              ${deleteBtn}
            </div>
          </div>
          <form class="d-flex gap-2 admin-topup-form" data-id="${user.id}">
            <input type="number" min="1" step="0.01" name="amount" class="form-control form-control-sm" placeholder="Пополнить на сумму (₽)" required>
            <button class="btn btn-sm btn-success">Пополнить</button>
          </form>
          <form class="d-flex gap-2 mt-2 admin-withdraw-form" data-id="${user.id}">
            <input type="number" min="1" step="0.01" name="amount" class="form-control form-control-sm" placeholder="Списать сумму (₽)" required>
            <button class="btn btn-sm btn-danger">Списать</button>
          </form>
        </li>`;
    })
    .join("");

  main.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="h3 m-0">Админ-панель</h1>
      <a class="btn btn-primary" href="admin-add-game.html">Добавить игру</a>
    </div>
    <div class="row g-3">
      <div class="col-lg-8">
        <div class="card bg-dark-subtle border-secondary">
          <div class="card-header">Главные карточки игр (${cards.length})</div>
          <div class="table-responsive">
            <table class="table table-dark table-striped mb-0">
              <thead>
                <tr><th>ID</th><th>Название</th><th>Изданий</th><th>Цена</th><th class="text-end">Действия</th></tr>
              </thead>
              <tbody>${gameRows}</tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card bg-dark-subtle border-secondary">
          <div class="card-header">Пользователи (${users.length})</div>
          <ul class="list-group list-group-flush">${userItems}</ul>
        </div>
      </div>
    </div>
    <p class="text-secondary small mt-3">Данные хранятся в localStorage браузера. На GitHub Pages у каждого посетителя свой отдельный «магазин».</p>`;

  document.querySelectorAll(".delete-game-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Удалить эту игру? Действие необратимо.")) return;
      const result = Store.deleteGame(btn.dataset.id);
      redirectWithFlash("admin.html", result.message, result.type || "info");
    });
  });

  document.querySelectorAll(".delete-user-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const user = Store.getUser(btn.dataset.id);
      if (!confirm(`Удалить пользователя ${user?.username}?`)) return;
      const result = Store.deleteUser(Number(btn.dataset.id));
      redirectWithFlash("admin.html", result.message, result.type || "info");
    });
  });

  document.querySelectorAll(".admin-topup-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const result = Store.adminTopup(Number(form.dataset.id), parseFloat(form.amount.value));
      redirectWithFlash("admin.html", result.message, result.ok ? "success" : "danger");
    });
  });

  document.querySelectorAll(".admin-withdraw-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const result = Store.adminWithdraw(Number(form.dataset.id), parseFloat(form.amount.value));
      redirectWithFlash("admin.html", result.message, result.ok ? "success" : "danger");
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (await initPage({ requireAdmin: true })) renderAdmin();
});

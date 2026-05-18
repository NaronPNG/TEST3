function renderAdminUser() {
  const userId = getQueryParam("id");
  const user = Store.getUser(userId);
  const main = document.getElementById("main");

  if (!user) {
    main.innerHTML = '<p class="text-danger">Пользователь не найден.</p>';
    return;
  }

  const purchased = user.purchased.map((id) => Store.getGame(id)).filter(Boolean);
  const purchasedHtml = purchased.length
    ? `<ul class="list-group list-group-flush">
        ${purchased
          .map(
            (game) => `
          <li class="list-group-item bg-transparent text-light d-flex justify-content-between">
            <a class="link-light text-decoration-none" href="game.html?id=${game.id}">${escapeHtml(game.name)}</a>
            <span>${formatPrice(game.price)}</span>
          </li>`
          )
          .join("")}
       </ul>`
    : '<p class="text-secondary mb-0">У пользователя пока нет покупок.</p>';

  main.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="h4 m-0">Профиль пользователя: ${escapeHtml(user.username)}</h1>
      <div class="d-flex gap-2">
        <button class="btn btn-primary btn-sm login-as-btn" data-id="${user.id}">Войти как этот пользователь</button>
        <a href="admin.html" class="btn btn-outline-light btn-sm">Назад в админку</a>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-4">
        <div class="card p-3 bg-dark-subtle border-secondary h-100">
          <h2 class="h6">Данные аккаунта</h2>
          <div class="text-center mb-3">
            <img src="${avatarUrl(user)}" alt="Аватар" class="rounded-circle border border-secondary" style="width:140px;height:140px;object-fit:cover;">
          </div>
          <p class="mb-1"><strong>ID:</strong> ${user.id}</p>
          <p class="mb-1"><strong>Логин:</strong> ${escapeHtml(user.username)}</p>
          <p class="mb-1"><strong>Email:</strong> ${escapeHtml(user.email)}</p>
          <p class="mb-1"><strong>Роль:</strong> ${user.isAdmin ? "Администратор" : "Пользователь"}</p>
          <p class="mb-0"><strong>Баланс:</strong> ${formatPrice(user.balance)}</p>
        </div>
      </div>
      <div class="col-md-8">
        <div class="card p-3 bg-dark-subtle border-secondary h-100">
          <h2 class="h6">Купленные игры (${purchased.length})</h2>
          ${purchasedHtml}
        </div>
      </div>
    </div>`;

  document.querySelector(".login-as-btn")?.addEventListener("click", () => {
    const result = Store.loginAsUser(user.id);
    redirectWithFlash("index.html", result.message, result.ok ? "success" : "danger");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (await initPage({ requireAdmin: true })) renderAdminUser();
});

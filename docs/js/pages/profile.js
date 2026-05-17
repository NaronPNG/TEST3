function renderProfile() {
  const user = Store.getCurrentUser();
  const main = document.getElementById("main");
  const purchased = user.purchased.map((id) => Store.getGame(id)).filter(Boolean);

  const purchasedHtml = purchased.length
    ? `<ul class="list-group list-group-flush">
        ${purchased
          .map(
            (game) => `
          <li class="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center gap-3">
            <div class="d-flex align-items-center gap-3">
              <img src="${escapeHtml(game.image_url)}" alt="${escapeHtml(game.name)}" class="rounded border border-secondary" style="width:72px;height:45px;object-fit:cover;">
              <a class="link-light text-decoration-none" href="game.html?id=${game.id}">${escapeHtml(game.name)}</a>
            </div>
            <span class="fw-semibold">${formatPrice(game.price)}</span>
          </li>`
          )
          .join("")}
       </ul>`
    : '<p class="text-secondary mb-0">Пока нет покупок.</p>';

  main.innerHTML = `
    <h1 class="h3 mb-3">${t("profile_title")}</h1>
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card p-3 bg-dark-subtle border-secondary h-100">
          <h2 class="h6">Пользователь</h2>
          <div class="text-center mb-3">
            <img src="${avatarUrl(user)}" alt="Аватар" class="rounded-circle border border-secondary" style="width:140px;height:140px;object-fit:cover;" id="avatar-preview">
          </div>
          <p class="mb-1">${escapeHtml(user.username)}</p>
          <p class="mb-1 text-secondary">${escapeHtml(user.email)}</p>
          <p class="fw-bold mt-2 mb-2">Баланс: ${formatPrice(user.balance)}</p>
          <form id="topup-form" class="d-flex gap-2">
            <input type="number" min="1" step="0.01" name="amount" class="form-control" placeholder="Сумма" required>
            <button class="btn btn-success">Пополнить</button>
          </form>
          <form id="avatar-form" class="mt-3">
            <label class="form-label">Сменить аватар</label>
            <input type="file" name="avatar_file" accept=".png,.jpg,.jpeg,.webp,.gif" class="form-control mb-2" required>
            <button class="btn btn-outline-light w-100">Загрузить аватар</button>
          </form>
          <button class="btn btn-outline-danger w-100 mt-3" id="delete-profile-btn">Удалить мой профиль</button>
        </div>
      </div>
      <div class="col-md-8">
        <div class="card p-3 bg-dark-subtle border-secondary h-100">
          <h2 class="h6">${t("purchased_games")}</h2>
          ${purchasedHtml}
        </div>
      </div>
    </div>`;

  document.getElementById("topup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(e.target.amount.value);
    const result = Store.topup(amount);
    redirectWithFlash("profile.html", result.message, result.ok ? "success" : "danger");
  });

  document.getElementById("avatar-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = e.target.avatar_file.files[0];
    if (!file) return;
    const dataUrl = await readImageAsDataUrl(file);
    const result = Store.setAvatar(dataUrl);
    redirectWithFlash("profile.html", result.message, "success");
  });

  document.getElementById("delete-profile-btn").addEventListener("click", () => {
    if (!confirm("Удалить ваш аккаунт? Это действие необратимо.")) return;
    const result = Store.deleteOwnProfile();
    redirectWithFlash("index.html", result.message, "info");
  });
}

window.onLangChange = () => renderProfile();

document.addEventListener("DOMContentLoaded", async () => {
  if (await initPage({ requireAuth: true })) renderProfile();
});

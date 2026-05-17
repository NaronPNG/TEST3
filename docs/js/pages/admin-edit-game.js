function renderEditForm() {
  const gameId = getQueryParam("id");
  const game = Store.getGame(gameId);
  const main = document.getElementById("main");

  if (!game) {
    main.innerHTML = '<p class="text-danger">Игра не найдена.</p>';
    return;
  }

  const [baseName] = splitGameTitle(game.name);
  const versions = getVersionsForBase(Store.getGames(), baseName);

  main.innerHTML = `
    <h1 class="h4 mb-3">Редактирование игры #${game.id}</h1>
    <div class="alert alert-info">Вы редактируете: <strong>${escapeHtml(baseName)}</strong> (изданий: ${versions.length}).</div>
    <form id="edit-game-form" class="card p-3 bg-dark-subtle border-secondary">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Название</label>
          <input class="form-control" name="name" value="${escapeHtml(game.name)}" required>
        </div>
        <div class="col-md-3">
          <label class="form-label">Цена (₽)</label>
          <input class="form-control" type="number" min="0.01" step="0.01" name="price" value="${game.price}" required>
        </div>
        <div class="col-md-3">
          <label class="form-label">Год релиза</label>
          <input class="form-control" type="number" min="1980" max="2030" name="release_year" value="${game.release_year}" required>
        </div>
        <div class="col-md-4">
          <label class="form-label">Категория</label>
          <input class="form-control" name="category" value="${escapeHtml(game.category)}" required>
        </div>
        <div class="col-md-4">
          <label class="form-label">Разработчик</label>
          <input class="form-control" name="developer" value="${escapeHtml(game.developer)}" required>
        </div>
        <div class="col-md-4">
          <label class="form-label">URL картинки</label>
          <input class="form-control" name="image_url" value="${escapeHtml(game.image_url)}">
        </div>
        <div class="col-md-4">
          <label class="form-label">Загрузить новый файл</label>
          <input class="form-control" type="file" name="image_file" accept=".png,.jpg,.jpeg,.webp,.gif">
        </div>
        <div class="col-12">
          <label class="form-label">Описание (100+ символов)</label>
          <textarea class="form-control" name="description" rows="5" required>${escapeHtml(game.description)}</textarea>
        </div>
      </div>
      <div class="mt-3 d-flex gap-2">
        <button class="btn btn-primary">Сохранить изменения</button>
        <a class="btn btn-outline-light" href="admin.html">Отмена</a>
      </div>
    </form>`;

  document.getElementById("edit-game-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    let imageUrl = form.image_url.value.trim();
    const file = form.image_file.files[0];
    if (file) imageUrl = await readImageAsDataUrl(file);

    const result = Store.updateGame(game.id, {
      name: form.name.value,
      price: form.price.value,
      release_year: form.release_year.value,
      category: form.category.value,
      developer: form.developer.value,
      description: form.description.value,
      image_url: imageUrl || game.image_url,
    });

    redirectWithFlash("admin.html", result.message, result.ok ? "success" : "danger");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (await initPage({ requireAdmin: true })) renderEditForm();
});

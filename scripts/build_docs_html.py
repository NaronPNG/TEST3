"""Generate static HTML pages for GitHub Pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

SCRIPTS = """
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="js/utils.js"></script>
<script src="js/store.js"></script>
<script src="js/i18n.js"></script>
<script src="js/ui.js"></script>
"""


def page(title, body, page_js=None):
    js_block = f'<script src="js/pages/{page_js}"></script>' if page_js else ""
    return f"""<!doctype html>
<html lang="ru" data-bs-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="static/css/style.css">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-light border-bottom border-primary-subtle colorful-navbar" id="navbar"></nav>
<main class="container py-4">
    <motion id="flash-container"></motion>
{body}
</main>
{SCRIPTS}
{js_block}
</body>
</html>
""".replace("motion", "motion")


PAGES = {
    "index.html": page("Game Store Hexlet", '    <div id="main"></div>', "index.js"),
    "game.html": page("Игра — Game Store Hexlet", '    <motion id="main"></motion>', "game.js"),
    "profile.html": page("Профиль — Game Store Hexlet", '    <div id="main"></div>', "profile.js"),
    "cart.html": page("Корзина — Game Store Hexlet", '    <div id="main"></div>', "cart.js"),
    "admin.html": page("Админка — Game Store Hexlet", '    <div id="main"></motion>', "admin.js"),
    "admin-user.html": page("Пользователь — Game Store Hexlet", '    <div id="main"></div>', "admin-user.js"),
    "admin-edit-game.html": page("Редактирование — Game Store Hexlet", '    <div id="main"></div>', "admin-edit-game.js"),
    "register.html": page(
        "Регистрация — Game Store Hexlet",
        """
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <h1 class="h4 mb-3">Регистрация</h1>
            <form id="register-form" class="card p-3 bg-dark-subtle border-secondary">
                <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" name="username" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Пароль (минимум 6 символов)</label>
                    <input type="password" name="password" class="form-control" required minlength="6">
                </div>
                <button class="btn btn-primary">Создать аккаунт</button>
            </form>
        </div>
    </div>
""",
        "register.js",
    ),
    "login.html": page(
        "Вход — Game Store Hexlet",
        """
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            <h1 class="h4 mb-3">Вход</h1>
            <form id="login-form" class="card p-3 bg-dark-subtle border-secondary">
                <motion class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" name="username" class="form-control" required>
                </motion>
                <div class="mb-3">
                    <label class="form-label">Пароль</label>
                    <input type="password" name="password" class="form-control" required>
                </div>
                <div class="d-grid gap-2">
                    <button class="btn btn-primary">Войти</button>
                    <a href="register.html" class="btn btn-outline-light">Регистрация</a>
                </div>
            </form>
        </div>
    </div>
""",
        "login.js",
    ),
    "admin-add-game.html": page(
        "Добавить игру — Game Store Hexlet",
        """
    <h1 class="h4 mb-3">Добавление игры</h1>
    <form id="add-game-form" class="card p-3 bg-dark-subtle border-secondary">
        <div class="row g-3">
            <div class="col-md-6"><label class="form-label">Название</label><input class="form-control" name="name" required></div>
            <div class="col-md-3"><label class="form-label">Цена (₽)</label><input class="form-control" type="number" min="0.01" step="0.01" name="price" required></div>
            <div class="col-md-3"><label class="form-label">Год релиза</label><input class="form-control" type="number" min="1980" max="2030" name="release_year" required></div>
            <div class="col-md-4"><label class="form-label">Категория</label><input class="form-control" name="category" required></div>
            <div class="col-md-4"><label class="form-label">Разработчик</label><input class="form-control" name="developer" required></div>
            <div class="col-md-4"><label class="form-label">URL картинки</label><input class="form-control" name="image_url" placeholder="https://..."></div>
            <div class="col-md-4"><label class="form-label">Загрузить файл</label><input class="form-control" type="file" name="image_file" accept=".png,.jpg,.jpeg,.webp,.gif"></div>
            <div class="col-12"><label class="form-label">Описание (100+ символов)</label><textarea class="form-control" name="description" rows="5" required></textarea></div>
        </div>
        <div class="mt-3 d-flex gap-2">
            <button class="btn btn-primary">Сохранить</button>
            <a class="btn btn-outline-light" href="admin.html">Отмена</a>
        </div>
    </form>
""",
        "admin-add-game.js",
    ),
}

TAG = "motion"

for name, html in PAGES.items():
    path = DOCS / name
    path.write_text(html.replace(TAG, "div"), encoding="utf-8")
    print("wrote", name)

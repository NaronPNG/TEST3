const DEFAULT_GAMES = [
  {
    id: 1,
    name: "The Witcher 3: Wild Hunt (Standard Edition)",
    price: 1311.0,
    description: "Epic RPG from CD Projekt RED with amazing storyline and open world.",
    image_url: "static/images/games/046f75a44c354e8789eca4aa5e685062.jpg",
    category: "RPG",
    developer: "CD Projekt RED",
    release_year: 2015
  },
  {
    id: 2,
    name: "Cyberpunk 2077 (Standard Edition)",
    price: 2499.0,
    description: "Futuristic RPG set in Night City.",
    image_url: "static/images/games/15b82e60c2e048d2b21250bc8c67aa53.png",
    category: "RPG",
    developer: "CD Projekt RED",
    release_year: 2020
  }
];

const ADMIN_PASSWORD_SHA256 = "admin123456";
const STORAGE_KEY = "gameStoreHexlet";
const STORAGE_VERSION = 3;
const DATA_VERSION = 1;

const Store = {
  _state: null,
  _ready: null,

  async init() {
    if (this._ready) return this._ready;
    this._ready = this._load();
    return this._ready;
  },

  async _load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    let savedData = null;
    if (saved) {
      try {
        savedData = JSON.parse(saved);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    if (savedData && savedData._version === STORAGE_VERSION) {
      this._state = savedData;
      this._state.settings = this._state.settings || { theme: "light", lang: "ru" };
      console.log("Store: loaded from localStorage", this._state.games?.length, "games");
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    console.log("Store: loading from games.json");
    try {
      const response = await fetch("data/games.json");
      console.log("Store: fetch response", response.status, response.url);
      if (!response.ok) throw new Error("Failed to load games.json");
      const games = await response.json();
      console.log("Store: loaded", games.length, "games");
      this._state = {
        _version: STORAGE_VERSION,
        version: DATA_VERSION,
        games,
        users: [
          {
            id: 1,
            username: "admin",
            email: "admin@gamestore.local",
            passwordHash: ADMIN_PASSWORD_SHA256,
            avatarUrl: null,
            isAdmin: true,
            balance: 50000,
            cart: [],
            purchased: [],
          },
        ],
        nextUserId: 2,
        nextGameId: Math.max(0, ...games.map((g) => g.id)) + 1,
        currentUserId: null,
        settings: { theme: "light", lang: "ru" },
      };
      this._persist();
    } catch (e) {
      console.error("Store init error:", e);
      this._state = {
        _version: STORAGE_VERSION,
        version: DATA_VERSION,
        games: DEFAULT_GAMES,
        users: [
          {
            id: 1,
            username: "admin",
            email: "admin@gamestore.local",
            passwordHash: ADMIN_PASSWORD_SHA256,
            avatarUrl: null,
            isAdmin: true,
            balance: 50000,
            cart: [],
            purchased: [],
          },
        ],
        nextUserId: 2,
        nextGameId: Math.max(0, ...DEFAULT_GAMES.map((g) => g.id)) + 1,
        currentUserId: null,
        settings: { theme: "light", lang: "ru" },
      };
    }
  },

  _persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
  },

  getGames() {
    return [...this._state.games];
  },

  getGame(id) {
    return this._state.games.find((g) => g.id === Number(id));
  },

  getUsers() {
    return [...this._state.users];
  },

  getUser(id) {
    return this._state.users.find((u) => u.id === Number(id));
  },

  getCurrentUser() {
    if (!this._state.currentUserId) return null;
    return this.getUser(this._state.currentUserId);
  },

  isLoggedIn() {
    return Boolean(this.getCurrentUser());
  },

  getTheme() {
    return this._state.settings.theme || "light";
  },

  getLang() {
    return this._state.settings.lang || "ru";
  },

  setTheme(theme) {
    if (theme === "light" || theme === "dark") {
      this._state.settings.theme = theme;
      this._persist();
    }
  },

  setLang(lang) {
    if (lang === "ru" || lang === "en") {
      this._state.settings.lang = lang;
      this._persist();
    }
  },

  async register(username, email, password) {
    if (password.length < 6) return { ok: false, message: "Password must be at least 6 characters." };
    if (!isValidEmail(email)) return { ok: false, message: "Please enter a valid email." };
    if (this._state.users.some((u) => u.username === username)) {
      return { ok: false, message: "Username is already taken." };
    }
    if (this._state.users.some((u) => u.email === email)) {
      return { ok: false, message: "Email is already used." };
    }
    const user = {
      id: this._state.nextUserId++,
      username,
      email,
      passwordHash: await hashPassword(password),
      avatarUrl: null,
      isAdmin: false,
      balance: 0,
      cart: [],
      purchased: [],
    };
    this._state.users.push(user);
    this._persist();
    return { ok: true, message: "Registration successful. You can login now." };
  },

  async login(username, password) {
    const user = this._state.users.find((u) => u.username === username);
    if (!user) return { ok: false, message: "Invalid username or password." };
    const hash = await hashPassword(password);
    if (user.passwordHash !== hash) return { ok: false, message: "Invalid username or password." };
    this._state.currentUserId = user.id;
    this._persist();
    return { ok: true, message: "Welcome back!" };
  },

logout() {
     const result = { ok: true, message: "You are logged out." };
     this._state.currentUserId = null;
     this._persist();
     return result;
   },

   loginAsUser(userId) {
     const user = this.getUser(userId);
     if (!user) return { ok: false, message: "User not found." };
     const currentUser = this.getCurrentUser();
     if (!currentUser?.isAdmin) return { ok: false, message: "Admin access required." };
     this._state.adminLoginUserId = currentUser.id;
     this._state.currentUserId = user.id;
     this._persist();
     return { ok: true, message: `Logged in as ${user.username}.` };
   },

   returnToAdmin() {
     const adminId = this._state.adminLoginUserId;
     if (!adminId) return { ok: false, message: "No admin session." };
     const admin = this.getUser(adminId);
     if (!admin) return { ok: false, message: "Admin not found." };
     this._state.currentUserId = adminId;
     delete this._state.adminLoginUserId;
     this._persist();
     return { ok: true, message: `Returned to admin (${admin.username}).` };
   },

  topup(amount) {
    const user = this.getCurrentUser();
    if (!user || amount <= 0) return { ok: false, message: "Amount must be greater than 0." };
    user.balance += amount;
    this._persist();
    return { ok: true, message: `Баланс пополнен на ${amount.toFixed(2)} ₽.` };
  },

  adminTopup(userId, amount) {
    const user = this.getUser(userId);
    if (!user || amount <= 0) return { ok: false, message: "Сумма должна быть больше 0." };
    user.balance += amount;
    this._persist();
    return { ok: true, message: `Баланс пользователя ${user.username} пополнен на ${amount.toFixed(2)} ₽.` };
  },

  adminWithdraw(userId, amount) {
    const user = this.getUser(userId);
    if (!user || amount <= 0) return { ok: false, message: "Сумма должна быть больше 0." };
    if (user.balance < amount) {
      return { ok: false, message: `Недостаточно средств на балансе пользователя ${user.username}.` };
    }
    user.balance -= amount;
    this._persist();
    return { ok: true, message: `С баланса пользователя ${user.username} списано ${amount.toFixed(2)} ₽.` };
  },

  deleteUser(userId) {
    const current = this.getCurrentUser();
    const user = this.getUser(userId);
    if (!user) return { ok: false, message: "User not found." };
    if (current && current.id === userId && current.isAdmin) {
      return { ok: false, message: "Нельзя удалить текущего администратора из админки." };
    }
    this._state.users = this._state.users.filter((u) => u.id !== userId);
    if (this._state.currentUserId === userId) this._state.currentUserId = null;
    this._persist();
    return { ok: true, message: `Пользователь ${user.username} удален.` };
  },

  deleteOwnProfile() {
    const user = this.getCurrentUser();
    if (!user) return { ok: false };
    const username = user.username;
    this._state.users = this._state.users.filter((u) => u.id !== user.id);
    this._state.currentUserId = null;
    this._persist();
    return { ok: true, message: `Профиль ${username} удален.` };
  },

  setAvatar(dataUrl) {
    const user = this.getCurrentUser();
    if (!user) return { ok: false };
    user.avatarUrl = dataUrl;
    this._persist();
    return { ok: true, message: "Аватарка обновлена." };
  },

  ownsGame(gameId) {
    const user = this.getCurrentUser();
    return user ? user.purchased.includes(Number(gameId)) : false;
  },

  inCart(gameId) {
    const user = this.getCurrentUser();
    return user ? user.cart.includes(Number(gameId)) : false;
  },

  addToCart(gameId) {
    const user = this.getCurrentUser();
    const game = this.getGame(gameId);
    if (!user || !game) return { ok: false };
    if (user.purchased.includes(game.id)) return { ok: false, message: "You already own this game.", type: "warning" };
    if (user.cart.includes(game.id)) return { ok: false, message: "Game already in cart.", type: "info" };
    user.cart.push(game.id);
    this._persist();
    return { ok: true, message: "Game added to cart.", type: "success" };
  },

  removeFromCart(gameId) {
    const user = this.getCurrentUser();
    if (!user) return { ok: false };
    user.cart = user.cart.filter((id) => id !== Number(gameId));
    this._persist();
    return { ok: true, message: "Game removed from cart.", type: "info" };
  },

  buyGame(gameId) {
    const user = this.getCurrentUser();
    const game = this.getGame(gameId);
    if (!user || !game) return { ok: false };
    if (user.purchased.includes(game.id)) return { ok: false, message: "You already own this game.", type: "warning" };
    if (user.balance < game.price) return { ok: false, message: "Not enough balance.", type: "danger" };
    user.balance -= game.price;
    if (!user.purchased.includes(game.id)) user.purchased.push(game.id);
    user.cart = user.cart.filter((id) => id !== game.id);
    this._persist();
    return { ok: true, message: `You bought ${game.name}.`, type: "success" };
  },

  checkoutAll() {
    const user = this.getCurrentUser();
    if (!user || user.cart.length === 0) return { ok: false, message: "Your cart is empty.", type: "warning" };
    const cartGames = user.cart.map((id) => this.getGame(id)).filter(Boolean);
    const total = cartGames.reduce((sum, g) => sum + g.price, 0);
    if (user.balance < total) return { ok: false, message: "Not enough balance for checkout.", type: "danger" };
    user.balance -= total;
    for (const game of cartGames) {
      if (!user.purchased.includes(game.id)) user.purchased.push(game.id);
    }
    user.cart = [];
    this._persist();
    return { ok: true, message: "Purchase completed successfully.", type: "success" };
  },

  checkoutSelected(gameIds) {
    const user = this.getCurrentUser();
    if (!user) return { ok: false };
    if (!gameIds.length) return { ok: false, message: "Выберите хотя бы одну игру для покупки.", type: "warning" };
    const selected = gameIds.map(Number).filter((id) => user.cart.includes(id));
    if (!selected.length) return { ok: false, message: "Выбранные игры не найдены в корзине.", type: "warning" };
    const games = selected.map((id) => this.getGame(id)).filter(Boolean);
    const total = games.reduce((sum, g) => sum + g.price, 0);
    if (user.balance < total) {
      return { ok: false, message: "Недостаточно средств для покупки выбранных игр.", type: "danger" };
    }
    user.balance -= total;
    for (const game of games) {
      if (!user.purchased.includes(game.id)) user.purchased.push(game.id);
      user.cart = user.cart.filter((id) => id !== game.id);
    }
    this._persist();
    return { ok: true, message: "Выбранные игры успешно куплены.", type: "success" };
  },

  addGame(data) {
    if ((data.description || "").length < 100) {
      return { ok: false, message: "Description must be at least 100 characters." };
    }
    if (!data.image_url) return { ok: false, message: "Provide image URL." };
    const game = {
      id: this._state.nextGameId++,
      name: data.name.trim(),
      price: Number(data.price),
      description: data.description.trim(),
      image_url: data.image_url,
      category: data.category.trim(),
      developer: data.developer.trim(),
      release_year: Number(data.release_year),
    };
    this._state.games.push(game);
    this._persist();
    return { ok: true, message: "Game added.", type: "success" };
  },

  updateGame(gameId, data) {
    const game = this.getGame(gameId);
    if (!game) return { ok: false, message: "Game not found." };
    if ((data.description || "").length < 100) {
      return { ok: false, message: "Description must be at least 100 characters." };
    }
    const [baseName] = splitGameTitle(game.name);
    const related = getVersionsForBase(this._state.games, baseName);
    game.name = data.name.trim();
    game.price = Number(data.price);
    game.description = data.description.trim();
    game.category = data.category.trim();
    game.developer = data.developer.trim();
    game.release_year = Number(data.release_year);
    if (data.image_url) {
      for (const v of related) v.image_url = data.image_url;
    }
    this._persist();
    return { ok: true, message: "Game updated.", type: "success" };
  },

  deleteGame(gameId) {
    this._state.games = this._state.games.filter((g) => g.id !== Number(gameId));
    for (const user of this._state.users) {
      user.cart = user.cart.filter((id) => id !== Number(gameId));
      user.purchased = user.purchased.filter((id) => id !== Number(gameId));
    }
    this._persist();
    return { ok: true, message: "Game deleted.", type: "info" };
  },

  filterGames(filters) {
    let games = this.getGames();
    const search = (filters.search || "").trim().toLowerCase();
    const category = (filters.category || "").trim();
    const minPrice = filters.min_price ? parseFloat(filters.min_price) : null;
    const maxPrice = filters.max_price ? parseFloat(filters.max_price) : null;
    const sort = filters.sort || "id_asc";

    if (search) {
      games = games.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          g.developer.toLowerCase().includes(search)
      );
    }
    if (category) games = games.filter((g) => g.category === category);
    if (minPrice !== null && !Number.isNaN(minPrice)) games = games.filter((g) => g.price >= minPrice);
    if (maxPrice !== null && !Number.isNaN(maxPrice)) games = games.filter((g) => g.price <= maxPrice);

    const sorters = {
      id_asc: (a, b) => a.id - b.id,
      id_desc: (a, b) => b.id - a.id,
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      name_asc: (a, b) => a.name.localeCompare(b.name),
      name_desc: (a, b) => b.name.localeCompare(a.name),
      year_desc: (a, b) => b.release_year - a.release_year,
      year_asc: (a, b) => a.release_year - b.release_year,
    };
    games.sort(sorters[sort] || sorters.id_asc);
    return buildCatalogEntries(games);
  },
};

function hashPassword(password) {
  return password;
}

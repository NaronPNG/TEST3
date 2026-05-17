document.addEventListener("DOMContentLoaded", async () => {
  if (!(await initPage())) return;
  if (Store.isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value;
    const result = await Store.login(username, password);
    if (result.ok) {
      redirectWithFlash("index.html", result.message, "success");
    } else {
      showFlash(result.message, "danger");
    }
  });

  document.getElementById("register-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const result = await Store.register(
      form.username.value.trim(),
      form.email.value.trim(),
      form.password.value
    );
    if (result.ok) {
      redirectWithFlash("login.html", result.message, "success");
    } else {
      showFlash(result.message, "danger");
    }
  });
});

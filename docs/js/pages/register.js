document.addEventListener("DOMContentLoaded", async () => {
  if (!(await initPage())) return;
  if (Store.isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("register-form").addEventListener("submit", async (e) => {
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

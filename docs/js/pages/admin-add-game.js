document.addEventListener("DOMContentLoaded", async () => {
  if (!(await initPage({ requireAdmin: true }))) return;

  document.getElementById("add-game-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    let imageUrl = form.image_url.value.trim();

    const file = form.image_file.files[0];
    if (file) {
      imageUrl = await readImageAsDataUrl(file);
    }

    const result = Store.addGame({
      name: form.name.value,
      price: form.price.value,
      release_year: form.release_year.value,
      category: form.category.value,
      developer: form.developer.value,
      description: form.description.value,
      image_url: imageUrl,
    });

    redirectWithFlash("admin.html", result.message, result.ok ? "success" : "danger");
  });
});

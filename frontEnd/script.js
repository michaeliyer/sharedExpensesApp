document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expenseForm");
  const entriesTable = document
    .getElementById("entriesTable")
    .getElementsByTagName("tbody")[0];
  const categorySelect = document.getElementById("category");
  const categoryForm = document.getElementById("category-form");

  // Fetch and populate categories
  function loadCategories() {
    fetch("/categories")
      .then((response) => response.json())
      .then((categories) => {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.name;
          categorySelect.appendChild(option);
        });
      });
  }
  loadCategories();

  // Handle new category submission
  categoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newCategoryName = document.getElementById("new-category-name").value;
    await fetch("/add-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    loadCategories();
    e.target.reset();
  });

  // Fetch and display entries
  loadEntries();

  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById("name").value,
      amount: parseFloat(document.getElementById("amount").value),
      type: document.getElementById("type").value,
      description: document.getElementById("description").value,
      category_id: categorySelect.value,
      date: document.getElementById("date").value,
    };

    await fetch("/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    loadEntries();
    e.target.reset();
  });

  function loadEntries() {
    fetch("/entries")
      .then((response) => response.json())
      .then((data) => {
        entriesTable.innerHTML = "";
        data.forEach((entry) => {
          const row = entriesTable.insertRow();
          row.innerHTML = `
            <td>${entry.name}</td>
            <td>${entry.amount.toFixed(2)}</td>
            <td>${entry.type}</td>
            <td>${entry.description}</td>
            <td>${entry.categoryName || "Uncategorized"}</td>
            <td>${entry.date}</td>
          `;
        });
      });
  }
});

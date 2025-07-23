document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expenseForm");
  const entriesTable = document
    .getElementById("entriesTable")
    .getElementsByTagName("tbody")[0];
  const categorySelect = document.getElementById("category");
  const categoryList = document.getElementById("category-list");
  const categoryForm = document.getElementById("category-form");
  const logoutBtn = document.getElementById("logout-btn");

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });

  const fetchWithAuth = (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return fetch(url, options);
  };

  // Fetch and populate categories
  function loadCategories() {
    fetchWithAuth("/api/categories")
      .then((response) => response.json())
      .then((categories) => {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categoryList.innerHTML = "";
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.name;
          categorySelect.appendChild(option);

          const li = document.createElement("li");
          li.textContent = category.name;
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.dataset.id = category.id;
          deleteBtn.classList.add("delete-category-btn");
          li.appendChild(deleteBtn);
          categoryList.appendChild(li);
        });
      });
  }
  loadCategories();

  categoryList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-category-btn")) {
      const id = e.target.dataset.id;
      if (confirm("Are you sure you want to delete this category?")) {
        fetchWithAuth(`/api/category/${id}`, {
          method: "DELETE",
        })
          .then((res) => {
            if (!res.ok) {
              return res.json().then((err) => {
                throw new Error(err.error);
              });
            }
            return res.json();
          })
          .then(() => {
            loadCategories();
          })
          .catch((err) => {
            alert(err.message);
          });
      }
    }
  });

  // Handle new category submission
  categoryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newCategoryName = document.getElementById("new-category-name").value;
    await fetchWithAuth("/api/add-category", {
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

    await fetchWithAuth("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    loadEntries();
    e.target.reset();
  });

  function loadEntries() {
    fetchWithAuth("/api/entries")
      .then((response) => {
        if (!response.ok) {
          window.location.href = "/login.html";
        }
        return response.json();
      })
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
            <td>${new Date(entry.date).toLocaleDateString()}</td>
          `;
        });
      });
  }
});

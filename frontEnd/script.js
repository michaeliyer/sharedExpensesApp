document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expenseForm");
  const entriesTable = document
    .getElementById("entriesTable")
    .getElementsByTagName("tbody")[0];
  const categorySelect = document.getElementById("category");
  const categoryList = document.getElementById("category-list");
  const categoryForm = document.getElementById("category-form");
  const logoutBtn = document.getElementById("logout-btn");
  const toggleEntries = document.getElementById("toggle-entries");
  const entriesTableContainer = document.getElementById(
    "entries-table-container"
  );
  const typeSelect = document.getElementById("type");
  const nameSelect = document.getElementById("name-select");
  const newNameInput = document.getElementById("new-name");
  const searchResultsContainer = document.getElementById(
    "search-results-container"
  );
  const searchResultsTable = document
    .getElementById("search-results-table")
    .getElementsByTagName("tbody")[0];
  const searchForm = document.getElementById("search-form");
  const searchCategorySelect = document.getElementById("search-category");
  const searchNameSelect = document.getElementById("search-name-select");

  entriesTableContainer.style.display = "none";

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

  toggleEntries.addEventListener("change", () => {
    if (toggleEntries.checked) {
      entriesTableContainer.style.display = "block";
    } else {
      entriesTableContainer.style.display = "none";
    }
  });

  typeSelect.addEventListener("change", () => {
    if (typeSelect.value === "deposit") {
      nameSelect.required = false;
      categorySelect.required = false;
    } else {
      nameSelect.required = true;
      categorySelect.required = true;
    }
  });

  // Fetch and populate names
  function loadNames() {
    fetchWithAuth("/api/names")
      .then((response) => response.json())
      .then((names) => {
        nameSelect.innerHTML = '<option value="">Select Name</option>';
        searchNameSelect.innerHTML = '<option value="">Search by Name</option>';
        names.forEach((name) => {
          const option = document.createElement("option");
          option.value = name.name;
          option.textContent = name.name;
          nameSelect.appendChild(option);

          const searchOption = document.createElement("option");
          searchOption.value = name.name;
          searchOption.textContent = name.name;
          searchNameSelect.appendChild(searchOption);
        });
        nameSelect.innerHTML += '<option value="new">Add New Name</option>';
      });
  }
  loadNames();

  nameSelect.addEventListener("change", () => {
    if (nameSelect.value === "new") {
      newNameInput.style.display = "block";
      newNameInput.required = true;
    } else {
      newNameInput.style.display = "none";
      newNameInput.required = false;
    }
  });

  // Fetch and populate categories
  function loadCategories() {
    fetchWithAuth("/api/categories")
      .then((response) => response.json())
      .then((categories) => {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        searchCategorySelect.innerHTML =
          '<option value="">Search by Category</option>';
        categoryList.innerHTML = "";
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.name;
          categorySelect.appendChild(option);

          const searchOption = document.createElement("option");
          searchOption.value = category.id;
          searchOption.textContent = category.name;
          searchCategorySelect.appendChild(searchOption);

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

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    const name = searchNameSelect.value;
    const month = document.getElementById("search-month").value;
    const startDate = document.getElementById("search-start-date").value;
    const endDate = document.getElementById("search-end-date").value;
    const category = document.getElementById("search-category").value;

    if (name) query.append("name", name);
    if (month) query.append("month", month);
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);
    if (category) query.append("category_id", category);

    loadSearchResults(query.toString());
  });

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

    let name = nameSelect.value;
    if (name === "new") {
      name = newNameInput.value;
    }

    const data = {
      name,
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
    loadNames();
    e.target.reset();
  });

  function loadSearchResults(query) {
    fetchWithAuth(`/api/entries?${query}`)
      .then((response) => response.json())
      .then((data) => {
        searchResultsTable.innerHTML = "";
        data.forEach((entry) => {
          const row = searchResultsTable.insertRow();
          row.innerHTML = `
            <td>${entry.name}</td>
            <td>${entry.amount.toFixed(2)}</td>
            <td>${entry.type}</td>
            <td>${entry.description}</td>
            <td>${entry.categoryname || "Uncategorized"}</td>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
          `;
        });
        searchResultsContainer.style.display = "block";
      });
  }

  function loadEntries(query = "") {
    fetchWithAuth(`/api/entries?${query}`)
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
            <td>${entry.categoryname || "Uncategorized"}</td>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
          `;
        });
      });
  }
});

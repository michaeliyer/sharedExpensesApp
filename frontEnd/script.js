document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  }
  document.getElementById("add-expense-btn").style.display = "inline-block";
  document.getElementById("add-deposit-btn").style.display = "inline-block";

  const expenseForm = document.getElementById("expenseForm");
  const nameSelect = document.getElementById("name-select");
  const newNameInput = document.getElementById("new-name");
  const entriesTableContainer = document.getElementById(
    "entries-table-container"
  );
  const entriesTable = document
    .getElementById("entries-table")
    .getElementsByTagName("tbody")[0];
  const searchResultsContainer = document.getElementById(
    "search-results-container"
  );
  const searchResultsTable = document
    .getElementById("search-results-table")
    .getElementsByTagName("tbody")[0];
  const searchForm = document.getElementById("search-form");
  const searchCategorySelect = document.getElementById("search-category");
  const searchNameSelect = document.getElementById("search-name-select");

  const expenseModal = document.getElementById("expense-modal");
  const categoryModal = document.getElementById("category-modal");
  const depositModal = document.getElementById("deposit-modal");

  const addExpenseBtn = document.getElementById("add-expense-btn");
  const addCategoryBtn = document.getElementById("add-category-btn");
  const addDepositBtn = document.getElementById("add-deposit-btn");

  const closeBtns = document.querySelectorAll(".close-btn");

  addExpenseBtn.addEventListener("click", () => {
    expenseModal.classList.add("show");
  });

  addCategoryBtn.addEventListener("click", () => {
    categoryModal.classList.add("show");
  });

  addDepositBtn.addEventListener("click", () => {
    depositModal.classList.add("show");
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      expenseModal.classList.remove("show");
      categoryModal.classList.remove("show");
      depositModal.classList.remove("show");
    });
  });

  window.addEventListener("click", (event) => {
    if (
      event.target == expenseModal ||
      event.target == categoryModal ||
      event.target == depositModal
    ) {
      expenseModal.classList.remove("show");
      categoryModal.classList.remove("show");
      depositModal.classList.remove("show");
    }
  });

  entriesTableContainer.style.display = "none";

  document.getElementById("toggle-entries").addEventListener("change", (e) => {
    entriesTableContainer.style.display = e.target.checked ? "block" : "none";
  });

  async function fetchWithAuth(url, options = {}) {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      window.location.href = "login.html";
    }
    return response;
  }

  function loadEntries() {
    fetchWithAuth("/api/entries")
      .then((response) => response.json())
      .then((data) => {
        entriesTable.innerHTML = "";
        data.forEach((entry) => {
          const row = entriesTable.insertRow();
          row.innerHTML = `
            <td>${entry.name}</td>
            <td>$${entry.amount.toFixed(2)}</td>
            <td>${entry.type}</td>
            <td>${entry.categoryname}</td>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
            <td>${entry.description}</td>
          `;
        });
      });
  }

  loadEntries();

  // Fetch and populate names
  function loadNames() {
    fetchWithAuth("/api/names")
      .then((response) => response.json())
      .then((names) => {
        nameSelect.innerHTML = '<option value="">Select Name</option>';
        searchNameSelect.innerHTML =
          '<option value="Search by Name">Search by Name</option>';
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
  window.loadNames = loadNames;
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

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name =
      nameSelect.value === "new" ? newNameInput.value : nameSelect.value;
    const amount = document.getElementById("amount").value;
    const category_id = document.getElementById("category").value;
    const date = document.getElementById("date").value;
    const description = document.getElementById("description").value;

    fetchWithAuth("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount,
        type: "expense",
        category_id,
        date,
        description,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        loadEntries();
        loadNames();
        expenseForm.reset();
        expenseModal.classList.remove("show");
      });
  });

  document.getElementById("deposit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = document.getElementById("deposit-amount").value;
    const date = document.getElementById("deposit-date").value;
    const description = document.getElementById("deposit-description").value;

    fetchWithAuth("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Deposit",
        amount,
        type: "deposit",
        date,
        description,
        category_id: null,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        loadEntries();
        document.getElementById("deposit-form").reset();
        depositModal.classList.remove("show");
      });
  });

  // Fetch and populate categories
  function loadCategories() {
    fetchWithAuth("/api/categories")
      .then((response) => response.json())
      .then((categories) => {
        const categorySelect = document.getElementById("category");
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        searchCategorySelect.innerHTML =
          '<option value="">All Categories</option>';
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.name;
          categorySelect.appendChild(option);

          const searchOption = document.createElement("option");
          searchOption.value = category.id;
          searchOption.textContent = category.name;
          searchCategorySelect.appendChild(searchOption);
        });
        // Remove old category list from main container if present
        const oldCategoryList = document.getElementById("category-list");
        if (oldCategoryList) oldCategoryList.remove();
      });
  }
  loadCategories();

  document.getElementById("category-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("new-category-name").value;
    fetchWithAuth("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then(() => {
        loadCategories();
        document.getElementById("category-form").reset();
        categoryModal.classList.remove("show");
      });
  });

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    const name = searchNameSelect.value;
    const month = document.getElementById("search-month").value;
    const startDate = document.getElementById("search-start-date").value;
    const endDate = document.getElementById("search-end-date").value;
    const categoryId = searchCategorySelect.value;
    const type = document.getElementById("search-type").value;

    if (name) query.append("name", name);
    if (month) query.append("month", month);
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);
    if (categoryId) query.append("category_id", categoryId);
    if (type) query.append("type", type);

    fetchWithAuth(`/api/entries?${query.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        searchResultsTable.innerHTML = "";
        data.forEach((entry) => {
          const row = searchResultsTable.insertRow();
          row.innerHTML = `
              <td>${entry.name}</td>
              <td>$${entry.amount.toFixed(2)}</td>
              <td>${entry.type}</td>
              <td>${entry.categoryname}</td>
              <td>${new Date(entry.date).toLocaleDateString()}</td>
              <td>${entry.description}</td>
            `;
        });
        searchResultsContainer.style.display = "block";
      });
  });

  // --- Add/Delete Categories Modal Logic ---
  const toggleCategoryListBtn = document.getElementById("toggle-category-list");
  const modalCategoryList = document.getElementById("modal-category-list");
  let modalCategories = [];
  let categoryListVisible = false;

  function renderModalCategoryList() {
    modalCategoryList.innerHTML = "";
    modalCategories.forEach((category) => {
      const li = document.createElement("li");
      li.className = "modal-category-item";
      // State: editing or not
      if (category.editing) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = category.name;
        input.className = "modal-category-edit-input";
        li.appendChild(input);
        // Save button
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.className = "modal-category-btn modal-category-save";
        saveBtn.onclick = () => {
          const newName = input.value.trim();
          if (!newName) return alert("Category name cannot be empty.");
          fetchWithAuth(`/api/category/${category.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
          })
            .then((response) => response.json())
            .then(() => {
              loadModalCategories();
              loadCategories();
            });
        };
        li.appendChild(saveBtn);
        // Cancel button
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "modal-category-btn modal-category-cancel";
        cancelBtn.onclick = () => {
          category.editing = false;
          renderModalCategoryList();
        };
        li.appendChild(cancelBtn);
      } else {
        const nameSpan = document.createElement("span");
        nameSpan.className = "modal-category-name";
        nameSpan.textContent = category.name;
        li.appendChild(nameSpan);
        // Edit button
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "modal-category-btn modal-category-edit";
        editBtn.onclick = () => {
          modalCategories.forEach((c) => (c.editing = false));
          category.editing = true;
          renderModalCategoryList();
        };
        li.appendChild(editBtn);
        // Delete button
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "modal-category-btn delete-category-btn";
        delBtn.onclick = () => {
          if (confirm(`Delete category '${category.name}'?`)) {
            fetchWithAuth(`/api/category/${category.id}`, {
              method: "DELETE",
            })
              .then((response) => {
                if (!response.ok) {
                  return response.json().then((data) => {
                    throw new Error(data.error || "Failed to delete category.");
                  });
                }
                return response.json();
              })
              .then(() => {
                loadModalCategories();
                loadCategories();
              })
              .catch((error) => {
                alert(error.message);
              });
          }
        };
        li.appendChild(delBtn);
      }
      modalCategoryList.appendChild(li);
    });
  }

  function loadModalCategories() {
    fetchWithAuth("/api/categories")
      .then((response) => response.json())
      .then((categories) => {
        modalCategories = categories.map((cat) => ({ ...cat, editing: false }));
        renderModalCategoryList();
      });
  }

  toggleCategoryListBtn.addEventListener("click", () => {
    categoryListVisible = !categoryListVisible;
    modalCategoryList.style.display = categoryListVisible ? "block" : "none";
    toggleCategoryListBtn.textContent = categoryListVisible
      ? "Hide Categories"
      : "Show/Delete Categories";
    if (categoryListVisible) {
      loadModalCategories();
    }
  });
});

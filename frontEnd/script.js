// CRITICAL TIMEZONE FIX: Date strings are used directly without any conversion $$
// This prevents the one-day-off issue by avoiding all timezone conversions
// Render should deploy this updated JavaScript file

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

  addExpenseBtn.addEventListener("click", () => {
    expenseModal.classList.add("show");
  });

  addCategoryBtn.addEventListener("click", () => {
    categoryModal.classList.add("show");
  });

  addDepositBtn.addEventListener("click", () => {
    depositModal.classList.add("show");
  });

  // Close buttons - each one only closes its specific modal
  const expenseCloseBtn = expenseModal.querySelector(".close-btn");
  const categoryCloseBtn = categoryModal.querySelector(".close-btn");
  const depositCloseBtn = depositModal.querySelector(".close-btn");

  expenseCloseBtn.addEventListener("click", () => {
    expenseModal.classList.remove("show");
  });

  categoryCloseBtn.addEventListener("click", () => {
    categoryModal.classList.remove("show");
  });

  depositCloseBtn.addEventListener("click", () => {
    depositModal.classList.remove("show");
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

  // Update loadEntries to style deposit rows and show minus sign
  function loadEntries() {
    fetchWithAuth("/api/entries")
      .then((response) => response.json())
      .then((data) => {
        entriesTable.innerHTML = "";
        data.forEach((entry) => {
          const row = entriesTable.insertRow();
          if (entry.type === "deposit") row.classList.add("deposit-row");
          row.innerHTML = `
            <td>${entry.name}</td>
            <td class="${entry.type === "deposit" ? "deposit-cell" : ""}">${
            entry.type === "deposit" ? "-" : ""
          }${parseFloat(entry.amount).toFixed(2)}</td>
            <td>${entry.type}</td>
            <td>${entry.categoryname}</td>
            <td>${entry.date}</td>
            <td>${entry.description || ""}</td>
            <td><button class="delete-btn" data-id="${
              entry.id
            }">Delete</button></td>
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
        searchNameSelect.innerHTML = '<option value="">Name/Business</option>';
        names.forEach((name) => {
          if (name.name !== "Deposit") {
            const option = document.createElement("option");
            option.value = name.name;
            option.textContent = name.name;
            nameSelect.appendChild(option);

            const searchOption = document.createElement("option");
            searchOption.value = name.name;
            searchOption.textContent = name.name;
            searchNameSelect.appendChild(searchOption);
          }
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

    // TIMEZONE FIX: Use direct string approach to avoid any timezone conversion
    console.log("Original date from form:", date);
    let processedDate = date;
    if (date) {
      // Keep the date exactly as received - no timezone conversion at all
      processedDate = date; // Use the date string directly
      console.log("Using date directly (no conversion):", processedDate);
    }

    fetchWithAuth("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount,
        type: "expense",
        category_id,
        date: processedDate,
        description,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        loadEntries();
        loadNames();
        expenseForm.reset();
        expenseModal.classList.remove("show");
        showSuccessFeedback("💰 Expense Added Successfully!");
      });
  });

  document.getElementById("deposit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = document.getElementById("deposit-amount").value;
    const date = document.getElementById("deposit-date").value;
    const description = document.getElementById("deposit-description").value;

    // TIMEZONE FIX: Use direct string approach to avoid any timezone conversion
    console.log("Original deposit date from form:", date);
    let processedDate = date;
    if (date) {
      // Keep the date exactly as received - no timezone conversion at all
      processedDate = date; // Use the date string directly
      console.log(
        "Using deposit date directly (no conversion):",
        processedDate
      );
    }

    fetchWithAuth("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Deposit",
        amount,
        type: "deposit",
        date: processedDate,
        description,
        category_id: null,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        loadEntries();
        document.getElementById("deposit-form").reset();
        depositModal.classList.remove("show");
        showSuccessFeedback("💚 Deposit Added Successfully!");
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

          // For search, use category name as value for easier backend filtering
          const searchOption = document.createElement("option");
          searchOption.value = category.name;
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
        showSuccessFeedback("📂 Category Added Successfully!");
      });
  });

  // Add a reset button to the search form
  const searchFormEl = document.getElementById("search-form");
  let resetBtn = document.getElementById("reset-search-btn");
  if (!resetBtn) {
    resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.id = "reset-search-btn";
    resetBtn.textContent = "Reset All Fields";
    resetBtn.style.marginLeft = "10px";
    searchFormEl.appendChild(resetBtn);
  }
  resetBtn.onclick = () => {
    // Reset all fields
    searchNameSelect.value = "";
    // Ensure placeholder is present and correct
    searchNameSelect.innerHTML = '<option value="">Name/Business</option>';
    // Re-add names except Deposit
    fetchWithAuth("/api/names")
      .then((response) => response.json())
      .then((names) => {
        names.forEach((name) => {
          if (name.name !== "Deposit") {
            const option = document.createElement("option");
            option.value = name.name;
            option.textContent = name.name;
            searchNameSelect.appendChild(option);
          }
        });
      });
    document.getElementById("search-month").value = "";
    document.getElementById("search-start-date").value = "";
    document.getElementById("search-end-date").value = "";
    searchCategorySelect.value = "";
    document.getElementById("search-type").value = "";
    searchResultsTable.innerHTML = "";
    document.getElementById("search-results-label").textContent = "";
  };

  // Add a label above results to show active filters
  let resultsLabel = document.getElementById("search-results-label");
  if (!resultsLabel) {
    resultsLabel = document.createElement("div");
    resultsLabel.id = "search-results-label";
    resultsLabel.style.margin = "10px 0 10px 0";
    resultsLabel.style.fontWeight = "bold";
    searchResultsContainer.insertBefore(
      resultsLabel,
      searchResultsContainer.firstChild.nextSibling
    );
  }

  // Update search results rendering to style deposit rows and show minus sign
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    const name = searchNameSelect.value;
    const month = document.getElementById("search-month").value;
    const startDate = document.getElementById("search-start-date").value;
    const endDate = document.getElementById("search-end-date").value;
    const categoryName = searchCategorySelect.value;
    const type = document.getElementById("search-type").value;

    // Only add name if a real name is selected
    if (name && name !== "" && name !== "Name/Business")
      query.append("name", name);

    // Only send one date filter at a time
    if (month) {
      query.append("month", month);
    } else if (startDate && endDate) {
      query.append("startDate", startDate);
      query.append("endDate", endDate);
    }

    // For search, send category name as filter
    if (categoryName) query.append("categoryname", categoryName);
    if (type) query.append("type", type);

    // Build filter label
    let label = "Filters: ";
    let any = false;
    if (name && name !== "" && name !== "Name/Business") {
      label += `Name: ${name} `;
      any = true;
    }
    if (month) {
      label += `Month: ${month} `;
      any = true;
    }
    if (startDate && endDate) {
      label += `Range: ${startDate} to ${endDate} `;
      any = true;
    }
    if (categoryName) {
      label += `Category: ${categoryName} `;
      any = true;
    }
    if (type) {
      label += `Type: ${type} `;
      any = true;
    }
    if (!any) label = "Filters: None";
    resultsLabel.textContent = label;

    fetchWithAuth(`/api/entries?${query.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        searchResultsTable.innerHTML = "";
        data.forEach((entry) => {
          const row = searchResultsTable.insertRow();
          if (entry.type === "deposit") row.classList.add("deposit-row");
          row.innerHTML = `
              <td>${entry.name}</td>
            <td class="${entry.type === "deposit" ? "deposit-cell" : ""}">${
            entry.type === "deposit" ? "-" : ""
          }${parseFloat(entry.amount).toFixed(2)}</td>
              <td>${entry.type}</td>
            <td>${entry.categoryname}</td>
              <td>${entry.date}</td>
            <td>${entry.description || ""}</td>
            <td><button class="delete-btn" data-id="${
              entry.id
            }">Delete</button></td>
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

  // Toggle Search and Filter panel
  const toggleSearchBtn = document.getElementById("toggle-search-btn");
  const searchToggleGroup = document.getElementById("search-toggle-group");
  if (toggleSearchBtn && searchToggleGroup) {
    toggleSearchBtn.addEventListener("click", () => {
      if (
        searchToggleGroup.style.display === "none" ||
        searchToggleGroup.style.display === ""
      ) {
        searchToggleGroup.style.display = "block";
      } else {
        searchToggleGroup.style.display = "none";
      }
    });
  }

  // Print Results functionality
  const printBtn = document.getElementById("print-results-btn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      const resultsContainer = document.getElementById(
        "search-results-container"
      );
      if (!resultsContainer) return;
      // Clone the results table and label
      const label = document.getElementById("search-results-label");
      const table = document.getElementById("search-results-table");
      const printWindow = window.open("", "", "width=900,height=700");
      printWindow.document.write("<html><head><title>Print Results</title>");
      printWindow.document.write(
        "<style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;margin-top:20px;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} th{background:#e9ecef;} h2{margin-bottom:0;} .label{margin-bottom:10px;font-weight:bold;}</style>"
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write("<h2>Search Results</h2>");
      if (label && label.textContent) {
        printWindow.document.write(
          `<div class="label">${label.textContent}</div>`
        );
      }
      printWindow.document.write(table.outerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
  }

  // Export Displayed Results as CSV functionality
  const exportDisplayedBtn = document.getElementById(
    "export-displayed-csv-btn"
  );
  if (exportDisplayedBtn) {
    exportDisplayedBtn.addEventListener("click", () => {
      const table = document.getElementById("search-results-table");
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length < 2) return alert("No results to export.");
      // Extract headers
      const headers = Array.from(rows[0].querySelectorAll("th")).map((th) =>
        th.textContent.trim()
      );
      // Extract data rows
      const data = rows
        .slice(1)
        .map((row) =>
          Array.from(row.querySelectorAll("td")).map((td) =>
            td.textContent.trim()
          )
        );
      // Build CSV
      const csvRows = [headers.join(",")];
      data.forEach((row) => {
        csvRows.push(
          row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")
        );
      });
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      // Prompt for filename
      let filename = prompt("Enter filename for CSV:", "export.csv");
      if (!filename) filename = "export.csv";
      if (!filename.endsWith(".csv")) filename += ".csv";
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Print All functionality
  const printAllBtn = document.getElementById("print-all-btn");
  if (printAllBtn) {
    printAllBtn.addEventListener("click", () => {
      const table = document.getElementById("entries-table");
      const printWindow = window.open("", "", "width=900,height=700");
      printWindow.document.write(
        "<html><head><title>Print All Entries</title>"
      );
      printWindow.document.write(
        "<style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;margin-top:20px;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} th{background:#e9ecef;} h2{margin-bottom:0;}</style>"
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write("<h2>All Entries</h2>");
      printWindow.document.write(table.outerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
  }

  // Export All as CSV functionality
  const exportAllBtn = document.getElementById("export-all-csv-btn");
  if (exportAllBtn) {
    exportAllBtn.addEventListener("click", () => {
      const table = document.getElementById("entries-table");
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length < 2) return alert("No entries to export.");
      // Extract headers
      const headers = Array.from(rows[0].querySelectorAll("th")).map((th) =>
        th.textContent.trim()
      );
      // Extract data rows
      const data = rows
        .slice(1)
        .map((row) =>
          Array.from(row.querySelectorAll("td")).map((td) =>
            td.textContent.trim()
          )
        );
      // Build CSV
      const csvRows = [headers.join(",")];
      data.forEach((row) => {
        csvRows.push(
          row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")
        );
      });
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      // Prompt for filename
      let filename = prompt("Enter filename for CSV:", "all-entries.csv");
      if (!filename) filename = "all-entries.csv";
      if (!filename.endsWith(".csv")) filename += ".csv";
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Show/Hide Total functionality for search results
  const showTotalBtn = document.getElementById("show-total-btn");
  const searchTotalDisplay = document.getElementById("search-total-display");
  let searchTotalVisible = false;
  if (showTotalBtn && searchTotalDisplay) {
    showTotalBtn.addEventListener("click", () => {
      if (!searchTotalVisible) {
        const table = document.getElementById("search-results-table");
        const rows = Array.from(table.querySelectorAll("tbody tr"));
        if (!rows.length) {
          searchTotalDisplay.textContent = "No results to total.";
          searchTotalVisible = true;
          showTotalBtn.textContent = "Hide Total";
          return;
        }
        // Find the Amount and Type column indices
        const headers = Array.from(table.querySelectorAll("thead th"));
        const amountIdx = headers.findIndex(
          (th) => th.textContent.trim().toLowerCase() === "amount"
        );
        const typeIdx = headers.findIndex(
          (th) => th.textContent.trim().toLowerCase() === "type"
        );
        if (amountIdx === -1 || typeIdx === -1) {
          searchTotalDisplay.textContent = "Amount or Type column not found.";
          searchTotalVisible = true;
          showTotalBtn.textContent = "Hide Total";
          return;
        }
        let total = 0;
        rows.forEach((row) => {
          const cell = row.querySelectorAll("td")[amountIdx];
          const typeCell = row.querySelectorAll("td")[typeIdx];
          if (cell && typeCell) {
            // Always treat value as positive
            const val = Math.abs(
              parseFloat(cell.textContent.replace(/[^\d.-]/g, ""))
            );
            const type = typeCell.textContent.trim().toLowerCase();
            if (!isNaN(val)) total += type === "deposit" ? -val : val;
          }
        });
        searchTotalDisplay.textContent = `Total Amount: $${total.toFixed(2)}`;
        searchTotalVisible = true;
        showTotalBtn.textContent = "Hide Total";
      } else {
        searchTotalDisplay.textContent = "";
        searchTotalVisible = false;
        showTotalBtn.textContent = "Show Total";
      }
    });
  }

  // Show/Hide Total functionality for All Entries
  const showAllTotalBtn = document.getElementById("show-all-total-btn");
  const allTotalDisplay = document.getElementById("all-total-display");
  let allTotalVisible = false;
  if (showAllTotalBtn && allTotalDisplay) {
    showAllTotalBtn.addEventListener("click", () => {
      if (!allTotalVisible) {
        const table = document.getElementById("entries-table");
        const rows = Array.from(table.querySelectorAll("tbody tr"));
        if (!rows.length) {
          allTotalDisplay.textContent = "No entries to total.";
          allTotalVisible = true;
          showAllTotalBtn.textContent = "Hide Total";
          return;
        }
        // Find the Amount and Type column indices
        const headers = Array.from(table.querySelectorAll("thead th"));
        const amountIdx = headers.findIndex(
          (th) => th.textContent.trim().toLowerCase() === "amount"
        );
        const typeIdx = headers.findIndex(
          (th) => th.textContent.trim().toLowerCase() === "type"
        );
        if (amountIdx === -1 || typeIdx === -1) {
          allTotalDisplay.textContent = "Amount or Type column not found.";
          allTotalVisible = true;
          showAllTotalBtn.textContent = "Hide Total";
          return;
        }
        let total = 0;
        rows.forEach((row) => {
          const cell = row.querySelectorAll("td")[amountIdx];
          const typeCell = row.querySelectorAll("td")[typeIdx];
          if (cell && typeCell) {
            // Always treat value as positive
            const val = Math.abs(
              parseFloat(cell.textContent.replace(/[^\d.-]/g, ""))
            );
            const type = typeCell.textContent.trim().toLowerCase();
            if (!isNaN(val)) total += type === "deposit" ? -val : val;
          }
        });
        allTotalDisplay.textContent = `Total Amount: $${total.toFixed(2)}`;
        allTotalVisible = true;
        showAllTotalBtn.textContent = "Hide Total";
      } else {
        allTotalDisplay.textContent = "";
        allTotalVisible = false;
        showAllTotalBtn.textContent = "Show Total";
      }
    });
  }

  // Visual success feedback function
  function showSuccessFeedback(message) {
    const feedback = document.createElement("div");
    feedback.className = "success-feedback";
    feedback.textContent = message;
    document.body.appendChild(feedback);

    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 2000);
  }
});

console.log("Monthly Totals are so so so Cool, Man!");

document.addEventListener("DOMContentLoaded", () => {
  const monthListContainer = document.getElementById("month-list-container");
  const monthDetailsTitle = document.getElementById("month-details-title");
  const monthDetailsContainer = document.getElementById(
    "month-details-container"
  );
  const transactionTable = document
    .getElementById("transaction-table")
    .getElementsByTagName("tbody")[0];
  const ytdTotalsContainer = document.getElementById("ytd-totals-container");
  const modal = document.getElementById("edit-modal");
  const closeBtn = document.getElementsByClassName("close-btn")[0];
  const editForm = document.getElementById("edit-form");
  const editCategorySelect = document.getElementById("edit-category");
  const logoutBtn = document.getElementById("logout-btn");

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });

  const fetchWithAuth = (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found for authenticated fetch.");
      return Promise.reject(new Error("Unauthorized"));
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return fetch(url, { ...options, headers });
  };

  // Fetch and display list of months
  fetchWithAuth("/api/totals")
    .then((response) => response.json())
    .then((months) => {
      months.forEach((monthObj) => {
        const monthButton = document.createElement("button");
        monthButton.textContent = monthObj.month;
        monthButton.addEventListener("click", () => {
          displayMonthDetails(monthObj.month);
        });
        monthListContainer.appendChild(monthButton);
      });
    });

  function displayMonthDetails(month) {
    monthDetailsTitle.textContent = `Details for ${month}`;
    monthDetailsContainer.innerHTML = "";
    transactionTable.innerHTML = "";
    ytdTotalsContainer.innerHTML = "";

    // Fetch monthly details
    fetchWithAuth(`/api/monthly-totals/${month}`)
      .then((response) => response.json())
      .then((data) => {
        data.forEach((category) => {
          const categoryDiv = document.createElement("div");
          categoryDiv.classList.add("category-item");
          categoryDiv.innerHTML = `
            <h4>${category.categoryName || "Uncategorized"}</h4>
            <p>Expenses: $${category.monthlyExpenses.toFixed(2)}</p>
            <p>Deposits: $${category.monthlyDeposits.toFixed(2)}</p>
            <p>Net: $${(
              category.monthlyExpenses - category.monthlyDeposits
            ).toFixed(2)}</p>
          `;
          monthDetailsContainer.appendChild(categoryDiv);
        });
      });

    // Fetch and display transactions
    fetchWithAuth(`/api/transactions/${month}`)
      .then((response) => response.json())
      .then((data) => {
        data.forEach((tx) => {
          const row = transactionTable.insertRow();
          row.innerHTML = `
            <td>${tx.name}</td>
            <td>${tx.amount.toFixed(2)}</td>
            <td>${tx.type}</td>
            <td>${tx.description}</td>
            <td>${tx.categoryname || "Uncategorized"}</td>
            <td>${tx.date}</td>
            <td>
              <button class="edit-btn" data-id="${tx.id}">Edit</button>
              <button class="delete-btn" data-id="${tx.id}">Delete</button>
            </td>
          `;
        });
      });

    // Add event listeners for edit and delete buttons
    transactionTable.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;
        if (confirm("Are you sure you want to delete this transaction?")) {
          fetchWithAuth(`/api/delete-transaction/${id}`, {
            method: "DELETE",
          }).then(() => {
            const currentMonth = monthDetailsTitle.textContent.replace(
              "Details for ",
              ""
            );
            displayMonthDetails(currentMonth);
            if (window.loadNames) window.loadNames();
          });
        }
      }
      if (e.target.classList.contains("edit-btn")) {
        const id = e.target.dataset.id;
        openEditModal(id);
      }
    });

    // Close modal
    closeBtn.onclick = function () {
      modal.classList.remove("show");
    };
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.classList.remove("show");
      }
    };

    // Handle edit form submission
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-id").value;
      // TIMEZONE FIX: Use direct string approach to avoid any timezone conversion
      const editDate = document.getElementById("edit-date").value;
      console.log("Original edit date from form:", editDate);
      let processedDate = editDate;
      if (editDate) {
        // Keep the date exactly as received - no timezone conversion at all
        processedDate = editDate; // Use the date string directly
        console.log("Using edit date directly (no conversion):", processedDate);
      }

      const data = {
        name: document.getElementById("edit-name").value,
        amount: parseFloat(document.getElementById("edit-amount").value),
        type: document.getElementById("edit-type").value,
        description: document.getElementById("edit-description").value,
        category_id: document.getElementById("edit-category").value,
        date: processedDate,
      };

      fetchWithAuth(`/api/update-transaction/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(() => {
        modal.classList.remove("show");
        const currentMonth = monthDetailsTitle.textContent.replace(
          "Details for ",
          ""
        );
        displayMonthDetails(currentMonth);
      });
    });

    function openEditModal(id) {
      // Fetch transaction details and populate form
      fetchWithAuth(`/api/transaction/${id}`) // Need to create this endpoint
        .then((response) => response.json())
        .then((tx) => {
          document.getElementById("edit-id").value = tx.id;
          document.getElementById("edit-name").value = tx.name;
          document.getElementById("edit-amount").value = tx.amount;
          document.getElementById("edit-type").value = tx.type;
          document.getElementById("edit-description").value = tx.description;
          // TIMEZONE FIX: Use date directly without conversion
          document.getElementById("edit-date").value = tx.date;

          // Populate category dropdown
          fetchWithAuth("/api/categories")
            .then((response) => response.json())
            .then((categories) => {
              editCategorySelect.innerHTML = "";
              categories.forEach((category) => {
                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name;
                if (category.id === tx.category_id) {
                  option.selected = true;
                }
                editCategorySelect.appendChild(option);
              });
            });

          modal.classList.add("show");
        });
    }

    // Fetch YTD totals
    fetchWithAuth(`/api/ytd-totals/${month}`)
      .then((response) => {
        if (!response.ok) {
          window.location.href = "/login.html";
        }
        return response.json();
      })
      .then((data) => {
        const ytdDiv = document.createElement("div");
        ytdDiv.innerHTML = `
          <p>YTD Expenses: $${(data.ytdexpenses || 0).toFixed(2)}</p>
          <p>YTD Deposits: $${(data.ytddeposits || 0).toFixed(2)}</p>
          <p>YTD Net: $${(
            (data.ytdexpenses || 0) - (data.ytddeposits || 0)
          ).toFixed(2)}</p>
        `;
        ytdTotalsContainer.appendChild(ytdDiv);
      });
  }
});

console.log("Monthly Totals are so so so Cool, Man!");

document.addEventListener("DOMContentLoaded", () => {
  // 🔐 EDIT PIN: Change the PIN below to control edit access
  // Current PIN: 0000 (change this value to update the edit PIN)
  const EDIT_PIN = "0000";

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
              category.monthlyDeposits - category.monthlyExpenses
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
        // First confirmation
        if (confirm("Are you sure you want to delete this transaction?")) {
          // Second confirmation
          if (confirm("Are you REALLY sure??? This cannot be undone!")) {
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
      // Show PIN prompt modal
      showPinPrompt(id);
    }

    // PIN prompt modal for monthly totals
    function showPinPrompt(entryId) {
      // Create PIN modal overlay
      const pinOverlay = document.createElement("div");
      pinOverlay.className = "pin-modal-overlay";
      pinOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;

      // Create PIN modal box
      const pinBox = document.createElement("div");
      pinBox.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
      `;

      pinBox.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #005f73;">🔐 Edit Access Required</h3>
        <p style="margin: 0 0 20px 0; color: #666;">Enter PIN to edit this entry:</p>
        <input 
          type="password" 
          id="pin-input" 
          placeholder="Enter PIN" 
          style="
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            text-align: center;
            margin-bottom: 20px;
            box-sizing: border-box;
          "
          autofocus
        />
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button 
            id="pin-cancel" 
            style="
              background: #6c757d;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            "
          >Cancel</button>
          <button 
            id="pin-submit" 
            style="
              background: #4caf50;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            "
          >Submit</button>
        </div>
      `;

      pinOverlay.appendChild(pinBox);
      document.body.appendChild(pinOverlay);

      const pinInput = pinBox.querySelector("#pin-input");
      const pinCancel = pinBox.querySelector("#pin-cancel");
      const pinSubmit = pinBox.querySelector("#pin-submit");

      // Focus on input
      pinInput.focus();

      // Handle Enter key
      pinInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          pinSubmit.click();
        }
      });

      // Handle Cancel
      pinCancel.addEventListener("click", () => {
        document.body.removeChild(pinOverlay);
      });

      // Handle Submit
      pinSubmit.addEventListener("click", () => {
        const enteredPin = pinInput.value;
        if (enteredPin === EDIT_PIN) {
          document.body.removeChild(pinOverlay);
          proceedWithEdit(entryId);
        } else {
          alert("❌ Incorrect PIN. Edit access denied.");
          pinInput.value = "";
          pinInput.focus();
        }
      });

      // Close on overlay click
      pinOverlay.addEventListener("click", (e) => {
        if (e.target === pinOverlay) {
          document.body.removeChild(pinOverlay);
        }
      });
    }

    // Proceed with edit after PIN verification
    function proceedWithEdit(id) {
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
            (data.ytddeposits || 0) - (data.ytdexpenses || 0)
          ).toFixed(2)}</p>
        `;
        ytdTotalsContainer.appendChild(ytdDiv);
      });
  }
});

console.log("Monthly Totals are so so so Cool, Man!");

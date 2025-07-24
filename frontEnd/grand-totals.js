document.addEventListener("DOMContentLoaded", () => {
  const annualTotalAmount = document.getElementById("annual-total-amount");
  const categoryTotalsContainer = document.getElementById(
    "category-totals-container"
  );
  const logoutBtn = document.getElementById("logout-btn");

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
  });

  const fetchWithAuth = (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (token) {
      options.headers = {
        Authorization: `Bearer ${token}`,
      };
    }
    return fetch(url, options);
  };

  fetchWithAuth("/api/grand-totals")
    .then((response) => {
      if (!response.ok) {
        window.location.href = "/login.html";
      }
      return response.json();
    })
    .then((data) => {
      let totalExpenses = 0;
      if (data.length === 0) {
        annualTotalAmount.textContent = "$0.00";
      } else {
        data.forEach((category) => {
          totalExpenses += category.totalexpenses;
          const net = category.totalexpenses - category.totaldeposits;

          const categoryDiv = document.createElement("div");
          categoryDiv.classList.add("category-item");
          categoryDiv.innerHTML = `
            <h4>${category.categoryname || "Uncategorized"}</h4>
            <p>Expenses: $${category.totalexpenses.toFixed(2)}</p>
            <p>Net: $${net.toFixed(2)}</p>
          `;
          // Add expand button
          const expandBtn = document.createElement("button");
          expandBtn.className = "category-expand-btn";
          expandBtn.textContent = "View Entries";
          expandBtn.onclick = () =>
            openCategoryModal(category.categoryname || "Uncategorized");
          categoryDiv.appendChild(expandBtn);
          categoryTotalsContainer.appendChild(categoryDiv);
        });
      }
      // Fetch and display total deposits in a dedicated section, and update annual total
      fetchWithAuth("/api/total-deposits")
        .then((response) => response.json())
        .then((depositData) => {
          const totalDeposits = +depositData.totaldeposits;
          const depositSection = document.createElement("div");
          depositSection.classList.add("category-item");
          depositSection.innerHTML = `
            <h3>All Deposits</h3>
            <p>Total Deposits: $${totalDeposits.toFixed(2)}</p>
          `;
          categoryTotalsContainer.appendChild(depositSection);
          // Update annual total
          annualTotalAmount.textContent = `$${(
            totalExpenses - totalDeposits
          ).toFixed(2)}`;
        });
    })
    .catch((error) => console.error("Error fetching grand totals:", error));

  // Modal logic
  function openCategoryModal(categoryName) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "category-modal-overlay";
    // Create modal box
    const modalBox = document.createElement("div");
    modalBox.className = "category-modal-box";
    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "category-modal-close";
    closeBtn.textContent = "✕";
    closeBtn.onclick = () => document.body.removeChild(overlay);
    modalBox.appendChild(closeBtn);
    // Title
    const title = document.createElement("div");
    title.className = "category-modal-title";
    title.textContent = `Entries for ${categoryName}`;
    modalBox.appendChild(title);
    // Table
    const table = document.createElement("table");
    table.className = "category-modal-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Amount</th>
          <th>Type</th>
          <th>Description</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    modalBox.appendChild(table);
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    // Fetch entries
    fetchWithAuth(
      `/api/entries-by-category/${encodeURIComponent(categoryName)}`
    )
      .then((response) => response.json())
      .then((entries) => {
        const tbody = table.querySelector("tbody");
        tbody.innerHTML = "";
        if (entries.length === 0) {
          const row = document.createElement("tr");
          const cell = document.createElement("td");
          cell.colSpan = 5;
          cell.textContent = "No entries found.";
          row.appendChild(cell);
          tbody.appendChild(row);
        } else {
          entries.forEach((entry) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${entry.name}</td>
              <td>$${(+entry.amount).toFixed(2)}</td>
              <td>${entry.type}</td>
              <td>${entry.description || ""}</td>
              <td>${new Date(entry.date).toLocaleDateString()}</td>
            `;
            tbody.appendChild(row);
          });
        }
      });
  }
});

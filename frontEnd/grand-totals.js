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
      let categoryNames = [];
      let categoryExpenses = [];

      // Define colors once for consistent use
      const categoryColors = [
        {
          bg: "#667eea",
          gradient: "linear-gradient(135deg, #667eea, #764ba2)",
        },
        {
          bg: "#ff6b6b",
          gradient: "linear-gradient(135deg, #ff6b6b, #ff5252)",
        },
        {
          bg: "#4caf50",
          gradient: "linear-gradient(135deg, #4caf50, #43a047)",
        },
        {
          bg: "#2196f3",
          gradient: "linear-gradient(135deg, #2196f3, #1976d2)",
        },
        {
          bg: "#9c27b0",
          gradient: "linear-gradient(135deg, #9c27b0, #673ab7)",
        },
        {
          bg: "#ff9800",
          gradient: "linear-gradient(135deg, #ff9800, #f57c00)",
        },
        {
          bg: "#607d8b",
          gradient: "linear-gradient(135deg, #607d8b, #455a64)",
        },
        {
          bg: "#e91e63",
          gradient: "linear-gradient(135deg, #e91e63, #c2185b)",
        },
      ];

      if (data.length === 0) {
        annualTotalAmount.textContent = "$0.00";
      } else {
        data.forEach((category, index) => {
          totalExpenses += category.totalexpenses;
          categoryNames.push(category.categoryname || "Uncategorized");
          categoryExpenses.push(category.totalexpenses);
          const net = category.totalexpenses - category.totaldeposits;

          // Use the same index for color that will be used in the graph
          const categoryColor = categoryColors[index % categoryColors.length];

          const categoryDiv = document.createElement("div");
          categoryDiv.classList.add("category-card");
          categoryDiv.style.background = categoryColor.gradient;
          categoryDiv.innerHTML = `
            <div class="category-card-header">
              <h4 class="category-card-title">${
                category.categoryname || "Uncategorized"
              }</h4>
              <div class="category-card-icon">📊</div>
            </div>
            <div class="category-card-stats">
              <div class="stat-item">
                <span class="stat-label">Expenses</span>
                <span class="stat-value">$${category.totalexpenses.toFixed(
                  2
                )}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Net Total</span>
                <span class="stat-value">$${net.toFixed(2)}</span>
              </div>
            </div>
          `;
          // Add expand button
          const expandBtn = document.createElement("button");
          expandBtn.className = "category-expand-btn-new";
          expandBtn.innerHTML = `
            <span>View Entries</span>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
          `;
          expandBtn.onclick = () =>
            openCategoryModal(category.categoryname || "Uncategorized");
          categoryDiv.appendChild(expandBtn);
          categoryTotalsContainer.appendChild(categoryDiv);
        });
        // Render bar graph if there are categories
        if (categoryNames.length > 0) {
          renderCategoryBarGraph(
            categoryNames,
            categoryExpenses,
            totalExpenses,
            categoryColors
          );
        }
      }
      // Always render the deposits box, even if total is zero
      const depositSection = document.createElement("div");
      depositSection.classList.add("category-card", "deposits-card");
      depositSection.style.background =
        "linear-gradient(135deg, #4caf50, #43a047)";
      depositSection.innerHTML = `
        <div class="category-card-header">
          <h4 class="category-card-title">All Deposits</h4>
          <div class="category-card-icon">💰</div>
        </div>
        <div class="category-card-stats">
          <div class="stat-item">
            <span class="stat-label">Total Deposits</span>
            <span class="stat-value" id="total-deposits-amount">$0.00</span>
          </div>
        </div>
      `;
      // Add expand button for deposits
      const expandBtn = document.createElement("button");
      expandBtn.className = "category-expand-btn-new";
      expandBtn.innerHTML = `
        <span>View Deposits</span>
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
      `;
      expandBtn.onclick = () => openDepositsModal();
      depositSection.appendChild(expandBtn);
      categoryTotalsContainer.appendChild(depositSection);
      // Fetch and update the total deposits and annual total
      fetchWithAuth("/api/total-deposits")
        .then((response) => response.json())
        .then((depositData) => {
          const totalDeposits = +depositData.totaldeposits;
          document.getElementById(
            "total-deposits-amount"
          ).textContent = `$${totalDeposits.toFixed(2)}`;
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
              <td class="amount-cell ${
                entry.type === "deposit" ? "deposit-amount" : "expense-amount"
              }">$${(+entry.amount).toFixed(2)}</td>
              <td>${entry.type}</td>
              <td>${entry.description || ""}</td>
              <td>${entry.date}</td>
            `;
            tbody.appendChild(row);
          });
        }
      });
  }

  function openDepositsModal() {
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
    title.textContent = `All Deposit Entries`;
    modalBox.appendChild(title);
    // Table
    const table = document.createElement("table");
    table.className = "category-modal-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Amount</th>
          <th>Description</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    modalBox.appendChild(table);
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    // Fetch deposit entries
    fetchWithAuth(`/api/all-deposits`)
      .then((response) => response.json())
      .then((entries) => {
        const tbody = table.querySelector("tbody");
        tbody.innerHTML = "";
        if (entries.length === 0) {
          const row = document.createElement("tr");
          const cell = document.createElement("td");
          cell.colSpan = 4;
          cell.textContent = "No deposits found.";
          row.appendChild(cell);
          tbody.appendChild(row);
        } else {
          entries.forEach((entry) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${entry.name}</td>
              <td class="amount-cell deposit-amount">$${(+entry.amount).toFixed(
                2
              )}</td>
              <td>${entry.description || ""}</td>
              <td>${entry.date}</td>
            `;
            tbody.appendChild(row);
          });
        }
      });
  }

  // Enhanced Chart.js bar graph logic with better colors
  let categoryBarChart = null;
  function renderCategoryBarGraph(names, expenses, total, categoryColors) {
    const ctx = document.getElementById("category-bar-graph").getContext("2d");
    if (categoryBarChart) {
      categoryBarChart.destroy();
    }

    // Use the same colors as the cards for perfect matching
    const backgroundColors = categoryColors.map((color) => color.bg);

    categoryBarChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: names,
        datasets: [
          {
            label: "Total Expenses",
            data: expenses,
            backgroundColor: backgroundColors.slice(0, names.length),
            borderRadius: 8,
            borderWidth: 2,
            borderColor: backgroundColors
              .slice(0, names.length)
              .map((color) => color + "80"),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            titleColor: "#333",
            bodyColor: "#666",
            borderColor: "#ddd",
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const value = context.parsed.y;
                const percent = total > 0 ? (value / total) * 100 : 0;
                return ` $${value.toFixed(2)} (${percent.toFixed(1)}%)`;
              },
            },
          },
          legend: { display: false },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Categories",
              color: "#667eea",
              font: { size: 14, weight: "bold" },
            },
            ticks: {
              color: "#333",
              font: { weight: "600", size: 12 },
              maxRotation: 45,
              minRotation: 0,
            },
            grid: {
              display: false,
            },
          },
          y: {
            title: {
              display: true,
              text: "Total Expenses ($)",
              color: "#667eea",
              font: { size: 14, weight: "bold" },
            },
            beginAtZero: true,
            ticks: {
              color: "#333",
              font: { weight: "500", size: 11 },
              callback: function (value) {
                return "$" + value.toFixed(0);
              },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        animation: {
          duration: 1000,
          easing: "easeOutQuart",
        },
      },
    });
  }

  // Toggle for expenses graph
  const toggleGraphBtn = document.getElementById("toggle-expenses-graph");
  const chartContainer = document.querySelector(".chart-container");
  let graphVisible = false;
  toggleGraphBtn.addEventListener("click", () => {
    graphVisible = !graphVisible;
    chartContainer.style.display = graphVisible ? "block" : "none";
    toggleGraphBtn.textContent = graphVisible
      ? "Hide Expenses Graph"
      : "Show Expenses Graph";
  });
});

console.log("Monthly Totals are so so so Cool, Man!");

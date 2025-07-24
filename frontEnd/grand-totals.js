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
});

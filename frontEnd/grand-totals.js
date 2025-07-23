document.addEventListener("DOMContentLoaded", () => {
  const annualTotalAmount = document.getElementById("annual-total-amount");
  const categoryTotalsContainer = document.getElementById(
    "category-totals-container"
  );

  fetch("/grand-totals")
    .then((response) => response.json())
    .then((data) => {
      let totalNet = 0;
      data.forEach((category) => {
        const net = category.totalExpenses - category.totalDeposits;
        totalNet += net;

        const categoryDiv = document.createElement("div");
        categoryDiv.classList.add("category-total");
        categoryDiv.innerHTML = `
          <h4>${category.categoryName || "Uncategorized"}</h4>
          <p>Expenses: $${category.totalExpenses.toFixed(2)}</p>
          <p>Deposits: $${category.totalDeposits.toFixed(2)}</p>
          <p>Net: $${net.toFixed(2)}</p>
        `;
        categoryTotalsContainer.appendChild(categoryDiv);
      });

      annualTotalAmount.textContent = `$${totalNet.toFixed(2)}`;
    })
    .catch((error) => console.error("Error fetching grand totals:", error));
});

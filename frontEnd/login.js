document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const errorMessage = document.getElementById("error-message");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem("token", token);
      window.location.href = "/";
    } else {
      errorMessage.textContent = "Invalid username or password";
    }
  });
});

// Password toggle functionality
const togglePassword = document.getElementById("toggle-password");
const passwordInput = document.getElementById("password");
const eyeIcon = document.getElementById("eye-icon");

if (togglePassword && passwordInput && eyeIcon) {
  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";

    // Change the eye icon based on state
    if (isPassword) {
      // Show "eye-off" icon when password is visible
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94L17.94 17.94z" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M1 1l22 22" stroke="currentColor" stroke-width="2"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" stroke="currentColor" stroke-width="2" fill="none"/>
      `;
    } else {
      // Show regular "eye" icon when password is hidden
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
      `;
    }
  });
}

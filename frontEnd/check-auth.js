const token = localStorage.getItem("token");
if (!token && window.location.pathname !== "/login.html") {
  window.location.href = "/login.html";
}

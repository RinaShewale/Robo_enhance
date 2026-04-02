function requireLogin() {
  const token = localStorage.getItem("token");

  if (!token || token === "null" || token === "undefined") {
    window.location.href = "login.html";
    return false;
  }

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  requireLogin();
});
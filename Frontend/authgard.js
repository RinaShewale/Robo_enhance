function getToken() {
    return localStorage.getItem("token");
}

function isLoggedIn() {
    const token = getToken();
    return token && token !== "null" && token !== "undefined";
}

// ❌ redirect if NOT logged in
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
    }
}
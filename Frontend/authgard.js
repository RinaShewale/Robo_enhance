// ============================
// AUTH GUARD SYSTEM
// ============================

// get token from browser
function getToken() {
    return localStorage.getItem("token");
}

// check user logged in or not
function isLoggedIn() {
    const token = getToken();
    return token && token !== "null" && token !== "undefined";
}

// ============================
// PROTECT PAGES
// ============================
function requireLogin() {
    if (!isLoggedIn()) {
        // redirect to login page
        window.location.href = "./register.html";
    }
}

// ============================
// UPDATE NAVBAR UI
// ============================
function updateNavbar() {
    const loggedIn = isLoggedIn();

    const signInBtn = document.querySelector(".btn1");
    const signInLink = document.querySelector("a[href='./register.html']");
    const profileLink = document.querySelector("a[href='./profile.html']");

    if (loggedIn) {
        // hide sign in
        if (signInBtn) signInBtn.style.display = "none";
        if (signInLink) signInLink.parentElement.style.display = "none";

        // show profile
        if (profileLink) profileLink.parentElement.style.display = "block";
    } else {
        // show sign in
        if (signInBtn) signInBtn.style.display = "block";
        if (signInLink) signInLink.parentElement.style.display = "block";

        // hide profile
        if (profileLink) profileLink.parentElement.style.display = "none";
    }
}

// ============================
// LOGOUT FUNCTION (OPTIONAL)
// ============================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "./register.html";
}
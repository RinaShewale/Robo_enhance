document.addEventListener('DOMContentLoaded', () => {

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

  function showError(input, message) {
    let errorEl = input.nextElementSibling;
    if (!errorEl || !errorEl.classList.contains('error-message')) {
      errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      input.parentNode.insertBefore(errorEl, input.nextSibling);
    }
    errorEl.textContent = message;
  }

  function clearError(input) {
    const errorEl = input.nextElementSibling;
    if (errorEl && errorEl.classList.contains('error-message')) {
      errorEl.textContent = '';
    }
  }

  // ======================
  // SIGNUP
  // ======================
  const signupForm = document.querySelector('.signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();

      const username = document.getElementById('username')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value.trim();

      if (!username || !email || !password) return;

      try {
        const res = await fetch('https://robo-enhance.onrender.com/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert("Signup successful!");
          window.location.href = "login.html";
        } else {
          alert(data.error || "Signup failed");
        }

      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    });
  }

  // ======================
  // LOGIN (FIXED MAIN PART)
  // ======================
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();

      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value.trim();

      if (!emailPattern.test(email)) return alert("Invalid email");
      if (!password) return alert("Password required");

      try {
        const res = await fetch('https://robo-enhance.onrender.com/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.token) {

          // 🔥 ONLY ONE AUTH SYSTEM
          localStorage.setItem('token', data.token);

          localStorage.setItem('userId', data.user?.id || "");
          localStorage.setItem('username', data.user?.username || "");
          localStorage.setItem('email', data.user?.email || "");

          window.location.href = "index.html";

        } else {
          alert(data.error || "Login failed");
        }

      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    });
  }

  // ======================
  // PROFILE UPDATE
  // ======================
  const profileForm = document.querySelector('.profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async e => {
      e.preventDefault();

      const username = document.getElementById('username')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const userId = localStorage.getItem('userId');

      try {
        const res = await fetch('https://robo-enhance.onrender.com/auth/update_profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId, username, email })
        });

        const data = await res.json();

        if (res.ok) {
          alert("Profile updated!");
          localStorage.setItem('username', username);
          localStorage.setItem('email', email);
        } else {
          alert(data.error || "Update failed");
        }

      } catch (err) {
        console.error(err);
        alert("Server error");
      }
    });
  }

});
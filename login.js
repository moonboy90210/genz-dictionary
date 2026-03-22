// login.js — login + signup page
import { login, signup, requireGuest } from "./auth.js";

// ============================================================
// THEME
// ============================================================
const root        = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const savedTheme  = localStorage.getItem("gz_theme") || "dark";
root.setAttribute("data-theme", savedTheme);

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("gz_theme", next);
});

// ============================================================
// GUARD — redirect if already logged in
// ============================================================
requireGuest(() => {
  // Only runs if no active session — page is ready to use
  initPage();
});

// ============================================================
// PAGE INIT
// ============================================================
function initPage() {

  // ---- Tabs ----
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach(t   => t.classList.remove("active"));
      document.querySelectorAll(".auth-form").forEach(f  => f.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab + "Form").classList.add("active");
      // Clear errors on tab switch
      document.querySelectorAll(".form-error").forEach(e => e.textContent = "");
    });
  });

  // ---- Login form ----
  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const email    = document.getElementById("loginEmail").value.trim();
    const errEl    = document.getElementById("loginError");
    const btn      = e.target.querySelector("button[type=submit]");

    errEl.textContent = "";

    if (!username || !email) {
      errEl.textContent = "Both fields are required.";
      return;
    }

    btn.textContent  = "LOGGING IN...";
    btn.disabled     = true;

    const res = await login(username, email);

    btn.textContent = "LOG IN →";
    btn.disabled    = false;

    if (!res.ok) {
      errEl.textContent = res.error;
      return;
    }

    location.href = res.redirect;
  });

  // ---- Signup form ----
  document.getElementById("signupForm").addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("signupUsername").value.trim();
    const email    = document.getElementById("signupEmail").value.trim();
    const errEl    = document.getElementById("signupError");
    const btn      = e.target.querySelector("button[type=submit]");

    errEl.textContent = "";

    if (!username || !email) {
      errEl.textContent = "Both fields are required.";
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      errEl.textContent = "Enter a valid email address.";
      return;
    }

    btn.textContent = "CREATING ACCOUNT...";
    btn.disabled    = true;

    const res = await signup(username, email);

    btn.textContent = "CREATE ACCOUNT →";
    btn.disabled    = false;

    if (!res.ok) {
      errEl.textContent = res.error;
      return;
    }

    location.href = res.redirect;
  });
}
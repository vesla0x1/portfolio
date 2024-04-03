function enableThemeToggle() {
  const themeToggle = document.querySelector('#theme-toggle');
  const preferDark = window.matchMedia("(prefers-color-scheme: dark)");
  function toggleTheme(theme) {
    if (theme == "dark") document.body.classList.add('dark'); else document.body.classList.remove('dark');
    themeToggle.innerHTML = theme == "dark" ? themeToggle.dataset.sunIcon : themeToggle.dataset.moonIcon;
    sessionStorage.setItem("theme", theme);
  }

  themeToggle.addEventListener('click', () => toggleTheme(sessionStorage.getItem("theme") == "dark" ? "light" : "dark"));
  preferDark.addEventListener("change", e => toggleTheme(e.matches ? "dark" : "light"));
  if (!sessionStorage.getItem("theme") && preferDark.matches) toggleTheme("dark");
  if (sessionStorage.getItem("theme") == "dark") toggleTheme("dark");
}

enableThemeToggle();

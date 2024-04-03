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

async function loadRecent(page) {
  const html = (await (await fetch(`/home/recent/${page === 1 ? '' : page}`)).text());
  const doc = new DOMParser().parseFromString(html, 'text/html');
  document.getElementById('recent-updates').innerHTML = doc.body.innerHTML;

  const next = document.getElementById('next');
  if (next) {
    next.addEventListener('click', e => e.preventDefault())
    next.onclick = () => { loadRecent(page + 1) }
  }

  const prev = document.getElementById('prev');
  if (prev) {
    prev.addEventListener('click', e => e.preventDefault())
    prev.onclick = () => { loadRecent(page - 1) };
  }
}

enableThemeToggle();

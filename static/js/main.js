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

function enableRssMask() {
  const rssBtn = document.querySelector('#rss-btn');
  const mask = document.querySelector('#rss-mask');
  const copyBtn = document.querySelector('#rss-mask button');
  if (!rssBtn || !mask) return;
  rssBtn.addEventListener('click', (e) => {
    e.preventDefault();
    mask.showModal();
  });
  const close = (e) => {
    if (e.target == mask) mask.close();
  };
  mask.addEventListener('click', close);
  const copy = () => {
    navigator.clipboard.writeText(copyBtn.dataset.link).then(() => {
      copyBtn.innerHTML = copyBtn.dataset.checkIcon;
      copyBtn.classList.add('copied');
      copyBtn.removeEventListener('click', copy);
      setTimeout(() => {
        mask.close();
        copyBtn.innerHTML = copyBtn.dataset.copyIcon;
        copyBtn.classList.remove('copied');
        copyBtn.addEventListener('click', copy);
      }, 400);
    });
  }
  copyBtn.addEventListener('click', copy);
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
enableRssMask();
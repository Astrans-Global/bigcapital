const theme =
  localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light');

document.documentElement.classList.toggle('bp4-dark', theme === 'dark');
document.body.classList.toggle('bp4-dark', theme === 'dark');

// Remove dark mode for payment portal pages
if (window.location.pathname.startsWith('/payment')) {
  document.documentElement.classList.remove('bp4-dark');
  document.body.classList.remove('bp4-dark');
}

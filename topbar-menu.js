// 右上角菜单：报告切换
document.addEventListener('DOMContentLoaded', () => {
  const moreBtn = document.querySelector('.topbar__more');
  const menu = document.getElementById('reportMenu');
  if (!moreBtn || !menu) return;

  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  // 点击菜单外部关闭
  document.addEventListener('click', (e) => {
    if (menu.hidden || menu.contains(e.target) || moreBtn.contains(e.target)) return;
    menu.hidden = true;
  });

  // 高亮当前页面对应项
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  menu.querySelectorAll('a').forEach((a) => {
    if (a.getAttribute('href').toLowerCase() === current) {
      a.classList.add('is-current');
    }
  });
});

// ══════════════════════════════════════
//  TEMA — claro / escuro
// ══════════════════════════════════════
const themeBtn = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme, save) {
    document.documentElement.setAttribute('data-theme', theme);
    const dark = theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#1b1c1e' : '#f5eee6');
    if (save) {
        try { localStorage.setItem('tema', theme); } catch (e) { /* sem armazenamento */ }
    }
}

applyTheme(document.documentElement.getAttribute('data-theme') || 'light', false);

themeBtn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
});

systemDark.addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('tema'); } catch (err) { /* sem armazenamento */ }
    if (!saved) applyTheme(e.matches ? 'dark' : 'light', false);
});

// ══════════════════════════════════════
//  NAVBAR — sombra ao rolar
// ══════════════════════════════════════
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ══════════════════════════════════════
//  REVEAL — animação ao rolar
// ══════════════════════════════════════
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.12,
});

revealEls.forEach(el => revealObserver.observe(el));

// ══════════════════════════════════════
//  LINK ATIVO NA NAV ao rolar
// ══════════════════════════════════════
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
        });
    });
}, {
    rootMargin: '-45% 0px -50% 0px',
    threshold: 0,
});

sections.forEach(sec => activeObserver.observe(sec));
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
//  MENU MOBILE
// ══════════════════════════════════════
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
    });
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
//  FORMULÁRIO — envio para Gmail
// ══════════════════════════════════════
const form = document.getElementById('contato-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    const data = new FormData(form);

    try {
        const response = await fetch('https://formspree.io/f/mwvdznad', {
            method: 'POST',
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            btn.textContent = 'Mensagem enviada ✓';
            btn.style.background = '#4CAF50';
            form.reset();

            setTimeout(() => {
                btn.textContent = 'Enviar mensagem →';
                btn.style.background = '';
                btn.disabled = false;
            }, 3500);
        } else {
            btn.textContent = 'Erro ao enviar. Tente novamente.';
            btn.style.background = '#E53935';
            btn.disabled = false;
        }
    } catch {
        btn.textContent = 'Erro ao enviar. Tente novamente.';
        btn.style.background = '#E53935';
        btn.disabled = false;
    }
});

// ══════════════════════════════════════
//  LINK ATIVO NA NAV ao rolar
// ══════════════════════════════════════
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navAnchors.forEach(a => a.style.color = '');
            const active = document.querySelector(
                `.nav-links a[href="#${entry.target.id}"]`
            );
            if (active) active.style.color = 'var(--laranja)';
        }
    });
}, {
    threshold: 0.4,
});

sections.forEach(sec => activeObserver.observe(sec));
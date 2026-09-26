// Fundo animado de tecnologia: rede de pontos conectados, formas geométricas e brilhos.
// Desenhado em canvas, reage ao mouse no desktop e se adapta ao tema claro/escuro.
(() => {
    const canvas = document.createElement('canvas');
    canvas.id = 'fundo-fx';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;

    let W = 0, H = 0, dpr = 1, mobile = false;
    let nodes = [], shapes = [], stars = [];
    let cor = { line: '88,45,26', node: '190,106,69', star: '190,106,69' };
    const mouse = { x: -9999, y: -9999, on: false };

    const rand = (a, b) => a + Math.random() * (b - a);

    function lerCores() {
        const cs = getComputedStyle(root);
        const get = (n, d) => (cs.getPropertyValue(n).trim() || d).replace(/\s+/g, '');
        cor = {
            line: get('--fx-line', cor.line),
            node: get('--fx-node', cor.node),
            star: get('--fx-star', cor.star),
        };
    }

    function criar() {
        const area = W * H;
        const nNodes = mobile ? Math.min(34, Math.max(16, Math.round(area / 16000)))
                              : Math.min(80, Math.max(32, Math.round(area / 21000)));
        nodes = Array.from({ length: nNodes }, () => ({
            x: rand(0, W), y: rand(0, H),
            vx: rand(-0.22, 0.22), vy: rand(-0.22, 0.22),
            r: rand(1.1, 2.5),
            tipo: Math.random() < 0.14 ? 1 : 0,
        }));

        const tipos = ['hex', 'tri', 'ring', 'sq', 'plus', 'hex'];
        const nShapes = mobile ? 5 : 9;
        shapes = Array.from({ length: nShapes }, (_, i) => ({
            tipo: tipos[i % tipos.length],
            x: rand(0, W), y: rand(0, H),
            vx: rand(-0.16, 0.16), vy: rand(-0.16, 0.16),
            s: rand(mobile ? 22 : 30, mobile ? 46 : 74),
            a: rand(0, Math.PI * 2),
            va: rand(-0.004, 0.004) || 0.002,
            alpha: rand(0.1, 0.2),
        }));

        const nStars = mobile ? 7 : 13;
        stars = Array.from({ length: nStars }, () => ({
            x: rand(0, W), y: rand(0, H),
            s: rand(4, mobile ? 8 : 11),
            fase: rand(0, Math.PI * 2),
            vel: rand(0.6, 1.5),
        }));
    }

    function tamanho() {
        mobile = window.innerWidth < 768;
        dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        criar();
        if (reduzir) desenhar(0);
    }

    function forma(sh, t) {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.a);
        ctx.strokeStyle = `rgba(${cor.line},${sh.alpha})`;
        ctx.lineWidth = 1.3;
        const s = sh.s;
        ctx.beginPath();
        if (sh.tipo === 'hex') {
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i;
                const px = Math.cos(ang) * s * 0.5, py = Math.sin(ang) * s * 0.5;
                i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            }
            ctx.closePath();
        } else if (sh.tipo === 'tri') {
            ctx.moveTo(0, -s * 0.55);
            ctx.lineTo(s * 0.5, s * 0.4);
            ctx.lineTo(-s * 0.5, s * 0.4);
            ctx.closePath();
        } else if (sh.tipo === 'ring') {
            ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
            ctx.moveTo(s * 0.22, 0);
            ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
        } else if (sh.tipo === 'sq') {
            ctx.rect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7);
            ctx.rect(-s * 0.18, -s * 0.18, s * 0.36, s * 0.36);
        } else {
            ctx.moveTo(-s * 0.3, 0); ctx.lineTo(s * 0.3, 0);
            ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, s * 0.3);
        }
        ctx.stroke();
        ctx.restore();
    }

    function estrela(st, t) {
        const p = 0.5 + 0.5 * Math.sin(t * 0.001 * st.vel + st.fase);
        const al = reduzir ? 0.5 : p * p;
        if (al < 0.03) return;
        const s = st.s * (0.6 + 0.6 * p);
        ctx.save();
        ctx.translate(st.x, st.y);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.6);
        g.addColorStop(0, `rgba(${cor.star},${0.35 * al})`);
        g.addColorStop(1, `rgba(${cor.star},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${cor.star},${0.85 * al})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
        ctx.moveTo(0, -s); ctx.lineTo(0, s);
        ctx.stroke();
        ctx.restore();
    }

    let ultimo = 0;

    function desenhar(t) {
        const dt = Math.min(2.5, (t - ultimo) / 16.67 || 1);
        ultimo = t;
        ctx.clearRect(0, 0, W, H);

        const lim = mobile ? 105 : 150;
        const mouseLim = 190;

        if (!reduzir) {
            for (const n of nodes) {
                n.x += n.vx * dt;
                n.y += n.vy * dt;
                if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
                if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
            }
            for (const sh of shapes) {
                sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.a += sh.va * dt;
                if (sh.x < -90) sh.x = W + 90; else if (sh.x > W + 90) sh.x = -90;
                if (sh.y < -90) sh.y = H + 90; else if (sh.y > H + 90) sh.y = -90;
            }
        }

        for (const sh of shapes) forma(sh, t);

        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < lim * lim) {
                    const al = (1 - Math.sqrt(d2) / lim) * 0.3;
                    ctx.strokeStyle = `rgba(${cor.line},${al})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
            if (mouse.on) {
                const dx = a.x - mouse.x, dy = a.y - mouse.y;
                const d = Math.hypot(dx, dy);
                if (d < mouseLim) {
                    ctx.strokeStyle = `rgba(${cor.node},${(1 - d / mouseLim) * 0.6})`;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                    if (!reduzir) {
                        a.x += (dx / (d || 1)) * 0.25 * dt;
                        a.y += (dy / (d || 1)) * 0.25 * dt;
                    }
                }
            }
        }

        for (const n of nodes) {
            ctx.fillStyle = `rgba(${cor.node},0.75)`;
            if (n.tipo === 1) {
                ctx.save();
                ctx.translate(n.x, n.y);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-n.r * 1.4, -n.r * 1.4, n.r * 2.8, n.r * 2.8);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (const st of stars) estrela(st, t);
    }

    let raf = 0;
    function loop(t) {
        desenhar(t);
        raf = requestAnimationFrame(loop);
    }

    function iniciar() {
        if (reduzir || raf) return;
        raf = requestAnimationFrame(loop);
    }

    function parar() {
        cancelAnimationFrame(raf);
        raf = 0;
    }

    lerCores();
    tamanho();
    if (reduzir) desenhar(0); else iniciar();

    let redim;
    window.addEventListener('resize', () => {
        clearTimeout(redim);
        redim = setTimeout(tamanho, 150);
    });

    window.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
    });
    document.addEventListener('pointerleave', () => { mouse.on = false; });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) parar(); else iniciar();
    });

    new MutationObserver(() => {
        lerCores();
        if (reduzir) desenhar(0);
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
})();

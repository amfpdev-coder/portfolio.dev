// Assistente de propostas: fluxo guiado (sem IA, sem servidor) que monta um pedido,
// envia para a Angélica pelo Formspree e gera um rascunho em PDF, sem valores.
(() => {
    const fab = document.getElementById('bot-fab');
    const panel = document.getElementById('bot-panel');
    const closeBtn = document.getElementById('bot-close');
    const log = document.getElementById('bot-log');
    const controls = document.getElementById('bot-controls');
    if (!fab || !panel || !log || !controls) return;

    const FORM_URL = 'https://formspree.io/f/mwvdznad';
    const WHATSAPP = '5583993389537';

    const SERVICOS = {
        'Banco de Dados':
            'Modelagem e criação de bancos de dados do zero, estruturados para suportar o sistema com segurança, eficiência e organização.',
        'Sistemas Desktop':
            'Criação de sistemas completos para uso local, com interface própria e funcionalidades sob medida para o fluxo do negócio do cliente.',
        'Websites':
            'Desenvolvimento de sites modernos, responsivos e rápidos. Do design à publicação, entrego sites que representam bem o negócio do cliente.',
        'Análise de Dados':
            'Análise exploratória de dados para identificar padrões, validar consistência e gerar insights para tomada de decisão.',
    };
    window.ASSISTENTE_SERVICOS = SERVICOS;

    const PARTIDAS = [
        'Começando do zero',
        'Já tenho planilhas ou um sistema atual',
        'Já tenho dados para analisar',
    ];
    const PRAZOS = ['Urgente (até 2 semanas)', 'De 1 a 2 meses', 'Sem pressa / a combinar'];
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    let runId = 0;
    let started = false;

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const forever = () => new Promise(() => {});

    function addMsg(text, who) {
        const el = document.createElement('div');
        el.className = 'bot-bubble ' + who;
        el.textContent = text;
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
        return el;
    }

    async function say(id, text) {
        const typing = document.createElement('div');
        typing.className = 'bot-bubble bot bot-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        log.appendChild(typing);
        log.scrollTop = log.scrollHeight;
        await wait(420);
        typing.remove();
        if (id !== runId) return forever();
        addMsg(text, 'bot');
    }

    function ask(id, build) {
        return new Promise((resolve) => {
            controls.replaceChildren();
            build((value, echo) => {
                if (id !== runId) return;
                controls.replaceChildren();
                if (echo) addMsg(echo, 'user');
                resolve(value);
            });
        });
    }

    function makeButton(text, cls) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = cls;
        b.textContent = text;
        return b;
    }

    function askText(id, opts = {}) {
        return ask(id, (done) => {
            const form = document.createElement('form');
            form.className = 'bot-form';
            const field = document.createElement(opts.multiline ? 'textarea' : 'input');
            if (!opts.multiline) {
                field.type = 'text';
                if (opts.inputMode) field.inputMode = opts.inputMode;
                if (opts.autocomplete) field.autocomplete = opts.autocomplete;
            } else {
                field.rows = 3;
            }
            field.className = 'bot-input';
            field.placeholder = opts.placeholder || '';
            field.maxLength = opts.multiline ? 800 : 120;
            field.setAttribute('aria-label', opts.placeholder || 'Sua resposta');

            const send = makeButton('', 'bot-send');
            send.type = 'submit';
            send.setAttribute('aria-label', 'Enviar resposta');
            send.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';

            const err = document.createElement('div');
            err.className = 'bot-error';
            err.setAttribute('role', 'alert');

            form.append(field, send);
            controls.append(form, err);

            if (opts.optional) {
                const skip = makeButton('Pular', 'bot-chip bot-skip');
                skip.addEventListener('click', () => done('', 'Pular'));
                controls.append(skip);
            }

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const v = field.value.trim();
                if (!v && opts.optional) return done('', 'Pular');
                const msg = v ? (opts.validate ? opts.validate(v) : '') : 'Preencha para continuar.';
                if (msg) {
                    err.textContent = msg;
                    return;
                }
                done(v, v);
            });
            if (opts.multiline) {
                field.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        form.requestSubmit();
                    }
                });
            }
            field.focus();
        });
    }

    function askSingle(id, options) {
        return ask(id, (done) => {
            const wrap = document.createElement('div');
            wrap.className = 'bot-chips';
            options.forEach((opt) => {
                const b = makeButton(opt, 'bot-chip');
                b.addEventListener('click', () => done(opt, opt));
                wrap.appendChild(b);
            });
            controls.appendChild(wrap);
            wrap.firstChild.focus();
        });
    }

    function askMulti(id, options) {
        return ask(id, (done) => {
            const wrap = document.createElement('div');
            wrap.className = 'bot-chips';
            const chosen = new Set();
            const err = document.createElement('div');
            err.className = 'bot-error';
            err.setAttribute('role', 'alert');
            options.forEach((opt) => {
                const b = makeButton(opt, 'bot-chip');
                b.setAttribute('aria-pressed', 'false');
                b.addEventListener('click', () => {
                    const on = !chosen.has(opt);
                    if (on) chosen.add(opt);
                    else chosen.delete(opt);
                    b.classList.toggle('selected', on);
                    b.setAttribute('aria-pressed', String(on));
                    err.textContent = '';
                });
                wrap.appendChild(b);
            });
            const go = makeButton('Continuar', 'bot-primary');
            go.addEventListener('click', () => {
                if (!chosen.size) {
                    err.textContent = 'Marque pelo menos uma opção.';
                    return;
                }
                const list = options.filter((o) => chosen.has(o));
                done(list, list.join(', '));
            });
            controls.append(wrap, err, go);
            wrap.firstChild.focus();
        });
    }

    function resumo(d) {
        return [
            'Nome: ' + d.nome,
            'E-mail: ' + d.email,
            'Empresa: ' + (d.empresa || '-'),
            'Serviços: ' + d.servicos.join(', '),
            'Necessidade: ' + d.descricao,
            'Ponto de partida: ' + d.partida,
            'Prazo desejado: ' + d.prazo,
        ].join('\n');
    }

    function whatsappUrl(d) {
        const texto =
            'Olá, Angélica! Sou ' + d.nome + '. Acabei de pedir uma proposta pelo site amfp.dev.\n' +
            'Serviços: ' + d.servicos.join(', ') + '\n' +
            'Prazo: ' + d.prazo + '\n' +
            'Pode me retornar?';
        return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    }

    function askFinal(id, waUrl) {
        return ask(id, (done) => {
            const wrap = document.createElement('div');
            wrap.className = 'bot-chips';
            if (waUrl) {
                const a = document.createElement('a');
                a.className = 'bot-whatsapp';
                a.href = waUrl;
                a.target = '_blank';
                a.rel = 'noopener';
                a.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>';
                a.append(' Chamar no WhatsApp');
                wrap.appendChild(a);
            }
            const again = makeButton('Fazer outro pedido', 'bot-chip');
            again.addEventListener('click', () => done(true, 'Fazer outro pedido'));
            wrap.appendChild(again);
            controls.appendChild(wrap);
            (wrap.firstChild).focus();
        });
    }

    async function enviar(d) {
        const fd = new FormData();
        fd.append('name', d.nome);
        fd.append('email', d.email);
        fd.append('_subject', 'Novo pedido de proposta — amfp.dev');
        fd.append('message', 'Pedido de proposta via assistente do site\n\n' + resumo(d));
        try {
            const r = await fetch(FORM_URL, {
                method: 'POST',
                body: fd,
                headers: { Accept: 'application/json' },
            });
            return r.ok;
        } catch {
            return false;
        }
    }

    async function run() {
        const id = ++runId;
        log.replaceChildren();
        controls.replaceChildren();
        const d = {};

        await say(id, 'Oi! Eu sou a Marina, assistente da amfp.dev. Em poucos passos monto um rascunho de proposta para você.');
        await say(id, 'Não passo valores por aqui: a Angélica revisa o seu pedido e envia o orçamento depois.');

        await say(id, 'Como posso te chamar?');
        d.nome = await askText(id, {
            placeholder: 'Seu nome',
            autocomplete: 'name',
            validate: (v) => (v.length < 2 ? 'Digite seu nome.' : ''),
        });

        await say(id, 'Prazer, ' + d.nome + '! Qual é o seu e-mail? É para onde a proposta será enviada.');
        d.email = await askText(id, {
            placeholder: 'seu@email.com',
            inputMode: 'email',
            autocomplete: 'email',
            validate: (v) => (EMAIL_RE.test(v) ? '' : 'Digite um e-mail válido.'),
        });

        await say(id, 'Qual o nome da sua empresa ou negócio? Se não tiver, pode pular.');
        d.empresa = await askText(id, { placeholder: 'Empresa ou negócio', optional: true });

        await say(id, 'O que você precisa? Pode marcar mais de um.');
        d.servicos = await askMulti(id, Object.keys(SERVICOS));

        await say(id, 'Conte em poucas linhas o que você quer resolver ou construir.');
        d.descricao = await askText(id, {
            placeholder: 'Descreva a sua necessidade',
            multiline: true,
            validate: (v) => (v.length < 10 ? 'Conte um pouco mais, com pelo menos 10 caracteres.' : ''),
        });

        await say(id, 'Qual é o ponto de partida?');
        d.partida = await askSingle(id, PARTIDAS);

        await say(id, 'E o prazo que você tem em mente?');
        d.prazo = await askSingle(id, PRAZOS);

        await say(id, 'Confira o seu pedido:\n\n' + resumo(d));
        await say(id, 'Ao enviar, você autoriza a Angélica a receber essas informações para responder ao seu pedido.');
        const acao = await askSingle(id, ['Enviar e baixar o PDF', 'Recomeçar']);
        if (acao === 'Recomeçar') return run();

        await say(id, 'Enviando o seu pedido...');
        const enviado = await enviar(d);
        let pdfOk = true;
        try {
            if (!window.jspdf || !window.gerarPropostaPdf) throw new Error('jsPDF indisponível');
            window.gerarPropostaPdf(d);
        } catch {
            pdfOk = false;
        }

        if (enviado && pdfOk) {
            await say(id, 'Pronto! Enviei o seu pedido para a Angélica e baixei o rascunho da proposta em PDF. Ela retorna por e-mail com os valores.');
        } else if (enviado) {
            await say(id, 'Enviei o seu pedido para a Angélica, que retorna por e-mail com os valores. Não consegui gerar o PDF agora, mas ela terá todas as informações.');
        } else if (pdfOk) {
            await say(id, 'Baixei o rascunho em PDF, mas não consegui enviar o pedido. Use o formulário de contato da página para falar com a Angélica.');
        } else {
            await say(id, 'Não consegui enviar o pedido agora. Use o formulário de contato da página para falar com a Angélica.');
        }
        if (enviado) {
            await say(id, 'Se preferir falar agora, é só chamar a Angélica no WhatsApp. Já deixei uma mensagem pronta com o seu pedido.');
        }
        const de_novo = await askFinal(id, enviado ? whatsappUrl(d) : null);
        if (de_novo) return run();
    }

    function open() {
        panel.classList.add('open');
        fab.setAttribute('aria-expanded', 'true');
        if (!started) {
            started = true;
            run();
        }
    }

    function close() {
        panel.classList.remove('open');
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
    }

    document.querySelectorAll('[data-open-bot]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!panel.classList.contains('open')) open();
        });
    });
    fab.addEventListener('click', () => (panel.classList.contains('open') ? close() : open()));
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });
})();

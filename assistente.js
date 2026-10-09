// Assistente de propostas (Marina): fluxo guiado e gratuito, sem IA e sem servidor.
// A Marina pergunta nome e empresa, manda a pessoa para um Google Forms (onde ela
// escreve tudo sobre o projeto) e fica de olho sozinha numa planilha publicada do
// Google até a resposta chegar — aí gera o PDF final da proposta.
//
// ───────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO NECESSÁRIA — preencha depois de criar o Google Forms e a Planilha
// ───────────────────────────────────────────────────────────────────────────
(() => {
    // 1) Link do formulário (a URL que aparece quando você clica em "Enviar" no
    //    editor do Forms, ou a URL da aba "Visualizar").
    const FORM_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeD-yTOiDYIz7Y8xOl0XVMjhIQRpTu32l9E87diHuJJeNkQwA/viewform';

    // 2) IDs dos campos para pré-preencher (veja o passo a passo que te enviei:
    //    "Obter link para preencher automaticamente" no menu ⋮ do formulário).
    const FORM_ENTRY = {
        codigo: 'entry.1034648226',
        nome: 'entry.811479730',
        empresa: 'entry.2147108579',
    };

    // 3) URL da planilha de respostas publicada como CSV (Arquivo → Compartilhar
    //    → Publicar na web → aba das respostas → formato CSV).
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCxrsfs81vbCLWDdTzX9T05ox_Syoi3CgfD0ETFQUm2s5g10VYhOjjJU0do6UC8fX6TUre149BclD0/pub?gid=1940292128&single=true&output=csv';
    // ───────────────────────────────────────────────────────────────────────

    const fab = document.getElementById('bot-fab');
    const panel = document.getElementById('bot-panel');
    const closeBtn = document.getElementById('bot-close');
    const log = document.getElementById('bot-log');
    const controls = document.getElementById('bot-controls');
    if (!fab || !panel || !log || !controls) return;

    const WHATSAPP = '5583993389537';
    const ESPERA_MAX_MS = 10 * 60 * 1000;
    const INTERVALO_MS = 4000;

    const SERVICOS_DESC = {
        'Banco de Dados':
            'Modelagem e criação de bancos de dados do zero, estruturados para suportar o sistema com segurança, eficiência e organização.',
        'Sistema Desktop':
            'Criação de sistemas completos para uso local, com interface própria e funcionalidades sob medida para o fluxo do negócio do cliente.',
        'Website':
            'Desenvolvimento de sites modernos, responsivos e rápidos. Do design à publicação, entrego sites que representam bem o negócio do cliente.',
        'Aplicativo':
            'Desenvolvimento de aplicativos mobile sob medida, com interface própria e funcionalidades pensadas para o uso no dia a dia do negócio ou do usuário final.',
        'Site / Aplicativo':
            'Projeto que une site e aplicativo numa mesma solução, com experiência integrada entre as duas plataformas.',
        'Análise de Dados':
            'Análise exploratória de dados para identificar padrões, validar consistência e gerar insights para tomada de decisão.',
    };
    window.ASSISTENTE_SERVICOS = SERVICOS_DESC;

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
            if (opts.multiline) {
                field.rows = 3;
            } else {
                field.type = 'text';
                if (opts.inputMode) field.inputMode = opts.inputMode;
                if (opts.autocomplete) field.autocomplete = opts.autocomplete;
            }
            field.className = 'bot-input';
            field.placeholder = opts.placeholder || '';
            field.maxLength = opts.multiline ? 600 : 120;
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

    function askFinal(id, waUrl, { rotuloWhats = 'Chamar no WhatsApp' } = {}) {
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
                a.append(' ' + rotuloWhats);
                wrap.appendChild(a);
            }
            const again = makeButton('Fazer outro pedido', 'bot-chip');
            again.addEventListener('click', () => done(true, 'Fazer outro pedido'));
            wrap.appendChild(again);
            controls.appendChild(wrap);
            wrap.firstChild.focus();
        });
    }

    function askAguardando(id, espera) {
        return ask(id, (done) => {
            const box = document.createElement('div');
            box.className = 'bot-waiting';
            box.innerHTML =
                '<div class="bot-waiting-dots"><span></span><span></span><span></span></div>' +
                '<p>Aguardando você enviar o formulário…</p>';

            const wrap = document.createElement('div');
            wrap.className = 'bot-chips bot-chips-center';
            const btn = makeButton('Já enviei, verificar agora', 'bot-chip');
            wrap.appendChild(btn);

            const info = document.createElement('div');
            info.className = 'bot-error';
            info.setAttribute('role', 'status');

            btn.addEventListener('click', async () => {
                btn.disabled = true;
                btn.textContent = 'Verificando...';
                const dados = await espera.verificarAgora();
                btn.disabled = false;
                btn.textContent = 'Já enviei, verificar agora';
                info.textContent = dados ? '' : 'Ainda não chegou. Aguarde alguns segundos e tente de novo.';
            });

            controls.append(box, wrap, info);
            espera.aguardando.then((res) => done(res));
        });
    }

    // ── Código de referência que liga a conversa à resposta do formulário ──
    function gerarCodigo() {
        const letras = Math.random().toString(36).slice(2, 6).toUpperCase();
        const tempo = Date.now().toString(36).slice(-3).toUpperCase();
        return letras + tempo;
    }

    function montarUrlFormulario(d, codigo) {
        const params = new URLSearchParams();
        params.set(FORM_ENTRY.codigo, codigo);
        if (d.nome) params.set(FORM_ENTRY.nome, d.nome);
        if (d.empresa) params.set(FORM_ENTRY.empresa, d.empresa);
        return FORM_BASE_URL + '?' + params.toString();
    }

    // ── Leitura da planilha publicada (CSV) ──
    function normalizar(s) {
        return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }

    function acharColuna(headers, ...chaves) {
        const norm = headers.map(normalizar);
        for (const chave of chaves) {
            const i = norm.findIndex((h) => h.includes(chave));
            if (i !== -1) return i;
        }
        return -1;
    }

    function parseCSV(texto) {
        const linhas = [];
        let linha = [], campo = '', aspas = false;
        for (let i = 0; i < texto.length; i++) {
            const c = texto[i];
            if (aspas) {
                if (c === '"') {
                    if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false;
                } else campo += c;
            } else if (c === '"') {
                aspas = true;
            } else if (c === ',') {
                linha.push(campo); campo = '';
            } else if (c === '\n') {
                linha.push(campo); linhas.push(linha); linha = []; campo = '';
            } else if (c === '\r') {
                // ignora — faz parte do \r\n
            } else {
                campo += c;
            }
        }
        if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }
        return linhas.filter((l) => l.some((c) => c !== ''));
    }

    function encontrarResposta(texto, codigo) {
        const linhas = parseCSV(texto);
        if (linhas.length < 2) return null;
        const headers = linhas[0];
        const iCodigo = acharColuna(headers, 'codigo');
        if (iCodigo === -1) return null;
        const iNome = headers.findIndex((h) => {
            const n = normalizar(h);
            return n.includes('nome') && !n.includes('empresa');
        });
        const iEmpresa = acharColuna(headers, 'empresa');
        const iServicos = acharColuna(headers, 'precisa', 'servi');
        const iDescricao = acharColuna(headers, 'projeto', 'conte', 'descri');
        const iPartida = acharColuna(headers, 'partida');
        const iPrazo = acharColuna(headers, 'prazo');
        const iEmail = acharColuna(headers, 'mail');

        for (let i = linhas.length - 1; i >= 1; i--) {
            const linha = linhas[i];
            if ((linha[iCodigo] || '').trim() !== codigo) continue;
            return {
                nome: iNome !== -1 ? (linha[iNome] || '').trim() : '',
                empresa: iEmpresa !== -1 ? (linha[iEmpresa] || '').trim() : '',
                servicos: iServicos !== -1 ? (linha[iServicos] || '').trim() : '',
                descricao: iDescricao !== -1 ? (linha[iDescricao] || '').trim() : '',
                partida: iPartida !== -1 ? (linha[iPartida] || '').trim() : '',
                prazo: iPrazo !== -1 ? (linha[iPrazo] || '').trim() : '',
                email: iEmail !== -1 ? (linha[iEmail] || '').trim() : '',
            };
        }
        return null;
    }

    // ── Espera a resposta chegar na planilha, sozinha, com verificação manual ──
    function aguardarFormulario(codigo) {
        let cancelado = false;
        let resolvido = false;
        let resolver;
        const aguardando = new Promise((res) => { resolver = res; });

        function concluir(resultado) {
            if (resolvido) return;
            resolvido = true;
            resolver(resultado);
        }

        async function verificarAgora() {
            if (resolvido) return null;
            try {
                const url = SHEET_CSV_URL + (SHEET_CSV_URL.includes('?') ? '&' : '?') + 'cb=' + Date.now();
                const resp = await fetch(url, { cache: 'no-store' });
                if (!resp.ok) return null;
                const texto = await resp.text();
                const dados = encontrarResposta(texto, codigo);
                if (dados) concluir({ ok: true, dados });
                return dados;
            } catch {
                return null;
            }
        }

        (async function loop() {
            const fim = Date.now() + ESPERA_MAX_MS;
            while (!cancelado && !resolvido) {
                await verificarAgora();
                if (resolvido) return;
                if (Date.now() > fim) { concluir({ ok: false }); return; }
                await wait(INTERVALO_MS);
            }
        })();

        return { aguardando, verificarAgora, cancelar: () => { cancelado = true; } };
    }

    function whatsappUrl(d) {
        const linhas = [
            'Olá, Angélica! Sou ' + d.nome + '.',
            'Acabei de preencher o formulário de proposta pelo site amfp.dev.',
        ];
        if (d.servicos) linhas.push('Serviços: ' + d.servicos);
        if (d.prazo) linhas.push('Prazo: ' + d.prazo);
        linhas.push('Pode me retornar?');
        return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(linhas.join('\n'));
    }

    function whatsappUrlSemConfirmacao(d) {
        const texto =
            'Olá, Angélica! Sou ' + d.nome + '. Preenchi o formulário de proposta no site amfp.dev, ' +
            'mas não tenho certeza se o envio foi registrado. Pode conferir?';
        return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    }

    async function run() {
        const id = ++runId;
        log.replaceChildren();
        controls.replaceChildren();
        const d = {};

        await say(id, 'Oi! Eu sou a Marina, assistente da amfp.dev.');
        await say(id, 'Eu só preciso do seu nome e, se tiver, da sua empresa. O resto do pedido você escreve com calma num formulário rápido, e eu cuido do resto sozinha por aqui.');

        await say(id, 'Como posso te chamar?');
        d.nome = await askText(id, {
            placeholder: 'Seu nome',
            autocomplete: 'name',
            validate: (v) => (v.length < 2 ? 'Digite seu nome.' : ''),
        });

        await say(id, 'Prazer, ' + d.nome + '! Qual é a sua empresa ou razão social? Se for pessoa física, pode pular.');
        d.empresa = await askText(id, { placeholder: 'Empresa ou razão social', optional: true });

        const codigo = gerarCodigo();
        const formUrl = montarUrlFormulario(d, codigo);

        await say(id, 'Perfeito! Vou abrir um formulário numa aba nova — conta lá com calma tudo sobre o projeto: o que você precisa, prazo, detalhes. Assim que você enviar, eu continuo sozinha por aqui.');
        const novaAba = window.open(formUrl, '_blank', 'noopener');
        if (!novaAba) {
            await say(id, 'Seu navegador bloqueou a aba nova. Clique no botão abaixo para abrir o formulário.');
            await ask(id, (done) => {
                const wrap = document.createElement('div');
                wrap.className = 'bot-chips';
                const a = document.createElement('a');
                a.className = 'bot-chip';
                a.href = formUrl;
                a.target = '_blank';
                a.rel = 'noopener';
                a.textContent = 'Abrir formulário';
                a.addEventListener('click', () => setTimeout(() => done(true, null), 300));
                wrap.appendChild(a);
                controls.appendChild(wrap);
            });
        }

        const espera = aguardarFormulario(codigo);
        const resultado = await askAguardando(id, espera);

        if (!resultado || !resultado.ok) {
            await say(id, 'Não consegui confirmar o envio automaticamente. Se você já preencheu, me chama no WhatsApp que a Angélica confere pra você.');
            const deNovo = await askFinal(id, whatsappUrlSemConfirmacao(d), { rotuloWhats: 'Confirmar no WhatsApp' });
            if (deNovo) return run();
            return;
        }

        Object.assign(d, resultado.dados);
        if (!d.nome) d.nome = resultado.dados.nome;

        await say(id, 'Recebi sua resposta, ' + d.nome + '!');
        await say(id, 'Quer acrescentar mais alguma coisa na sua proposta antes de eu gerar o PDF?');
        d.extra = await askText(id, {
            placeholder: 'Algo a mais que você queira contar',
            multiline: true,
            optional: true,
        });

        await say(id, 'Já vou montar o PDF da sua proposta...');

        let pdfOk = true;
        try {
            if (!window.jspdf || !window.gerarPropostaPdf) throw new Error('jsPDF indisponível');
            window.gerarPropostaPdf(d);
        } catch {
            pdfOk = false;
        }

        if (pdfOk) {
            await say(id, 'Pronto! Sua proposta já está na pasta de downloads. A Angélica também recebeu sua resposta e pode te chamar por lá.');
        } else {
            await say(id, 'Recebi sua resposta, mas não consegui gerar o PDF agora. A Angélica já tem tudo o que você escreveu e vai te retornar.');
        }

        await say(id, 'Se preferir, já chama ela direto no WhatsApp — deixei uma mensagem pronta com o que você me contou.');
        const deNovo = await askFinal(id, whatsappUrl(d));
        if (deNovo) return run();
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

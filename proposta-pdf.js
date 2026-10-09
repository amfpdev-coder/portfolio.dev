// Gera a proposta final (sem valores) no navegador, usando jsPDF.
window.gerarPropostaPdf = function (d) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const W = 210, H = 297, M = 18, CW = W - 2 * M;
    const C = {
        coral: [190, 106, 69],
        coralD: [88, 45, 26],
        ink: [27, 28, 30],
        muted: [107, 91, 80],
        peach: [245, 238, 230],
        line: [217, 198, 183],
        accent: [218, 141, 106],
        onDark: [250, 245, 239],
        card: [255, 255, 255],
        shadow: [222, 205, 190],
        tint: [250, 232, 221],
        hr: [218, 220, 224],
    };
    let y = 28;

    const color = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

    function chrome() {
        doc.setDrawColor(...C.hr);
        doc.setLineWidth(0.4);
        doc.line(0, 17, W, 17);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        color(C.ink);
        doc.text('amfp.dev', M, 11);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        color(C.muted);
        doc.text('PROPOSTA COMERCIAL', W - M, 10.5, { align: 'right' });
    }

    function newPage() {
        doc.addPage();
        chrome();
        y = 28;
    }

    function ensure(h) {
        if (y + h > H - 22) newPage();
    }

    function heading(n, t) {
        ensure(18);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        color(C.ink);
        doc.text(n, M, y);
        const nw = doc.getTextWidth(n);
        doc.text(t, M + nw + 3, y);
        y += 2.5;
        doc.setDrawColor(...C.hr);
        doc.setLineWidth(0.3);
        doc.line(M, y, W - M, y);
        y += 5.5;
    }

    function para(text, o = {}) {
        const size = o.size || 9.5;
        const indent = o.indent || 0;
        const gap = o.gap === undefined ? 1.5 : o.gap;
        const lh = size * 0.3528 * 1.5;
        doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        color(o.color || C.muted);
        doc.splitTextToSize(String(text), CW - indent).forEach((line) => {
            ensure(lh + 1);
            doc.text(line, M + indent, y);
            y += lh;
        });
        y += gap;
    }

    function label(text) {
        para(text.toUpperCase(), { size: 7.5, bold: true, color: C.muted, gap: 0.5 });
    }

    function bullet(text) {
        ensure(10);
        doc.setFillColor(...C.ink);
        doc.circle(M + 1.2, y - 1.2, 0.6, 'F');
        para(text, { indent: 5, gap: 1.2 });
    }

    // ── Wireframes de referência (desenhados em vetor, sem imagem externa) ──
    function wfShadow(x, y, w, h, r) {
        doc.setFillColor(...C.shadow);
        doc.roundedRect(x + 0.9, y + 1.1, w, h, r, r, 'F');
    }
    function wfCard(x, y, w, h, o = {}) {
        const r = o.r === undefined ? 2 : o.r;
        if (o.shadow !== false) wfShadow(x, y, w, h, r);
        doc.setDrawColor(...(o.stroke || C.ink));
        doc.setLineWidth(o.lw || 0.4);
        doc.setFillColor(...(o.fill || C.card));
        doc.roundedRect(x, y, w, h, r, r, o.noStroke ? 'F' : 'FD');
    }
    function wfRect(x, y, w, h, o = {}) {
        doc.setDrawColor(...(o.color || C.muted));
        doc.setLineWidth(o.lw || 0.35);
        if (o.fill) {
            doc.setFillColor(...o.fill);
            doc.rect(x, y, w, h, o.noStroke ? 'F' : 'FD');
        } else {
            doc.rect(x, y, w, h);
        }
    }
    function wfLine(x, y, w, o = {}) {
        doc.setDrawColor(...(o.color || C.muted));
        doc.setLineWidth(o.lw || 0.6);
        doc.line(x, y, x + w, y);
    }
    function wfCirc(x, y, r, o = {}) {
        if (o.fill) {
            doc.setFillColor(...o.fill);
            doc.circle(x, y, r, 'F');
        } else {
            doc.setDrawColor(...(o.color || C.muted));
            doc.setLineWidth(o.lw || 0.35);
            doc.circle(x, y, r);
        }
    }
    function wfText(x, y, txt, o = {}) {
        doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
        doc.setFontSize(o.size || 6.5);
        color(o.color || C.ink);
        doc.text(txt, x, y, o.align ? { align: o.align } : undefined);
    }
    function wfChip(x, y, w, h, txt, o = {}) {
        const fill = o.fill || C.accent;
        doc.setFillColor(...fill);
        doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
        wfText(x + w / 2, y + h / 2 + (o.size || 6.5) * 0.12, txt, {
            size: o.size || 6.5, bold: true, color: o.textColor || C.onDark, align: 'center',
        });
    }
    function wfImgPlaceholder(x, y, w, h, r = 1.5) {
        doc.setFillColor(...C.tint);
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, w, h, r, r, 'FD');
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.35);
        doc.line(x + 2, y + 2, x + w - 2, y + h - 2);
        doc.line(x + w - 2, y + 2, x + 2, y + h - 2);
    }

    function wfWebsite(x, y, w, h) {
        wfCard(x, y, w, h, { fill: C.card });
        // header
        doc.setFillColor(...C.ink);
        doc.roundedRect(x, y, w, 12, 2, 2, 'F');
        doc.rect(x, y + 6, w, 6, 'F');
        wfChip(x + 5, y + 3.2, 7, 5.6, 'A', { fill: C.accent, size: 6 });
        wfText(x + 14, y + 7, 'amfp.dev', { color: C.onDark, bold: true, size: 7.5 });
        ['Início', 'Sobre', 'Serviços', 'Contato'].forEach((t, i) => {
            wfText(x + w - 62 + i * 16, y + 7, t, { color: C.onDark, size: 6 });
        });
        // hero
        const heroY = y + 16, heroH = 28;
        wfImgPlaceholder(x + w - 58, heroY, 52, heroH);
        wfText(x + 6, heroY + 8, 'Sua solução sob medida', { bold: true, size: 11, color: C.ink });
        wfText(x + 6, heroY + 14, 'Sistemas e sites pensados para o seu negócio', { size: 6.5, color: C.muted });
        wfChip(x + 6, heroY + 18, 30, 7, 'Começar agora', { fill: C.accent, size: 6.3 });
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.4);
        doc.roundedRect(x + 40, heroY + 18, 24, 7, 3.5, 3.5, 'S');
        wfText(x + 52, heroY + 22.6, 'Saiba mais', { size: 6, color: C.coralD, align: 'center' });
        // cards
        const cardY = heroY + heroH + 7;
        const cardH = 24;
        const cw = (w - 12 - 12) / 3;
        const titulos = ['Rápido', 'Seguro', 'Sob medida'];
        for (let i = 0; i < 3; i++) {
            const cx = x + 6 + i * (cw + 6);
            wfCard(cx, cardY, cw, cardH, { fill: C.card, r: 2 });
            wfCirc(cx + 7, cardY + 7, 3, { fill: C.accent });
            wfText(cx + 13, cardY + 8.5, titulos[i], { bold: true, size: 7 });
            wfLine(cx + 5, cardY + 15, cw - 10, { lw: 0.3, color: C.line });
            wfLine(cx + 5, cardY + 18.5, cw - 18, { lw: 0.3, color: C.line });
        }
        doc.setFillColor(...C.ink);
        doc.rect(x, y + h - 8, w, 8, 'F');
        wfText(x + 6, y + h - 4, '© amfp.dev', { color: C.onDark, size: 5.5 });
    }

    function wfApp(x, y, w, h) {
        const pw = 48, px = x + (w - pw) / 2;
        wfCard(px, y, pw, h, { fill: C.card, r: 4, lw: 0.6 });
        doc.setFillColor(...C.ink);
        doc.roundedRect(px + 2, y + 2, pw - 4, 11, 3, 3, 'F');
        doc.rect(px + 2, y + 7, pw - 4, 6, 'F');
        wfText(px + pw / 2, y + 9, 'Pedidos', { color: C.onDark, bold: true, size: 7.5, align: 'center' });
        wfCirc(px + pw - 7, y + 7.5, 2, { fill: C.accent });
        const dados = [
            ['Bolo de chocolate', 'Pedido #214 · hoje'],
            ['Torta de morango', 'Pedido #213 · hoje'],
            ['Brigadeiros (30un)', 'Pedido #212 · ontem'],
            ['Cupcakes (12un)', 'Pedido #211 · ontem'],
        ];
        const areaY = y + 16;
        const rowH = (h - 16 - 17) / dados.length;
        dados.forEach((d2, i) => {
            const ry = areaY + i * rowH;
            wfCard(px + 4, ry, pw - 8, rowH - 3, { fill: C.card, r: 2, shadow: false, lw: 0.3, stroke: C.line });
            wfCirc(px + 10, ry + (rowH - 3) / 2, 3, { fill: C.tint });
            wfCirc(px + 10, ry + (rowH - 3) / 2, 3, { color: C.accent, lw: 0.4 });
            wfText(px + 16, ry + (rowH - 3) / 2 - 0.3, d2[0], { bold: true, size: 6.2 });
            wfText(px + 16, ry + (rowH - 3) / 2 + 3.4, d2[1], { size: 5.4, color: C.muted });
            wfText(px + pw - 8, ry + (rowH - 3) / 2 + 1.5, '>', { size: 7, color: C.line, align: 'center' });
        });
        doc.setFillColor(...C.tint);
        doc.rect(px + 2, y + h - 13, pw - 4, 11, 'F');
        const tabs = ['Início', 'Pedidos', 'Chat', 'Perfil'];
        tabs.forEach((t, i) => {
            const tx = px + 9 + i * 10;
            wfCirc(tx, y + h - 9, 1.9, i === 0 ? { fill: C.accent } : { color: C.muted, lw: 0.4 });
            wfText(tx, y + h - 4.3, t, { size: 4.3, color: i === 0 ? C.coralD : C.muted, align: 'center' });
        });
    }

    function wfDesktop(x, y, w, h) {
        wfCard(x, y, w, h, { fill: C.card });
        const sideW = 34;
        doc.setFillColor(...C.ink);
        doc.rect(x, y, sideW, h, 'F');
        wfChip(x + 6, y + 5, 10, 6, 'A', { fill: C.accent, size: 6 });
        wfText(x + 19, y + 9, 'amfp.dev', { color: C.onDark, bold: true, size: 6.5 });
        const menu = ['Dashboard', 'Pedidos', 'Clientes', 'Relatórios', 'Config.'];
        menu.forEach((t, i) => {
            const my = y + 18 + i * 9;
            if (i === 0) {
                doc.setFillColor(...C.accent);
                doc.roundedRect(x + 4, my, sideW - 8, 6.5, 1.5, 1.5, 'F');
            }
            wfText(x + 8, my + 4.4, t, { size: 6, color: i === 0 ? C.onDark : C.onDark, bold: i === 0 });
        });
        // top bar
        doc.setFillColor(...C.card);
        doc.rect(x + sideW, y, w - sideW, 11, 'F');
        wfText(x + sideW + 6, y + 7, 'Painel de Gestão', { bold: true, size: 8 });
        for (let i = 0; i < 3; i++) wfCirc(x + w - 8 - i * 9, y + 5.5, 2.4, { color: C.line, lw: 0.4 });
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.3);
        doc.line(x + sideW, y + 11, x + w, y + 11);
        // KPI cards
        const cw = (w - sideW - 12 - 12) / 3;
        const kpis = [['128', 'Pedidos no mês'], ['R$ 9.4k', 'Faturamento'], ['+12%', 'Crescimento']];
        for (let i = 0; i < 3; i++) {
            const cx = x + sideW + 6 + i * (cw + 6);
            wfCard(cx, y + 15, cw, 16, { fill: C.card, r: 2 });
            wfText(cx + 4, y + 23, kpis[i][0], { bold: true, size: 9.5, color: C.coralD });
            wfText(cx + 4, y + 27.5, kpis[i][1], { size: 5.3, color: C.muted });
        }
        // table
        const tableY = y + 35;
        const tableW = w - sideW - 12;
        const tableH = h - (tableY - y) - 6;
        wfCard(x + sideW + 6, tableY, tableW, tableH, { fill: C.card, r: 2 });
        doc.setFillColor(...C.tint);
        doc.rect(x + sideW + 6, tableY, tableW, 7, 'F');
        const cols = ['Pedido', 'Cliente', 'Status', 'Total'];
        const colW = tableW / cols.length;
        cols.forEach((c, i) => wfText(x + sideW + 10 + i * colW, tableY + 4.6, c, { bold: true, size: 6 }));
        const linhas = [['#214', 'Maria Lima', 'Pago', 'R$ 86'], ['#213', 'João Alves', 'Pendente', 'R$ 54'],
            ['#212', 'Ana Souza', 'Pago', 'R$ 122']];
        linhas.forEach((ln, r) => {
            const ry = tableY + 7 + r * ((tableH - 7) / linhas.length);
            const rh = (tableH - 7) / linhas.length;
            ln.forEach((val, c) => {
                if (c === 2) {
                    wfChip(x + sideW + 10 + c * colW, ry + rh / 2 - 2.3, 16, 4.6, val, {
                        fill: val === 'Pago' ? C.accent : C.tint, textColor: val === 'Pago' ? C.onDark : C.coralD, size: 5,
                    });
                } else {
                    wfText(x + sideW + 10 + c * colW, ry + rh / 2 + 1, val, { size: 5.8 });
                }
            });
            if (r < linhas.length - 1) wfLine(x + sideW + 6, ry + rh, tableW, { lw: 0.2, color: C.line });
        });
    }

    function wfBanco(x, y, w, h) {
        const bw = 52, bh = 38;
        const tabelas = [
            { nome: 'clientes', bx: x + 4, by: y + 2, campos: ['id', 'nome', 'email', 'telefone'] },
            { nome: 'pedidos', bx: x + w - bw - 4, by: y + 2, campos: ['id', 'cliente_id', 'data', 'total'] },
            { nome: 'produtos', bx: x + (w - bw) / 2, by: y + h - bh - 2, campos: ['id', 'nome', 'preço', 'estoque'] },
        ];
        doc.setDrawColor(...C.line);
        doc.setLineWidth(0.35);
        doc.line(tabelas[0].bx + bw, tabelas[0].by + 10, tabelas[2].bx + bw / 2, tabelas[2].by);
        doc.line(tabelas[1].bx, tabelas[1].by + 10, tabelas[2].bx + bw / 2, tabelas[2].by);
        doc.line(tabelas[0].bx + bw, tabelas[0].by + 5, tabelas[1].bx, tabelas[1].by + 5);
        wfText((tabelas[0].bx + bw + tabelas[1].bx) / 2, tabelas[0].by + 3.5, '1 : N', { size: 5, color: C.muted, align: 'center' });
        tabelas.forEach((t) => {
            wfCard(t.bx, t.by, bw, bh, { fill: C.card, r: 1.5 });
            doc.setFillColor(...C.ink);
            doc.rect(t.bx, t.by, bw, 7, 'F');
            wfText(t.bx + bw / 2, t.by + 4.8, t.nome, { color: C.onDark, bold: true, size: 6.3, align: 'center' });
            t.campos.forEach((campo, i) => {
                const ry = t.by + 11 + i * 6.5;
                const chave = i === 0;
                wfCirc(t.bx + 5, ry - 1, 1, chave ? { fill: C.accent } : { color: C.line, lw: 0.3 });
                wfText(t.bx + 8, ry, campo, { size: 5.6, bold: chave, color: chave ? C.coralD : C.ink });
                wfLine(t.bx + bw - 14, ry - 1, 9, { lw: 0.3, color: C.line });
            });
        });
    }

    function wfDados(x, y, w, h) {
        wfCard(x, y, w, h, { fill: C.card });
        const filtros = ['Período: 30 dias', 'Categoria: Todas', 'Região: Brasil'];
        let fx = x + 6;
        filtros.forEach((f) => {
            const fw = f.length * 1.55 + 6;
            doc.setDrawColor(...C.line);
            doc.setLineWidth(0.3);
            doc.setFillColor(...C.tint);
            doc.roundedRect(fx, y + 5, fw, 6, 3, 3, 'FD');
            wfText(fx + fw / 2, y + 8.8, f, { size: 5.4, color: C.coralD, align: 'center' });
            fx += fw + 4;
        });
        const cw = (w - 12 - 12) / 3;
        const kpis = [['24', 'Pedidos'], ['R$ 3,2k', 'Ticket médio'], ['+18%', 'Crescimento']];
        for (let i = 0; i < 3; i++) {
            const cx = x + 6 + i * (cw + 6);
            const cy = y + 15;
            wfCard(cx, cy, cw, 15, { fill: C.card, r: 2 });
            wfText(cx + cw / 2, cy + 8.5, kpis[i][0], { bold: true, size: 10, color: C.coralD, align: 'center' });
            wfText(cx + cw / 2, cy + 12.3, kpis[i][1], { size: 5.2, color: C.muted, align: 'center' });
        }
        const chartY = y + 34;
        const chartH = 38;
        const chW = (w - 12 - 8) / 2;
        wfCard(x + 6, chartY, chW, chartH, { fill: C.card, r: 2 });
        wfText(x + 10, chartY + 6, 'Vendas por mês', { bold: true, size: 6.5 });
        const barras = [0.3, 0.6, 0.4, 0.8, 0.5, 0.7];
        const meses = ['J', 'F', 'M', 'A', 'M', 'J'];
        const bw2 = (chW - 14) / barras.length;
        const baseY = chartY + chartH - 6;
        barras.forEach((v, i) => {
            const bh2 = (chartH - 16) * v;
            doc.setFillColor(...C.accent);
            doc.roundedRect(x + 10 + i * bw2, baseY - bh2, bw2 - 2.5, bh2, 0.8, 0.8, 'F');
            wfText(x + 10 + i * bw2 + (bw2 - 2.5) / 2, baseY + 3.5, meses[i], { size: 5, color: C.muted, align: 'center' });
        });
        wfCard(x + 6 + chW + 8, chartY, chW, chartH, { fill: C.card, r: 2 });
        wfText(x + 6 + chW + 12, chartY + 6, 'Tendência', { bold: true, size: 6.5 });
        const pts = [0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.65];
        const cx0 = x + 6 + chW + 12, cy0 = chartY + chartH - 6, cw0 = chW - 16, ch0 = chartH - 16;
        const pxy = pts.map((v, i) => [cx0 + (i * cw0) / (pts.length - 1), cy0 - v * ch0]);
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.7);
        for (let i = 0; i < pxy.length - 1; i++) doc.line(pxy[i][0], pxy[i][1], pxy[i + 1][0], pxy[i + 1][1]);
        pxy.forEach((p) => wfCirc(p[0], p[1], 0.9, { fill: C.coralD }));
        // tabela
        const tY = chartY + chartH + 5;
        wfCard(x + 6, tY, w - 12, 20, { fill: C.card, r: 2 });
        doc.setFillColor(...C.tint);
        doc.rect(x + 6, tY, w - 12, 6, 'F');
        wfText(x + 10, tY + 4.2, 'Produto', { bold: true, size: 6 });
        wfText(x + w - 30, tY + 4.2, 'Vendas', { bold: true, size: 6 });
        [['Bolo de chocolate', '42'], ['Torta de morango', '31']].forEach((ln, i) => {
            const ry = tY + 6 + i * 6.5 + 4.5;
            wfText(x + 10, ry, ln[0], { size: 5.8 });
            wfText(x + w - 30, ry, ln[1], { size: 5.8 });
        });
    }

    const WIREFRAMES = { website: wfWebsite, app: wfApp, desktop: wfDesktop, banco: wfBanco, dados: wfDados };
    const TITULOS_WF = { website: 'Website', app: 'Aplicativo', desktop: 'Sistema Desktop', banco: 'Banco de Dados', dados: 'Análise de Dados' };

    // ── Título ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    color(C.ink);
    doc.text('Proposta Comercial', M, y);
    y += 8;
    para(
        'Desenvolvimento de sistemas, bancos de dados e análise de dados sob medida.',
        { size: 11, gap: 2 }
    );
    para(
        'Proposta elaborada a partir das informações que você enviou. O investimento é ' +
        'definido pela amfp.dev após a análise do escopo e enviado para aprovação.',
        { size: 8.5, gap: 5 }
    );

    // ── Dados do pedido ──
    const hoje = new Date().toLocaleDateString('pt-BR');
    const par = (l1, v1, l2, v2) => {
        ensure(16);
        const yy = y;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        color(C.muted);
        doc.text(l1.toUpperCase(), M, yy);
        doc.text(l2.toUpperCase(), M + CW / 2, yy);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        color(C.ink);
        doc.text(doc.splitTextToSize(v1 || '-', CW / 2 - 6)[0], M, yy + 5);
        doc.text(doc.splitTextToSize(v2 || '-', CW / 2 - 6)[0], M + CW / 2, yy + 5);
        y += 13;
    };
    par('Cliente', d.nome, 'Empresa / negócio', d.empresa);
    par('E-mail', d.email, 'Data', hoje);
    par('Validade da proposta', '15 dias corridos', 'Responsável', 'Angélica Feitosa · amfp.dev');

    // ── 1. Apresentação ──
    heading('1', 'Apresentação');
    para(
        'Sou Angélica Feitosa, formada em Análise e Desenvolvimento de Sistemas. Trabalho sob o nome ' +
        'amfp.dev, desenvolvendo sistemas completos e realizando análise de dados, com foco em ' +
        'modelagem de banco de dados, regras de negócio e geração de insights para tomada de decisão.'
    );
    para(
        'Já entreguei um sistema de gestão desktop completo para um cliente real, com banco relacional ' +
        'modelado do zero, módulo de relatórios e controle de acesso.'
    );

    // ── 2. Escopo ──
    heading('2', 'Escopo solicitado');
    const listaServicos = Array.isArray(d.servicos)
        ? d.servicos
        : String(d.servicos || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (listaServicos.length) {
        listaServicos.forEach((nome) => {
            para(nome, { size: 10.5, bold: true, color: C.ink, gap: 0.3 });
            const desc = (window.ASSISTENTE_SERVICOS || {})[nome];
            if (desc) para(desc, { size: 9, gap: 2.5 });
        });
    }
    y += 1;
    label('Necessidade informada');
    para(d.descricao || '-', { color: C.ink, gap: 3 });
    label('Ponto de partida');
    para(d.partida || '-', { color: C.ink, gap: 3 });
    label('Prazo desejado');
    para(d.prazo || '-', { color: C.ink, gap: 2 });
    if (d.extra) {
        label('Observações adicionais');
        para(d.extra, { color: C.ink, gap: 2 });
    }

    // ── 3. Referência visual (wireframes genéricos por categoria) ──
    const MAPA_WF = {
        'Website': ['website'],
        'Aplicativo': ['app'],
        'Sistema Desktop': ['desktop'],
        'Banco de Dados': ['banco'],
        'Análise de Dados': ['dados'],
        'Site / Aplicativo': ['website', 'app'],
    };
    const tiposWf = [];
    listaServicos.forEach((nome) => {
        (MAPA_WF[nome] || []).forEach((t) => { if (!tiposWf.includes(t)) tiposWf.push(t); });
    });

    const ALTURAS_WF = { app: 92, website: 92, dados: 100, desktop: 72, banco: 72 };
    if (tiposWf.length) {
        const primeiraAltura = ALTURAS_WF[tiposWf[0]] || 72;
        ensure(26 + primeiraAltura + 10);
        heading('3', 'Referência visual');
        para(
            'Ilustração de referência do tipo de projeto solicitado. O layout final é desenhado ' +
            'sob medida para o seu caso.',
            { size: 8.5, gap: 4 }
        );
        tiposWf.forEach((tipo) => {
            const alturaBloco = ALTURAS_WF[tipo] || 72;
            ensure(alturaBloco + 10);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            color(C.ink);
            doc.text('Wireframe — ' + TITULOS_WF[tipo], M, y);
            y += 5;
            WIREFRAMES[tipo](M, y, CW, alturaBloco);
            y += alturaBloco + 8;
        });
    }

    // ── 4. Como eu trabalho ──
    heading('4', 'Como eu trabalho');
    [
        'Levantamento: conversa para entender o negócio, os processos e o que o sistema precisa resolver.',
        'Modelagem: desenho do modelo de dados e das telas, validado com você antes de programar.',
        'Desenvolvimento: construção do sistema, com entregas parciais para acompanhamento.',
        'Testes e ajustes: validação no dia a dia do negócio e correções antes da entrega final.',
        'Entrega: publicação ou instalação, orientação de uso e entrega dos arquivos do projeto.',
    ].forEach(bullet);

    // ── 5. Investimento e condições ──
    heading('5', 'Investimento e condições');
    para(
        'O valor será definido por Angélica Feitosa após a análise do escopo e enviado ao contratante ' +
        'para aprovação.'
    );
    bullet('Forma de pagamento: 50% na aprovação da proposta e 50% na entrega final.');
    bullet('Prazo estimado de entrega: a definir após o levantamento de requisitos.');
    bullet('Garantia: 30 dias após a entrega, para correção de falhas do escopo contratado.');

    // ── 6. Condições gerais ──
    heading('6', 'Condições gerais');
    [
        'O prazo passa a contar após a aprovação desta proposta, o pagamento da primeira parcela e o envio das informações necessárias por parte do contratante.',
        'Alterações fora do escopo descrito são orçadas e aprovadas antes de serem executadas.',
        'O código-fonte e os arquivos do projeto são entregues ao contratante após a quitação integral.',
        'Dados e informações do contratante são tratados com confidencialidade e usados apenas para a execução do projeto.',
        'Após o período de validade, valores e prazos podem ser revisados.',
    ].forEach(bullet);

    // ── 7. Aceite ──
    ensure(60);
    heading('7', 'Aceite');
    para('Ao assinar, o contratante declara estar de acordo com o escopo, o investimento e as condições descritas nesta proposta.');
    y += 14;
    doc.setDrawColor(...C.ink);
    doc.setLineWidth(0.3);
    const colW = CW * 0.44;
    doc.line(M, y, M + colW, y);
    doc.line(W - M - colW, y, W - M, y);
    y += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    color(C.muted);
    doc.text('Contratante', M + colW / 2, y, { align: 'center' });
    doc.text('amfp.dev', W - M - colW / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text('Nome e assinatura', M + colW / 2, y, { align: 'center' });
    doc.text('Angélica Feitosa', W - M - colW / 2, y, { align: 'center' });

    // Cabeçalho da primeira página e rodapés
    doc.setPage(1);
    chrome();
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setDrawColor(...C.hr);
        doc.setLineWidth(0.3);
        doc.line(M, H - 14, W - M, H - 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        color(C.muted);
        doc.text('amfp.dev  ·  Angélica Feitosa  ·  github.com/amfpdev-coder  ·  linkedin.com/in/amfpdev', M, H - 9.5);
        doc.text('Página ' + i + ' de ' + total, W - M, H - 9.5, { align: 'right' });
    }

    const slug = String(d.nome || 'cliente')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'cliente';
    doc.save('Proposta-amfp.dev-' + slug + '.pdf');
};

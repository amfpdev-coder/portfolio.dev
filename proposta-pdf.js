// Gera o rascunho de proposta (sem valores) no navegador, usando jsPDF.
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
    };
    let y = 28;

    const color = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

    function chrome() {
        doc.setFillColor(...C.peach);
        doc.rect(0, 0, W, 17, 'F');
        doc.setFillColor(...C.coral);
        doc.rect(0, 17, W, 0.8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        color(C.ink);
        doc.text('amfp', M, 11);
        const w1 = doc.getTextWidth('amfp');
        color(C.coral);
        doc.text('.', M + w1, 11);
        const w2 = doc.getTextWidth('.');
        color(C.ink);
        doc.text('dev', M + w1 + w2, 11);
        doc.setFontSize(7.5);
        color(C.coralD);
        doc.text('PROPOSTA COMERCIAL  ·  RASCUNHO', W - M, 10.5, { align: 'right' });
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
        color(C.coral);
        doc.text(n, M, y);
        const nw = doc.getTextWidth(n);
        color(C.ink);
        doc.text(t, M + nw + 3, y);
        y += 2.5;
        doc.setDrawColor(...C.line);
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
        para(text.toUpperCase(), { size: 7.5, bold: true, color: C.coralD, gap: 0.5 });
    }

    function bullet(text) {
        ensure(10);
        doc.setFillColor(...C.coral);
        doc.circle(M + 1.2, y - 1.2, 0.6, 'F');
        para(text, { indent: 5, gap: 1.2 });
    }

    // ── Título ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    color(C.ink);
    doc.text('Rascunho de Proposta', M, y);
    y += 8;
    para(
        'Desenvolvimento de sistemas, bancos de dados e análise de dados sob medida.',
        { size: 11, gap: 2 }
    );
    para(
        'Rascunho gerado a partir do seu pedido. Escopo sujeito à revisão da amfp.dev; ' +
        'os valores serão enviados após a análise.',
        { size: 8.5, gap: 5 }
    );

    // ── Dados do pedido ──
    const hoje = new Date().toLocaleDateString('pt-BR');
    const par = (l1, v1, l2, v2) => {
        ensure(16);
        const yy = y;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        color(C.coralD);
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
    (d.servicos || []).forEach((nome) => {
        para(nome, { size: 10.5, bold: true, color: C.ink, gap: 0.3 });
        para((window.ASSISTENTE_SERVICOS || {})[nome] || '', { size: 9, gap: 2.5 });
    });
    y += 1;
    label('Necessidade informada');
    para(d.descricao || '-', { color: C.ink, gap: 3 });
    label('Ponto de partida');
    para(d.partida || '-', { color: C.ink, gap: 3 });
    label('Prazo desejado');
    para(d.prazo || '-', { color: C.ink, gap: 2 });

    // ── 3. Como eu trabalho ──
    heading('3', 'Como eu trabalho');
    [
        'Levantamento: conversa para entender o negócio, os processos e o que o sistema precisa resolver.',
        'Modelagem: desenho do modelo de dados e das telas, validado com você antes de programar.',
        'Desenvolvimento: construção do sistema, com entregas parciais para acompanhamento.',
        'Testes e ajustes: validação no dia a dia do negócio e correções antes da entrega final.',
        'Entrega: publicação ou instalação, orientação de uso e entrega dos arquivos do projeto.',
    ].forEach(bullet);

    // ── 4. Investimento e condições ──
    heading('4', 'Investimento e condições');
    para(
        'O valor será definido por Angélica Feitosa após a análise do escopo e enviado ao contratante ' +
        'para aprovação.'
    );
    bullet('Forma de pagamento: 50% na aprovação da proposta e 50% na entrega final.');
    bullet('Prazo estimado de entrega: a definir após o levantamento de requisitos.');
    bullet('Garantia: 30 dias após a entrega, para correção de falhas do escopo contratado.');

    // ── 5. Condições gerais ──
    heading('5', 'Condições gerais');
    [
        'O prazo passa a contar após a aprovação desta proposta, o pagamento da primeira parcela e o envio das informações necessárias por parte do contratante.',
        'Alterações fora do escopo descrito são orçadas e aprovadas antes de serem executadas.',
        'O código-fonte e os arquivos do projeto são entregues ao contratante após a quitação integral.',
        'Dados e informações do contratante são tratados com confidencialidade e usados apenas para a execução do projeto.',
        'Após o período de validade, valores e prazos podem ser revisados.',
    ].forEach(bullet);

    // ── 6. Aceite ──
    ensure(60);
    heading('6', 'Aceite');
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
        doc.setDrawColor(...C.line);
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

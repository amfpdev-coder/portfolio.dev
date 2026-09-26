# amfp.dev — Portfólio

Portfólio pessoal de **Angélica Feitosa**, analista de dados e desenvolvedora de sistemas.

🔗 [portfolioamfpdev.netlify.app](https://portfolioamfpdev.netlify.app)

## Sobre

Site estático de página única (single page) apresentando quem sou, minhas especialidades e os sistemas que já entreguei — do banco de dados à tomada de decisão.

## Tecnologias

Python · SQL · Java · Spring Boot · JavaScript · pandas · DuckDB · Git · PostgreSQL · SQLite

## Stack do site

- HTML5
- CSS3 (sem frameworks — variáveis nativas, Grid e Flexbox)
- JavaScript vanilla (sem bibliotecas)
- Fonte: [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts

## Estrutura

```
index.html    → estrutura e conteúdo do site
style.css     → estilos (tema claro pêssego com acentos em coral)
script.js     → interações (tema claro/escuro, scroll reveal e destaque da seção ativa na navegação)
fundo.js      → fundo animado em canvas (rede de pontos, formas geométricas e brilhos)
assistente.js → robô guiado que monta o pedido de proposta e envia via Formspree
proposta-pdf.js → gera o rascunho de proposta em PDF (jsPDF), sem valores
assets/       → imagens
```

## Rodando localmente

Não há build nem dependências — basta servir os arquivos estáticos:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Contato

- GitHub: [github.com/amfpdev-coder](https://github.com/amfpdev-coder)
- LinkedIn: [linkedin.com/in/amfpdev](https://linkedin.com/in/amfpdev)

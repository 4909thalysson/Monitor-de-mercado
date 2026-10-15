/* ==========================================================================
   Análises de Mercado — lógica da página
   - Lista os documentos do bucket "analises_mercado" (pastas soja/trigo/milho)
   - Ícones das culturas vêm dos PNGs da pasta ASSESTS (SVG como fallback)
   - Botão "Adicionar documento" visível a todos (EXIGIR_LOGIN = false);
     mude a constante para true quando o login do admin estiver pronto
   - Envio de documento por pop-up (Fonte, Título e Arquivo)
   ========================================================================== */

const ICONS = {
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.7-.3-1.5-.8-2.1-1.5-.6-.6-1-1.3-1.2-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.1-.4s-.5-1.2-.7-1.6c-.2-.4-.3-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-.9.1-1Z"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>',
  soja: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c4 0 6 3 6 7 0 6-3 11-6 11S6 16 6 10c0-4 2-7 6-7Z" stroke-linejoin="round"/><path d="M9 8c1.5 1 4.5 1 6 0" stroke-linecap="round"/></svg>',
  trigo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M12 5c-2 0-3 1-3 2.5S10 10 12 10s3-1 3-2.5S14 5 12 5Z"/><path d="M12 9c-2 0-3 1-3 2.5S10 14 12 14s3-1 3-2.5S14 9 12 9Z"/><path d="M12 13c-2 0-3 1-3 2.5S10 18 12 18s3-1 3-2.5-1-2.5-3-2.5Z"/></svg>',
  milho: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="3" width="8" height="17" rx="4" stroke-linejoin="round"/><path d="M9 7h6M9 10h6M9 13h6M9 16h6" stroke-linecap="round"/></svg>'
};

// "imagem" = PNG da pasta ASSESTS (principal). "icon" = SVG genérico (fallback).
const COLUMN_META = {
  soja:  { label: 'Soja',  imagem: '/ASSESTS/icon-soja.png',  icon: ICONS.soja },
  trigo: { label: 'Trigo', imagem: '/ASSESTS/icon-trigo.png', icon: ICONS.trigo },
  milho: { label: 'Milho', imagem: '/ASSESTS/icon-milho.png', icon: ICONS.milho }
};

const SUPABASE_URL = 'https://ixathumefunfdpkmfkjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4YXRodW1lZnVuZmRwa21ma2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1OTUyMzcsImV4cCI6MjEwNjE3MTIzN30.lw63gsDVWU9V7pOLiHvuh4OlSCSBxfxKh1TRR-k1F7k';
const BUCKET = 'analises_mercado';

// Endpoint do Formspree usado pelo botão "Enviar por e-mail".
const FORMSPREE_URL = 'https://formspree.io/f/xbgdqgwz';

// Contatos do botão de WhatsApp. Para acrescentar mais, copie uma linha:
// "numero" com DDI + DDD, só dígitos (55 = Brasil). O "nome" aparece no pop-up.
// Se a lista ficar vazia, o WhatsApp abre para a pessoa escolher o contato.
const WHATSAPP_CONTATOS = [
  { nome: 'Thalysson', numero: '555591079683' },
  { nome: 'Jason', numero: '55559979-9200' },
  { nome: 'Rafael', numero: '55559659-9200' },
  { nome: 'Eduardo Petry', numero: '554789228620' }



];

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* --------------------------------------------------------------------------
   Utilitários
   -------------------------------------------------------------------------- */

function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatarTamanho(bytes) {
  if (bytes == null) return '--';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace('.', ',')} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

function formatarDataArquivo(iso) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('pt-BR');
}

// Não existe uma tabela com os metadados dos documentos — então título e
// fonte vêm do próprio nome do arquivo, seguindo o padrão
// "Fonte - Título.pdf" (o texto antes do primeiro " - " é a fonte, o
// resto — sem a extensão — é o título mostrado no card).
function interpretarNomeArquivo(nomeArquivo) {
  const semExtensao = nomeArquivo.replace(/\.[^/.]+$/, '');
  const separador = ' - ';
  const posicao = semExtensao.indexOf(separador);
  if (posicao === -1) {
    return { fonte: '', titulo: semExtensao };
  }
  return {
    fonte: semExtensao.slice(0, posicao).trim(),
    titulo: semExtensao.slice(posicao + separador.length).trim()
  };
}

// Cor do "logo" do card, escolhida pela fonte. Fontes fora dessa lista
// caem num cinza-azulado neutro em vez de quebrar o layout.
const CORES_FONTE = {
  'CEPEA': '#2563EB',
  'AGROCONSULT': '#16A34A',
  'CONAB': '#16A34A',
  'SAFRAS & MERCADO': '#16A34A',
  'DATAGRO': '#F08C1A',
  'B3': '#0F172A'
};

function logoParaFonte(fonte) {
  const bg = CORES_FONTE[fonte.toUpperCase()] || '#64748B';
  const text = fonte ? fonte.slice(0, 4).toUpperCase() : '?';
  return { text, bg };
}

// O Supabase Storage rejeita chaves com acento/caractere especial
// ("Invalid key"). Remove os acentos (NFD + descarta os diacríticos) e
// troca qualquer coisa fora de letras/números/espaço/ponto/traço/parênteses
// por "-", mantendo "Fonte - Título.ext" ainda legível.
function sanitizarNomeArquivo(nome) {
  const semAcento = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Mantém "&" pra não quebrar fontes como "Safras & Mercado" (viraria um
  // segundo " - " e confundiria o parser de fonte/título).
  return semAcento.replace(/[^a-zA-Z0-9 ._()&-]/g, '-');
}

// Evita " - " dentro dos campos Fonte/Título, que confundiria o parser.
function limparCampo(valor) {
  return valor.trim().replace(/\s+-\s+/g, '-');
}

/* --------------------------------------------------------------------------
   Autenticação
   EXIGIR_LOGIN = false  → todo mundo vê o botão de upload (modo atual, sem
                           policies no Supabase ainda).
   EXIGIR_LOGIN = true   → só quem estiver logado vê o botão. Mude para true
                           depois de criar o admin e as policies no Supabase;
                           a proteção real está nas policies, isto é só interface.
   -------------------------------------------------------------------------- */

const EXIGIR_LOGIN = false;

async function obterSessao() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

/* --------------------------------------------------------------------------
   Acesso aos dados (Supabase Storage)
   -------------------------------------------------------------------------- */

const api = {
  async getAnalises() {
    const chaves = Object.keys(COLUMN_META); // ['soja', 'trigo', 'milho']

    const listagens = await Promise.all(
      chaves.map((chave) =>
        supabaseClient.storage
          .from(BUCKET)
          .list(chave, { sortBy: { column: 'created_at', order: 'desc' } })
      )
    );

    const dados = {};

    chaves.forEach((chave, i) => {
      const { data: arquivos, error } = listagens[i];

      if (error) {
        console.error(`Erro ao listar documentos de "${chave}":`, error);
        dados[chave] = [];
        return;
      }

      dados[chave] = (arquivos || [])
        // ".emptyFolderPlaceholder" é um arquivo interno que o Supabase cria
        // sozinho pra marcar a pasta — filtra pelo nome (o "id" nem sempre
        // vem vazio nele, então só checar o "id" não é suficiente).
        .filter((arquivo) => arquivo.name !== '.emptyFolderPlaceholder')
        .map((arquivo) => {
          const { fonte, titulo } = interpretarNomeArquivo(arquivo.name);
          const caminho = `${chave}/${arquivo.name}`;

          // Assume bucket público. Se o bucket for privado, troque por
          // supabaseClient.storage.from(BUCKET).createSignedUrl(caminho, 3600)
          // (retorna uma Promise — precisa de await aqui dentro do .map,
          // então essa função vira async nesse caso).
          const { data: urlData } = supabaseClient.storage.from(BUCKET).getPublicUrl(caminho);

          return {
            logo: logoParaFonte(fonte),
            titulo: titulo || arquivo.name,
            fonte: fonte || '—',
            data: formatarDataArquivo(arquivo.created_at),
            tamanho: formatarTamanho(arquivo.metadata ? arquivo.metadata.size : null),
            descricao: '',
            url: urlData.publicUrl
          };
        });
    });

    return dados;
  }
};

/* --------------------------------------------------------------------------
   Card de documento
   -------------------------------------------------------------------------- */

function criarCardDocumento(doc) {
  const card = document.createElement('div');
  card.className = 'doc-card';
  card.innerHTML = `
    <div class="doc-card-top">
      <div class="doc-logo" style="background:${doc.logo.bg}">${escaparHtml(doc.logo.text)}</div>
      <div class="doc-info">
        <p class="doc-title">${escaparHtml(doc.titulo)}</p>
        <p class="doc-source">${escaparHtml(doc.fonte)}</p>
      </div>
      <div class="doc-actions">
        <button class="doc-action doc-action-whatsapp" title="Enviar por WhatsApp">${ICONS.whatsapp}</button>
        <button class="doc-action doc-action-email" title="Enviar por e-mail">${ICONS.email}</button>
        <button class="doc-action doc-action-view" title="Visualizar">${ICONS.view}</button>
      </div>
    </div>
    <p class="doc-meta">${ICONS.calendar}<span>${escaparHtml(doc.data)} • ${escaparHtml(doc.tamanho)}</span></p>
    ${doc.descricao ? `<p class="doc-description">${escaparHtml(doc.descricao)}</p>` : ''}
  `;

  // "Visualizar" abre o arquivo de verdade (URL do Storage), "e-mail" abre
  // o pop-up que envia pelo Formspree e "WhatsApp" abre uma conversa com a
  // mensagem e o link do documento já preenchidos (wa.me).
  card.querySelector('.doc-action-view').addEventListener('click', () => {
    if (doc.url) window.open(doc.url, '_blank');
  });
  card.querySelector('.doc-action-whatsapp').addEventListener('click', () => {
    abrirWhatsApp(doc);
  });
  card.querySelector('.doc-action-email').addEventListener('click', () => {
    abrirModalEmail(doc);
  });

  return card;
}

/* --------------------------------------------------------------------------
   Pop-up de envio de documento
   -------------------------------------------------------------------------- */

function abrirModalUpload(chave) {
  const meta = COLUMN_META[chave];

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <div class="modal-header">
        <h3 id="modal-titulo">Adicionar documento · ${escaparHtml(meta.label)}</h3>
        <button type="button" class="modal-close" aria-label="Fechar">&times;</button>
      </div>

      <form class="modal-form" novalidate>
        <label class="modal-field">
          <span>Fonte</span>
          <input type="text" name="fonte" placeholder="Ex.: CEPEA" autocomplete="off" required>
        </label>

        <label class="modal-field">
          <span>Título</span>
          <input type="text" name="titulo" placeholder="Ex.: Boletim semanal de soja" required>
        </label>

        <label class="modal-field">
          <span>Arquivo</span>
          <input type="file" name="arquivo" accept=".pdf,.doc,.docx,.xls,.xlsx" required>
        </label>

        <p class="modal-error" hidden></p>

        <div class="modal-actions">
          <button type="button" class="btn-modal btn-modal-cancel">Cancelar</button>
          <button type="submit" class="btn-modal btn-modal-send">Enviar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const form = overlay.querySelector('.modal-form');
  const inputFonte = form.elements.fonte;
  const inputTitulo = form.elements.titulo;
  const inputArquivo = form.elements.arquivo;
  const erroEl = overlay.querySelector('.modal-error');
  const btnEnviar = overlay.querySelector('.btn-modal-send');

  function fechar() {
    document.removeEventListener('keydown', aoPressionarTecla);
    overlay.remove();
  }

  function aoPressionarTecla(e) {
    if (e.key === 'Escape') fechar();
  }

  function mostrarErro(msg) {
    erroEl.textContent = msg;
    erroEl.hidden = false;
  }

  document.addEventListener('keydown', aoPressionarTecla);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  overlay.querySelector('.modal-close').addEventListener('click', fechar);
  overlay.querySelector('.btn-modal-cancel').addEventListener('click', fechar);

  // Ao escolher o arquivo, sugere o título a partir do nome (se ainda estiver vazio)
  inputArquivo.addEventListener('change', () => {
    const arquivo = inputArquivo.files[0];
    if (arquivo && !inputTitulo.value.trim()) {
      inputTitulo.value = arquivo.name.replace(/\.[^/.]+$/, '');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;

    const arquivo = inputArquivo.files[0];
    const fonte = limparCampo(inputFonte.value);
    const titulo = limparCampo(inputTitulo.value);

    if (!fonte || !titulo || !arquivo) {
      mostrarErro('Preencha a fonte, o título e selecione um arquivo.');
      return;
    }

    const extensao = (arquivo.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
    const nomeFinal = sanitizarNomeArquivo(`${fonte} - ${titulo}${extensao}`);
    const caminho = `${chave}/${nomeFinal}`;

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando…';

    const { error } = await supabaseClient.storage
      .from(BUCKET)
      .upload(caminho, arquivo, { upsert: false });

    if (error) {
      console.error(error);
      const duplicado = /already exists|duplicate/i.test(error.message);
      mostrarErro(duplicado
        ? 'Já existe um documento com essa fonte e título nesta cultura.'
        : `Não foi possível enviar o arquivo: ${error.message}`);
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar';
      return;
    }

    fechar();
    await renderPagina();
  });

  inputFonte.focus();
}

/* --------------------------------------------------------------------------
   Envio por WhatsApp (link wa.me)
   O WhatsApp não aceita anexo por link: a mensagem leva o título, a fonte e
   o link do documento. A pessoa só precisa tocar em "enviar" no WhatsApp.
   Os contatos ficam em WHATSAPP_CONTATOS (no início do arquivo).
   -------------------------------------------------------------------------- */

// Monta o link wa.me com a mensagem pronta. Número vazio = a pessoa escolhe
// o contato dentro do WhatsApp.
function montarLinkWhatsApp(doc, numero) {
  const linhas = [`*${doc.titulo}*`];
  if (doc.fonte && doc.fonte !== '—') linhas.push(`Fonte: ${doc.fonte}`);
  linhas.push('', doc.url);

  const texto = encodeURIComponent(linhas.join('\n'));
  return `https://wa.me/${numero || ''}?text=${texto}`;
}

function abrirWhatsApp(doc) {
  if (WHATSAPP_CONTATOS.length === 0) {
    window.open(montarLinkWhatsApp(doc, ''), '_blank', 'noopener');
    return;
  }
  abrirModalWhatsApp(doc);
}

// Pop-up com um botão por contato (e "Outro contato" para escolher no WhatsApp).
function abrirModalWhatsApp(doc) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-whats-titulo">
      <div class="modal-header">
        <h3 id="modal-whats-titulo">Enviar por WhatsApp</h3>
        <button type="button" class="modal-close" aria-label="Fechar">&times;</button>
      </div>

      <div class="modal-form">
        <p class="modal-doc-resumo">
          <strong>${escaparHtml(doc.titulo)}</strong><br>
          <span>${escaparHtml(doc.fonte)}</span>
        </p>

        <div class="contato-lista">
          ${WHATSAPP_CONTATOS.map((c, i) => `
            <button type="button" class="contato-btn" data-indice="${i}">
              <span class="contato-nome">${escaparHtml(c.nome)}</span>
              <span class="contato-numero">+${escaparHtml(c.numero)}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  function fechar() {
    document.removeEventListener('keydown', aoPressionarTecla);
    overlay.remove();
  }

  function aoPressionarTecla(e) {
    if (e.key === 'Escape') fechar();
  }

  document.addEventListener('keydown', aoPressionarTecla);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  overlay.querySelector('.modal-close').addEventListener('click', fechar);

  overlay.querySelectorAll('.contato-btn').forEach((botao) => {
    botao.addEventListener('click', () => {
      const indice = botao.dataset.indice;
      const numero = indice === 'outro' ? '' : WHATSAPP_CONTATOS[Number(indice)].numero;
      window.open(montarLinkWhatsApp(doc, numero), '_blank', 'noopener');
      fechar();
    });
  });
}

/* --------------------------------------------------------------------------
   Pop-up de envio por e-mail (Formspree)
   -------------------------------------------------------------------------- */

function abrirModalEmail(doc) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-email-titulo">
      <div class="modal-header">
        <h3 id="modal-email-titulo">Enviar por e-mail</h3>
        <button type="button" class="modal-close" aria-label="Fechar">&times;</button>
      </div>

      <form class="modal-form" novalidate>
        <p class="modal-doc-resumo">
          <strong>${escaparHtml(doc.titulo)}</strong><br>
          <span>${escaparHtml(doc.fonte)}</span>
        </p>

        <label class="modal-field">
          <span>E-mail do destinatário</span>
          <input type="email" name="email" placeholder="nome@empresa.com" required>
        </label>

        <label class="modal-field">
          <span>Mensagem (opcional)</span>
          <textarea name="mensagem" rows="3" placeholder="Segue a análise de mercado."></textarea>
        </label>

        <p class="modal-error" hidden></p>
        <p class="modal-success" hidden></p>

        <div class="modal-actions">
          <button type="button" class="btn-modal btn-modal-cancel">Cancelar</button>
          <button type="submit" class="btn-modal btn-modal-send">Enviar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const form = overlay.querySelector('.modal-form');
  const inputEmail = form.elements.email;
  const inputMensagem = form.elements.mensagem;
  const erroEl = overlay.querySelector('.modal-error');
  const sucessoEl = overlay.querySelector('.modal-success');
  const btnEnviar = overlay.querySelector('.btn-modal-send');

  function fechar() {
    document.removeEventListener('keydown', aoPressionarTecla);
    overlay.remove();
  }

  function aoPressionarTecla(e) {
    if (e.key === 'Escape') fechar();
  }

  function mostrarErro(msg) {
    sucessoEl.hidden = true;
    erroEl.textContent = msg;
    erroEl.hidden = false;
  }

  document.addEventListener('keydown', aoPressionarTecla);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  overlay.querySelector('.modal-close').addEventListener('click', fechar);
  overlay.querySelector('.btn-modal-cancel').addEventListener('click', fechar);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;

    const email = inputEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mostrarErro('Informe um e-mail válido.');
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando…';

    try {
      const resposta = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email,
          _subject: `Análise de mercado: ${doc.titulo}`,
          documento: doc.titulo,
          fonte: doc.fonte,
          link: doc.url,
          message: inputMensagem.value.trim() || 'Segue o documento em anexo no link abaixo.'
        })
      });

      if (!resposta.ok) {
        let detalhe = '';
        try {
          const corpo = await resposta.json();
          detalhe = (corpo.errors || []).map((er) => er.message).join(' ');
        } catch (_) { /* resposta sem JSON */ }
        throw new Error(detalhe || `Erro ${resposta.status}`);
      }

      sucessoEl.textContent = 'E-mail enviado!';
      sucessoEl.hidden = false;
      btnEnviar.textContent = 'Enviado';
      setTimeout(fechar, 1500);
    } catch (erro) {
      console.error(erro);
      mostrarErro(`Não foi possível enviar: ${erro.message}`);
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar';
    }
  });

  inputEmail.focus();
}

/* --------------------------------------------------------------------------
   Coluna (cultura)
   -------------------------------------------------------------------------- */

function criarColuna(chave, docs, logado) {
  const meta = COLUMN_META[chave];

  const coluna = document.createElement('div');
  coluna.className = `column column-${chave}`;
  coluna.innerHTML = `
    <div class="column-header">
      <div class="column-header-left">
        <div class="column-icon">
          <img src="${meta.imagem}" alt="${escaparHtml(meta.label)}">
        </div>
        <h2 class="column-name">${escaparHtml(meta.label)}</h2>
      </div>
      <span class="column-badge">${docs.length} documento${docs.length === 1 ? '' : 's'}</span>
    </div>
    <div class="column-body"></div>
  `;

  // Se o PNG não carregar (caminho errado, arquivo ausente), volta pro SVG genérico
  const iconeEl = coluna.querySelector('.column-icon');
  iconeEl.querySelector('img').addEventListener('error', () => {
    iconeEl.innerHTML = meta.icon;
  });

  const body = coluna.querySelector('.column-body');

  if (docs.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'column-empty';
    vazio.textContent = 'Nenhum documento por aqui ainda.';
    body.appendChild(vazio);
  } else {
    docs.forEach((doc) => body.appendChild(criarCardDocumento(doc)));
  }

  // Com EXIGIR_LOGIN ligado, só quem está logado vê o botão de envio.
  if (!EXIGIR_LOGIN || logado) {
    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn-add-doc';
    btnAdd.innerHTML = `<span class="btn-add-icon">${ICONS.plus}</span> Adicionar documento`;
    btnAdd.addEventListener('click', () => abrirModalUpload(chave));
    body.appendChild(btnAdd);
  }

  return coluna;
}

/* --------------------------------------------------------------------------
   Renderização da página
   -------------------------------------------------------------------------- */

async function renderPagina() {
  const container = document.getElementById('columns');
  container.innerHTML = '<p class="loading-msg">Carregando documentos…</p>';

  const [dados, sessao] = await Promise.all([api.getAnalises(), obterSessao()]);
  container.innerHTML = '';

  Object.keys(COLUMN_META).forEach((chave) => {
    container.appendChild(criarColuna(chave, dados[chave] || [], !!sessao));
  });
}

// Se o login/logout acontecer em outra aba, a página atualiza sozinha.
supabaseClient.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') renderPagina();
});

renderPagina();
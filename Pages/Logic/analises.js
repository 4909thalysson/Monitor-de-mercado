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

const COLUMN_META = {
  soja:  { label: 'Soja',  Image: ASSESTS/icon-soja.png, icon: ICONS.soja },
  trigo: { label: 'Trigo', Image: ASSESTS/icon-trigo.png, icon: ICONS.trigo },
  milho: { label: 'Milho', Image: ASSESTS/icon-milho.png, icon: ICONS.milho }
};

const SUPABASE_URL = 'https://ixathumefunfdpkmfkjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4YXRodW1lZnVuZmRwa21ma2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1OTUyMzcsImV4cCI6MjEwNjE3MTIzN30.lw63gsDVWU9V7pOLiHvuh4OlSCSBxfxKh1TRR-k1F7k';
const BUCKET = 'analises_mercado';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

function criarCardDocumento(doc) {
  const card = document.createElement('div');
  card.className = 'doc-card';
  card.innerHTML = `
    <div class="doc-card-top">
      <div class="doc-logo" style="background:${doc.logo.bg}">${doc.logo.text}</div>
      <div class="doc-info">
        <p class="doc-title">${doc.titulo}</p>
        <p class="doc-source">${doc.fonte}</p>
      </div>
      <div class="doc-actions">
        <button class="doc-action doc-action-whatsapp" title="Enviar por WhatsApp">${ICONS.whatsapp}</button>
        <button class="doc-action doc-action-email" title="Enviar por e-mail">${ICONS.email}</button>
        <button class="doc-action doc-action-view" title="Visualizar">${ICONS.view}</button>
        <button class="doc-action doc-action-more" title="Mais opções">&#8230;</button>
      </div>
    </div>
    <p class="doc-meta">${ICONS.calendar}<span>${doc.data} • ${doc.tamanho}</span></p>
    ${doc.descricao ? `<p class="doc-description">${doc.descricao}</p>` : ''}
  `;

  // "Visualizar" já abre o arquivo de verdade (URL do Storage). WhatsApp,
  // e-mail e "mais opções" ainda são placeholders — prontos pra receber a
  // integração real (ex.: WhatsApp Business API pra mandar o PDF direto,
  // um endpoint de e-mail). Por enquanto só avisam no console.
  card.querySelector('.doc-action-view').addEventListener('click', () => {
    if (doc.url) window.open(doc.url, '_blank');
  });
  card.querySelector('.doc-action-whatsapp').addEventListener('click', () => {
    console.log('Enviar por WhatsApp:', doc.titulo, doc.url);
  });
  card.querySelector('.doc-action-email').addEventListener('click', () => {
    console.log('Enviar por e-mail:', doc.titulo, doc.url);
  });
  card.querySelector('.doc-action-more').addEventListener('click', () => {
    console.log('Mais opções:', doc.titulo);
  });

  return card;
}

// O Supabase Storage rejeita chaves com acento/caractere especial
// ("Invalid key"). Remove os acentos (NFD + descarta os diacríticos) e
// troca qualquer coisa fora de letras/números/espaço/ponto/traço/parênteses
// por "-", mantendo "Fonte - Título.ext" ainda legível.
function sanitizarNomeArquivo(nome) {
  const semAcento = nome.normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Mantém "&" pra não quebrar fontes como "Safras & Mercado" (viraria um
  // segundo " - " e confundiria o parser de fonte/título).
  return semAcento.replace(/[^a-zA-Z0-9 ._()&-]/g, '-');
}

// Abre o seletor de arquivo do sistema e sobe o escolhido pra pasta da
// cultura dentro do bucket. Pra sair certinho no card, nomeie o arquivo
// como "Fonte - Título.pdf" antes de selecionar (sem acento — veja
// sanitizarNomeArquivo acima).
function acionarUpload(chave) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx';
  input.addEventListener('change', async () => {
    const arquivo = input.files[0];
    if (!arquivo) return;

    const nomeSanitizado = sanitizarNomeArquivo(arquivo.name);
    const caminho = `${chave}/${nomeSanitizado}`;
    const { error } = await supabaseClient.storage.from(BUCKET).upload(caminho, arquivo, { upsert: false });

    if (error) {
      alert(`Não foi possível enviar o arquivo: ${error.message}`);
      console.error(error);
      return;
    }

    await renderPagina();
  });
  input.click();
}

function criarColuna(chave, docs) {
  const meta = COLUMN_META[chave];

  const coluna = document.createElement('div');
  coluna.className = `column column-${chave}`;
  coluna.innerHTML = `
    <div class="column-header">
      <div class="column-header-left">
        <div class="column-icon">${meta.icon}</div>
        <h2 class="column-name">${meta.label}</h2>
      </div>
      <span class="column-badge">${docs.length} documento${docs.length === 1 ? '' : 's'}</span>
    </div>
    <div class="column-body"></div>
  `;

  const body = coluna.querySelector('.column-body');

  if (docs.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'column-empty';
    vazio.textContent = 'Nenhum documento por aqui ainda.';
    body.appendChild(vazio);
  } else {
    docs.forEach((doc) => body.appendChild(criarCardDocumento(doc)));
  }

  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn-add-doc';
  btnAdd.innerHTML = `<span class="btn-add-icon">${ICONS.plus}</span> Adicionar documento`;
  btnAdd.addEventListener('click', () => acionarUpload(chave));
  body.appendChild(btnAdd);

  return coluna;
}

async function renderPagina() {
  const container = document.getElementById('columns');
  container.innerHTML = '<p class="loading-msg">Carregando documentos…</p>';

  const dados = await api.getAnalises();
  container.innerHTML = '';

  Object.keys(COLUMN_META).forEach((chave) => {
    container.appendChild(criarColuna(chave, dados[chave] || []));
  });
}

renderPagina();
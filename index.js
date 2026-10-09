const HG_WEATHER_KEY = 'bf20c501';
const HG_FINANCE_KEY = 'bf20c501';
const CITY_NAME = 'São Luiz Gonzaga,RS';
 
// Troque pela URL da página de Análises assim que ela estiver publicada.
const ANALISES_URL = './Pages/analises.html';
 
// A HG Brasil retorna clima e finanças em endpoints separados. O card do
// Dólar e o card do Peso Argentino vêm os dois do endpoint de finanças,
// então essa função guarda a mesma requisição/promise pra não buscar
// duas vezes.
let financePromise = null;
function fetchFinance() {
  if (!financePromise) {
    const url = `https://api.hgbrasil.com/finance?format=json-cors&key=${HG_FINANCE_KEY}`;
    financePromise = fetch(url).then(res => res.json());
  }
  return financePromise;
}
 
function fetchWeather() {
  const url = `https://api.hgbrasil.com/weather?format=json-cors&key=${HG_WEATHER_KEY}&city_name=${encodeURIComponent(CITY_NAME)}`;
  return fetch(url).then(res => res.json());
}
 
const api = {
  async getCotacaoDolar() {
    const data = await fetchFinance();
    const usd = data.results.currencies.USD;
    return { valor: usd.buy, data: new Date() };
  },
  async getCotacaoPesoArgentino() {
    const data = await fetchFinance();
    const ars = data.results.currencies.ARS;
    return { valor: ars.buy, data: new Date() };
  },
  async getTemperatura() {
    const data = await fetchWeather();
    const r = data.results;
    const forecast = r.forecast || [];
 
    // Calcula a data de amanhã (hoje +1) por conta própria, em vez de
    // confiar na posição do item dentro do array "forecast" — e usa isso
    // pra achar o dia certo pelo campo "date" (formato dd/mm), que é mais
    // confiável do que assumir um índice fixo.
    const hoje = new Date();
    const amanhaDate = new Date(hoje);
    amanhaDate.setDate(hoje.getDate() + 1);
 
    const amanhaStr = formatarData(amanhaDate);
    const amanha = forecast.find(f => f.date === amanhaStr);
 
    return {
      cidade: r.city,
      valorC: r.temp,
      descricao: r.description,
      umidade: r.humidity,
      amanhaData: amanhaStr,
      amanhaMax: amanha ? amanha.max : null,
      amanhaMin: amanha ? amanha.min : null,
      amanhaUmidade: amanha ? amanha.humidity : null
    };
  }
};
 
function formatarData(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
 
// O Peso Argentino vale poucos centavos de Real (ex.: R$ 0,0031), então
// com 2 casas decimais ele sempre apareceria como "R$ 0,00" — por isso o
// número de casas é configurável (padrão 2, mas o peso usa 4).
function formatarMoeda(valor, casas = 2) {
  return `R$ ${valor.toFixed(casas).replace('.', ',')}`;
}
 
// Usa allSettled (em vez de Promise.all) pra que, se um só endpoint falhar
// (ex.: chave errada, sem internet), os outros dois blocos ainda apareçam.
async function renderWidget() {
  const [dolar, peso, clima] = await Promise.allSettled([
    api.getCotacaoDolar(),
    api.getCotacaoPesoArgentino(),
    api.getTemperatura()
  ]);
 
  const dolarEl = document.getElementById('value-dolar');
  if (dolar.status === 'fulfilled') {
    dolarEl.textContent = formatarMoeda(dolar.value.valor);
    document.getElementById('date-dolar').textContent = formatarData(dolar.value.data);
  } else {
    dolarEl.textContent = '--';
    console.error('Erro ao buscar cotação do dólar:', dolar.reason);
  }
  dolarEl.classList.remove('is-loading');
 
  const pesoEl = document.getElementById('value-peso');
  if (peso.status === 'fulfilled') {
    pesoEl.textContent = formatarMoeda(peso.value.valor, 4);
    document.getElementById('date-peso').textContent = formatarData(peso.value.data);
  } else {
    pesoEl.textContent = '--';
    console.error('Erro ao buscar cotação do peso argentino:', peso.reason);
  }
  pesoEl.classList.remove('is-loading');
 
  if (clima.status === 'fulfilled') {
    document.getElementById('weather-city').textContent = clima.value.cidade;
    document.getElementById('weather-value').textContent = `${clima.value.valorC}°C`;
    document.getElementById('weather-description').textContent = clima.value.descricao || '--';
    document.getElementById('weather-humidity').textContent =
      clima.value.umidade != null ? `${clima.value.umidade}%` : '--%';
 
    document.getElementById('forecast-tomorrow-date').textContent = clima.value.amanhaData;
    document.getElementById('forecast-tomorrow-max').textContent =
      clima.value.amanhaMax != null ? `${clima.value.amanhaMax}°` : '--°';
    document.getElementById('forecast-tomorrow-min').textContent =
      clima.value.amanhaMin != null ? `${clima.value.amanhaMin}°` : '--°';
    document.getElementById('forecast-tomorrow-humidity').textContent =
      clima.value.amanhaUmidade != null ? `${clima.value.amanhaUmidade}%` : '--%';
  } else {
    document.getElementById('weather-value').textContent = '--°C';
    document.getElementById('weather-description').textContent = '--';
    document.getElementById('weather-humidity').textContent = '--%';
    document.getElementById('forecast-tomorrow-max').textContent = '--°';
    document.getElementById('forecast-tomorrow-min').textContent = '--°';
    document.getElementById('forecast-tomorrow-humidity').textContent = '--%';
    console.error('Erro ao buscar temperatura:', clima.reason);
  }
}
 
renderWidget();
 
// ---------------------------------------------------------------------
// Relógio (hora + dia/semana/ano) — atualiza a cada segundo.
// ---------------------------------------------------------------------
function atualizarRelogio() {
  const agora = new Date();
 
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
 
  let data = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  // toLocaleDateString devolve tudo em minúsculo — deixa a primeira letra maiúscula
  data = data.charAt(0).toUpperCase() + data.slice(1);
 
  document.getElementById('clock-time').textContent = hora;
  document.getElementById('clock-date').textContent = data;
}
 
atualizarRelogio();
setInterval(atualizarRelogio, 1000);
 
// ---------------------------------------------------------------------
// Os widgets do Cepea (dentro de .cepea-item) escrevem seu próprio HTML
// via document.write, incluindo uma imagem de logotipo hospedada no
// domínio deles. Se a Cepea não tiver o domínio autorizado pra
// hotlinking, essa imagem quebra (ícone de "imagem não encontrada"),
// mesmo com a tabela de preços funcionando normalmente.
//
// Este trecho só esconde a imagem quebrada, sem tocar nos dados.
// ---------------------------------------------------------------------
function esconderImagemQuebrada(img) {
  if (!img.complete || img.naturalWidth === 0) {
    img.style.display = 'none';
  }
}
 
window.addEventListener('load', () => {
  document.querySelectorAll('.cepea-item img').forEach((img) => {
    esconderImagemQuebrada(img);
    img.addEventListener('error', () => esconderImagemQuebrada(img));
  });
});
 
// ---------------------------------------------------------------------
// Botão "Acessar Análises" — abre a página de análises em uma nova aba.
// ---------------------------------------------------------------------
const btnAnalises = document.getElementById('btn-analises');
if (btnAnalises) {
  btnAnalises.addEventListener('click', () => {
    window.open(ANALISES_URL, '_blank');
  });
}
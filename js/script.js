/* =========================================================
   Cherry Kbeuty — interações
   ========================================================= */
(() => {
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cabeçalho ganha sombra ao rolar ---------- */
  const topo = $('#topo');
  const aoRolar = () => topo.classList.toggle('topo--rolado', window.scrollY > 8);
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  /* ---------- Painéis: menu mobile e busca ---------- */
  let painelAberto = null;
  let gatilhoAtual = null;

  function abrePainel(painel, gatilho) {
    if (painelAberto) fechaPainel(painelAberto, false);
    painelAberto = painel;
    gatilhoAtual = gatilho;
    painel.hidden = false;
    document.body.classList.add('travado');
    $$(`[aria-controls="${painel.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
    requestAnimationFrame(() => {
      painel.classList.add('aberto');
      const foco = $('[data-foco]', painel) || $('input', painel) || $('button, a', painel);
      foco?.focus({ preventScroll: true });
    });
  }

  function fechaPainel(painel = painelAberto, devolveFoco = true) {
    if (!painel) return;
    painel.classList.remove('aberto');
    $$(`[aria-controls="${painel.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
    document.body.classList.remove('travado');
    setTimeout(() => { if (!painel.classList.contains('aberto')) painel.hidden = true; }, reduzMovimento ? 0 : 400);
    if (devolveFoco) gatilhoAtual?.focus();
    painelAberto = null;
    painel.dispatchEvent(new CustomEvent('painelfechado'));
  }

  // usado por js/loja.js (detalhes do produto)
  window.CherryPaineis = {
    abrir: (id, gatilho) => abrePainel(document.getElementById(id), gatilho || document.activeElement),
    fechar: () => fechaPainel(),
  };

  $$('[data-abre]').forEach((botao) => {
    const painel = document.getElementById(botao.dataset.abre);
    botao.addEventListener('click', () => abrePainel(painel, botao));
  });

  $$('.painel').forEach((painel) => {
    $$('[data-fecha]', painel).forEach((el) => el.addEventListener('click', () => fechaPainel(painel)));
    // links do menu fecham o painel ao navegar
    $$('a[href^="#"]', painel).forEach((a) => a.addEventListener('click', () => fechaPainel(painel, false)));
  });

  document.addEventListener('keydown', (e) => {
    if (!painelAberto) return;
    if (e.key === 'Escape') { fechaPainel(); return; }
    // mantém o foco dentro do painel
    if (e.key === 'Tab') {
      const focaveis = $$('a[href], button:not([disabled]), input', painelAberto).filter((el) => el.offsetParent !== null);
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  });

  window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
    if (e.matches && painelAberto?.id === 'menu-mobile') fechaPainel(painelAberto, false);
  });

  /* ---------- Busca ---------- */
  const campoBusca = $('#busca-campo');
  const formBusca = $('.busca__form');
  $$('.busca__sugestoes button').forEach((b) => {
    b.addEventListener('click', () => { campoBusca.value = b.textContent; formBusca.requestSubmit(); });
  });
  formBusca.addEventListener('submit', (e) => {
    e.preventDefault();
    const termo = campoBusca.value.trim();
    if (!termo) return;
    fechaPainel(painelAberto, false);
    window.CherryLoja?.buscar(termo);
  });

  /* ---------- Ano no rodapé ---------- */
  $('#ano').textContent = new Date().getFullYear();

  if (reduzMovimento) return;

  /* ---------- Pétalas de cerejeira caindo ---------- */
  const hero = $('.hero');
  const caixaPetalas = $('.petalas');

  function ajustaQueda() {
    caixaPetalas.style.setProperty('--queda', `${hero.offsetHeight + 60}px`);
  }

  function criaPetalas() {
    const quantidade = window.innerWidth < 700 ? 10 : 18;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < quantidade; i++) {
      const p = document.createElement('span');
      const duracao = 9 + Math.random() * 9;
      p.className = 'petala';
      p.style.setProperty('--x', `${(Math.random() * 100).toFixed(2)}%`);
      p.style.setProperty('--s', `${(8 + Math.random() * 10).toFixed(1)}px`);
      p.style.setProperty('--d', `${duracao.toFixed(2)}s`);
      p.style.setProperty('--atraso', `${(-Math.random() * duracao).toFixed(2)}s`);
      p.style.setProperty('--deriva', `${((Math.random() - 0.35) * 180).toFixed(0)}px`);
      p.style.setProperty('--giro', `${((Math.random() * 2 - 1) * 540).toFixed(0)}deg`);
      p.style.opacity = (0.55 + Math.random() * 0.4).toFixed(2);
      frag.appendChild(p);
    }
    caixaPetalas.appendChild(frag);
  }

  ajustaQueda();
  criaPetalas();
  new ResizeObserver(ajustaQueda).observe(hero);

  /* ---------- Parallax suave com o mouse ---------- */
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const camadas = $$('.hero__arte [data-prof]').map((el) => ({ el, prof: Number(el.dataset.prof) }));
  let alvoX = 0, alvoY = 0, x = 0, y = 0, quadro = 0;

  function anima() {
    x += (alvoX - x) * 0.08;
    y += (alvoY - y) * 0.08;
    for (const { el, prof } of camadas) {
      el.style.transform = `translate3d(${(x * prof).toFixed(2)}px, ${(y * prof).toFixed(2)}px, 0)`;
    }
    quadro = Math.abs(alvoX - x) > 0.001 || Math.abs(alvoY - y) > 0.001 ? requestAnimationFrame(anima) : 0;
  }

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    alvoX = ((e.clientX - r.left) / r.width) * 2 - 1;
    alvoY = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (!quadro) quadro = requestAnimationFrame(anima);
  });
  hero.addEventListener('pointerleave', () => {
    alvoX = alvoY = 0;
    if (!quadro) quadro = requestAnimationFrame(anima);
  });
})();

/* PrevSystem — comportamento comum às 15 peças (proposta Apple Design).
   Molas criticamente amortecidas (amortecimento 1,0), arrasto 1:1 com projeção do impulso,
   janelas com o cursor dentro, Tab preso, Esc fecha sem apagar, "reduzir movimento" respeitado. */
(() => {
  const reduzMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const celular = () => matchMedia('(max-width: 767px)').matches;
  const semMenuFixo = () => matchMedia('(max-width: 1023px)').matches;

  /* ---------- Física ---------- */
  // Mola com dois parâmetros, como a Apple: resposta (s) e amortecimento (1 = sem quique).
  function mola({ de, para, velocidade = 0, resposta = 0.36, amortecimento = 1, precisao = 0.5, aoMudar, aoFim }) {
    const k = Math.pow((2 * Math.PI) / resposta, 2);
    const c = (4 * Math.PI * amortecimento) / resposta;
    let x = de, v = velocidade, ultimo = performance.now(), id = 0, parado = false;
    const passo = (agora) => {
      if (parado) return;
      const dt = Math.min((agora - ultimo) / 1000, 1 / 30);
      ultimo = agora;
      for (let i = 0; i < 4; i++) { const h = dt / 4; const a = -k * (x - para) - c * v; v += a * h; x += v * h; }
      if (Math.abs(x - para) < precisao && Math.abs(v) < precisao * 6) { x = para; v = 0; aoMudar(x); if (aoFim) aoFim(); return; }
      aoMudar(x);
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return { parar() { parado = true; cancelAnimationFrame(id); return { x, v }; } };
  }
  // Projeção do impulso (a mesma função da Apple): para onde o gesto está indo.
  const projetar = (v, taxa = 0.998) => ((v / 1000) * taxa) / (1 - taxa);
  // Borda elástica: quanto mais passa do limite, menos acompanha.
  const elastico = (excesso, dimensao, c = 0.55) => (excesso * dimensao * c) / (dimensao + c * Math.abs(excesso));

  // Histórico curto do ponteiro para medir a velocidade na soltura.
  function rastreador() {
    const pts = [];
    return {
      add(p) { pts.push({ p, t: performance.now() }); if (pts.length > 6) pts.shift(); },
      velocidade() {
        if (pts.length < 2) return 0;
        const a = pts[0], b = pts[pts.length - 1];
        const dt = (b.t - a.t) / 1000;
        return dt > 0 ? (b.p - a.p) / dt : 0;
      },
      limpar() { pts.length = 0; },
    };
  }

  /* ---------- Foco ---------- */
  const SELETOR_FOCO = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const visiveis = (raiz) => [...raiz.querySelectorAll(SELETOR_FOCO)].filter((e) => e.getClientRects().length > 0 && !e.closest('[hidden]'));
  function prenderTab(raiz, ev) {
    const f = visiveis(raiz);
    if (!f.length) return;
    const primeiro = f[0], ultimo = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
    else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
    else if (!raiz.contains(document.activeElement)) { ev.preventDefault(); primeiro.focus(); }
  }

  /* ---------- Menu do celular (gaveta que vem da esquerda e volta para a esquerda) ---------- */
  const corpo = document.body;
  const lateral = document.querySelector('.lateral');
  const veuMenu = document.querySelector('.veu-menu');
  const botaoMenu = document.querySelector('[data-abrir-menu]');
  let menuMola = null, dx = 0;
  const larguraMenu = () => (lateral ? lateral.getBoundingClientRect().width + 24 : 340);
  function pintarMenu(x) {
    dx = x;
    lateral.style.setProperty('--dx', `${x}px`);
    corpo.style.setProperty('--veu-opacidade', String(Math.max(0, Math.min(1, 1 + x / larguraMenu()))));
  }
  function moverMenu(para, velocidade = 0, aoFim) {
    if (menuMola) menuMola.parar();
    if (reduzMovimento()) { pintarMenu(para); if (aoFim) aoFim(); return; }
    menuMola = mola({ de: dx, para, velocidade, resposta: 0.32, aoMudar: pintarMenu, aoFim });
  }
  function abrirMenu() {
    if (!lateral) return;
    if (!corpo.classList.contains('menu-aberto')) { pintarMenu(-larguraMenu()); corpo.classList.add('menu-aberto'); }
    lateral.setAttribute('role', 'dialog'); lateral.setAttribute('aria-modal', 'true');
    if (botaoMenu) botaoMenu.setAttribute('aria-expanded', 'true');
    moverMenu(0);
    const f = lateral.querySelector('[data-fechar-menu]'); if (f) f.focus();
  }
  function fecharMenu(velocidade = 0) {
    if (!corpo.classList.contains('menu-aberto')) return;
    if (botaoMenu) botaoMenu.setAttribute('aria-expanded', 'false');
    moverMenu(-larguraMenu(), velocidade, () => {
      corpo.classList.remove('menu-aberto'); lateral.removeAttribute('role'); lateral.removeAttribute('aria-modal');
      lateral.style.removeProperty('--dx'); if (botaoMenu) botaoMenu.focus();
    });
  }
  if (botaoMenu) botaoMenu.addEventListener('click', abrirMenu);
  document.querySelectorAll('[data-fechar-menu]').forEach((b) => b.addEventListener('click', () => fecharMenu()));
  if (veuMenu) veuMenu.addEventListener('click', () => fecharMenu());
  if (lateral) {
    lateral.querySelectorAll('a.item').forEach((a) => a.addEventListener('click', () => { if (semMenuFixo()) fecharMenu(); }));
    // Arrasto 1:1 da gaveta, com limiar de 10 px antes de decidir a direção.
    let inicio = null, decidido = false, horizontal = false, base = 0;
    const rastro = rastreador();
    lateral.addEventListener('pointerdown', (e) => {
      if (!corpo.classList.contains('menu-aberto') || e.button !== 0) return;
      if (menuMola) { const s = menuMola.parar(); dx = s.x; }
      inicio = { x: e.clientX, y: e.clientY }; decidido = false; horizontal = false; base = dx; rastro.limpar(); rastro.add(e.clientX);
    });
    lateral.addEventListener('pointermove', (e) => {
      if (!inicio) return;
      const mx = e.clientX - inicio.x, my = e.clientY - inicio.y;
      if (!decidido) {
        if (Math.hypot(mx, my) < 10) return;
        decidido = true; horizontal = Math.abs(mx) > Math.abs(my);
        if (horizontal) lateral.setPointerCapture(e.pointerId); else { inicio = null; return; }
      }
      rastro.add(e.clientX);
      let alvo = base + mx;
      if (alvo > 0) alvo = elastico(alvo, larguraMenu());
      pintarMenu(alvo);
    });
    const soltar = () => {
      if (!inicio) return;
      const foiArrasto = decidido && horizontal;
      inicio = null;
      if (!foiArrasto) return;
      const v = rastro.velocidade();
      const destino = dx + projetar(v);
      if (destino < -larguraMenu() / 2) fecharMenu(v); else moverMenu(0, v);
    };
    lateral.addEventListener('pointerup', soltar);
    lateral.addEventListener('pointercancel', soltar);
  }

  /* ---------- Janelas e folhas ---------- */
  const janelas = new Map();
  function controle(janela) {
    if (janelas.has(janela)) return janelas.get(janela);
    const veu = document.querySelector(`[data-veu-de="${janela.id}"]`);
    let m = null, valor = 0, origem = null;
    const c = {
      janela, veu, aberta: !janela.hidden,
      pintar(x) {
        valor = x;
        if (celular()) {
          janela.style.setProperty('--dy', `${x}px`);
          janela.style.setProperty('--escala', '1');
          janela.style.opacity = '1';
          if (veu) veu.style.setProperty('--veu-opacidade', String(Math.max(0, 1 - x / Math.max(1, janela.offsetHeight))));
        } else {
          // x vai de 0 (aberta) a 1 (fechada): a janela "materializa" a partir do botão que a abriu.
          janela.style.setProperty('--dy', `${x * 10}px`);
          janela.style.setProperty('--escala', String(1 - x * 0.05));
          janela.style.opacity = String(1 - x);
          if (veu) veu.style.setProperty('--veu-opacidade', String(1 - x));
        }
      },
      fechada() { return celular() ? janela.offsetHeight + 24 : 1; },
      mover(para, velocidade = 0, aoFim) {
        if (m) { const s = m.parar(); valor = s.x; }
        if (reduzMovimento()) {
          // Movimento reduzido: troca suave de opacidade, sem deslizar nem escalar.
          janela.style.setProperty('--dy', '0px'); janela.style.setProperty('--escala', '1');
          janela.style.transition = 'opacity .2s ease'; if (veu) veu.style.transition = 'opacity .2s ease';
          const fim = para !== 0;
          janela.style.opacity = fim ? '0' : '1'; if (veu) veu.style.opacity = fim ? '0' : '1';
          setTimeout(() => { if (aoFim) aoFim(); }, 200);
          return;
        }
        const ehCel = celular();
        m = mola({ de: valor, para, velocidade, resposta: ehCel ? 0.3 : 0.28, precisao: ehCel ? 0.5 : 0.002, aoMudar: c.pintar, aoFim });
      },
      abrir(gatilho) {
        origem = gatilho || document.activeElement;
        if (!celular() && gatilho) {
          const r = gatilho.getBoundingClientRect();
          janela.hidden = false;
          const j = janela.getBoundingClientRect();
          janela.style.transformOrigin = `${r.left + r.width / 2 - j.left}px ${r.top + r.height / 2 - j.top}px`;
        }
        janela.hidden = false; if (veu) { veu.hidden = false; veu.style.opacity = ''; }
        janela.style.opacity = '';
        c.aberta = true;
        c.pintar(c.fechada());
        c.mover(0);
        const alvo = janela.querySelector('[data-foco-inicial]') || visiveis(janela)[0];
        if (alvo) alvo.focus();
      },
      fechar(velocidade = 0) {
        if (!c.aberta) return;
        c.aberta = false;
        c.mover(c.fechada(), velocidade, () => {
          janela.hidden = true; if (veu) veu.hidden = true;
          if (origem && document.contains(origem)) origem.focus();
        });
      },
    };
    // Arrasto da folha no celular: puxador e cabeça acompanham o dedo 1:1.
    const pegas = janela.querySelectorAll('.puxador, .janela-cabeca');
    const rastro = rastreador();
    let inicio = null, base = 0;
    pegas.forEach((p) => {
      p.addEventListener('pointerdown', (e) => {
        if (!celular() || e.button !== 0 || e.target.closest('button:not(.puxador), a, input, select, textarea')) return;
        if (m) { const s = m.parar(); valor = s.x; }
        inicio = e.clientY; base = valor; rastro.limpar(); rastro.add(e.clientY); p.setPointerCapture(e.pointerId);
      });
      p.addEventListener('pointermove', (e) => {
        if (inicio === null) return;
        rastro.add(e.clientY);
        let alvo = base + (e.clientY - inicio);
        if (alvo < 0) alvo = elastico(alvo, janela.offsetHeight);
        c.pintar(alvo);
      });
      const soltar = () => {
        if (inicio === null) return;
        inicio = null;
        const v = rastro.velocidade();
        const destino = valor + projetar(v);
        if (destino > janela.offsetHeight / 2) c.fechar(v); else c.mover(0, v);
      };
      p.addEventListener('pointerup', soltar);
      p.addEventListener('pointercancel', soltar);
    });
    if (veu) veu.addEventListener('click', () => c.fechar());
    janela.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => c.fechar()));
    janelas.set(janela, c);
    return c;
  }
  document.querySelectorAll('.janela[id]').forEach((j) => controle(j));
  document.querySelectorAll('[data-abrir-janela]').forEach((b) => b.addEventListener('click', () => {
    const j = document.getElementById(b.dataset.abrirJanela); if (j) controle(j).abrir(b);
  }));
  const janelaAberta = () => [...janelas.values()].find((c) => c.aberta);

  /* ---------- Teclado: Tab preso, Esc fecha sem apagar ---------- */
  document.addEventListener('keydown', (e) => {
    const j = janelaAberta();
    const menuAberto = corpo.classList.contains('menu-aberto') && semMenuFixo();
    if (e.key === 'Escape') {
      if (j) { e.preventDefault(); j.fechar(); return; }
      if (menuAberto) { e.preventDefault(); fecharMenu(); return; }
    }
    if (e.key === 'Tab') {
      if (j) prenderTab(j.janela, e);
      else if (menuAberto) prenderTab(lateral, e);
    }
  });

  /* ---------- Formulários de cadastro: Enter avança, Ctrl+Enter salva (Regra 55) ---------- */
  document.querySelectorAll('form[data-cadastro]').forEach((form) => {
    const salvar = form.querySelector('[data-salvar]') || document.querySelector('[data-salvar]');
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const t = e.target;
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); if (salvar) salvar.click(); return; }
      if (t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.tagName === 'A') return;
      e.preventDefault();
      const campos = visiveis(form).filter((x) => ['INPUT', 'SELECT', 'TEXTAREA'].includes(x.tagName));
      const i = campos.indexOf(t);
      if (i > -1 && i < campos.length - 1) campos[i + 1].focus(); else if (salvar) salvar.focus();
    });
    if (salvar) salvar.addEventListener('click', (e) => {
      e.preventDefault();
      const erro = form.querySelector('[aria-invalid="true"]');
      if (erro) erro.focus();
    });
  });

  /* ---------- Entrar: o Enter executa ---------- */
  document.querySelectorAll('form[data-entrar]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const b = form.querySelector('button[type="submit"]');
      if (!b || b.getAttribute('aria-disabled') === 'true') return;
      const txt = b.querySelector('.rotulo-botao');
      const antes = txt.textContent;
      b.setAttribute('aria-disabled', 'true'); txt.textContent = 'Aguarde…';
      setTimeout(() => { b.removeAttribute('aria-disabled'); txt.textContent = antes; }, 1400);
    });
  });
  document.querySelectorAll('[data-mostrar-senha]').forEach((b) => b.addEventListener('click', () => {
    const campo = document.getElementById(b.dataset.mostrarSenha);
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    b.setAttribute('aria-label', mostrar ? 'Esconder a senha' : 'Mostrar a senha');
    b.setAttribute('data-dica', mostrar ? 'Esconder a senha' : 'Mostrar a senha');
    b.setAttribute('aria-pressed', String(mostrar));
    const u = b.querySelector('use'); if (u) u.setAttribute('href', mostrar ? '#i-eye-off' : '#i-eye');
  }));

  /* ---------- Aviso do pé: some sozinho, pausa com o mouse ou o foco, tem Fechar ---------- */
  document.querySelectorAll('.aviso-pe').forEach((av) => {
    let t = null;
    const sumir = () => { av.classList.add('saindo'); setTimeout(() => { av.hidden = true; }, 260); };
    const armar = () => { clearTimeout(t); t = setTimeout(sumir, 8000); };
    av.addEventListener('mouseenter', () => clearTimeout(t));
    av.addEventListener('mouseleave', armar);
    av.addEventListener('focusin', () => clearTimeout(t));
    av.addEventListener('focusout', armar);
    const f = av.querySelector('[data-fechar-aviso]'); if (f) f.addEventListener('click', sumir);
    armar();
  });

  /* ---------- Abas: setas trocam ---------- */
  document.querySelectorAll('[role="tablist"]').forEach((lista) => {
    const abas = [...lista.querySelectorAll('[role="tab"]')];
    const escolher = (a) => { abas.forEach((x) => { x.setAttribute('aria-selected', String(x === a)); x.tabIndex = x === a ? 0 : -1; }); a.focus(); };
    abas.forEach((a) => a.addEventListener('click', () => escolher(a)));
    lista.addEventListener('keydown', (e) => {
      const i = abas.indexOf(document.activeElement); if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); escolher(abas[(i + 1) % abas.length]); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); escolher(abas[(i - 1 + abas.length) % abas.length]); }
    });
  });

  /* ---------- Grupo recolhível do menu e "Mais filtros" ---------- */
  document.querySelectorAll('button[aria-controls][aria-expanded]').forEach((b) => {
    if (b.hasAttribute('data-abrir-menu')) return;
    b.addEventListener('click', () => {
      const alvo = document.getElementById(b.getAttribute('aria-controls')); if (!alvo) return;
      const abrir = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(abrir)); alvo.hidden = !abrir;
      const r = b.querySelector('[data-rotulo-aberto]');
      if (r) r.textContent = abrir ? r.dataset.rotuloAberto : r.dataset.rotuloFechado;
    });
  });

  /* ---------- Conferência: conta o que está marcado para aplicar ---------- */
  document.querySelectorAll('[data-contar-em]').forEach((saida) => {
    const raiz = document.getElementById(saida.dataset.contarEm);
    const botao = document.querySelector('[data-aplicar]');
    const atualizar = () => {
      const n = raiz.querySelectorAll('input[type="checkbox"]:checked').length;
      saida.textContent = n === 0 ? 'Nenhum selecionado para aplicar' : n === 1 ? '1 selecionado para aplicar' : `${n} selecionados para aplicar`;
      if (botao) botao.querySelector('.rotulo-botao').textContent = n === 0 ? 'Só guardar o documento' : 'Aplicar selecionados';
    };
    raiz.addEventListener('change', atualizar);
  });

  /* ---------- Espera longa (Regra 43, item 12) ---------- */
  document.querySelectorAll('[data-demora]').forEach((el) => setTimeout(() => { el.hidden = false; }, 10000));

  /* ---------- Cabeçalho da tabela preso abaixo da faixa de avisos ---------- */
  const faixa = document.querySelector('.faixa-urgente');
  const medir = () => document.documentElement.style.setProperty('--faixa-altura', faixa && !semMenuFixo() ? `${faixa.offsetHeight}px` : '0px');
  medir(); addEventListener('resize', medir);

  /* ---------- Peças que já abrem com a janela à vista: cursor dentro ---------- */
  const inicial = document.querySelector('[data-foco-ao-abrir]');
  if (inicial) requestAnimationFrame(() => inicial.focus());
})();

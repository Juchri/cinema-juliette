(async function () {
  const res = await fetch('data/films.json');
  const DATA = await res.json();
  const P = DATA.personnes;
  const COL = ['var(--c0)', 'var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)'];
  const col = (p) => COL[P.indexOf(p)];
  const L = d3.formatLocale({decimal: ',', thousands: ' ', grouping: [3], currency: ['', ' €']});
  const f1 = L.format('.1f'), f2 = L.format('.2f');
  const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

  // ---------- Calculs ----------
  const F = DATA.films.map((f) => {
    const v = f.notes.filter((x) => x !== null);
    return {...f, nb: v.length, moyenne: mean(v), ecart: v.length ? Math.max(...v) - Math.min(...v) : null};
  }).filter((f) => f.nb > 0);
  const allNotes = F.flatMap((f) => f.notes.filter((x) => x !== null));
  const M3 = F.filter((f) => f.nb >= 3);
  // À note égale (au dixième affiché) : le plus de personnes, puis le plus récent.
  const r1 = (x) => Math.round(x * 10) / 10;
  const departage = (a, b) => b.nb - a.nb || b.annee - a.annee || a.id - b.id;
  const TOP = M3.slice().sort((a, b) => r1(b.moyenne) - r1(a.moyenne) || departage(a, b)).slice(0, 10);
  const FLOP = M3.slice().sort((a, b) => r1(a.moyenne) - r1(b.moyenne) || departage(a, b)).slice(0, 8);
  const DIV = M3.slice().sort((a, b) => b.ecart - a.ecart || departage(a, b)).slice(0, 8);

  const PEOPLE = P.map((p, i) => {
    const mine = F.filter((f) => f.notes[i] !== null), v = mine.map((f) => f.notes[i]);
    const diffs = mine.map((f) => { const o = f.notes.filter((x, k) => k !== i && x !== null); return o.length ? f.notes[i] - mean(o) : null; }).filter((x) => x !== null);
    const best = mine.slice().sort((a, b) => b.notes[i] - a.notes[i])[0];
    const counts = d3.range(1, 11).map((n) => v.filter((x) => x === n).length);
    return {p, i, n: v.length, moyenne: mean(v), pct8: v.filter((x) => x >= 8).length / v.length, dix: v.filter((x) => x === 10).length,
      vs: mean(diffs), best, counts, fav: counts.indexOf(Math.max(...counts)) + 1};
  });
  const PAIRS = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {
    const c = F.filter((f) => f.notes[i] !== null && f.notes[j] !== null);
    if (c.length < 3) continue;
    PAIRS.push({a: P[i], b: P[j], i, j, n: c.length, ecart: mean(c.map((f) => Math.abs(f.notes[i] - f.notes[j]))), same: c.filter((f) => f.notes[i] === f.notes[j]).length / c.length});
  }
  PAIRS.sort((x, y) => x.ecart - y.ecart);
  const YEARS = Array.from(new Set(F.map((f) => f.annee))).sort().map((y) => {
    const fs = F.filter((f) => f.annee === y), row = {annee: y, films: fs.length};
    P.forEach((p, i) => { const v = fs.map((f) => f.notes[i]).filter((x) => x !== null); row[p] = v.length >= 3 ? mean(v) : null; row['n_' + p] = v.length; });
    return row;
  });

  // ---------- Intro ----------
  const big = PEOPLE.filter((x) => x.n >= 30).sort((a, b) => b.vs - a.vs);
  const duo = PAIRS.filter((x) => x.n >= 20)[0];
  const lead = $('#lead'); lead.replaceChildren();
  const B = (t) => el('b', null, t);
  lead.append('En huit ans, la famille a noté ', B(F.length), ' films. Le duo le plus en phase : ', B(duo.a + ' & ' + duo.b),
    ', à peine ', B(f1(duo.ecart)), ' point d’écart en moyenne. La main la plus généreuse est celle de ', B(big[0].p),
    ', la plus sévère celle de ', B(big[big.length - 1].p), '. Et le film qui met tout le monde d’accord : ', B(TOP[0].titre), '.');
  $('#maj').textContent = new Date(DATA.maj).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'});

  // ---------- Tuiles ----------
  const tiles = [[F.length, 'films notés depuis 2019'], [allNotes.length, 'notes données au total'], [f2(mean(allNotes)), 'note moyenne'],
    [F.filter((f) => f.nb === 5).length, 'films vus par les 5'], [PEOPLE[0].n, 'films notés par Pilou, record d’assiduité']];
  tiles.forEach(([v, l]) => { const t = el('div', 'tile'); t.append(el('div', 'big', String(v)), el('div', 'lbl', l)); $('#chiffres').appendChild(t); });

  // ---------- Podiums ----------
  const chips = (f) => { const c = el('div', 'chips'); f.notes.forEach((x, i) => { if (x === null) return; const s = el('span', 'chip'); const d = el('i'); d.style.background = COL[i]; s.append(d, P[i] + ' ' + x); c.appendChild(s); }); return c; };
  function podium(id, restId, list, scoreOf, scoreLbl) {
    const box = $(id);
    list.slice(0, 3).forEach((f, k) => {
      const s = el('div', 'step r' + (k + 1));
      const po = el('div', 'poster'); po.append(el('div', 'medal', String(k + 1)), el('div', 'ph', f.titre));
      poserAffiche(po, f.titre, f.annee);
      const a = el('div', 'avg', scoreOf(f)); a.appendChild(el('small', null, ' ' + scoreLbl));
      s.append(po, el('div', 't', f.titre), el('div', 'y', String(f.annee)), a, chips(f), el('div', 'plinth'));
      box.appendChild(s);
    });
    const ol = $(restId);
    list.slice(3).forEach((f) => {
      const li = el('li'); const th = el('div', 'thumb'); poserAffiche(th, f.titre, f.annee);
      const mid = el('div'); const t = el('span', 't', f.titre); mid.append(t, el('span', 'y', String(f.annee)), chips(f));
      const sc = el('div', 'score', scoreOf(f)); sc.appendChild(el('small', null, scoreLbl));
      li.append(th, mid, sc); ol.appendChild(li);
    });
  }
  podium('#podium-top', '#rest-top', TOP, (f) => f1(f.moyenne), '/10');
  podium('#podium-div', '#rest-div', DIV, (f) => String(f.ecart), 'pts d’écart');
  podium('#podium-flop', '#rest-flop', FLOP, (f) => f1(f.moyenne), '/10');

  // ---------- Classement des cinéphiles ----------
  const VUS = P.map((p, i) => {
    const seen = F.filter((f) => f.notes[i] !== null || f.endormi === p);
    const parAn = {}; YEARS.forEach((y) => { parAn[y.annee] = seen.filter((f) => f.annee === y.annee).length; });
    return {p, n: seen.length, siestes: F.filter((f) => f.endormi === p).length, parAn};
  }).sort((a, b) => b.n - a.n);
  const medals = ['🥇', '🥈', '🥉'];
  const maxVus = VUS[0].n;
  VUS.forEach((v, k) => {
    const r = el('div', 'rk');
    const bar = el('div', 'bar'); const fill = el('span'); fill.style.background = col(v.p); bar.appendChild(fill);
    const val = el('div', 'val'); val.appendChild(el('b', null, String(v.n)));
    val.appendChild(el('small', null, Math.round(100 * v.n / F.length) + ' % des films' + (v.siestes ? ` · ${v.siestes} 💤` : '')));
    r.append(el('div', 'pos', medals[k] || String(k + 1)), el('div', 'nm', v.p), bar, val);
    $('#ranking').appendChild(r);
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = (100 * v.n / maxVus) + '%'; }));
  });
  const thy = el('tr'); thy.appendChild(el('th', null, 'Films vus')); YEARS.forEach((y) => thy.appendChild(el('th', 'n', String(y.annee)))); thy.appendChild(el('th', 'n', 'Total'));
  $('#t-years thead').appendChild(thy);
  VUS.forEach((v) => {
    const tr = el('tr'); tr.appendChild(el('td', null, v.p));
    YEARS.forEach((y) => { const n = v.parAn[y.annee]; const best = Math.max(...VUS.map((w) => w.parAn[y.annee])); tr.appendChild(el('td', n === best && n > 0 ? 'n hi' : n ? 'n' : 'n mu', n ? String(n) : '–')); });
    tr.appendChild(el('td', 'n tot', String(v.n))); $('#t-years tbody').appendChild(tr);
  });
  const trT = el('tr'); trT.appendChild(el('td', 'mu', 'Films de l’année')); YEARS.forEach((y) => trT.appendChild(el('td', 'n mu', String(y.films)))); trT.appendChild(el('td', 'n mu', String(F.length)));
  $('#t-years tbody').appendChild(trT);

  // ---------- Portraits ----------
  PEOPLE.forEach((x) => {
    const c = el('div', 'person'); c.style.setProperty('--pc', col(x.p));
    c.appendChild(el('h3', null, x.p));
    const dl = el('dl');
    [['Films notés', x.n], ['Moyenne', f2(x.moyenne)], ['8 ou plus', Math.round(x.pct8 * 100) + ' %'], ['Nombre de 10', x.dix], ['Note fétiche', x.fav],
      ['Écart aux autres', (x.vs > 0 ? '+' : '') + f2(x.vs)]].forEach(([k, v]) => dl.append(el('dt', null, k), el('dd', null, String(v))));
    c.appendChild(dl);
    c.appendChild(el('div', 'tag', x.vs >= 0.15 ? 'Plutôt généreux·se' : x.vs <= -0.15 ? 'Plutôt sévère' : 'Dans la moyenne de la famille'));
    const h = el('div', 'heart'); h.append('♥ ', el('b', null, x.best.titre), ` (${x.best.annee}) — ${x.best.notes[x.i]}/10`); c.appendChild(h);
    $('#people').appendChild(c);
  });

  // ---------- Graphiques ----------
  const tipFor = (box) => { const t = el('div', 'tip'); t.hidden = true; box.appendChild(t); return t; };
  const showTip = (box, tip, ev, lines) => {
    tip.replaceChildren(...lines.map((l) => el('div', null, l))); tip.hidden = false;
    const r = box.getBoundingClientRect(); let x = ev.clientX - r.left + 12;
    if (x + tip.offsetWidth > r.width) x = ev.clientX - r.left - tip.offsetWidth - 12;
    tip.style.left = Math.max(0, x) + 'px'; tip.style.top = (ev.clientY - r.top + 12) + 'px';
  };

  function drawFilms() {
    const box = $('#ch-films'); box.replaceChildren();
    const w = box.clientWidth || 500, h = 230, m = {t: 22, b: 24};
    const x = d3.scaleBand(YEARS.map((r) => r.annee), [0, w]).padding(0.25), y = d3.scaleLinear([0, d3.max(YEARS, (r) => r.films)], [h - m.b, m.t]);
    const svg = d3.select(box).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('width', '100%').attr('role', 'img').attr('aria-label', 'Films notés par année');
    svg.selectAll('rect.b').data(YEARS).join('rect').attr('class', 'b').attr('x', (r) => x(r.annee)).attr('width', x.bandwidth()).attr('y', (r) => y(r.films)).attr('height', (r) => y(0) - y(r.films)).attr('rx', 4).style('fill', 'var(--red)');
    svg.selectAll('text.v').data(YEARS).join('text').attr('class', 'v').attr('x', (r) => x(r.annee) + x.bandwidth() / 2).attr('y', (r) => y(r.films) - 6).attr('text-anchor', 'middle').style('fill', 'var(--fg)').text((r) => r.films);
    svg.append('g').attr('transform', `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickSize(0).tickPadding(8)).call((g) => g.select('.domain').remove());
    const tip = tipFor(box);
    svg.selectAll('rect.h').data(YEARS).join('rect').attr('class', 'h').attr('x', (r) => x(r.annee)).attr('width', x.bandwidth()).attr('y', 0).attr('height', h - m.b).style('fill', 'transparent')
      .on('pointermove', (ev, r) => showTip(box, tip, ev, [String(r.annee), r.films + ' films', ...P.filter((p) => r['n_' + p]).map((p) => p + ' : ' + r['n_' + p])])).on('pointerleave', () => { tip.hidden = true; });
  }

  function drawAvg() {
    const box = $('#ch-avg'); box.replaceChildren();
    const lg = el('div', 'legend'); P.forEach((p) => { const s = el('span'); const d = el('i'); d.style.background = col(p); s.append(d, p); lg.appendChild(s); }); box.appendChild(lg);
    const w = box.clientWidth || 500, h = 240, m = {t: 10, r: 52, b: 24, l: 30};
    const vals = YEARS.flatMap((r) => P.map((p) => r[p])).filter((v) => v !== null);
    const x = d3.scalePoint(YEARS.map((r) => r.annee), [m.l, w - m.r]).padding(0.3), y = d3.scaleLinear([Math.floor(d3.min(vals)), Math.ceil(d3.max(vals))], [h - m.b, m.t]);
    const svg = d3.select(box).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('width', '100%').attr('role', 'img').attr('aria-label', 'Moyenne de chacun par année');
    svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(4)).join('line').attr('x1', m.l).attr('x2', w - m.r).attr('y1', y).attr('y2', y);
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(6)).call((g) => g.select('.domain').remove());
    svg.append('g').attr('transform', `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickSize(0).tickPadding(8)).call((g) => g.select('.domain').remove());
    const tip = tipFor(box), ends = [];
    P.forEach((p) => {
      const pts = YEARS.filter((r) => r[p] !== null); if (!pts.length) return;
      svg.append('path').datum(YEARS).attr('d', d3.line().defined((r) => r[p] !== null).x((r) => x(r.annee)).y((r) => y(r[p]))).style('fill', 'none').style('stroke', col(p)).style('stroke-width', 2.2);
      svg.append('g').selectAll('circle').data(pts).join('circle').attr('cx', (r) => x(r.annee)).attr('cy', (r) => y(r[p])).attr('r', 4).style('fill', col(p))
        .on('pointermove', (ev, r) => showTip(box, tip, ev, [p + ' — ' + r.annee, 'Moyenne : ' + f2(r[p]), r['n_' + p] + ' films notés'])).on('pointerleave', () => { tip.hidden = true; });
      const last = pts[pts.length - 1]; ends.push({p, x: x(last.annee), y: y(last[p])});
    });
    ends.sort((a, b) => a.y - b.y); for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 13) ends[k].y = ends[k - 1].y + 13;
    svg.append('g').selectAll('text').data(ends).join('text').attr('x', (e) => e.x + 8).attr('y', (e) => e.y + 4).text((e) => e.p).style('fill', (e) => col(e.p));
  }

  function drawDist() {
    const wrap = $('#ch-dist'); wrap.replaceChildren();
    const maxPart = d3.max(PEOPLE, (x) => d3.max(x.counts) / x.n);
    const boxes = PEOPLE.map((x) => { const box = el('div', 'box'); box.append(el('b', null, x.p), el('span', null, 'Note fétiche : ' + x.fav)); wrap.appendChild(box); return box; });
    PEOPLE.forEach((x, k) => {
      const box = boxes[k];
      const w = Math.max(130, box.clientWidth - 24), h = 96, mb = 16;
      const sx = d3.scaleBand(d3.range(1, 11), [0, w]).padding(0.15), sy = d3.scaleLinear([0, maxPart], [h - mb, 4]);
      const rows = x.counts.map((c, k) => ({note: k + 1, c, part: c / x.n}));
      const svg = d3.select(box).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('width', '100%').attr('role', 'img').attr('aria-label', 'Répartition des notes de ' + x.p);
      svg.selectAll('rect.b').data(rows).join('rect').attr('class', 'b').attr('x', (r) => sx(r.note)).attr('width', sx.bandwidth()).attr('y', (r) => sy(r.part)).attr('height', (r) => sy(0) - sy(r.part)).attr('rx', 2).style('fill', col(x.p));
      svg.append('g').attr('transform', `translate(0,${h - mb})`).call(d3.axisBottom(sx).tickSize(0).tickPadding(4)).call((g) => g.select('.domain').remove()).selectAll('text').style('fill', 'var(--muted)').style('font-size', '10px');
      const tip = tipFor(box);
      svg.selectAll('rect.h').data(rows).join('rect').attr('class', 'h').attr('x', (r) => sx(r.note)).attr('width', sx.bandwidth()).attr('y', 0).attr('height', h).style('fill', 'transparent')
        .on('pointermove', (ev, r) => showTip(box, tip, ev, [x.p + ' — note ' + r.note, r.c + ' fois (' + Math.round(r.part * 100) + ' %)'])).on('pointerleave', () => { tip.hidden = true; });
    });
  }

  function drawPairs() {
    const box = $('#ch-pairs'); box.replaceChildren();
    const w = Math.min(box.clientWidth || 380, 440), lab = 50, cell = (w - lab) / 5, h = lab + cell * 5;
    const svg = d3.select(box).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('width', '100%').style('max-width', w + 'px').attr('role', 'img').attr('aria-label', 'Écart moyen entre chaque duo');
    const op = d3.scaleLinear(d3.extent(PAIRS, (r) => r.ecart), [0.95, 0.15]);
    P.forEach((p, i) => {
      svg.append('text').attr('x', lab + cell * i + cell / 2).attr('y', lab - 10).attr('text-anchor', 'middle').text(p).style('fill', col(p));
      svg.append('text').attr('x', lab - 6).attr('y', lab + cell * i + cell / 2 + 4).attr('text-anchor', 'end').text(p).style('fill', col(p));
      svg.append('rect').attr('x', lab + cell * i + 2).attr('y', lab + cell * i + 2).attr('width', cell - 4).attr('height', cell - 4).attr('rx', 6).style('fill', 'var(--panel)');
    });
    const tip = tipFor(box);
    PAIRS.forEach((r) => [[r.i, r.j], [r.j, r.i]].forEach(([a, b]) => {
      const g = svg.append('g');
      g.append('rect').attr('x', lab + cell * a + 2).attr('y', lab + cell * b + 2).attr('width', cell - 4).attr('height', cell - 4).attr('rx', 6).style('fill', 'var(--gold)').style('fill-opacity', op(r.ecart));
      g.append('text').attr('x', lab + cell * a + cell / 2).attr('y', lab + cell * b + cell / 2 + 4).attr('text-anchor', 'middle').text(f1(r.ecart)).style('fill', op(r.ecart) > 0.55 ? '#1a1013' : 'var(--fg)').style('font-weight', 600);
      g.on('pointermove', (ev) => showTip(box, tip, ev, [r.a + ' & ' + r.b, 'Écart moyen : ' + f2(r.ecart), r.n + ' films en commun', 'Même note : ' + Math.round(r.same * 100) + ' %'])).on('pointerleave', () => { tip.hidden = true; });
    }));
  }

  const drawAll = () => { drawFilms(); drawAvg(); drawDist(); drawPairs(); };
  drawAll();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawAll, 150); });

  // ---------- Suggestions ----------
  P.forEach((p, i) => {
    const cand = F.filter((f) => f.notes[i] === null && f.endormi !== p && f.moyenne >= 7)
      .sort((a, b) => (b.nb >= 2) - (a.nb >= 2) || r1(b.moyenne) - r1(a.moyenne) || departage(a, b)).slice(0, 3);
    const card = el('div', 'sg'); card.style.setProperty('--pc', col(p));
    const h = el('h3', null, p); h.appendChild(el('small', null, 'À voir absolument')); card.appendChild(h);
    if (!cand.length) { card.appendChild(el('p', 'empty', 'Rien à rattraper : ' + p + ' a tout vu !')); }
    const ul = el('ul');
    cand.forEach((f) => {
      const li = el('li'); const th = el('div', 'thumb'); poserAffiche(th, f.titre, f.annee);
      const tx = el('div'); tx.append(el('div', 't', f.titre + ' (' + f.annee + ')'));
      const m = el('div', 'm'); m.append(el('b', null, f1(f.moyenne)), ' · ' + f.notes.map((x, k) => x === null ? null : P[k] + ' ' + x).filter(Boolean).join(', '));
      tx.appendChild(m); li.append(th, tx); ul.appendChild(li);
    });
    card.appendChild(ul); $('#sugg').appendChild(card);
  });

  // ---------- Tableaux ----------
  const cls = (v) => v === null ? 'n mu' : v >= 9 ? 'n hi' : v <= 4 ? 'n lo' : 'n';
  const row = (cells) => { const tr = el('tr'); cells.forEach(([t, c]) => tr.appendChild(el('td', c, String(t)))); return tr; };
  PAIRS.forEach((r) => $('#t-pairs tbody').appendChild(row([[r.a + ' & ' + r.b], [r.n, 'n'], [f2(r.ecart), 'n'], [Math.round(r.same * 100) + ' %', 'n']])));
  F.filter((f) => f.nb === 5).sort((a, b) => b.moyenne - a.moyenne).forEach((f) =>
    $('#t-all5 tbody').appendChild(row([[f.titre], [f.annee], ...f.notes.map((x) => [x, cls(x)]), [f1(f.moyenne), 'n']])));
  F.filter((f) => f.nb === 1 && f.notes[2] !== null).forEach((f) => $('#t-solo tbody').appendChild(row([[f.titre], [f.annee], [f.notes[2], cls(f.notes[2])]])));

  const ys = Array.from(new Set(F.map((f) => f.annee))).sort().reverse();
  ys.forEach((y) => $('#f-year').appendChild(new Option(y, y)));
  function drawCarnet() {
    const tb = $('#t-all tbody'); tb.replaceChildren();
    const y = $('#f-year').value, q = $('#f-q').value.trim().toLowerCase();
    F.filter((f) => (!y || String(f.annee) === y) && (!q || f.titre.toLowerCase().includes(q))).forEach((f) =>
      tb.appendChild(row([[f.annee], [f.titre], ...f.notes.map((x, i) => (x === null && f.endormi === P[i]) ? ['💤', 'n mu'] : [x === null ? '–' : x, cls(x)]), [f1(f.moyenne), 'n']])));
  }
  $('#f-year').addEventListener('change', drawCarnet);
  $('#f-q').addEventListener('input', drawCarnet);
  drawCarnet();
})();

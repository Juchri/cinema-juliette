// Affiches via l'API publique de Wikipédia (sans clé). Le navigateur du visiteur fait la requête.
// INDICES : recherche plus précise pour certains films ("titre|année" -> [langue, recherche]).
// Pour corriger une affiche, ajoutez ou modifiez une ligne ici.
window.INDICES = {
  "L’innocent|2022": ["fr", "L'Innocent film Louis Garrel 2022"],
  "Des rayons et des ombres|2026": ["fr", "Des rayons et des ombres film Giannoli"],
  "Je verrai toujours vos visages|2023": ["en", "All Your Faces 2023 film"],
  "Conte de Montecristo|2024": ["en", "The Count of Monte Cristo 2024 film"],
  "D’artagnan|2023": ["en", "The Three Musketeers: D'Artagnan"],
  "Parasite|2019": ["en", "Parasite 2019 film Bong Joon-ho"],
  "Dossier 137|2025": ["en", "Case 137 Dominik Moll film"],
  "La venus électrique|2026": ["fr", "La Vénus électrique film"],
  "L’histoire de souleymane|2024": ["en", "Souleymane's Story film"],
  "Tatami|2024": ["en", "Tatami 2023 film"],
  "En corps|2022": ["en", "Rise 2022 film Klapisch En corps"],
  "La tresse|2024": ["en", "The Braid Laetitia Colombani film"],
  "Anatomie d’une chute|2023": ["en", "Anatomy of a Fall"],
  "Avatar 2|2023": ["en", "Avatar: The Way of Water"],
  "Un ours dans le Jura|2025": ["fr", "Un ours dans le Jura film Franck Dubosc"],
  "Vingt Dieux|2024": ["en", "Holy Cow 2024 French film Vingt Dieux"],
  "Pauvres créatures|2024": ["en", "Poor Things film"],
  "Barbie|2023": ["en", "Barbie 2023 film"],
  "The Batman|2022": ["en", "The Batman film 2022"],
  "Douleur et gloire|2019": ["en", "Pain and Glory film"],
  "Anora|2024": ["en", "Anora film Sean Baker"],
  "The substance|2024": ["en", "The Substance 2024 film"],
  "Corsage|2022": ["en", "Corsage 2022 film Kreutzer"],
  "F1|2025": ["en", "F1 2025 film Brad Pitt"],
  "Babylon|2022": ["en", "Babylon 2022 film Chazelle"],
  "Marty Suprême|2026": ["en", "Marty Supreme film"],
  "Les 3 mousquetaires|2024": ["en", "The Three Musketeers: Milady"],
  "Les fantômes|2024": ["en", "Ghost Trail 2024 film Les Fantômes"]
};

(function () {
  const CACHE = 'affiches-v1';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE) || '{}'); } catch (e) { cache = {}; }
  const save = () => { try { localStorage.setItem(CACHE, JSON.stringify(cache)); } catch (e) { /* stockage indisponible */ } };

  async function search(lang, q) {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
      `&generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(q)}` +
      `&prop=pageimages&piprop=thumbnail&pithumbsize=500&pilicense=any`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const pages = Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index);
    const hit = pages.find((p) => p.thumbnail && p.thumbnail.source);
    return hit ? hit.thumbnail.source : null;
  }

  window.affiche = async function (titre, annee) {
    const key = titre + '|' + annee;
    if (key in cache) return cache[key];
    const tries = [];
    if (INDICES[key]) tries.push(INDICES[key]);
    tries.push(['en', `${titre} ${annee} film`], ['fr', `${titre} film ${annee}`]);
    let src = null;
    for (const [lang, q] of tries) {
      try { src = await search(lang, q); } catch (e) { src = null; }
      if (src) break;
    }
    if (src) { cache[key] = src; save(); }
    return src;
  };

  window.poserAffiche = function (box, titre, annee) {
    affiche(titre, annee).then((src) => {
      if (!src) return;
      const img = new Image();
      img.alt = 'Affiche : ' + titre;
      img.loading = 'lazy';
      img.onload = () => { img.classList.add('ok'); box.classList.add('has-img'); };
      img.src = src;
      box.appendChild(img);
    });
  };
})();

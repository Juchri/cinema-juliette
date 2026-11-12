# Le ciné en famille · 2019 → 2026

Le carnet de notes cinéma de Pilou, Zabou, Juju, Popo et Coco, en site web : podiums avec affiches, portraits, affinités, et tout le carnet.

- `data/films.json` : les notes (ordre des colonnes : Pilou, Zabou, Juju, Popo, Coco ; `null` = pas de note).
- `posters.js` : les affiches viennent de l’API publique de Wikipédia, sans clé. Pour corriger une affiche, ajoutez une ligne dans `INDICES`.
- Site statique : il suffit d’activer GitHub Pages (Settings → Pages → branche `main`, dossier `/`).

Pour ajouter un film, ajoutez une entrée dans `data/films.json` :

```json
{"id":310,"annee":2026,"titre":"Mon film","notes":[8,7,null,null,null],"endormi":null}
```

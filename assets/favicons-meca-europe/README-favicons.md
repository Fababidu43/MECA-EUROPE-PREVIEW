# Favicons MECA-EUROPE — version finale retouchée

## Ce qui a été peaufiné par rapport à la première version

1. **Deux variantes adaptées à la taille** : en dessous de 48px, les 3 petites étoiles et l'ombre portée devenaient une bouillie de pixels illisible. J'ai donc créé :
   - une version **simplifiée** (M plus grand, contour plus épais, sans étoiles) pour le `favicon-16x16.png`, `favicon-32x32.png` et les petites tailles du `.ico`
   - la version **complète** (M + 3 étoiles + ombre) pour toutes les tailles à partir de 48px, où les détails restent lisibles
2. **Correction du fichier `.ico`** : dans la première version, il était généré à partir d'une image déjà réduite à 16px puis ré-agrandie, ce qui le rendait flou. Il est maintenant construit à partir de trois images sources nettes (une par taille), donc chaque résolution (16/32/48px) est parfaitement nette.
3. **Léger renforcement de la netteté** (unsharp mask) sur les tailles 16 et 32px pour compenser la perte de détail inhérente à la réduction d'image.

## Fichiers fournis

- `favicon.ico` → racine du site (16/32/48px, nets et corrects cette fois)
- `favicon-16x16.png`, `favicon-32x32.png` → version simplifiée, sans étoiles
- `favicon-48x48.png` à `favicon-512x512.png` → version complète avec étoiles
- `android-chrome-192x192.png`, `android-chrome-512x512.png` → Android / PWA
- `apple-touch-icon.png` (180x180, fond blanc) → icône iPhone/iPad
- `favicon-120x120.png`, `favicon-152x152.png`, `favicon-167x167.png` → anciens formats Apple
- `mstile-150x150.png` (fond blanc) → tuile Windows
- `site.webmanifest` → config PWA
- `browserconfig.xml` → config tuile Windows

## Où les mettre

Dépose tous ces fichiers à la racine de ton site (là où se trouve `index.html`) :
```
https://tonsite.fr/favicon.ico
https://tonsite.fr/site.webmanifest
...
```

## Code à coller dans le `<head>` de ton HTML

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">

<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#18789A">
<meta name="msapplication-TileColor" content="#18789A">
<meta name="msapplication-config" content="/browserconfig.xml">
```

Pense à vider le cache de ton navigateur (ou ouvrir le site en navigation privée) après la mise en ligne : les favicons sont mis en cache très longtemps.

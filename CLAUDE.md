# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Build production site to ./dist/
npm run preview   # Preview production build locally
```

Requires Node.js ≥ 22.12.0.

## Architecture

Static informational site for The Booth House (Frank Lloyd Wright, 1915, Glencoe IL), built with **Astro 6** and **GLightbox** for the photo gallery lightbox.

Single-page site: `src/pages/index.astro` composes all sections via components in `src/components/`. The layout wrapper (`src/layouts/Layout.astro`) handles HTML structure, meta tags, and font loading (Cormorant Garamond + Inter via Google Fonts).

**Components** map directly to page sections: `Nav`, `Hero`, `History`, `OriginalOwners`, `Gallery`, `LegoModel`, `FloorPlans`, `Timeline`, `RavineBluffs`.

**Design tokens** live in `src/styles/global.css` — earthy color palette (`#FAF8F4` bg, `#B5824A` accent), spacing scale, max-width 1100px, mobile breakpoint at 768px.

**Static assets** are organized under `public/images/` by section (hero, gallery, floor-plans, lego, owners, ravine). A `content-inbox/` directory at the project root is used as a staging area for new assets before they're moved into `public/`.

GLightbox is loaded via CDN (not npm) in the layout.

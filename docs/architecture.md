# Architecture

The portfolio is one static page with six chapters. React owns navigation,
accessible controls and readable content; Three.js renders the visual scenes.

## Page and content

`app/page.tsx` defines the chapter sections and work dialog. Native scrolling
updates a progress ref; the scene reads that ref without sending every animation
frame through React state. A separate controls ref carries the current figure,
watch, experience tab, animation state and scene interactions.

`app/journey.ts` is the source for internship records. Both the work dialog and
3D monitor use its exported order. `app/collection.json` pairs display names with
the exported figure node identifiers.

The dialog and tabs use Base UI primitives through `components/ui`. Keep keyboard
navigation, focus management and Escape dismissal when changing the work reader.
The résumé remains available at `/cheah-tze-juen-resume.pdf`.

## Scene lifecycle

`app/DayScene.tsx` dynamically imports Three.js and its GLTF and Draco loaders,
creates the renderer, loads the exported models, and places them into chapter
worlds. It manages camera transitions, lighting, model selection, resize handling
and disposal. The collection's figure and watch models share a chapter.

Models and fallback renders live under `/models/`. Model node names form an
interface with the animation and selection code: preserve them when replacing
an export. Watch display scale is based on the case diameter so the Laco and
Seiko dials remain comparable in size to the Omega.

`app/sports-motion.ts` contains deterministic squash and stadium updates. The
scene calls them with elapsed time and entry progress. Tests exercise their
movement bounds and continuity using Three.js objects without a browser.

The page supports reduced motion and a pause control. If a model or WebGL setup
fails, a fallback render and retry control keep the page usable. The renderer,
loaded resources and event listeners are released when the scene unmounts.

## Audio

`app/crowd-audio.ts` owns the locally served trumpet arrangement. Explicit stadium
entry requests playback; the page controls muting and stops playback when the
stadium is no longer active or the page is hidden. Browser playback rejection is
handled by the existing sound control. No YouTube player is embedded.

## Build

Vinext supplies the Next-compatible routing and image interfaces used by the app.
`next.config.ts` selects static export. Vite and Tailwind handle bundling and CSS.
The deployable output is `dist/client`; build caches and output are gitignored.
GitHub Actions publishes this artifact rather than exposing generated files as
the repository's source tree.

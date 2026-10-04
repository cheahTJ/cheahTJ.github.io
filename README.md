# Cheah Tze Juen — Portfolio

[Visit the portfolio](https://cheahtj.github.io/)

An interactive portfolio that moves through a day: a coding desk, alpine trails,
a squash court, Tottenham's stadium, a collection of figures and watches, and
contact details. The work reader presents five internships and a personal project.

Built with **React, TypeScript, Three.js, Vinext and Tailwind CSS**. The site is
statically exported and deployed to GitHub Pages; it needs no backend, database,
API keys or environment variables.

## Run locally

Use Node.js **22.13 or newer** and npm. CI uses Node.js 22.

```sh
npm ci
npm run dev
```

Open the local URL printed by the dev server. To preview the production build:

```sh
npm run build
npm start
```

## Project structure

```text
app/
  page.tsx               Page, chapter navigation and work reader
  DayScene.tsx           Three.js renderer and scene lifecycle
  journey.ts             Internship descriptions and display order
  collection.json        Figure names and model identifiers
  sports-motion.ts       Squash and stadium animation
  crowd-audio.ts         Stadium trumpet playback and cleanup
  layout.tsx             Document metadata
  globals.css            Shared styles and responsive layouts
components/ui/           Shared button, dialog and tab primitives
lib/utils.ts             Class-name utility
public/
  models/                Six GLB scenes, fallback renders and terrain credits
  images/                Portrait
  audio/                 Finished trumpet arrangement and credits
  fonts/                 Locally served Manrope fonts and license
  draco/                 GLB decoder and license
  cheah-tze-juen-resume.pdf
scripts/                 Optional audio authoring utility
tests/                  Motion and audio lifecycle tests
docs/                   Architecture, asset and deployment notes
.github/workflows/       Validation and GitHub Pages deployment
```

## Checks

```sh
npm run check      # Formatting, TypeScript, lint and tests
npm run build      # Static export to dist/client
npm run format    # Apply formatting when editing
```

Tests cover squash rally continuity, two full football teams and in-bounds motion,
and trumpet playback, muting and resource cleanup. Visual verification is still
needed for model, layout or animation changes.

## Where to make changes

- **Work experience:** edit `app/journey.ts`. Its order is shared by the work reader
  and the 3D desk monitor. Keep claims grounded in actual experience.
- **Page copy and interactions:** edit `app/page.tsx`.
- **Figure names:** edit `app/collection.json`; identifiers must match GLB node names.
- **Models and camera behavior:** start with `app/DayScene.tsx` and
  [the architecture notes](docs/architecture.md).
- **Styles:** edit `app/globals.css` and check both desktop and phone layouts.

## Deployment and assets

Pushes to `main` run validation, create a fresh build, and publish `dist/client`
through GitHub Actions. Pull requests run validation without deploying.
**Generated HTML and JavaScript are not committed.** See
[deployment instructions](docs/deployment.md).

Only the exported assets used by the current site are included. Earlier scene
experiments and full Blender authoring projects are kept separately from this
repository. See [asset notes and credits](docs/assets.md).

Dependencies and bundled third-party assets retain their respective licenses.
No license is granted here for reuse of personal photographs, résumé content or
character likenesses.

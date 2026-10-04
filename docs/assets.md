# Assets and authoring

The repository contains the six scene exports required to run the current site:

| Export               | Scene                              |
| -------------------- | ---------------------------------- |
| `morning-desk`       | Coding desk and experience monitor |
| `banff-cinema`       | Moraine Lake alpine landscape      |
| `squash-court`       | Court, players and ball            |
| `spurs`              | Tottenham stadium                  |
| `collection-figures` | Selected figure collection         |
| `watch-studies`      | Omega, Laco and Seiko watches      |

Each GLB has a PNG fallback in `public/models`. The assets are authored in Blender
and exported to glTF. Full editable Blender projects, terrain caches and older
experiments are maintained in a separate local authoring archive. They are not
required to install, build or run this repository.

When replacing a model, preserve the node identifiers expected by
`app/DayScene.tsx` and `app/sports-motion.ts`. Check the replacement in the actual
page at desktop and phone sizes, including the fallback state. The figure display
names are maintained in `app/collection.json`.

## Credits

- Terrain, satellite imagery and rock material: see
  [`public/models/terrain-credits.txt`](../public/models/terrain-credits.txt).
- Trumpet arrangement and sample terms: see
  [`public/audio/CREDITS.txt`](../public/audio/CREDITS.txt). The site distributes
  the finished instrumental arrangement, not raw instrument samples.
- Manrope font license: [`public/fonts/OFL.txt`](../public/fonts/OFL.txt).
- Draco decoder license: [`public/draco/LICENSE.txt`](../public/draco/LICENSE.txt).

`scripts/render-trumpet.py` is an optional authoring utility, separate from the npm
build. It requires Python, NumPy, macOS `afconvert`, and a locally supplied
Philharmonia `Brass.zip` sample archive. Run it from the repository root with:

```sh
python3 scripts/render-trumpet.py /path/to/Brass.zip
```

Original sample archives are not included or redistributed. The existing finished
WAV is bundled, so visitors and contributors do not need the authoring tools.

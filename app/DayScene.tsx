'use client';

import collectionNames from './collection.json';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import Image from 'next/image';
import type * as Three from 'three';
import { createSquashMotion, createStadiumLife } from './sports-motion';
import { journey } from './journey';

type Controls = {
  playing: boolean;
  figure: number;
  watch: number;
  bracelet: boolean;
  courtside: boolean;
  roof: boolean;
  work: boolean;
  selected: number;
};
type Props = {
  progress: RefObject<number>;
  controls: RefObject<Controls>;
  onOpenWork: () => void;
};
const assets = [
  'morning-desk',
  'banff-cinema',
  'squash-court',
  'spurs',
  'collection-figures',
  'watch-studies',
];
const fallback = [
  'morning-desk',
  'banff-cinema',
  'squash-court',
  'spurs',
  'collection-figures',
  'collection-figures',
];
const companyNames = journey.map(({ company }) => company);

export default function DayScene({ progress, controls, onOpenWork }: Props) {
  const host = useRef<HTMLDivElement>(null),
    open = useRef(onOpenWork);
  useLayoutEffect(() => {
    open.current = onOpenWork;
  }, [onOpenWork]);
  const [loaded, setLoaded] = useState<boolean[]>(Array(5).fill(false));
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false,
      frame = 0,
      cleanup = () => {};

    const init = async () => {
      try {
        const [T, { GLTFLoader }, { RoomEnvironment }, { DRACOLoader }] =
          await Promise.all([
            import('three'),
            import('three/addons/loaders/GLTFLoader.js'),
            import('three/addons/environments/RoomEnvironment.js'),
            import('three/addons/loaders/DRACOLoader.js'),
          ]);
        if (disposed || !host.current) return;
        setFailed(false);
        setLoaded(Array(5).fill(false));
        const el = host.current;
        const renderer = new T.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFShadowMap;
        el.appendChild(renderer.domElement);
        renderer.domElement.setAttribute(
          'aria-label',
          'A day with Tze Juen: a coding desk, alpine trail, squash rally, Tottenham stadium, and model collections.',
        );
        renderer.domElement.setAttribute('role', 'img');
        const scene = new T.Scene(),
          camera = new T.PerspectiveCamera(34, 1, 0.1, 260);
        const worlds = Array.from({ length: 5 }, () => new T.Group());
        worlds.forEach((w) => scene.add(w));
        const room = new RoomEnvironment(),
          pmrem = new T.PMREMGenerator(renderer),
          env = pmrem.fromScene(room, 0.04);
        room.dispose();
        scene.environment = env.texture;
        scene.environmentIntensity = 0.6;
        const hemi = new T.HemisphereLight(0xc9dfff, 0x253648, 1.2);
        scene.add(hemi);
        const sun = new T.DirectionalLight(0xffebcd, 3.2);
        sun.position.set(-7, 10, 8);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.bias = -0.0003;
        sun.shadow.normalBias = 0.035;
        Object.assign(sun.shadow.camera, {
          left: -19,
          right: 19,
          top: 19,
          bottom: -19,
          near: 0.1,
          far: 100,
        });
        scene.add(sun, sun.target);
        const rim = new T.DirectionalLight(0xaacaff, 1.4);
        rim.position.set(8, 5, -6);
        scene.add(rim);
        // A navy atmospheric backdrop, with a visible sun path and moonlit stars.
        // It is rendered behind geometry and participates in the same scroll dissolve.
        const skyMaterial = new T.ShaderMaterial({
          uniforms: {
            base: { value: new T.Color(0x0c1b32) },
            glow: { value: new T.Color(0xe8a35e) },
            sunPoint: { value: new T.Vector2(0.78, 0.63) },
            strength: { value: 0.7 },
            night: { value: 0 },
            aspect: { value: 1 },
          },
          vertexShader:
            'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.999,1.0);}',
          fragmentShader: `
            varying vec2 vUv;
            uniform vec3 base, glow;
            uniform vec2 sunPoint;
            uniform float strength, night, aspect;
            float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
            void main(){
              vec2 p=(vUv-sunPoint)*vec2(aspect,1.0);
              float d=length(p);
              float halo=exp(-d*d*8.0)*strength;
              float horizon=exp(-pow((vUv.y-sunPoint.y)*5.0,2.0));
              vec3 col=base*(0.60+0.55*vUv.y)+glow*(halo*0.65+horizon*0.085*strength);
              float disk=1.0-smoothstep(0.022,0.0235,d);
              float moonShade=0.62+0.2*hash(floor(p*550.0))+0.18*cos(p.x*300.0)*sin(p.y*400.0);
              col+=mix(glow*3.0,vec3(0.52,0.67,0.83)*moonShade,night)*disk;
              vec2 grid=vUv*vec2(250.0*aspect,250.0);
              float star=step(0.9977,hash(floor(grid)))*(1.0-smoothstep(0.025,0.28,length(fract(grid)-0.5)));
              col+=vec3(0.6,0.75,1.0)*star*night*smoothstep(0.3,0.85,vUv.y);
              gl_FragColor=vec4(col,1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`,
          depthTest: false,
          depthWrite: false,
        });
        const sky = new T.Mesh(new T.PlaneGeometry(2, 2), skyMaterial);
        sky.frustumCulled = false;
        sky.renderOrder = -100;
        scene.add(sky);
        // Soft, tapered shafts emerge from the studio window behind the monitor.
        const shaftMaterial = new T.ShaderMaterial({
          uniforms: { colour: { value: new T.Color(0xffb254) } },
          vertexShader:
            'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
          fragmentShader:
            'varying vec2 vUv; uniform vec3 colour; void main(){float edge=pow(sin(vUv.y*3.14159),1.5);gl_FragColor=vec4(colour,edge*(1.0-vUv.x)*0.28);}',
          transparent: true,
          depthWrite: false,
          side: T.DoubleSide,
          blending: T.AdditiveBlending,
        });
        for (const offset of [0, 1.6]) {
          const geo = new T.BufferGeometry();
          geo.setAttribute(
            'position',
            new T.Float32BufferAttribute(
              [
                -6,
                6 - offset,
                -2.7,
                -6,
                5.3 - offset,
                -2.7,
                7,
                -0.5 - offset,
                -2.6,
                7,
                1.0 - offset,
                -2.6,
              ],
              3,
            ),
          );
          geo.setAttribute(
            'uv',
            new T.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 1, 1], 2),
          );
          geo.setIndex([0, 1, 2, 0, 2, 3]);
          worlds[0].add(new T.Mesh(geo, shaftMaterial));
        }
        const collectionLights = new T.Group();
        worlds[4].add(collectionLights);
        for (const [x, colour] of [
          [-2.1, 0xffd3a1],
          [2.1, 0xc6e0ff],
        ]) {
          const light = new T.SpotLight(colour, 65, 15, 0.42, 0.7, 2);
          light.position.set(x, 5.2, 3.8);
          light.target.position.set(x, 0, 0);
          collectionLights.add(light, light.target);
        }
        // Render both chapters only during the dissolve; stay at one scene render otherwise.
        const targetA = new T.WebGLRenderTarget(1, 1, {
            type: T.HalfFloatType,
          }),
          targetB = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType });
        const composite = new T.Scene(),
          flatCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const blendMaterial = new T.ShaderMaterial({
          uniforms: {
            a: { value: targetA.texture },
            b: { value: targetB.texture },
            blend: { value: 0 },
          },
          vertexShader:
            'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
          fragmentShader:
            'uniform sampler2D a; uniform sampler2D b; uniform float blend; varying vec2 vUv; void main(){vec4 ca=texture2D(a,vUv);vec4 cb=texture2D(b,vUv);gl_FragColor=mix(ca,cb,blend); \n#include <tonemapping_fragment>\n#include <colorspace_fragment> }',
          depthTest: false,
          depthWrite: false,
          toneMapped: true,
        });
        // Shader chunks must start on their own line.
        blendMaterial.fragmentShader = blendMaterial.fragmentShader
          .replace(' #include', '\n#include')
          .replace('> }', '>\n}');
        const quad = new T.Mesh(new T.PlaneGeometry(2, 2), blendMaterial);
        composite.add(quad);
        const loadedModels: Three.Object3D[] = [];
        const keys = new Map<string, { obj: Three.Object3D; y: number }>();
        let screenMesh: Three.Mesh | undefined;
        let animateSquash = (_time: number) => {};
        let animateStadium = (_time: number, _entered: number) => {};
        const figures: Three.Object3D[] = [],
          watches: Three.Object3D[] = [];
        const figureDisplay = new T.Group(),
          watchDisplay = new T.Group();
        worlds[4].add(figureDisplay, watchDisplay);
        const platformMat = new T.MeshStandardMaterial({
          color: 0x29384b,
          roughness: 0.32,
          metalness: 0.55,
        });
        const platforms: Three.Mesh[] = [];
        for (const x of [-2.1, 2.1]) {
          const p = new T.Mesh(
            new T.CylinderGeometry(1.18, 1.24, 0.15, 80),
            platformMat,
          );
          p.position.set(x, -1.22, 0);
          p.receiveShadow = true;
          worlds[4].add(p);
          platforms.push(p);
        }
        const floor = new T.Mesh(
          new T.PlaneGeometry(60, 60),
          new T.MeshStandardMaterial({
            color: 0x07111e,
            roughness: 0.9,
            metalness: 0.02,
            envMapIntensity: 0,
          }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.31;
        floor.receiveShadow = true;
        worlds[4].add(floor);
        const screenCanvas = document.createElement('canvas');
        screenCanvas.width = 1536;
        screenCanvas.height = 864;
        const ctx = screenCanvas.getContext('2d');
        const codeTexture = new T.CanvasTexture(screenCanvas);
        codeTexture.colorSpace = T.SRGBColorSpace;
        codeTexture.flipY = false;
        codeTexture.anisotropy = 4;
        // Imported glTF UVs use top-left texture coordinates.
        let lastText = -1,
          lastSelected = -1,
          lastWork = false;
        const code = (elapsed: number) => {
          if (!ctx) return;
          const count = controls.current.playing
            ? Math.min(11, Math.floor((elapsed % 12) * 3.6))
            : 11;
          if (
            lastText === count &&
            lastSelected === controls.current.selected &&
            lastWork === controls.current.work
          )
            return;
          lastText = count;
          lastSelected = controls.current.selected;
          lastWork = controls.current.work;
          ctx.fillStyle = '#0b1727';
          ctx.fillRect(0, 0, 1536, 864);
          ctx.fillStyle = '#1b2b40';
          ctx.fillRect(0, 0, 1536, 70);
          ['#ec7881', '#d7e3ef', '#70adff', '#8ddbaf'].forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(39 + i * 28, 35, 6, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.font = '24px monospace';
          ctx.fillStyle = '#a5b8d1';
          ctx.fillText('tzejuen.ts', 205, 43);
          if (controls.current.work) {
            ctx.font = 'bold 42px monospace';
            ctx.fillStyle = '#f1f5fb';
            ctx.fillText('My work', 92, 155);
            companyNames.forEach((name, i) => {
              const y = 235 + i * 90;
              ctx.fillStyle =
                i === controls.current.selected ? '#294b70' : '#101e30';
              ctx.fillRect(70, y - 42, 1395, 69);
              ctx.fillStyle =
                i === controls.current.selected ? '#9acaFF' : '#d1dce9';
              ctx.font = '32px monospace';
              ctx.fillText(`0${i + 1}   ${name}`, 100, y);
            });
          } else {
            ctx.font = '30px monospace';
            ctx.fillStyle = '#5a718d';
            ctx.fillText('// A little curiosity goes a long way.', 92, 168);
            const draw = (tokens: [string, string][], y: number) => {
              let x = 130;
              ctx.font = '38px monospace';
              tokens.forEach(([str, c]) => {
                ctx.fillStyle = c;
                ctx.fillText(str, x, y);
                x += ctx.measureText(str).width;
              });
            };
            draw(
              [
                ['const ', '#f1818b'],
                ['hello ', '#f1f4fb'],
                ['= ', '#87baff'],
                ['"' + 'hello world'.slice(0, count) + '"', '#8fd9b2'],
                [';', '#f1f4fb'],
              ],
              285,
            );
            draw(
              [
                ['console', '#84b9ff'],
                ['.', '#f1f4fb'],
                ['log', '#f1818b'],
                ['(hello);', '#f1f4fb'],
              ],
              370,
            );
            ctx.fillStyle = '#32455e';
            ctx.fillRect(75, 438, 1387, 2);
            ctx.font = '24px monospace';
            ctx.fillStyle = '#7d94b3';
            ctx.fillText('TERMINAL', 94, 500);
            ctx.fillStyle = '#88d7ad';
            ctx.font = 'bold 65px monospace';
            ctx.fillText(count === 11 ? 'hello world' : '▋', 94, 615);
            ctx.fillStyle = '#96adcb';
            ctx.font = '24px monospace';
            ctx.fillText('click the screen to explore my work ↗', 94, 773);
          }
          codeTexture.needsUpdate = true;
        };
        const materialTextures: Three.Texture[] = [];
        // Fine PBR micro-detail on architectural metal and leather, without image stand-ins.
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = noiseCanvas.height = 128;
        const nc = noiseCanvas.getContext('2d');
        if (nc) {
          const pixels = nc.createImageData(128, 128);
          let seed = 781;
          for (let i = 0; i < pixels.data.length; i += 4) {
            seed = (seed * 16807) % 2147483647;
            const v = 90 + (seed % 120);
            pixels.data.set([v, v, v, 255], i);
          }
          nc.putImageData(pixels, 0, 0);
        }
        const grain = new T.CanvasTexture(noiseCanvas);
        grain.wrapS = grain.wrapT = T.RepeatWrapping;
        grain.repeat.set(12, 12);
        materialTextures.push(grain);
        const brushedCanvas = document.createElement('canvas');
        brushedCanvas.width = brushedCanvas.height = 256;
        const brush = brushedCanvas.getContext('2d')!;
        for (let x = 0; x < 256; x++) {
          const g = 112 + ((x * 73) % 31);
          brush.fillStyle = `rgb(${g},${g},${g})`;
          brush.fillRect(x, 0, 1, 256);
        }
        const brushed = new T.CanvasTexture(brushedCanvas);
        materialTextures.push(brushed);

        const draco = new DRACOLoader();
        draco.setDecoderPath('/draco/');
        const loader = new GLTFLoader().setDRACOLoader(draco);
        const load = async (index: number) => {
          try {
            const gltf = await loader.loadAsync(
              `/models/${assets[index]}.glb?v=${index === 4 ? 'collection18' : index === 5 ? 'watches20' : index === 2 ? 'sports16' : 'alpine15'}`,
            );
            if (disposed) {
              dispose(gltf.scene);
              return;
            }
            const model = gltf.scene;
            loadedModels.push(model);
            model.traverse((o) => {
              if (o instanceof T.Mesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                for (const m of Array.isArray(o.material)
                  ? o.material
                  : [o.material]) {
                  if (m instanceof T.MeshStandardMaterial) {
                    m.envMapIntensity = 0.7;
                    if (/facade panels|Sapphire|steel|polish/i.test(m.name))
                      m.envMapIntensity = 1.4;
                    if (/leather/i.test(m.name)) {
                      m.bumpMap = grain;
                      m.bumpScale = 0.013;
                    }
                  }
                }
              }
            });
            if (index === 0) {
              worlds[0].add(model);
              screenMesh = model.getObjectByName('MonitorPixels') as Three.Mesh;
              if (screenMesh) {
                screenMesh.material = new T.MeshBasicMaterial({
                  map: codeTexture,
                  toneMapped: false,
                  side: T.DoubleSide,
                });
                screenMesh.castShadow = false;
                screenMesh.receiveShadow = false;
              }
              model.traverse((o) => {
                if (o instanceof T.Mesh && /Window_side_wall/.test(o.name))
                  o.castShadow = false;
                if (
                  o instanceof T.Mesh &&
                  o.material instanceof T.MeshStandardMaterial &&
                  o.material.name === 'Morning plaster'
                )
                  o.material.color.set(0x35465e);
                if (o.name.startsWith('Key_'))
                  keys.set(o.name.toLowerCase().slice(4), {
                    obj: o,
                    y: o.position.y,
                  });
              });
            } else if (index === 1) {
              worlds[1].add(model);
              model.traverse((o) => {
                if (o instanceof T.Mesh) {
                  o.castShadow = false;
                  o.receiveShadow = false;
                  // Preserve the elevation model's slope-aware rock, scree and snow colours.
                  if (o.material instanceof T.MeshStandardMaterial) {
                    o.material.envMapIntensity = 0.18;
                    o.material.roughness = 0.94;
                    if (
                      o.geometry.getAttribute('uv') &&
                      !o.material.normalMap
                    ) {
                      o.material.bumpMap = grain;
                      o.material.bumpScale = 0.055;
                    }
                  }
                  if (
                    o.name.includes('water') &&
                    o.material instanceof T.MeshStandardMaterial
                  ) {
                    o.material.transparent = false;
                    o.material.opacity = 1;
                    o.material.depthWrite = true;
                    o.material.color.set(0x328f9e);
                    o.material.roughness = 0.25;
                    o.material.metalness = 0.3;
                    o.material.envMapIntensity = 0.75;
                    o.material.bumpMap = grain;
                    o.material.bumpScale = 0.009;
                    const pos = o.geometry.getAttribute('position');
                    const uv = new Float32Array(pos.count * 2);
                    for (let j = 0; j < pos.count; j++) {
                      uv[j * 2] = pos.getX(j) * 0.025;
                      uv[j * 2 + 1] = pos.getZ(j) * 0.025;
                    }
                    o.geometry.setAttribute('uv', new T.BufferAttribute(uv, 2));
                  }
                }
              });
            } else if (index === 2) {
              worlds[2].add(model);
              animateSquash = createSquashMotion(T, model);
              model.traverse((o) => {
                if (o instanceof T.Mesh) {
                  const mats = Array.isArray(o.material)
                    ? o.material
                    : [o.material];
                  if (mats.some((m) => /Maple board/.test(m.name))) {
                    o.castShadow = false;
                    o.receiveShadow = false;
                  }
                  for (const m of mats) {
                    if (/Court architectural glass/.test(m.name)) {
                      m.transparent = true;
                      m.opacity = 0.09;
                      m.depthWrite = false;
                      o.castShadow = false;
                    }
                  }
                }
              });
              const shadow = new T.Mesh(
                new T.PlaneGeometry(6.4, 9.75),
                new T.ShadowMaterial({ opacity: 0.22, depthWrite: false }),
              );
              shadow.rotation.x = -Math.PI / 2;
              shadow.position.y = 0.057;
              shadow.receiveShadow = true;
              worlds[2].add(shadow);
            } else if (index === 3) {
              worlds[3].add(model);
              const oldBall = model.getObjectByName('Football');
              if (oldBall) oldBall.visible = false;
              animateStadium = createStadiumLife(T, worlds[3]);
              model.traverse((o) => {
                if (o instanceof T.Mesh) {
                  for (const m of Array.isArray(o.material)
                    ? o.material
                    : [o.material]) {
                    if (
                      m instanceof T.MeshStandardMaterial &&
                      /facade panels/i.test(m.name)
                    ) {
                      m.bumpMap = grain;
                      m.bumpScale = 0.017;
                      m.roughness = 0.36;
                    }
                    if (
                      m instanceof T.MeshStandardMaterial &&
                      /Ryegrass|Mown ryegrass/.test(m.name)
                    ) {
                      m.bumpMap = grain;
                      m.bumpScale = 0.018;
                    }
                  }
                }
              });
            } else {
              const names =
                index === 4
                  ? Array.from(
                      { length: collectionNames.length },
                      (_, i) => `Figure_${i}`,
                    )
                  : ['Omega', 'Laco', 'Seiko'];
              let watchCaseDiameter = 0;
              names.forEach((name) => {
                const object = model.getObjectByName(name);
                if (!object) return;
                object.removeFromParent();
                object.position.set(0, 0, 0);
                object.rotation.set(0, 0, 0);
                object.updateMatrixWorld(true);
                const bounds = new T.Box3().setFromObject(object),
                  center = bounds.getCenter(new T.Vector3()),
                  size = bounds.getSize(new T.Vector3());
                const wrap = new T.Group();
                wrap.add(object);
                object.position.sub(center);
                if (index === 4) {
                  wrap.scale.setScalar(2.5 / size.y);
                } else {
                  let caseObject: Three.Object3D | undefined;
                  object.traverse((part) => {
                    if (
                      /^(Case[_ ]body|Main[_ ]case[_ ]band)([._]?\d+)?$/.test(
                        part.name,
                      )
                    )
                      caseObject = part;
                  });
                  const caseHeight = caseObject
                    ? new T.Box3()
                        .setFromObject(caseObject)
                        .getSize(new T.Vector3()).y
                    : size.y;
                  if (name === 'Omega')
                    watchCaseDiameter = (caseHeight * 2.8) / size.y;
                  // Use equal case diameters so long straps do not shrink the dial.
                  wrap.scale.setScalar(watchCaseDiameter / caseHeight);
                }
                (index === 4 ? figureDisplay : watchDisplay).add(wrap);
                (index === 4 ? figures : watches).push(wrap);
              });
              if (index === 5)
                watches.forEach((w) =>
                  w.traverse((o) => {
                    if (o instanceof T.Mesh) {
                      for (const m of Array.isArray(o.material)
                        ? o.material
                        : [o.material]) {
                        if (
                          m instanceof T.MeshStandardMaterial &&
                          /Satin steel/.test(m.name)
                        ) {
                          m.roughness = 0.36;
                          m.envMapIntensity = 1.15;
                          m.bumpMap = brushed;
                          m.bumpScale = 0.0007;
                        }
                      }
                    }
                    if (
                      o instanceof T.Mesh &&
                      o.name.startsWith('Domed_sapphire')
                    ) {
                      o.material = new T.MeshPhysicalMaterial({
                        color: 0xd8eaff,
                        metalness: 0,
                        roughness: 0.08,
                        transparent: true,
                        opacity: 0.085,
                        depthWrite: false,
                      });
                      o.castShadow = false;
                    }
                  }),
                );
            }
            setLoaded((old) => {
              const next = [...old];
              next[Math.min(index, 4)] =
                index < 4 || (figures.length > 0 && watches.length > 0);
              return next;
            });
          } catch (e) {
            if (!disposed) {
              console.error(`Could not load ${assets[index]}`, e);
              setFailed(true);
            }
          }
        };
        // Load this chapter and the next one; later interests do not delay the greeting.
        const requested = new Set<number>();
        const request = (index: number) => {
          if (index > 4) return;
          const indexes = index === 4 ? [4, 5] : [index];
          indexes.forEach((i) => {
            if (!requested.has(i)) {
              requested.add(i);
              void load(i);
            }
          });
        };
        const first = Math.min(5, Math.floor(progress.current));
        request(first);

        const raycaster = new T.Raycaster(),
          pointer = new T.Vector2();
        const click = (e: MouseEvent) => {
          if (progress.current > 0.62 || !screenMesh) return;
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
          );
          raycaster.setFromCamera(pointer, camera);
          if (raycaster.intersectObject(screenMesh).length) open.current();
        };
        const move = (e: MouseEvent) => {
          if (progress.current > 0.62 || !screenMesh) {
            renderer.domElement.style.cursor = 'default';
            return;
          }
          const r = renderer.domElement.getBoundingClientRect();
          pointer.set(
            ((e.clientX - r.left) / r.width) * 2 - 1,
            -((e.clientY - r.top) / r.height) * 2 + 1,
          );
          raycaster.setFromCamera(pointer, camera);
          renderer.domElement.style.cursor = raycaster.intersectObject(
            screenMesh,
          ).length
            ? 'pointer'
            : 'default';
        };
        renderer.domElement.addEventListener('click', click);
        renderer.domElement.addEventListener('mousemove', move);
        const lost = (e: Event) => {
          e.preventDefault();
          setFailed(true);
        };
        renderer.domElement.addEventListener('webglcontextlost', lost);
        const size = () => {
          const w = el.clientWidth,
            h = el.clientHeight;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          const pr = renderer.getPixelRatio();
          targetA.setSize(w * pr, h * pr);
          targetB.setSize(w * pr, h * pr);
        };
        size();
        const resize = new ResizeObserver(size);
        resize.observe(el);
        const reduced = matchMedia('(prefers-reduced-motion: reduce)');
        let elapsed = 0,
          last = 0,
          current = progress.current,
          focus = 0,
          watchTurn = 0,
          lift = 0,
          lastActive = -1;
        const bg = [0x101e35, 0x122b45, 0x16233a, 0x101b32, 0x071225, 0x0c1420];
        const lighting = [
          {
            glow: 0xffb25d,
            strength: 0.95,
            point: [0.83, 0.68],
            key: 0xff8f3f,
            power: 5.5,
            hemi: 0.62,
            env: 0.22,
            pos: [-12, 7, 7],
            rim: 0.65,
          },
          {
            glow: 0xb3dbf2,
            strength: 0.58,
            point: [0.79, 0.83],
            key: 0xfff1df,
            power: 2.9,
            hemi: 0.65,
            env: 0.1,
            pos: [25, 17, -5],
            rim: 0.45,
          },
          {
            glow: 0xfca96d,
            strength: 0.7,
            point: [0.83, 0.58],
            key: 0xffb06b,
            power: 3.9,
            hemi: 0.7,
            env: 0.3,
            pos: [-14, 6, 9],
            rim: 0.75,
          },
          {
            glow: 0xff6f37,
            strength: 1.05,
            point: [0.77, 0.51],
            key: 0xff8e50,
            power: 2.8,
            hemi: 0.36,
            env: 0.24,
            pos: [12, 5, -18],
            rim: 1.45,
          },
          {
            glow: 0x446eae,
            strength: 0.27,
            point: [0.83, 0.78],
            key: 0x749bcc,
            power: 0.25,
            hemi: 0.34,
            env: 0.38,
            pos: [4, 12, -8],
            rim: 2.1,
          },
          {
            glow: 0x446eae,
            strength: 0.15,
            point: [0.83, 0.78],
            key: 0x749bcc,
            power: 0.25,
            hemi: 0.34,
            env: 0.38,
            pos: [4, 12, -8],
            rim: 2.1,
          },
        ];
        const aim = new T.Vector3(),
          position = new T.Vector3();
        function configure(index: number, u: number) {
          const s = controls.current,
            mobile = el.clientWidth < 901;
          const t = reduced.matches || !s.playing ? 0.22 : u;
          worlds.forEach((w, i) => (w.visible = i === index));
          scene.background = new T.Color(bg[index]);
          scene.fog =
            index === 1
              ? new T.Fog(0x243f55, 38, 105)
              : index === 4
                ? new T.Fog(bg[4], 14, 31)
                : null;
          const data = [
            {
              p: [3.1 - 4 * t, 5.3 + 12 * t, 13.5 - 8 * t],
              a: [0, 1.8, 0],
              f: 34,
              shift: 0.2,
            },
            {
              p: [-7 + 4 * t, 15 + 5 * t, 27 - 12 * t],
              a: [-1, 3.5, -8 - 7 * t],
              f: 46,
              shift: 0.06,
            },
            {
              p: [
                11 - 6 * t - 5 * focus,
                12 - 3 * t - 5 * focus,
                17 - 3 * t - 2 * focus,
              ],
              a: [0, 2, 0],
              f: 37,
              shift: 0.22,
            },
            {
              p: [25 - 20 * t, 28 - 8 * t, 39 - 9 * t],
              a: [0, 2, 0],
              f: 39,
              shift: 0.13,
            },
            { p: [0.2, 1.0, 12.7], a: [0, 0.2, 0], f: 34, shift: 0 },
            { p: [0, 1, 15], a: [0, 0, 0], f: 34, shift: 0 },
          ][index];
          position.fromArray(data.p);
          aim.fromArray(data.a);
          camera.fov = data.f;
          if (mobile) {
            if (index === 0) {
              position.set(1.0 - 1.5 * t, 5.5 + 9 * t, 15.5 - 7 * t);
              aim.set(0, 1.4, 0);
              camera.fov = 47;
            }
            if (index === 1) {
              position.set(-6 + 3 * t, 15 + 5 * t, 32 - 12 * t);
              aim.set(-1, 4, -7 - 5 * t);
              camera.fov = 56;
            }
            if (index === 2) {
              position.set(11 - 3 * focus, 14 - 3 * focus, 23 - 3 * focus);
              camera.fov = 49;
            }
            if (index === 3) {
              position.set(30 - 10 * t, 38 - 6 * t, 48 - 6 * t);
              camera.fov = 53;
            }
            if (index === 4) {
              position.set(0, 1, el.clientWidth < 360 ? 15.2 : 14.2);
              aim.set(0, 0.1, 0);
              camera.fov = 47;
            }
          }
          if (index === 3) {
            position.lerp(
              new T.Vector3(
                mobile ? 0 : 3.8,
                mobile ? 9 : 5.0,
                mobile ? 9.8 : 10.3,
              ),
              lift,
            );
            aim.lerp(new T.Vector3(0, 0.8, -1.0), lift);
            camera.fov = T.MathUtils.lerp(camera.fov, mobile ? 75 : 57, lift);
          }
          camera.position.copy(position);
          camera.lookAt(aim);
          camera.clearViewOffset();
          const w = el.clientWidth,
            h = el.clientHeight;
          // Reserve copy space by shifting the physical camera frustum, not shrinking the scene into a card.
          camera.setViewOffset(
            w,
            h,
            -w * (mobile ? 0 : data.shift * (index === 3 ? 1 - lift : 1)),
            -h *
              (mobile
                ? index === 4
                  ? 0.04
                  : index === 3
                    ? 0.23 - 0.11 * lift
                    : index === 2
                      ? 0.27
                      : 0.23
                : index === 4
                  ? 0
                  : 0.04),
            w,
            h,
          );
          camera.updateProjectionMatrix();
          const light = lighting[index];
          hemi.intensity = light.hemi;
          hemi.color.set(index === 1 ? 0xc4d9ed : 0x7698c8);
          scene.environmentIntensity = light.env;
          sun.intensity = light.power;
          sun.color.set(light.key);
          sun.position.fromArray(light.pos);
          rim.intensity = light.rim;
          rim.color.set(index === 3 ? 0xffb489 : 0x91bcff);
          skyMaterial.uniforms.base.value.set(bg[index]);
          skyMaterial.uniforms.glow.value.set(light.glow);
          skyMaterial.uniforms.strength.value =
            light.strength * (mobile ? 0.68 : 1);
          skyMaterial.uniforms.sunPoint.value.set(
            mobile ? 0.89 : light.point[0],
            (mobile && index >= 4 ? 0.65 : light.point[1]) - t * 0.06,
          );
          skyMaterial.uniforms.night.value = index >= 4 ? 1 : 0;
          skyMaterial.uniforms.aspect.value = w / h;
          renderer.toneMappingExposure = 1.0;
        }
        function animate(time: number) {
          if (disposed) return;
          frame = requestAnimationFrame(animate);
          if (time - last < 32 || document.hidden) return;
          const dt = Math.min((time - last) / 1000, 0.08);
          last = time;
          const s = controls.current;
          if (s.playing && !reduced.matches) elapsed += dt;
          current = reduced.matches
            ? progress.current
            : T.MathUtils.lerp(
                current,
                progress.current,
                1 - Math.exp(-dt * 9),
              );
          const index = Math.min(5, Math.floor(current)),
            u = current - index;
          if (index !== lastActive) {
            setActive(index);
            lastActive = index;
            request(index);
            request(index + 1);
          }
          focus = T.MathUtils.lerp(focus, Number(s.courtside), 0.07);
          lift = reduced.matches
            ? Number(s.roof)
            : T.MathUtils.lerp(lift, Number(s.roof), 1 - Math.exp(-dt * 2.5));
          watchTurn = reduced.matches
            ? Number(s.bracelet)
            : T.MathUtils.lerp(
                watchTurn,
                Number(s.bracelet),
                1 - Math.exp(-dt * 5),
              );
          code(elapsed);
          keys.forEach((k) => (k.obj.position.y = k.y));
          const charIndex = Math.floor((elapsed % 12) * 3.6),
            letter = 'hello world'[charIndex];
          if (charIndex < 11 && s.playing) {
            const key = keys.get(letter === ' ' ? 'space' : letter);
            if (key)
              key.obj.position.y =
                key.y -
                Math.sin((((elapsed % 12) * 3.6) % 1) * Math.PI) * 0.065;
          }
          if (index === 2 || (index === 1 && u > 0.7)) animateSquash(elapsed);
          if (index === 3 || (index === 2 && u > 0.7))
            animateStadium(elapsed, lift);
          figures.forEach((f, i) => {
            f.visible = i === s.figure;
            f.rotation.y = 0.16 + Math.sin(elapsed * 0.3) * 0.23;
          });
          watches.forEach((w, i) => {
            w.visible = i === s.watch;
            w.rotation.y =
              -0.18 +
              Math.sin(elapsed * 0.27) * 0.22 +
              (i === 0 ? watchTurn * Math.PI : 0);
            w.rotation.z = -0.12;
          });
          const spacing =
            el.clientWidth < 360 ? 1.1 : el.clientWidth < 641 ? 1.28 : 2.1;
          figureDisplay.position.set(-spacing, 0.1, 0);
          watchDisplay.position.set(spacing, 0.23, 0);
          platforms.forEach(
            (p, i) => (p.position.x = (i === 0 ? -1 : 1) * spacing),
          );
          const blend = index < 5 ? T.MathUtils.smoothstep(u, 0.7, 1) : 0;
          configure(index, u);
          if (blend > 0.001) {
            renderer.setRenderTarget(targetA);
            renderer.render(scene, camera);
            configure(index + 1, 0);
            renderer.setRenderTarget(targetB);
            renderer.render(scene, camera);
            blendMaterial.uniforms.blend.value = blend;
            renderer.setRenderTarget(null);
            renderer.render(composite, flatCamera);
          } else {
            renderer.setRenderTarget(null);
            renderer.render(scene, camera);
          }
        }
        function dispose(obj: Three.Object3D) {
          obj.traverse((o) => {
            if (o instanceof T.Mesh) {
              o.geometry.dispose();
              for (const m of Array.isArray(o.material)
                ? o.material
                : [o.material])
                m.dispose();
            }
          });
        }
        frame = requestAnimationFrame(animate);
        cleanup = () => {
          cancelAnimationFrame(frame);
          resize.disconnect();
          renderer.domElement.removeEventListener('click', click);
          renderer.domElement.removeEventListener('mousemove', move);
          renderer.domElement.removeEventListener('webglcontextlost', lost);
          sky.geometry.dispose();
          skyMaterial.dispose();
          worlds.forEach(dispose);
          loadedModels.forEach(dispose);
          materialTextures.forEach((t) => t.dispose());
          codeTexture.dispose();
          targetA.dispose();
          targetB.dispose();
          quad.geometry.dispose();
          blendMaterial.dispose();
          env.dispose();
          pmrem.dispose();
          draco.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (e) {
        console.error('Scene unavailable', e);
        if (!disposed) setFailed(true);
      }
    };
    void init();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [attempt, controls, progress]);
  return (
    <div className="scene-stage" data-chapter={active}>
      {active < 5 && (!loaded[Math.min(active, 4)] || failed) && (
        <Image
          unoptimized
          width={1500}
          height={1300}
          className="scene-fallback"
          src={`/models/${fallback[active]}.png?v=${active === 4 ? 'collection18' : active === 2 ? 'sports16' : 'alpine15'}`}
          alt=""
        />
      )}
      <div
        ref={host}
        style={{
          position: 'absolute',
          inset: 0,
          opacity:
            failed || (!loaded[Math.min(active, 4)] && active < 5) ? 0 : 1,
        }}
      />
      {active < 5 && !loaded[Math.min(active, 4)] && !failed && (
        <output className="scene-loading">Setting the scene…</output>
      )}
      {failed && (
        <button className="scene-retry" onClick={() => setAttempt(attempt + 1)}>
          Reload the scenes
        </button>
      )}
    </div>
  );
}

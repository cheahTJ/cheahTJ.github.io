import type * as Three from 'three';

// A continuous shot schedule drives both the ball and the players' footwork.
export function createSquashMotion(T: typeof Three, model: Three.Object3D) {
  const players = [0, 1].map((i) => model.getObjectByName(`Player_${i}`));
  const arms = [0, 1].map((i) => model.getObjectByName(`SwingArm_${i}`));
  const legs = [0, 1].map((i) =>
    [-1, 1].map((s) => model.getObjectByName(`StrideLeg_${i}_${s}`)),
  );
  const ball = model.getObjectByName('SquashBall');
  const hits = [
    [-2, 2.6],
    [1.6, 0.3],
    [-1.8, -1.7],
    [1.9, 3.2],
    [-2.15, 1.2],
    [1.7, -1.3],
    [-1.6, 3.1],
    [1.5, 1.6],
  ];
  const duration = 1.85;
  const point = (n: number) => {
    const h = hits[n % hits.length];
    return new T.Vector3(h[0] + 0.59, 1.38, h[1] - 0.79);
  };
  const from = new T.Vector3(),
    to = new T.Vector3(),
    wall = new T.Vector3(),
    bounce = new T.Vector3();
  return (time: number) => {
    const shot = Math.floor(time / duration),
      f = time / duration - shot,
      hitter = shot % 2,
      next = (shot + 1) % hits.length;
    from.copy(point(shot));
    to.copy(point(next));
    wall.set(from.x * 0.3 + to.x * 0.24, 2.25 + (shot % 3) * 0.15, -4.76);
    bounce.set(to.x, 0.105, to.z - 0.95);
    if (ball) {
      if (f < 0.35) ball.position.lerpVectors(from, wall, f / 0.35);
      else if (f < 0.79) {
        const t = (f - 0.35) / 0.44;
        ball.position.lerpVectors(wall, bounce, t);
        ball.position.y += Math.sin(t * Math.PI) * 0.22;
      } else {
        const t = (f - 0.79) / 0.21;
        ball.position.lerpVectors(bounce, to, t);
        ball.position.y += Math.sin(t * Math.PI) * 0.08;
      }
    }
    players.forEach((p, i) => {
      if (!p) return;
      const h = hits[shot % hits.length],
        n = hits[next],
        tx = i === 0 ? -0.55 : 0.55,
        tz = 0.6;
      const k = T.MathUtils.smoothstep(f, 0, i === hitter ? 0.64 : 0.88);
      const x =
        i === hitter
          ? T.MathUtils.lerp(h[0], tx, k)
          : T.MathUtils.lerp(tx, n[0], k);
      const z =
        i === hitter
          ? T.MathUtils.lerp(h[1], tz, k)
          : T.MathUtils.lerp(tz, n[1], k);
      const speed = Math.sin(
        Math.PI * Math.min(1, f / (i === hitter ? 0.64 : 0.88)),
      );
      p.position.set(
        x,
        0.06 + Math.abs(Math.sin(time * 13 + i * 2)) * 0.065 * speed,
        z,
      );
      p.rotation.y = Math.sin(f * Math.PI) * 0.12 * (i === hitter ? -1 : 1);
      p.rotation.x = -0.075 * speed;
      legs[i].forEach((leg, j) => {
        if (leg)
          leg.rotation.x = Math.sin(time * 13 + j * Math.PI + i) * 0.6 * speed;
      });
      const arm = arms[i];
      if (arm) {
        // Racket returns to the contact position at each ball/player rendezvous.
        const stroke =
          i === hitter
            ? Math.sin(Math.min(f / 0.23, 1) * Math.PI)
            : -Math.sin(T.MathUtils.smoothstep(f, 0.8, 1) * Math.PI);
        arm.rotation.y = stroke * 0.95;
        arm.rotation.x = stroke * 0.25;
      }
    });
  };
}

export function createStadiumLife(T: typeof Three, parent: Three.Object3D) {
  const group = new T.Group();
  group.name = 'Live match and supporters';
  parent.add(group);
  let seed = 1961;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const crowd: { x: number; y: number; z: number; a: number; phase: number }[] =
    [];
  for (let row = 0; row < 23; row++)
    for (let seat = 0; seat < 250; seat++) {
      if (seat % 25 < 2 || random() < 0.06) continue;
      const a = (seat * Math.PI * 2) / 250,
        gap = row >= 12 && Math.sin(a) < 0.4 ? 0.35 : 0;
      const x =
        (5.88 + row * 0.18 + gap) *
        Math.sign(Math.cos(a)) *
        Math.abs(Math.cos(a)) ** 0.64;
      const z =
        -(8.82 + row * 0.15 + gap) *
        Math.sign(Math.sin(a)) *
        Math.abs(Math.sin(a)) ** 0.64;
      crowd.push({
        x,
        y: 0.47 + row * 0.19,
        z,
        a,
        phase: random() * Math.PI * 2,
      });
    }
  const mat = new T.MeshStandardMaterial({ roughness: 0.86 });
  const bodies = new T.InstancedMesh(
    new T.CapsuleGeometry(0.055, 0.1, 2, 5),
    mat,
    crowd.length,
  );
  const heads = new T.InstancedMesh(
    new T.SphereGeometry(0.046, 7, 5),
    mat,
    crowd.length,
  );
  const arms = new T.InstancedMesh(
    new T.CapsuleGeometry(0.019, 0.105, 2, 4),
    mat,
    crowd.length * 2,
  );
  const trousers = new T.InstancedMesh(
    new T.BoxGeometry(0.085, 0.095, 0.08),
    mat,
    crowd.length,
  );
  group.add(bodies, heads, arms, trousers);
  arms.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const dummy = new T.Object3D(),
    colour = new T.Color();
  const shirts = [
    0xe8edf5, 0xd8e2eb, 0x243d5f, 0x12243e, 0x728299, 0xb1becf, 0xc7b698,
  ];
  const skin = [0xe6bb98, 0xa36d4e, 0xc99673, 0x704a35, 0xd0a47d];
  crowd.forEach((p, i) => {
    dummy.rotation.set(0, -p.a, 0);
    dummy.position.set(p.x, p.y + 0.17, p.z);
    dummy.updateMatrix();
    bodies.setMatrixAt(i, dummy.matrix);
    bodies.setColorAt(
      i,
      colour.setHex(shirts[Math.floor(random() * shirts.length)]),
    );
    dummy.position.y = p.y + 0.3;
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
    heads.setColorAt(
      i,
      colour.setHex(skin[Math.floor(random() * skin.length)]),
    );
    dummy.position.y = p.y + 0.055;
    dummy.updateMatrix();
    trousers.setMatrixAt(i, dummy.matrix);
    trousers.setColorAt(i, colour.setHex(0x202b3c));
    for (let j = 0; j < 2; j++)
      arms.setColorAt(
        i * 2 + j,
        colour.setHex(shirts[Math.floor(random() * shirts.length)]),
      );
  });
  [bodies, heads, arms, trousers].forEach((m) => {
    m.frustumCulled = false;
  });
  const white = new T.MeshStandardMaterial({
    color: 0xf2f3ef,
    roughness: 0.65,
  });
  const red = new T.MeshStandardMaterial({ color: 0xad333e, roughness: 0.75 });
  const navy = new T.MeshStandardMaterial({ color: 0x13243d, roughness: 0.8 });
  const skinMat = new T.MeshStandardMaterial({
    color: 0xc09270,
    roughness: 0.85,
  });
  const boot = new T.MeshStandardMaterial({ color: 0xe5dd7a, roughness: 0.6 });
  const footballers: {
    root: Three.Group;
    legs: Three.Group[];
    arms: Three.Group[];
    base: [number, number];
    team: number;
  }[] = [];
  const bases: [number, number][] = [
    [0, 7.4],
    [-3.4, 4.7],
    [-1.2, 5],
    [1.2, 5],
    [3.4, 4.7],
    [-2.8, 1.9],
    [0, 2.2],
    [2.8, 1.9],
    [-2.6, -1.6],
    [0, -3.3],
    [2.6, -1.6],
  ];
  function mesh(
    geometry: Three.BufferGeometry,
    material: Three.Material,
    root: Three.Object3D,
    x: number,
    y: number,
    z: number,
  ) {
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    root.add(m);
    return m;
  }
  for (let team = 0; team < 2; team++)
    bases.forEach((base, i) => {
      const root = new T.Group();
      root.name = `Footballer_${team}_${i}`;
      group.add(root);
      const jersey =
        i === 0
          ? new T.MeshStandardMaterial({
              color: team === 0 ? 0xe1b953 : 0x5ab0b1,
              roughness: 0.7,
            })
          : team === 0
            ? white
            : red;
      mesh(new T.CapsuleGeometry(0.065, 0.1, 3, 8), jersey, root, 0, 0.28, 0);
      mesh(new T.SphereGeometry(0.053, 9, 6), skinMat, root, 0, 0.425, 0);
      mesh(
        new T.SphereGeometry(0.054, 8, 5),
        navy,
        root,
        0,
        0.449,
        -0.013,
      ).scale.set(1, 0.46, 1);
      mesh(new T.BoxGeometry(0.12, 0.09, 0.08), navy, root, 0, 0.17, 0);
      const legs: Three.Group[] = [],
        playerArms: Three.Group[] = [];
      for (const s of [-1, 1]) {
        const leg = new T.Group();
        leg.position.set(s * 0.043, 0.165, 0);
        root.add(leg);
        legs.push(leg);
        mesh(
          new T.CapsuleGeometry(0.025, 0.095, 2, 6),
          skinMat,
          leg,
          0,
          -0.058,
          0,
        );
        mesh(
          new T.BoxGeometry(0.045, 0.055, 0.09),
          team === 0 ? white : red,
          leg,
          0,
          -0.107,
          0,
        );
        mesh(
          new T.BoxGeometry(0.052, 0.032, 0.082),
          boot,
          leg,
          0,
          -0.145,
          0.021,
        );
        const arm = new T.Group();
        arm.position.set(s * 0.075, 0.32, 0);
        root.add(arm);
        playerArms.push(arm);
        const m = mesh(
          new T.CapsuleGeometry(0.019, 0.11, 2, 6),
          skinMat,
          arm,
          s * 0.018,
          -0.055,
          0,
        );
        m.rotation.z = s * 0.2;
      }
      footballers.push({
        root,
        legs,
        arms: playerArms,
        base: [base[0] * (team ? -1 : 1), base[1] * (team ? -1 : 1)],
        team,
      });
    });
  const ball = new T.Mesh(new T.SphereGeometry(0.07, 12, 8), white);
  ball.name = 'MatchBall';
  group.add(ball);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    mesh(
      new T.SphereGeometry(0.021, 5, 4),
      navy,
      ball,
      Math.cos(a) * 0.064,
      Math.sin(a) * 0.064,
      0,
    );
  }
  // LED banks and directed beams sit on the roof's inner edge, aimed across the pitch.
  const lamps = new T.Group();
  group.add(lamps);
  const glow = new T.MeshBasicMaterial({ color: 0xe2f2ff, toneMapped: false });
  const beamMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    blending: T.AdditiveBlending,
    uniforms: { strength: { value: 0.075 } },
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'varying vec2 vUv;uniform float strength;void main(){float edge=pow(sin(vUv.x*3.14159265),2.);gl_FragColor=vec4(.60,.78,1.,strength*edge*pow(vUv.y,1.7));}',
  });
  for (const x of [-6.7, 6.7])
    for (const z of [-7, 0, 7]) {
      const source = new T.Vector3(x, 5.5, z),
        target = new T.Vector3(-x * 0.25, 0.05, z * 0.58),
        delta = target.clone().sub(source),
        length = delta.length();
      const fixture = new T.Group();
      fixture.position.copy(source);
      fixture.lookAt(target);
      lamps.add(fixture);
      mesh(new T.BoxGeometry(1.0, 0.22, 0.12), navy, fixture, 0, 0, 0);
      for (let j = 0; j < 6; j++)
        mesh(
          new T.BoxGeometry(0.13, 0.13, 0.018),
          glow,
          fixture,
          -0.395 + j * 0.158,
          0,
          0.069,
        );
      const spot = new T.SpotLight(0xdcecff, 135, 23, 0.51, 0.62, 1.5);
      spot.position.copy(source);
      spot.target.position.copy(target);
      lamps.add(spot, spot.target);
      const beam = new T.Mesh(
        new T.ConeGeometry(2.25, length, 28, 1, true),
        beamMaterial,
      );
      beam.position.copy(source).addScaledVector(delta, 0.5);
      beam.quaternion.setFromUnitVectors(
        new T.Vector3(0, -1, 0),
        delta.normalize(),
      );
      lamps.add(beam);
    }
  const sequence = [2, 5, 6, 8, 9, 10, 7, 4, 3, 6, 1, 5];
  const duration = 2.25;
  const pose = (i: number, t: number) => {
    const p = footballers[i];
    return new T.Vector3(
      p.base[0] + Math.sin(t * 0.72 + i * 1.7) * (i % 11 === 0 ? 0.22 : 0.7),
      0.09,
      p.base[1] + Math.sin(t * 0.65 + i) * (i % 11 === 0 ? 0.12 : 0.9),
    );
  };
  let previous = -1,
    previousEntry = -1;
  return (time: number, entered: number) => {
    const n = Math.floor(time / duration),
      f = time / duration - n,
      a = sequence[n % sequence.length],
      b = sequence[(n + 1) % sequence.length];
    const start = pose(a, n * duration),
      end = pose(b, (n + 1) * duration);
    ball.position.lerpVectors(start, end, f);
    ball.position.y += Math.sin(f * Math.PI) * 0.23;
    ball.rotation.x = time * 6;
    ball.rotation.z = time * 3;
    footballers.forEach((p, i) => {
      const destination = pose(i, time);
      if (p.team === 1) {
        destination.x += (ball.position.x - destination.x) * 0.1;
        destination.z += (ball.position.z - destination.z) * 0.1;
      }
      const speed = destination.distanceTo(p.root.position);
      p.root.position.copy(destination);
      p.root.position.y = 0.055;
      p.root.rotation.y = Math.atan2(
        ball.position.x - destination.x,
        ball.position.z - destination.z,
      );
      const run = Math.min(0.6, speed * 14);
      p.legs.forEach(
        (l, j) => (l.rotation.x = Math.sin(time * 10 + j * Math.PI + i) * run),
      );
      p.arms.forEach(
        (l, j) =>
          (l.rotation.x = -Math.sin(time * 10 + j * Math.PI + i) * run * 0.7),
      );
      if (i === a && f < 0.17)
        p.legs[1].rotation.x = -Math.sin((f / 0.17) * Math.PI) * 0.8;
    });
    // Crowd updates at 15 fps; shared meshes keep thousands of people inexpensive.
    const tick = Math.floor(time * 15);
    if (tick !== previous || Math.abs(entered - previousEntry) > 0.03) {
      previousEntry = entered;
      previous = tick;
      crowd.forEach((p, i) => {
        const excitement = 0.13 + entered * 0.87;
        for (let j = 0; j < 2; j++) {
          const side = j === 0 ? -1 : 1,
            wave = Math.sin(time * (3.1 + (i % 5) * 0.15) + p.phase + j * 0.7);
          dummy.position.set(
            p.x + side * 0.069,
            p.y + 0.18 + excitement * 0.08,
            p.z,
          );
          dummy.rotation.set(
            wave * 0.22,
            0,
            side * (0.3 + excitement * (1.65 + wave * 0.35)),
          );
          dummy.updateMatrix();
          arms.setMatrixAt(i * 2 + j, dummy.matrix);
        }
      });
      arms.instanceMatrix.needsUpdate = true;
    }
  };
}

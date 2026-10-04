import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
const code = ts.transpileModule(
  fs.readFileSync(new URL('../app/sports-motion.ts', import.meta.url), 'utf8'),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  },
).outputText;
const { createSquashMotion, createStadiumLife } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);

test('squash players cover the court, meet the ball and loop without teleporting', () => {
  const model = new THREE.Group();
  for (const name of [
    'SquashBall',
    'Player_0',
    'Player_1',
    'SwingArm_0',
    'SwingArm_1',
    'StrideLeg_0_-1',
    'StrideLeg_0_1',
    'StrideLeg_1_-1',
    'StrideLeg_1_1',
  ]) {
    const o = new THREE.Group();
    o.name = name;
    model.add(o);
  }
  const update = createSquashMotion(THREE, model),
    ball = model.getObjectByName('SquashBall');
  const player = model.getObjectByName('Player_0');
  const bounds = new THREE.Box3();
  for (let t = 0; t < 1.85 * 16; t += 0.025) {
    update(t);
    bounds.expandByPoint(player.position);
    assert.ok(ball.position.y >= 0.1);
    assert.ok(Math.abs(ball.position.x) < 3.2);
    assert.ok(ball.position.z >= -4.8 && ball.position.z < 4.8);
  }
  assert.ok(
    bounds.max.z - bounds.min.z > 4,
    'player travels between the front and back court',
  );
  for (let shot = 0; shot < 16; shot++) {
    update(shot * 1.85);
    const p = model.getObjectByName(`Player_${shot % 2}`);
    assert.ok(Math.abs(ball.position.x - (p.position.x + 0.59)) < 1e-8);
    assert.ok(Math.abs(ball.position.z - (p.position.z - 0.79)) < 1e-8);
    update(shot * 1.85 - 1e-6 + 1.85 * 16);
    const before = player.position.clone();
    update(shot * 1.85 + 1e-6 + 1.85 * 16);
    assert.ok(player.position.distanceTo(before) < 0.001);
  }
  update(4);
  const snapshot = model.children.map((o) => o.position.toArray());
  update(4);
  assert.deepEqual(
    model.children.map((o) => o.position.toArray()),
    snapshot,
  );
});

test('stadium has two full teams, a moving in-bounds ball and an entry crowd response', () => {
  const parent = new THREE.Group(),
    update = createStadiumLife(THREE, parent);
  update(0, 0);
  const group = parent.children[0],
    players = group.children.filter((o) => o.name.startsWith('Footballer_'));
  assert.equal(players.length, 22);
  const crowd = group.children.filter((o) => o.isInstancedMesh);
  assert.equal(crowd.length, 4);
  assert.ok(crowd[0].count > 4000);
  const ball = group.getObjectByName('MatchBall');
  const start = ball.position.clone();
  for (let t = 0; t < 28; t += 0.15) {
    update(t, 0);
    assert.ok(Math.abs(ball.position.x) < 5.2);
    assert.ok(Math.abs(ball.position.z) < 8);
    assert.ok(ball.position.y >= 0.08);
    for (const p of players) {
      assert.ok(Math.abs(p.position.x) < 5.2);
      assert.ok(Math.abs(p.position.z) < 8);
    }
  }
  assert.ok(ball.position.distanceTo(start) > 1);
  update(28, 0);
  const arms = crowd[2].instanceMatrix.array.slice();
  update(28, 1);
  assert.notDeepEqual(
    crowd[2].instanceMatrix.array,
    arms,
    'entry raises arms even with time paused',
  );
});

test('trumpet audio starts by request, fades on mute and releases its media resource', async () => {
  const original = {
    Audio: globalThis.Audio,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };
  let instance;
  const callbacks = new Map();
  let id = 0;
  globalThis.Audio = class {
    volume = 0;
    playing = false;
    constructor(src) {
      instance = this;
      this.src = src;
    }
    play() {
      this.playing = true;
      return Promise.resolve();
    }
    pause() {
      this.playing = false;
    }
    removeAttribute() {
      this.removed = true;
    }
    load() {
      this.released = true;
    }
  };
  globalThis.setInterval = (cb) => {
    callbacks.set(++id, cb);
    return id;
  };
  globalThis.clearInterval = (n) => callbacks.delete(n);
  try {
    const code = ts.transpileModule(
      fs.readFileSync(
        new URL('../app/crowd-audio.ts', import.meta.url),
        'utf8',
      ),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
        },
      },
    ).outputText;
    const { createCrowdAudio } = await import(
      'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
    );
    const controller = createCrowdAudio(() =>
      assert.fail('unexpected playback failure'),
    );
    assert.equal(instance.src, '/audio/spurs-trumpet.wav');
    assert.equal(instance.playing, false);
    controller.setAudible(true);
    assert.equal(instance.playing, true);
    for (let i = 0; i < 80; i++) for (const cb of callbacks.values()) cb();
    assert.equal(instance.volume, 0.32);
    controller.setAudible(false);
    for (let i = 0; i < 80; i++) for (const cb of callbacks.values()) cb();
    assert.equal(instance.playing, false);
    assert.equal(instance.volume, 0);
    controller.dispose();
    assert.ok(instance.removed && instance.released);
    assert.equal(callbacks.size, 0);
  } finally {
    Object.assign(globalThis, original);
  }
});

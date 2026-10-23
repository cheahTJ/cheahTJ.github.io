import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(
  fs.readFileSync(
    new URL('../lib/subscription-clock.ts', import.meta.url),
    'utf8',
  ),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  },
).outputText;
const { createSubscriptionClock, advanceSubscriptionClock, billingDate, DAY } =
  await import(
    'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
  );
const utc = (month, day) => Date.UTC(2026, month - 1, day, 9);

test('trial stays free until its boundary, then creates one paid invoice', () => {
  const initial = createSubscriptionClock();
  const before = advanceSubscriptionClock(initial, utc(1, 22) - 1);
  assert.equal(before.status, 'trialing');
  assert.equal(before.paidInvoices, 0);
  const paid = advanceSubscriptionClock(before, utc(1, 22));
  assert.equal(paid.status, 'active');
  assert.equal(paid.paidInvoices, 1);
  assert.equal(paid.nextAt, utc(2, 22));
  assert.deepEqual(
    paid.events.map((e) => e.title),
    [
      'Free trial started',
      'Free trial ended',
      'Invoice created',
      'Payment succeeded',
    ],
  );
  assert.equal(
    initial.events.length,
    1,
    'advancing does not mutate earlier snapshots',
  );
});

test('failed first invoice is retried once without shifting the billing anniversary', () => {
  const failed = advanceSubscriptionClock(
    createSubscriptionClock('retry'),
    utc(1, 22),
  );
  assert.equal(failed.status, 'past_due');
  assert.equal(failed.paidInvoices, 0);
  assert.equal(failed.nextEvent, 'retry');
  assert.equal(failed.nextAt, utc(1, 24));
  const waiting = advanceSubscriptionClock(failed, utc(1, 23));
  assert.equal(waiting.status, 'past_due');
  const recovered = advanceSubscriptionClock(waiting, utc(1, 24));
  assert.equal(recovered.status, 'active');
  assert.equal(recovered.paidInvoices, 1);
  assert.equal(recovered.nextAt, utc(2, 22));
  assert.equal(
    recovered.events.filter((e) => e.title === 'Invoice created').length,
    1,
    'retry uses the same invoice',
  );
  const renewed = advanceSubscriptionClock(recovered, utc(2, 22));
  assert.equal(renewed.paidInvoices, 2);
  assert.equal(
    renewed.events.filter((e) => e.title === 'Payment failed').length,
    1,
  );
});

test('jumping across months processes all due events in the same order as small steps', () => {
  for (const scenario of ['success', 'retry']) {
    const initial = createSubscriptionClock(scenario);
    const jumped = advanceSubscriptionClock(initial, utc(4, 23));
    let stepped = initial;
    for (let day = initial.now + DAY; day <= utc(4, 23); day += DAY) {
      stepped = advanceSubscriptionClock(stepped, day);
    }
    assert.deepEqual(jumped, stepped);
    assert.equal(jumped.paidInvoices, 4);
    assert.ok(
      jumped.events.every(
        (event, i, all) => i === 0 || event.at >= all[i - 1].at,
      ),
    );
  }
});

test('month-end billing clamps short months without accumulating date drift', () => {
  const jan31 = utc(1, 31);
  assert.equal(billingDate(jan31, 1), utc(2, 28));
  assert.equal(billingDate(jan31, 2), utc(3, 31));
  assert.equal(
    billingDate(Date.UTC(2028, 0, 31, 9), 1),
    Date.UTC(2028, 1, 29, 9),
  );
  assert.equal(billingDate(utc(12, 31), 1), Date.UTC(2027, 0, 31, 9));
});

test('the demo caps long jumps and cannot charge twice or move backward', () => {
  for (const scenario of ['success', 'retry']) {
    const initial = createSubscriptionClock(scenario);
    for (const invalid of [initial.now - DAY, initial.now, NaN, Infinity]) {
      assert.equal(advanceSubscriptionClock(initial, invalid), initial);
    }
    const finished = advanceSubscriptionClock(initial, Date.UTC(2100, 0, 1));
    assert.equal(finished.now, initial.end);
    assert.equal(finished.paidInvoices, 6);
    assert.ok(finished.events.every((e) => e.at <= finished.end));
    assert.deepEqual(
      advanceSubscriptionClock(finished, finished.end + DAY),
      finished,
    );
    assert.deepEqual(
      createSubscriptionClock(scenario),
      initial,
      'reset returns the original fictional state',
    );
  }
});

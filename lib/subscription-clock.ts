/** Fictional subscription rules for the portfolio demo; no payment APIs are used. */
export const DAY = 24 * 60 * 60 * 1000;
export const MONTHLY_PRICE = 12;
export const DEMO_START = Date.UTC(2026, 0, 15, 9);
export type Scenario = 'success' | 'retry';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due';
export type ScheduledEvent = 'trial_ends' | 'renewal' | 'retry';
export type ClockEvent = {
  id: number;
  at: number;
  title: string;
  detail: string;
  tone: 'neutral' | 'success' | 'warning';
};
export type SubscriptionClock = {
  now: number;
  start: number;
  end: number;
  billingAnchor: number;
  billingCycle: number;
  nextAt: number;
  nextEvent: ScheduledEvent;
  scenario: Scenario;
  status: SubscriptionStatus;
  paidInvoices: number;
  events: ClockEvent[];
};

/** Keep renewals on the original billing day, clamping only short months. */
export function billingDate(anchor: number, months: number) {
  const date = new Date(anchor);
  const monthStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Date.UTC(
    monthStart.getUTCFullYear(),
    monthStart.getUTCMonth(),
    Math.min(date.getUTCDate(), lastDay),
    date.getUTCHours(),
    date.getUTCMinutes(),
  );
}

export function createSubscriptionClock(
  scenario: Scenario = 'success',
  start = DEMO_START,
): SubscriptionClock {
  return {
    now: start,
    start,
    end: billingDate(start, 6),
    billingAnchor: start + 7 * DAY,
    billingCycle: 0,
    nextAt: start + 7 * DAY,
    nextEvent: 'trial_ends',
    scenario,
    status: 'trialing',
    paidInvoices: 0,
    events: [
      {
        id: 1,
        at: start,
        title: 'Free trial started',
        detail: 'Alex joined the Studio plan. No payment is due for 7 days.',
        tone: 'neutral',
      },
    ],
  };
}

/** Process every due event in order, including when the clock skips many days. */
export function advanceSubscriptionClock(
  current: SubscriptionClock,
  requestedAt: number,
): SubscriptionClock {
  if (!Number.isFinite(requestedAt) || requestedAt <= current.now)
    return current;
  const target = Math.min(requestedAt, current.end);
  const next = { ...current, events: [...current.events] };
  const record = (
    title: string,
    detail: string,
    tone: ClockEvent['tone'] = 'neutral',
  ) => {
    next.events.push({
      id: next.events.length + 1,
      at: next.now,
      title,
      detail,
      tone,
    });
  };

  while (next.nextAt <= target) {
    next.now = next.nextAt;
    if (next.nextEvent === 'retry') {
      record(
        'Retry succeeded',
        'The same S$12 invoice is now paid.',
        'success',
      );
    } else {
      if (next.nextEvent === 'trial_ends') {
        record('Free trial ended', 'Monthly billing begins today.');
      }
      record('Invoice created', 'S$12 is due for the next month of Studio.');
      if (next.scenario === 'retry' && next.billingCycle === 0) {
        record('Payment failed', 'The fictional card was declined.', 'warning');
        record(
          'Retry scheduled',
          'The same invoice will be retried in 2 days.',
        );
        next.status = 'past_due';
        next.nextEvent = 'retry';
        next.nextAt = next.now + 2 * DAY;
        continue;
      }
      record(
        'Payment succeeded',
        'S$12 paid. The subscription is active.',
        'success',
      );
    }
    next.status = 'active';
    next.paidInvoices += 1;
    next.billingCycle += 1;
    next.nextEvent = 'renewal';
    next.nextAt = billingDate(next.billingAnchor, next.billingCycle);
  }
  next.now = target;
  return next;
}

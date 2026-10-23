# Subscription clock demo

The Ant Group entry contains an optional, inline demo. Visitors first read the
experience, then open **Try the subscription clock** to explore a fictional
subscription. It illustrates clock advancement without reproducing Antom's
implementation or connecting to any payment service.

## Behavior

- A fictional customer starts a 7-day trial on 15 January 2026 at 09:00 UTC.
- Studio costs S$12 per month after the trial.
- **Successful payments** pays each invoice when due.
- **Failed payment + retry** declines the first payment, then settles the same
  invoice two days later. Later payments succeed. The renewal date stays anchored
  to the original billing day.
- **Next event**, **+1 day** and **+7 days** advance the simulated clock. All events
  crossed by a jump are processed in order. Nothing runs against real-world time.
- Each run is capped at six months. Changing scenario or resetting starts fresh.
- Event history is newest first, initially showing the latest four events. Earlier
  events can be expanded. No data is persisted or sent to a server.

## Structure and checks

`lib/subscription-clock.ts` holds the deterministic state transitions and calendar
rules. `components/work/SubscriptionDemo.tsx` presents the clock, state, controls
and event history; its styles are colocated. `app/page.tsx` mounts it only for Ant
Group. Tests cover trial boundaries, retries, event ordering, monthly date
clamping, long jumps, reset and duplicate-charge prevention.

The existing Base UI work dialog handles focus and Escape dismissal. The demo
uses a native disclosure and radio group, visible focus indicators, text labels
for status, an accessible announcement after time changes, and no automatic
animation. Opening the demo brings it into view; the work window’s close bar stays
visible while it is open. Its primary clock control becomes full-width on small
screens.

For UI changes, verify the demo within the actual work reader at desktop and
phone widths, including failed-payment, recovered, completed and reset states.
Keep the experience and résumé accessible without opening the demo.

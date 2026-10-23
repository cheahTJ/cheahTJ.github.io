'use client';

import { useState } from 'react';
import { ArrowRight, ChevronDown, Clock3, RotateCcw } from 'lucide-react';
import {
  advanceSubscriptionClock,
  createSubscriptionClock,
  DAY,
  MONTHLY_PRICE,
  type Scenario,
} from '@/lib/subscription-clock';
import './subscription-demo.css';

const date = (value: number) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(value);
const statusNames = {
  trialing: 'Free trial',
  active: 'Active',
  past_due: 'Payment overdue',
};
const eventNames = {
  trial_ends: 'Trial ends',
  renewal: 'Renewal',
  retry: 'Payment retry',
};

export default function SubscriptionDemo() {
  const [clock, setClock] = useState(() => createSubscriptionClock());
  const [showHistory, setShowHistory] = useState(false);
  const finished = clock.now >= clock.end;
  const history = [...clock.events].reverse();
  const visibleEvents = showHistory ? history : history.slice(0, 4);
  const nextDate = Math.min(clock.nextAt, clock.end);
  const daysAway = Math.ceil((nextDate - clock.now) / DAY);

  const advance = (to: number) => {
    setClock((current) => advanceSubscriptionClock(current, to));
  };
  const reset = (scenario: Scenario = clock.scenario) => {
    setClock(createSubscriptionClock(scenario));
    setShowHistory(false);
  };

  return (
    <details
      className="subscription-demo"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          event.currentTarget.scrollIntoView({
            block: 'start',
            behavior: 'instant',
          });
        }
      }}
    >
      <summary>
        <span className="subscription-demo-icon">
          <Clock3 size={18} />
        </span>
        <span>
          <strong>Try the subscription clock</strong>
          <span>Fast-forward a fictional subscription.</span>
        </span>
        <ChevronDown className="subscription-demo-chevron" size={18} />
      </summary>
      <section
        className="subscription-demo-body"
        aria-label="Subscription clock demo"
      >
        <div className="subscription-demo-intro">
          <span className="subscription-demo-label">INTERACTIVE DEMO</span>
          <h5>Move the clock. See what happens.</h5>
          <p>
            Inspired by the clock-advancement feature I worked on. This
            fictional example runs entirely in your browser.
          </p>
        </div>
        <fieldset className="subscription-scenarios">
          <legend>Choose a scenario</legend>
          <label>
            <input
              type="radio"
              name="subscription-scenario"
              value="success"
              checked={clock.scenario === 'success'}
              onChange={() => reset('success')}
            />
            Successful payments
          </label>
          <label>
            <input
              type="radio"
              name="subscription-scenario"
              value="retry"
              checked={clock.scenario === 'retry'}
              onChange={() => reset('retry')}
            />
            Failed payment + retry
          </label>
          <p>Changing the scenario restarts the demo.</p>
        </fieldset>
        <div className="subscription-clock-face">
          <div>
            <span className="subscription-demo-label">
              SIMULATED DATE · 09:00 UTC
            </span>
            <time dateTime={new Date(clock.now).toISOString()}>
              {date(clock.now)}
            </time>
          </div>
          <button className="subscription-reset" onClick={() => reset()}>
            <RotateCcw size={14} aria-hidden="true" /> Reset demo
          </button>
        </div>
        <div className="subscription-clock-progress" aria-hidden="true">
          <span
            style={{
              width: `${((clock.now - clock.start) / (clock.end - clock.start)) * 100}%`,
            }}
          />
        </div>
        <div className="subscription-account">
          <span>Alex · Studio plan</span>
          <span>S$12 / month · 7-day free trial</span>
        </div>
        <dl className="subscription-stats">
          <div>
            <dt>Subscription</dt>
            <dd
              className={`subscription-status subscription-status-${clock.status}`}
            >
              <i aria-hidden="true" />
              {statusNames[clock.status]}
            </dd>
          </div>
          <div>
            <dt>Total paid</dt>
            <dd>
              S${clock.paidInvoices * MONTHLY_PRICE}
              <span>
                {' '}
                · {clock.paidInvoices} paid{' '}
                {clock.paidInvoices === 1 ? 'invoice' : 'invoices'}
              </span>
            </dd>
          </div>
        </dl>
        <div className="subscription-next-event">
          <span>{finished ? 'Demo complete' : 'Coming up'}</span>
          <strong>
            {finished
              ? 'You explored 6 months.'
              : `${clock.nextAt > clock.end ? 'End of demo' : eventNames[clock.nextEvent]} · ${date(nextDate)}`}
          </strong>
          {!finished && (
            <span>
              {daysAway} {daysAway === 1 ? 'day' : 'days'} away
            </span>
          )}
        </div>
        <fieldset className="subscription-clock-actions">
          <legend className="sr-only">Advance the subscription clock</legend>
          <button
            className="subscription-advance"
            disabled={finished}
            onClick={() => advance(nextDate)}
          >
            Next event <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button disabled={finished} onClick={() => advance(clock.now + DAY)}>
            +1 day
          </button>
          <button
            disabled={finished}
            onClick={() => advance(clock.now + 7 * DAY)}
          >
            +7 days
          </button>
        </fieldset>
        <p className="subscription-explanation">
          Advancing time checks for due events and processes them in order.
          Retry payments keep the original monthly renewal date.
        </p>
        <output className="sr-only" aria-live="polite" aria-atomic="true">
          {date(clock.now)}. {statusNames[clock.status]}. S$
          {clock.paidInvoices * MONTHLY_PRICE} paid.{' '}
          {clock.events[clock.events.length - 1].title}.
          {finished
            ? ' Demo complete. Reset to try again.'
            : ` Next: ${clock.nextAt > clock.end ? 'End of demo' : eventNames[clock.nextEvent]} on ${date(nextDate)}.`}
        </output>
        <div className="subscription-history-heading">
          <h6>Event history</h6>
          <span>
            Newest first · {clock.events.length}{' '}
            {clock.events.length === 1 ? 'event' : 'events'}
          </span>
        </div>
        <ol className="subscription-events" aria-label="Subscription events">
          {visibleEvents.map((event) => (
            <li
              key={event.id}
              className={`subscription-event subscription-event-${event.tone}`}
            >
              <i aria-hidden="true" />
              <div>
                <time dateTime={new Date(event.at).toISOString()}>
                  {date(event.at)}
                </time>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        {history.length > 4 && (
          <button
            className="subscription-history-toggle"
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
          >
            {showHistory
              ? 'Show latest 4 events'
              : `Show ${history.length - 4} earlier ${history.length - 4 === 1 ? 'event' : 'events'}`}
          </button>
        )}
        <p className="subscription-demo-footnote">
          Illustrative rules and fictional data; no real payments are made.
        </p>
      </section>
    </details>
  );
}

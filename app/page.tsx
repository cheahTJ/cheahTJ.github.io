'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { journey } from './journey';
import figures from './collection.json';
import DayScene from './DayScene';
import { createCrowdAudio } from './crowd-audio';

const chapters = [
  'morning',
  'trail',
  'squash',
  'spurs',
  'collection',
  'contact',
];
const labels = [
  'At my desk',
  'I love hiking',
  'Finding my rhythm',
  'Come on you Spurs',
  'Little things in life',
  'Say hello',
];
const hours = ['08:00', '13:00', '17:00', '19:45', '21:00', '21:30'];
const phases = [
  'Morning',
  'Afternoon',
  'Golden hour',
  'Evening',
  'Night',
  'Night',
];
const watchNames = ['Omega Speedmaster', 'Laco Pilot', 'Seiko Presage'];
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function Home() {
  const [work, setWork] = useState(false);
  const [selected, setSelected] = useState('0');
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [figure, setFigure] = useState(3);
  const [watch, setWatch] = useState(0);
  const [courtside, setCourtside] = useState(false);
  const [roof, setRoof] = useState(false);
  const [muted, setMuted] = useState(false);
  const audio = useRef<ReturnType<typeof createCrowdAudio> | null>(null);
  const enterStadium = () => {
    if (!roof && !audio.current) {
      try {
        audio.current = createCrowdAudio(() => setMuted(true));
      } catch {
        setMuted(true);
      }
    }
    audio.current?.setAudible(!roof && !muted && playing);
    setRoof(!roof);
  };
  useEffect(() => {
    const sync = () =>
      audio.current?.setAudible(
        roof && active === 3 && !muted && playing && !document.hidden,
      );
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [roof, active, muted, playing]);
  useEffect(() => () => audio.current?.dispose(), []);
  const [reducedMotion, setReducedMotion] = useState(false);
  const progress = useRef(0);
  const controls = useRef({
    playing,
    figure,
    watch,
    bracelet: false,
    courtside,
    roof,
    work,
    selected: Number(selected),
  });
  useLayoutEffect(() => {
    controls.current = {
      playing,
      figure,
      watch,
      bracelet: false,
      courtside,
      roof,
      work,
      selected: Number(selected),
    };
  }, [playing, figure, watch, courtside, roof, work, selected]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motionFrame = requestAnimationFrame(() => {
      setReducedMotion(media.matches);
      if (media.matches) setPlaying(false);
    });
    const change = () => {
      setReducedMotion(media.matches);
      setPlaying(!media.matches);
    };
    media.addEventListener('change', change);
    const sections = [
      ...document.querySelectorAll<HTMLElement>('.story-chapter'),
    ];
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      let index = 0;
      sections.forEach((s, i) => {
        if (y >= s.offsetTop - 2) index = i;
      });
      const section = sections[index];
      const u = Math.max(
        0,
        Math.min(1, (y - section.offsetTop) / section.offsetHeight),
      );
      progress.current = index + u;
      setActive(index);
      sections.forEach((s, i) => {
        const copy = s.querySelector<HTMLElement>('.chapter-content');
        if (!copy) return;
        const opacity = i === index ? 1 - smooth(0.57, 0.86, u) : 0;
        copy.style.opacity = String(opacity);
        copy.style.visibility = opacity > 0.005 ? 'visible' : 'hidden';
        copy.inert = opacity < 0.1;
        copy.style.setProperty('--copy-y', `${-smooth(0.45, 0.9, u) * 26}px`);
      });
      document.documentElement.style.setProperty(
        '--day-progress',
        `${Math.min(100, (y / (document.documentElement.scrollHeight - innerHeight)) * 100)}%`,
      );
    };
    const scroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    return () => {
      cancelAnimationFrame(motionFrame);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', scroll);
      media.removeEventListener('change', change);
    };
  }, []);
  return (
    <>
      <a className="skip-link" href="#contact">
        Skip to contact
      </a>
      <header className="day-header">
        <a
          className="signature"
          href="#morning"
          aria-label="Tze Juen, back to morning"
        >
          tj<span>.</span>
        </a>
        <nav aria-label="Main navigation">
          <button onClick={() => setWork(true)}>
            My work <ArrowUpRight size={14} />
          </button>
          <a href="/cheah-tze-juen-resume.pdf" target="_blank" rel="noreferrer">
            Résumé <ArrowUpRight size={14} />
          </a>
        </nav>
      </header>
      <DayScene
        progress={progress}
        controls={controls}
        onOpenWork={() => setWork(true)}
      />
      <div
        className="day-phase"
        data-phase={active}
        aria-label={`${hours[active]}, ${phases[active]}`}
      >
        <span className="phase-symbol" aria-hidden="true" />
        <span>
          {hours[active]} <b>{phases[active]}</b>
        </span>
      </div>
      <main className="day-story">
        <section
          className="story-chapter morning"
          id="morning"
          aria-label="Morning at my desk"
        >
          <div className="chapter-content">
            <div className="chapter-copy hero-copy">
              <p className="eyebrow">A DAY IN MY WORLD</p>
              <h1>
                Hello,
                <br />
                I’m Tze Juen<span>.</span>
              </h1>
              <p className="lead">Programmer by heart.</p>
              <p className="intro-purpose">
                Eager to understand stakeholder needs and grow into a
                front-facing engineer.
              </p>
              <p className="credentials">
                NUS Computer Science · SG Digital Scholar
              </p>
              <button className="primary-action" onClick={() => setWork(true)}>
                Open my work <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="chapter-bottom">
              <a href="#trail">
                Scroll into my day <ArrowDown size={16} />
              </a>
            </div>
          </div>
        </section>
        <section
          className="story-chapter trail"
          id="trail"
          aria-label="Afternoon on the trail"
        >
          <div className="chapter-content">
            <div className="chapter-copy">
              <h2>
                I love
                <br />
                hiking<span>.</span>
              </h2>
              <p className="lead">
                Some of my favourite ideas start
                <br className="desktop-break" /> a long way from a screen.
              </p>
              <p className="story-text">
                The alpine trails of Banff remind me to slow down, look closer,
                and keep exploring.
              </p>
            </div>
            <div className="chapter-bottom">
              <span>
                Moraine Lake, Banff{' '}
                <a
                  className="terrain-credit"
                  href="/terrain-credits.txt"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Terrain data credits"
                >
                  <ArrowUpRight size={14} />
                </a>
              </span>
              <a href="#squash">
                Back for a rally <ArrowDown size={16} />
              </a>
            </div>
          </div>
        </section>
        <section
          className="story-chapter squash"
          id="squash"
          aria-label="Squash court"
        >
          <div className="chapter-content">
            <div className="chapter-copy">
              <h2>
                Finding
                <br />
                my rhythm<span>.</span>
              </h2>
              <p className="lead">Quick feet, rapid ball, dynamic gameplay.</p>
              <p className="story-text">
                Squash is my reset. I love the pace, the little adjustments, and
                the feeling of earning the next point.
              </p>
              <button
                className="outline-action"
                aria-pressed={courtside}
                onClick={() => setCourtside(!courtside)}
              >
                {courtside ? 'Back to the gallery' : 'Step courtside'}{' '}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="chapter-bottom">
              <a href="#spurs">
                Under the lights <ArrowDown size={16} />
              </a>
            </div>
          </div>
        </section>
        <section
          className="story-chapter spurs"
          id="spurs"
          data-entered={roof}
          aria-label="Tottenham Hotspur Stadium"
        >
          <div className="chapter-content">
            <div className="chapter-copy stadium-copy">
              <h2>
                {roof ? (
                  <>
                    To dare is to do<span>.</span>
                  </>
                ) : (
                  <>
                    To dare
                    <br />
                    is to do<span>.</span>
                  </>
                )}
              </h2>
              <p className="lead">
                A Tottenham Hotspur supporter.
                <br />
                Through every twist in the story.
              </p>
              <p className="story-text">
                European champions. A supporter since 2020, when a game of FIFA
                introduced me to Spurs. North London forever. COYS.
              </p>
              <button
                className="outline-action"
                aria-pressed={roof}
                onClick={enterStadium}
              >
                {roof ? 'Leave the stadium' : 'Enter the stadium'}{' '}
                <ArrowUpRight size={16} />
              </button>
              {roof && (
                <button
                  className="stadium-sound"
                  onClick={() => setMuted(!muted)}
                  aria-pressed={muted}
                  aria-label={muted ? 'Unmute trumpet' : 'Mute trumpet'}
                >
                  {muted ? 'Sound off' : 'Sound on'}
                </button>
              )}
            </div>
            <div className="chapter-bottom">
              <a href="#collection">
                Home, at last <ArrowDown size={16} />
              </a>
            </div>
          </div>
        </section>
        <section
          className="story-chapter collection"
          id="collection"
          aria-label="My Funko Pop and watch collections"
        >
          <div className="chapter-content">
            <div className="collection-heading">
              <h2>
                Little things in life<span>.</span>
              </h2>
            </div>
            <div className="collection-controls">
              <div className="collection-side">
                <p className="eyebrow">MY FUNKO POP COLLECTION</p>
                <h3 aria-live="polite">{figures[figure]}</h3>
                <div className="selector-row">
                  <button
                    aria-label="Previous Funko Pop"
                    onClick={() =>
                      setFigure((figure + figures.length - 1) % figures.length)
                    }
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>
                    {String(figure + 1).padStart(2, '0')} / {figures.length}
                  </span>
                  <button
                    aria-label="Next Funko Pop"
                    onClick={() => setFigure((figure + 1) % figures.length)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="collection-side">
                <p className="eyebrow">WATCHES I LOVE</p>
                <h3 aria-live="polite">{watchNames[watch]}</h3>
                <div className="selector-row watches">
                  {['Omega', 'Laco', 'Seiko'].map((name, i) => (
                    <button
                      key={name}
                      aria-pressed={watch === i}
                      onClick={() => setWatch(i)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="chapter-bottom">
              <a href="#contact">
                Keep the conversation going <ArrowDown size={16} />
              </a>
            </div>
          </div>
        </section>
        <section
          className="story-chapter contact"
          id="contact"
          aria-label="Connect with Tze Juen"
        >
          <div className="chapter-content contact-content">
            <div className="contact-intro">
              <Image
                unoptimized
                src="/images/portrait.png"
                alt="Cheah Tze Juen"
                width="96"
                height="96"
              />
            </div>
            <h2>
              Your story.
              <br />
              I’m listening<span>.</span>
            </h2>
            <p>
              I’m always curious about what’s next.
              <br className="desktop-break" /> An idea, an opportunity, or a
              good story — I’d love to hear it.
            </p>
            <div className="contact-links">
              <a
                className="primary-action"
                href="mailto:cheahtzejuen@gmail.com"
              >
                Say hello <ArrowUpRight size={18} />
              </a>
              <a
                href="https://www.linkedin.com/in/tzejuen-cheah"
                target="_blank"
                rel="noreferrer"
              >
                Find me on LinkedIn <ArrowUpRight size={16} />
              </a>
            </div>
            <footer>
              <span>Cheah Tze Juen · Singapore</span>
              <a href="#morning">Another day? ↑</a>
            </footer>
          </div>
        </section>
      </main>
      <aside className="day-rail" aria-label="Day chapters">
        <span className="day-hour">{hours[active]}</span>
        <nav aria-label="Jump to a chapter">
          {chapters.map((id, i) => (
            <a
              key={id}
              href={`#${id}`}
              aria-label={labels[i]}
              aria-current={active === i ? 'step' : undefined}
            >
              <span className="rail-dot" />
              <span className="rail-label">{labels[i]}</span>
            </a>
          ))}
        </nav>
        <button
          className="motion-toggle"
          disabled={reducedMotion}
          aria-label={
            reducedMotion
              ? 'Motion reduced by device setting'
              : playing
                ? 'Pause motion'
                : 'Play motion'
          }
          aria-pressed={!playing}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
      </aside>
      <div className="day-progress" aria-hidden="true" />
      <Dialog open={work} onOpenChange={setWork}>
        <DialogContent className="work-window" showCloseButton={false}>
          <div className="window-bar">
            <span className="window-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>tzejuen / my-work</span>
            <DialogClose className="window-close" aria-label="Close my work">
              <X size={20} />
            </DialogClose>
          </div>
          <div className="work-header">
            <div>
              <p className="eyebrow">INTERNSHIPS & PERSONAL PROJECT</p>
              <DialogTitle>My engineering experience.</DialogTitle>
            </div>
            <a
              href="/cheah-tze-juen-resume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Full résumé <ArrowUpRight size={15} />
            </a>
          </div>
          <DialogDescription className="sr-only">
            Explore my internships and a personal project. Select a company to
            read what I built.
          </DialogDescription>
          <Tabs
            value={selected}
            onValueChange={(v) => setSelected(String(v))}
            orientation="vertical"
            className="work-tabs"
          >
            <TabsList className="company-list">
              {journey.map((j, i) => (
                <TabsTrigger
                  className="company-tab"
                  key={j.company}
                  value={String(i)}
                >
                  <span>0{i + 1}</span>
                  {j.company}
                  <ArrowUpRight size={14} />
                </TabsTrigger>
              ))}
              <TabsTrigger className="company-tab project-tab" value="5">
                <span>↳</span>Faith Companion
                <ArrowUpRight size={14} />
              </TabsTrigger>
            </TabsList>
            {journey.map((j, i) => (
              <TabsContent
                className="work-detail"
                key={j.company}
                value={String(i)}
              >
                <p className="work-date">{j.date}</p>
                <h3>{j.company}</h3>
                <p className="work-role">{j.role}</p>
                <h4>{j.theme}</h4>
                {j.intro && <p>{j.intro}</p>}
                <ul>
                  {j.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {j.company === 'IMDA' && (
                  <p className="work-award">{j.highlight}</p>
                )}
                <div className="work-tech">{j.tech.join(' · ')}</div>
              </TabsContent>
            ))}
            <TabsContent className="work-detail" value="5">
              <p className="work-date">PERSONAL PROJECT</p>
              <h3>Faith Companion</h3>
              <p className="work-role">
                Personal project · Android application
              </p>
              <h4>One place for church activities.</h4>
              <p>
                Built an Android application that gives churchgoers one place to
                find and take part in church activities.
              </p>
              <div className="work-tech">Flutter · Firebase · Android</div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

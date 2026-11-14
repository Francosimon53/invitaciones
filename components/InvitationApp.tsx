"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { saveRsvp } from "@/app/actions";
import type { Reservation } from "@/lib/reservation";
import { LANG_CHOICE_COOKIE, type Lang } from "@/lib/i18n";
import type { InvitationView } from "@/lib/view";
import { EFFECTS } from "@/lib/effects";
import { MagicCanvas } from "./MagicCanvas";
import { Countdown } from "./Countdown";
import { CalendarOptions } from "./CalendarOptions";
import { ArrowDown, Blossom, CalendarDays, Check, ChevronDown, Crystal as SnowCrystal, MapPin, Music2, Pause, Phone, Play, SnowflakeIcon, Sparkles } from "./icons";
import "./invitation-extra.css";

export interface GuestInfo {
  token: string;
  name: string;
}

interface Props {
  view: InvitationView;
  initialLang: Lang;
  /** Nombre que aparece en el sobre y en el formulario (enlace personal o ?familia=). */
  family: string;
  guest: GuestInfo | null;
  initialReservation: Reservation | null;
}

type Stage = "closed" | "opening" | "open";

const YEAR = 60 * 60 * 24 * 365;

/** La invitación: mismo diseño, clases y comportamiento que la original, con los datos de cada evento. */
export function InvitationApp({ view, initialLang, family: initialFamily, guest, initialReservation }: Props) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [stage, setStage] = useState<Stage>("closed");
  const [snow, setSnow] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showMobileRsvp, setShowMobileRsvp] = useState(false);
  const [celebration, setCelebration] = useState(0);
  const [family, setFamily] = useState(initialReservation?.family || initialFamily || "");
  const [attending, setAttending] = useState<boolean | null>(initialReservation ? initialReservation.attending : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [already, setAlready] = useState(false);
  const [wasUpdate, setWasUpdate] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(initialReservation);
  const [editing, setEditing] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicFallback, setMusicFallback] = useState(false);
  const [closed, setClosed] = useState(Date.now() >= view.deadlineMs);
  const audioRef = useRef<HTMLAudioElement>(null);
  const heroRef = useRef<HTMLHeadingElement>(null);
  const s = view.strings[lang];
  const cal = view.calendar[lang];
  const isOpen = stage !== "closed";
  const simulated = view.mode !== "live";
  // movimiento propio del estilo; los de invierno no tienen entrada y conservan la nieve
  const effects = (EFFECTS as Partial<Record<string, (typeof EFFECTS)[keyof typeof EFFECTS]>>)[view.theme] ?? null;
  const MotionIcon = effects ? Sparkles : SnowflakeIcon;
  // el adorno entre secciones: cristal de nieve de noche, flor en los estilos de día
  const Crystal = view.day ? Blossom : SnowCrystal;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /** Solo el selector ES/EN guarda el idioma: así, mientras el invitado no elija, manda el idioma de su teléfono. */
  const chooseLang = (next: Lang) => {
    setLang(next);
    document.cookie = `${LANG_CHOICE_COOKIE}=${next}; path=/; max-age=${YEAR}; samesite=lax`;
  };

  useEffect(() => {
    document.body.classList.toggle("envelope-closed", stage !== "open");
    return () => document.body.classList.remove("envelope-closed");
  }, [stage]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setClosed(Date.now() >= view.deadlineMs);
  }, [view.deadlineMs]);

  useEffect(() => {
    if (stage !== "open") {
      setShowMobileRsvp(false);
      return;
    }
    const hero = document.querySelector(".palace-hero");
    const rsvp = document.getElementById("confirmar");
    if (!hero || !rsvp) return;
    let heroVisible = true;
    let rsvpVisible = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroVisible = e.isIntersecting;
        if (e.target === rsvp) rsvpVisible = e.isIntersecting;
      }
      setShowMobileRsvp(!heroVisible && !rsvpVisible);
    });
    io.observe(hero);
    io.observe(rsvp);
    return () => io.disconnect();
  }, [stage]);

  const playAudio = (el: HTMLAudioElement) => {
    el.volume = 0.45;
    setMusicFallback(false);
    el.play().catch((err: unknown) => {
      if (!(err instanceof Error) || err.name !== "AbortError") setMusicFallback(true);
    });
  };

  const openEnvelope = () => {
    if (stage !== "closed") return;
    setStage("opening");
    if (audioRef.current) playAudio(audioRef.current);
    window.setTimeout(() => setCelebration((c) => c + 1), 900);
    window.setTimeout(
      () => {
        setStage("open");
        heroRef.current?.focus({ preventScroll: true });
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 150 : 2100,
    );
  };

  const toggleMusic = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) playAudio(el);
    else el.pause();
  };

  const openAgain = () => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setStage("closed");
    setCelebration(0);
    audioRef.current?.pause();
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (attending === null || saving) return;
    const clean = family.replace(/\s+/g, " ").trim();
    if (clean.length < 2) {
      setError(s.errName);
      return;
    }
    setSaving(true);
    setError("");
    setAlready(false);
    if (simulated) {
      // muestra y vista previa: se ve igual que la real, pero no se guarda nada
      window.setTimeout(() => {
        const updated = reservation !== null;
        setReservation({ id: "muestra", family: clean, attending, code: "MUESTRA" });
        setEditing(false);
        setWasUpdate(updated);
        if (!updated) setCelebration((c) => c + 1);
        setSaving(false);
      }, 500);
      return;
    }
    try {
      const res = await saveRsvp({ slug: view.slug, family: clean, attending, guestToken: guest?.token ?? null, lang });
      if (!res.ok) {
        if (res.error === "already") {
          setAlready(true);
          return;
        }
        setError(res.error === "closed" ? s.errClosed : res.error === "name" ? s.errName : s.errSave);
        if (res.error === "closed") setClosed(true);
        return;
      }
      setReservation(res.reservation);
      setEditing(false);
      setWasUpdate(res.updated);
      if (!res.updated) setCelebration((c) => c + 1);
    } catch {
      setError(s.errNetwork);
    } finally {
      setSaving(false);
    }
  }

  const addressee = family || s.defaultGuest;

  return (
    <>
      <audio
        ref={audioRef}
        src={view.music}
        preload="none"
        loop
        onPlay={() => setMusicPlaying(true)}
        onPause={() => setMusicPlaying(false)}
        onError={() => {
          setMusicFallback(true);
          setMusicPlaying(false);
        }}
      />
      <MagicCanvas active snow={snow} effects={effects} celebration={celebration} reducedMotion={reducedMotion} palette={view.snow} />

      {view.mode === "preview" && <p className="preview-ribbon">{s.previewBanner}</p>}

      <header className={`site-header ${isOpen ? "is-open" : ""}`}>
        <a
          href="#"
          className="monogram"
          aria-label={s.monogramLabel}
          onClick={(e) => {
            e.preventDefault();
            if (stage === "open") window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          {view.monogram}
          <span>XV</span>
        </a>
        <span className="header-title">{s.headerTitle}</span>
        <div className="header-controls">
          <button
            className={`icon-button snow-button ${snow ? "selected" : ""}`}
            aria-label={snow ? s.snowOn : s.snowOff}
            aria-pressed={snow}
            onClick={() => setSnow((v) => !v)}
          >
            <MotionIcon size={17} />
          </button>
          {isOpen && (
            <button className="icon-button music-button" aria-label={musicPlaying ? s.musicPause : s.musicPlay} onClick={toggleMusic}>
              {musicPlaying ? (
                <span className="music-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <Music2 size={17} />
              )}
            </button>
          )}
          <div className="languages" aria-label={s.language}>
            <button onClick={() => chooseLang("es")} aria-pressed={lang === "es"}>
              ES
            </button>
            <span>/</span>
            <button onClick={() => chooseLang("en")} aria-pressed={lang === "en"}>
              EN
            </button>
          </div>
        </div>
      </header>

      {stage !== "open" && (
        <section className={`envelope-gate ${stage}`} aria-label={s.gateLabel}>
          <div className="gate-light" />
          <div className="gate-stars" />
          <div className="gate-intro">
            <span className="eyebrow">{s.gateEyebrow}</span>
            <h1>{s.gateTitle}</h1>
            <div className="tiny-divider">
              <i />
              <Crystal />
              <i />
            </div>
          </div>
          <div className="envelope-stage">
            <div className="letter-glimmer">
              <Crystal />
              <span>{view.honoree}</span>
            </div>
            <div className="envelope-layers">
              <img className="envelope-back" src={view.images.envelope} alt={s.envelopeAlt} fetchPriority="high" />
              <img className="envelope-front" src={view.images.envelope} alt="" aria-hidden="true" />
              <div className="envelope-flap">
                <img src={view.images.envelope} alt="" aria-hidden="true" />
              </div>
              <div className="envelope-addressee">
                <span>{s.addressee}</span>
                <h2 className={addressee.length > 30 ? "long-name" : ""}>{addressee}</h2>
              </div>
              <span className="snowflake-seal" aria-hidden="true">
                <span className="seal-sparkle" />
                <span className="seal-sparkle second" />
                <span className="seal-halo" />
              </span>
              <button type="button" className="envelope-tap-area" onClick={openEnvelope} aria-label={s.tapAnywhere} disabled={stage !== "closed"} />
              <span className="envelope-note">{s.envelopeNote}</span>
            </div>
          </div>
          <button type="button" className="open-hint envelope-open-cta" onClick={openEnvelope} disabled={stage !== "closed"}>
            <MotionIcon size={20} />
            <span>{stage === "opening" ? s.opening : s.tapToOpen}</span>
            <ArrowDown size={18} />
          </button>
          <p className="envelope-open-help">{s.openHelp}</p>
          <p className="sound-hint">
            <Music2 size={12} />
            {s.soundHint}
          </p>
          <p className="gate-date">{s.dateLabel}</p>
        </section>
      )}

      <main className={`invitation ${stage === "closed" ? "waiting" : "revealed"}`} aria-hidden={!isOpen} inert={!isOpen}>
        <section className="palace-hero">
          <img src={view.images.palace} className="palace-image" alt={s.palaceAlt} fetchPriority="high" />
          {celebration > 0 && <div className="firework-illumination" key={celebration} />}
          <div className="hero-wash" />
          <div className="royal-frame">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="hero-title">
            <Crystal className="hero-crystal" />
            <p className="eyebrow">{s.heroEyebrow}</p>
            <h1 ref={heroRef} tabIndex={-1}>
              {s.heroName}
            </h1>
            <div className="xv-title">
              <i />
              {s.heroXv}
              <i />
            </div>
            <p className="hero-subtitle">{s.heroSubtitle}</p>
          </div>
          <div className="hero-bottom">
            <p className="hero-poem">{s.heroPoem}</p>
            <div className="hero-event">
              <div>
                <span>{s.dayUpper}</span>
                <strong>{s.dateLabel}</strong>
              </div>
              <div className="event-rule" />
              <div>
                <span>{view.venueUpper}</span>
                <strong className="event-hour">{s.timeRange}</strong>
              </div>
            </div>
            <address className="hero-address">
              {view.addressLine1} <span>·</span> {view.addressLine2}
            </address>
            <div className="hero-attire">
              <strong>{s.attire}</strong>
              <p>{s.attireNote}</p>
            </div>
            <div className="hero-actions">
              <a href="#confirmar" className="silver-button">
                <Sparkles size={16} />
                {s.rsvpCta}
              </a>
              <a className="outline-button" href={view.directionsUrl} target="_top" rel="noopener noreferrer">
                <MapPin size={16} />
                {s.directions}
              </a>
            </div>
            <a href="#detalles" className="discover-link">
              {s.discover}
              <ChevronDown size={15} />
            </a>
          </div>
        </section>

        <section id="historia" className="story-section section-reveal">
          <Crystal className="section-crystal" />
          <p className="eyebrow">{s.storyEyebrow}</p>
          <h2>
            {s.storyTitle}
            <br />
            <em>{s.storyTitleEm}</em>
          </h2>
          <p className="story-copy">{s.storyCopy}</p>
          <p className="signature">{view.honoree}</p>
          <div className="tiny-divider">
            <i />
            <Crystal />
            <i />
          </div>
          <p className="eyebrow countdown-label">{s.countdownLabel}</p>
          <Countdown startMs={view.startMs} s={s} />
        </section>

        <section className="evening-section" id="detalles">
          <div className="evening-image" role="img" aria-label={s.stepsAlt} />
          <div className="evening-content">
            <p className="eyebrow">{s.saveEyebrow}</p>
            <h2>
              {s.saveTitle}
              <br />
              <em>{s.saveTitleEm}</em>
            </h2>
            <div className="detail-row">
              <CalendarDays />
              <div>
                <h3>{s.longDate}</h3>
                <p>{s.timeRange}</p>
                <small>{s.localTime}</small>
              </div>
            </div>
            <div className="detail-row">
              <MapPin />
              <div>
                <h3>{view.venue}</h3>
                <p>
                  {view.addressLine1}
                  <br />
                  {view.addressLine2}
                </p>
              </div>
            </div>
            <div className="detail-actions">
              <a className="outline-button" href={view.directionsUrl} target="_top" rel="noopener noreferrer">
                <MapPin size={14} />
                {s.directions}
              </a>
              <CalendarOptions s={s} google={cal.google} ics={cal.ics} />
            </div>
            <div className="dress-code">
              <div>
                <Sparkles size={20} />
                <span className="eyebrow">{s.dressEyebrow}</span>
              </div>
              <h3>{s.dressTitle}</h3>
              <p>{s.attireNote}</p>
              <span className="dress-swatches">
                <i />
                <i />
              </span>
            </div>
          </div>
        </section>

        <section className="rsvp-section" id="confirmar">
          <div className="rsvp-intro">
            <Crystal className="section-crystal" />
            <p className="eyebrow">{s.rsvpEyebrow}</p>
            <h2>
              {s.rsvpTitle}
              <br />
              <em>{s.rsvpTitleEm}</em>
            </h2>
            <p>{s.rsvpCopy}</p>
            <div className="rsvp-deadline">
              <span>{s.replyBefore}</span>
              <strong>{s.deadline}</strong>
            </div>
          </div>
          <div className="rsvp-card">
            {reservation && !editing ? (
              <div className="reservation-receipt" role="status">
                <div className="receipt-check">
                  <Check />
                </div>
                <p className="eyebrow">{wasUpdate ? s.savedUpdated : s.saved}</p>
                <h3>{reservation.attending ? s.savedYesTitle : s.savedNoTitle}</h3>
                <p>{reservation.attending ? s.savedYesCopy : s.savedNoCopy}</p>
                <div className="receipt-details">
                  <strong>{reservation.family}</strong>
                  <span>{reservation.attending ? s.confirmed : s.declined}</span>
                </div>
                <small className="receipt-code">
                  {s.yourConfirmation} · {reservation.code}
                </small>
                {reservation.attending && <CalendarOptions s={s} google={cal.google} ics={cal.ics} />}
                <button className="text-button" disabled={closed} onClick={() => setEditing(true)}>
                  {s.updateReply}
                </button>
                <p className="receipt-note">{simulated ? s.demoNote : s.receiptNote}</p>
                {view.creditUrl && <CreditCta href={view.creditUrl} ask={s.creditAsk} cta={s.creditCta} />}
              </div>
            ) : (
              <form onSubmit={submit}>
                <p className="form-heading">
                  <span>RSVP</span>
                </p>
                <label className="field-label" htmlFor="family">
                  {s.fullName}
                </label>
                <input
                  id="family"
                  name="family"
                  autoComplete="name"
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  placeholder={s.namePlaceholder}
                  minLength={2}
                  maxLength={90}
                  required
                />
                <fieldset>
                  <legend>{s.willAttend}</legend>
                  <div className="attendance-options">
                    <button type="button" aria-pressed={attending === true} className={attending === true ? "selected" : ""} onClick={() => setAttending(true)}>
                      <Sparkles size={17} />
                      {s.yes}
                    </button>
                    <button type="button" aria-pressed={attending === false} className={attending === false ? "selected" : ""} onClick={() => setAttending(false)}>
                      {s.no}
                    </button>
                  </div>
                </fieldset>
                {error && (
                  <p role="alert" className="form-error">
                    {error}
                  </p>
                )}
                {already && (
                  <p role="status" className="form-note">
                    {s.alreadyConfirmed}
                  </p>
                )}
                {closed ? (
                  <p className="form-error">{s.deadlinePassed}</p>
                ) : (
                  <button className="silver-button submit-button" type="submit" disabled={attending === null || saving}>
                    {saving ? s.saving : s.send}
                    {!saving && <Check size={16} />}
                  </button>
                )}
                <p className="form-footnote">{simulated ? s.demoNote : s.footnote}</p>
                {editing && (
                  <button className="text-button cancel-edit" type="button" onClick={() => setEditing(false)}>
                    {s.backToConfirmation}
                  </button>
                )}
              </form>
            )}
            {view.phone && view.phoneHref && (
              <div className="rsvp-contact">
                <p>{s.inquiries}</p>
                <a href={`tel:${view.phoneHref}`} aria-label={s.callLabel}>
                  <Phone size={17} />
                  <span>{view.phone}</span>
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="closing-section">
          <Crystal className="section-crystal" />
          <h2>
            {s.closingTitle}
            <br />
            <em>{s.closingTitleEm}</em>
          </h2>
          <p>
            {view.honoreeUpper} · {s.dateLabel}
          </p>
          <button className="text-button" onClick={openAgain}>
            <Sparkles size={14} />
            {s.openAgain}
          </button>
          <div className="soundtrack">
            <span className="eyebrow">
              <Music2 size={13} />
              {s.soundtrack}
            </span>
            <p>{s.trackTitle}</p>
            {musicFallback && (
              <p className="music-fallback" role="status">
                {s.musicFallback}
              </p>
            )}
            <button className="text-button" onClick={toggleMusic}>
              {musicPlaying ? <Pause size={14} /> : <Play size={14} />}
              {musicPlaying ? s.pause : s.play}
            </button>
          </div>
        </section>

        <footer>
          <span>{view.honoreeUpper}</span>
          <Crystal />
          <span>{s.footerTitle}</span>
          {view.creditUrl && <CreditCta href={view.creditUrl} ask={s.creditAsk} cta={s.creditCta} />}
        </footer>
      </main>

      {stage === "open" && showMobileRsvp && (
        <a href="#confirmar" className="mobile-rsvp">
          <Sparkles size={15} />
          {reservation ? s.myRsvp : s.rsvpShort}
        </a>
      )}
    </>
  );
}

/** «Pide la tuya» como botón: la pregunta encima y el botón con el estilo de «Cómo llegar». */
function CreditCta({ href, ask, cta }: { href: string; ask: string; cta: string }) {
  return (
    <div className="credit-cta">
      <p>{ask}</p>
      <a className="outline-button credit-button" href={href} target="_blank" rel="noopener noreferrer">
        <Sparkles size={14} />
        {cta}
      </a>
    </div>
  );
}

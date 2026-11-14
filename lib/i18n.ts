/**
 * Idioma de la invitación y sus textos (ES/EN), los del diseño original con los datos de cada evento.
 * Los textos se arman en el servidor para los dos idiomas y viajan ya listos al navegador: así las fechas y horas
 * salen idénticas en el servidor y en el teléfono (sin diferencias de ICU entre Node y Safari).
 */
import type { EventData } from "./event";
import { dateLabel, dayName, deadlineLabel, longDate, timeRange } from "./event";
import { THEMES } from "./themes";

export type Lang = "es" | "en";
export const LANGS: Lang[] = ["es", "en"];

export interface Strings {
  monogramLabel: string;
  headerTitle: string;
  snowOn: string;
  snowOff: string;
  musicPause: string;
  musicPlay: string;
  language: string;
  gateLabel: string;
  gateEyebrow: string;
  gateTitle: string;
  envelopeAlt: string;
  addressee: string;
  defaultGuest: string;
  tapAnywhere: string;
  envelopeNote: string;
  opening: string;
  tapToOpen: string;
  openHelp: string;
  soundHint: string;
  palaceAlt: string;
  heroEyebrow: string;
  heroName: string;
  heroXv: string;
  heroSubtitle: string;
  heroPoem: string;
  dateLabel: string;
  dayUpper: string;
  dayTitle: string;
  /** "Sábado, 15 de mayo de 2027": la fecha completa de la sección de detalles. */
  longDate: string;
  timeRange: string;
  attire: string;
  attireNote: string;
  rsvpCta: string;
  directions: string;
  discover: string;
  storyEyebrow: string;
  storyTitle: string;
  storyTitleEm: string;
  storyCopy: string;
  countdownLabel: string;
  countdownAria: string;
  units: [string, string, string, string];
  stepsAlt: string;
  saveEyebrow: string;
  saveTitle: string;
  saveTitleEm: string;
  localTime: string;
  addToCalendar: string;
  calendarHelp: string;
  dressEyebrow: string;
  dressTitle: string;
  rsvpEyebrow: string;
  rsvpTitle: string;
  rsvpTitleEm: string;
  rsvpCopy: string;
  replyBefore: string;
  deadline: string;
  saved: string;
  savedYesTitle: string;
  savedNoTitle: string;
  savedYesCopy: string;
  savedNoCopy: string;
  confirmed: string;
  declined: string;
  yourConfirmation: string;
  updateReply: string;
  receiptNote: string;
  fullName: string;
  namePlaceholder: string;
  willAttend: string;
  yes: string;
  no: string;
  deadlinePassed: string;
  saving: string;
  send: string;
  footnote: string;
  backToConfirmation: string;
  inquiries: string;
  callLabel: string;
  closingTitle: string;
  closingTitleEm: string;
  openAgain: string;
  soundtrack: string;
  trackTitle: string;
  musicFallback: string;
  pause: string;
  play: string;
  footerTitle: string;
  creditAsk: string;
  creditCta: string;
  myRsvp: string;
  rsvpShort: string;
  errClosed: string;
  errSave: string;
  errNetwork: string;
  errName: string;
  alreadyConfirmed: string;
  savedUpdated: string;
  /** Aviso de las invitaciones de muestra y de las vistas previas: la respuesta no se guarda. */
  demoNote: string;
  previewBanner: string;
}

/** Textos que la clienta puede cambiar (si no, van los del diseño). */
export const DEFAULT_TEXTS: Record<"poem" | "story", Record<Lang, string>> = {
  poem: {
    es: "Una noche para soñar. Un recuerdo para siempre.",
    en: "A night to dream. A memory to keep forever.",
  },
  story: {
    es: "Quince años de sueños y hermosos recuerdos han escrito mi historia. Hoy comienza un nuevo capítulo, y quiero compartirlo con quienes han sido parte de ella.",
    en: "Fifteen years of dreams and beautiful memories have written my story. A new chapter is about to begin, and I would love to share it with those who have been part of it.",
  },
};

function upper(s: string, lang: Lang): string {
  return s.toLocaleUpperCase(lang === "es" ? "es" : "en");
}

/** Posesivo inglés: "Valentina’s", "Inés’" no; con s final también lleva ’s (estilo de invitación). */
function possessive(name: string): string {
  return `${name}’s`;
}

export function buildStrings(lang: Lang, ev: EventData): Strings {
  const t = THEMES[ev.theme];
  const name = ev.honoree;
  const NAME = upper(name, lang);
  const deadline = deadlineLabel(ev, lang);
  const day = dayName(ev, lang);
  const custom = (key: "poem" | "story" | "attire") => (ev.texts[key]?.[lang] ?? "").trim();
  const attireNote = custom("attire") || t.attire[lang];
  const phone = ev.phone ?? "";

  if (lang === "es") {
    return {
      monogramLabel: `${name}, quince años`,
      headerTitle: t.header.es,
      snowOn: `Pausar ${t.motion.es}`,
      snowOff: `Activar ${t.motion.es}`,
      musicPause: "Pausar música",
      musicPlay: "Escuchar música",
      language: "Idioma",
      gateLabel: "Tu invitación",
      gateEyebrow: `${NAME} · XV`,
      gateTitle: "La magia está por comenzar",
      envelopeAlt: t.envelopeAlt.es,
      addressee: "UNA INVITACIÓN ESPECIAL PARA",
      defaultGuest: "Familia invitada",
      tapAnywhere: "Toca cualquier parte del sobre para abrir tu invitación",
      envelopeNote: `CON CARIÑO, ${NAME}`,
      opening: "Abriendo tu invitación…",
      tapToOpen: "TOCA AQUÍ PARA ABRIR",
      openHelp: "También puedes tocar cualquier parte del sobre",
      soundHint: "Abre con música · Activa el sonido",
      palaceAlt: t.palaceAlt.es,
      heroEyebrow: "ESTÁS INVITADO A CELEBRAR",
      heroName: name,
      heroXv: "MIS 15 AÑOS",
      heroSubtitle: t.title.es,
      heroPoem: custom("poem") || DEFAULT_TEXTS.poem.es,
      dateLabel: dateLabel(ev, "es"),
      dayUpper: upper(day, "es"),
      dayTitle: day.charAt(0).toLocaleUpperCase("es") + day.slice(1),
      longDate: longDate(ev, "es"),
      timeRange: timeRange(ev),
      attire: "VESTIMENTA FORMAL",
      attireNote,
      rsvpCta: "Confirmar mi asistencia",
      directions: "Cómo llegar",
      discover: "Ver la información completa",
      storyEyebrow: "HAY SUEÑOS QUE MERECEN CELEBRARSE",
      storyTitle: "Quince años de sueños.",
      storyTitleEm: "Una noche inolvidable.",
      storyCopy: custom("story") || DEFAULT_TEXTS.story.es,
      countdownLabel: "LA CUENTA REGRESIVA PARA SOÑAR JUNTOS",
      countdownAria: "Tiempo para la celebración",
      units: ["días", "horas", "minutos", "segundos"],
      stepsAlt: t.stepsAlt.es,
      saveEyebrow: "GUARDA ESTA FECHA",
      saveTitle: "Nos vemos",
      saveTitleEm: "bajo las estrellas",
      localTime: `Hora local de ${ev.cityLabel}`,
      addToCalendar: "Añadir al calendario",
      calendarHelp: "Elige tu calendario y guarda el evento. Si descargas el archivo, ábrelo para importarlo.",
      dressEyebrow: "VESTIMENTA",
      dressTitle: "Vestimenta formal",
      rsvpEyebrow: "TU LUGAR EN ESTA HISTORIA",
      rsvpTitle: "¿Me acompañas",
      rsvpTitleEm: "a vivir este sueño?",
      rsvpCopy: "Tu presencia hará esta noche aún más especial.",
      replyBefore: "CONFIRMA ANTES DEL",
      deadline,
      saved: "RESPUESTA GUARDADA",
      savedYesTitle: "¡La magia nos espera!",
      savedNoTitle: "Gracias por responder",
      savedYesCopy: "Qué alegría compartir esta noche contigo.",
      savedNoCopy: "Te tendremos presente en esta noche especial.",
      confirmed: "Asistencia confirmada",
      declined: "No asistirá",
      yourConfirmation: "TU CONFIRMACIÓN",
      updateReply: "Modificar mi respuesta",
      receiptNote: `Puedes actualizar tu respuesta desde este mismo enlace antes del ${deadline}.`,
      fullName: "Tu nombre completo",
      namePlaceholder: "Ej. Lucía García",
      willAttend: "¿Podrás asistir?",
      yes: "Sí, asistiré",
      no: "No podré asistir",
      deadlinePassed: "El plazo de confirmación finalizó. Comunícate con la familia anfitriona.",
      saving: "Guardando tu respuesta…",
      send: "Enviar confirmación",
      footnote: `Una respuesta por invitado. Podrás modificarla antes del ${deadline}.`,
      backToConfirmation: "Volver a mi confirmación",
      inquiries: "Consultas sobre la celebración",
      callLabel: `Llamar al ${phone}`,
      closingTitle: "Los mejores recuerdos",
      closingTitleEm: "comienzan contigo.",
      openAgain: "Volver a abrir la magia",
      soundtrack: "LA MÚSICA DE ESTA NOCHE",
      trackTitle: t.title.es,
      musicFallback: "No pudimos reproducir la música. Vuelve a intentarlo.",
      pause: "Pausar",
      play: "Reproducir música",
      footerTitle: t.header.es,
      creditAsk: "¿Te gustó esta invitación?",
      creditCta: "Pide la tuya",
      myRsvp: "Mi confirmación",
      rsvpShort: "Confirmar asistencia",
      errClosed: `El plazo para confirmar terminó. Debías responder antes del ${deadline}. Comunícate con la familia anfitriona.`,
      errSave: "No se pudo guardar tu respuesta. Revisa los datos y tu conexión e inténtalo de nuevo.",
      errNetwork: "No se guardó tu respuesta. Revisa tu conexión.",
      errName: "Escribe tu nombre completo.",
      alreadyConfirmed:
        "Ya tenemos una confirmación con ese nombre. ¡Gracias! Si necesitas cambiarla, usa el enlace que te enviamos o comunícate con la familia.",
      savedUpdated: "RESPUESTA ACTUALIZADA",
      demoNote: "Invitación de muestra: las respuestas no se guardan.",
      previewBanner: "Vista previa · las respuestas no se guardan",
    };
  }

  return {
    monogramLabel: `${possessive(name)} fifteenth birthday`,
    headerTitle: t.header.en,
    snowOn: `Pause ${t.motion.en}`,
    snowOff: `Start ${t.motion.en}`,
    musicPause: "Pause music",
    musicPlay: "Play music",
    language: "Language",
    gateLabel: "Your invitation",
    gateEyebrow: `${NAME} · XV`,
    gateTitle: "The magic is about to begin",
    envelopeAlt: t.envelopeAlt.en,
    addressee: "A SPECIAL INVITATION FOR",
    defaultGuest: "Our special guests",
    tapAnywhere: "Tap anywhere on the envelope to open your invitation",
    envelopeNote: `WITH LOVE, ${NAME}`,
    opening: "Opening your invitation…",
    tapToOpen: "TAP HERE TO OPEN",
    openHelp: "You can also tap anywhere on the envelope",
    soundHint: "Opens with music · Turn your sound on",
    palaceAlt: t.palaceAlt.en,
    heroEyebrow: "YOU ARE CORDIALLY INVITED TO CELEBRATE",
    heroName: possessive(name),
    heroXv: "15TH BIRTHDAY",
    heroSubtitle: t.title.en,
    heroPoem: custom("poem") || DEFAULT_TEXTS.poem.en,
    dateLabel: dateLabel(ev, "en"),
    dayUpper: upper(day, "en"),
    dayTitle: day,
    longDate: longDate(ev, "en"),
    timeRange: timeRange(ev),
    attire: "FORMAL ATTIRE",
    attireNote,
    rsvpCta: "RSVP to the celebration",
    directions: "Get directions",
    discover: "View all celebration details",
    storyEyebrow: "SOME DREAMS DESERVE A CELEBRATION",
    storyTitle: "Fifteen years of dreams.",
    storyTitleEm: "One unforgettable night.",
    storyCopy: custom("story") || DEFAULT_TEXTS.story.en,
    countdownLabel: "COUNTING DOWN TO OUR MAGICAL NIGHT",
    countdownAria: "Time until the celebration",
    units: ["days", "hours", "minutes", "seconds"],
    stepsAlt: t.stepsAlt.en,
    saveEyebrow: "SAVE THE DATE",
    saveTitle: "See you",
    saveTitleEm: "under the stars",
    localTime: `Local time in ${ev.cityLabel}`,
    addToCalendar: "Add to calendar",
    calendarHelp: "Choose your calendar and save the event. If you download the file, open it to import the event.",
    dressEyebrow: "DRESS CODE",
    dressTitle: "Formal attire",
    rsvpEyebrow: "YOUR PLACE IN THIS STORY",
    rsvpTitle: "Will you join me",
    rsvpTitleEm: "for this dream?",
    rsvpCopy: "Your presence will make this night even more special.",
    replyBefore: "PLEASE REPLY BEFORE",
    deadline,
    saved: "RESPONSE SAVED",
    savedYesTitle: "The magic awaits!",
    savedNoTitle: "Thank you for replying",
    savedYesCopy: "We are so happy to share this night with you.",
    savedNoCopy: "We will be thinking of you on this special night.",
    confirmed: "Attendance confirmed",
    declined: "Unable to attend",
    yourConfirmation: "YOUR CONFIRMATION",
    updateReply: "Update my reply",
    receiptNote: `You can update your response using this same link before ${deadline}.`,
    fullName: "Your full name",
    namePlaceholder: "E.g. Lucia Garcia",
    willAttend: "Will you attend?",
    yes: "Yes, I will attend",
    no: "I can’t make it",
    deadlinePassed: "The RSVP deadline has passed. Please contact the host family.",
    saving: "Saving your reply…",
    send: "Send RSVP",
    footnote: `One response per guest. You may update it before ${deadline}.`,
    backToConfirmation: "Back to my confirmation",
    inquiries: "Celebration inquiries",
    callLabel: `Call ${phone}`,
    closingTitle: "The best memories",
    closingTitleEm: "begin with you.",
    openAgain: "Open the magic again",
    soundtrack: "TONIGHT’S SOUNDTRACK",
    trackTitle: t.title.en,
    musicFallback: "We couldn't play the music. Please try again.",
    pause: "Pause",
    play: "Play music",
    footerTitle: t.header.en,
    creditAsk: "Like this invitation?",
    creditCta: "Get yours",
    myRsvp: "My RSVP",
    rsvpShort: "RSVP",
    errClosed: "The RSVP deadline has passed. Please contact the host family.",
    errSave: "Unable to save. Please try again.",
    errNetwork: "Your reply was not saved. Check your connection.",
    errName: "Please enter your full name.",
    alreadyConfirmed:
      "We already have an RSVP under that name. Thank you! If you need to change it, use the link we sent you or contact the host family.",
    savedUpdated: "RESPONSE UPDATED",
    demoNote: "Sample invitation: replies are not saved.",
    previewBanner: "Preview · replies are not saved",
  };
}

export function asLang(value: unknown): Lang | null {
  return value === "es" || value === "en" ? value : null;
}

/** Cookie con el idioma que el invitado eligió a mano en el selector ES/EN; manda sobre el idioma de su teléfono. */
export const LANG_CHOICE_COOKIE = "xv_lang_choice";

/**
 * Idioma del teléfono o navegador (cabecera Accept-Language), solo si es español o inglés.
 * Respeta el orden de preferencia y los pesos q: "pt-BR,pt;q=0.9,en;q=0.8" → "en"; "fr-FR,fr;q=0.9" → null.
 */
export function langFromAcceptLanguage(header: string | null | undefined): Lang | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.split(";").map((p) => p.trim());
      const qParam = params.find((p) => /^q=/i.test(p));
      const q = qParam === undefined ? 1 : Number(qParam.slice(2));
      return { base: tag.toLowerCase().split("-")[0], q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { base } of ranked) {
    const lang = asLang(base);
    if (lang) return lang;
  }
  return null;
}

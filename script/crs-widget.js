// Express Entry CEC — Scriptable Widget
// Medium: CEC draw + CRS trend + personal CRS
// Small: compact CEC trend + personal summary
// Data: IRCC official rounds JSON

// ================= SETTINGS =================

const SETTINGS = {
  DATA_URL:
    "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json",

  PAGE_URL:
    "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html",

  REFRESH_HOURS: 4,
  TIMEOUT_SECONDS: 15,
  MEDIUM_TREND_DRAWS: 8,
  SMALL_TREND_DRAWS: 5,
  PREVIEW_SIZE: "medium"
};

// Fixed widths for consistent alignment.
const LAYOUT = {
  LEFT_WIDTH: 181,
  RIGHT_WIDTH: 127,
  TREND_IMAGE_WIDTH: 165
};

// ================= PERSONAL PROFILE =================

// Personal CRS is an estimate.
// Update the assumptions when your situation changes.

const MY = {
  AGE: 30,

  CELPIP: {
    L: 7,
    R: 7,
    W: 7,
    S: 7
  },

  NOC_TEER: 1,
  EDUCATION: "two_or_more",
  FOREIGN_WORK_YEARS: 1,

  CANADIAN_WORK_YEARS: 1,
  CANADIAN_WORK_VERIFIED: false,

  CANADIAN_EDUCATION_POINTS: 0,
  HIGH_WAGE_WORK_POINTS: 0,
  JOB_OFFER_POINTS: 0,
  OTHER_ADDITIONAL_POINTS: 0,

  LANGUAGE_TARGET_CLB: 10,
  LANGUAGE_TEST_DATE: null,
  CRS_OVERRIDE: null
};

// ================= THEME =================

const C = {
  background: Color.dynamic(
    new Color("#EEF3FB"),
    new Color("#101827")
  ),

  ink: Color.dynamic(
    new Color("#182A45"),
    new Color("#F6F9FF")
  ),

  muted: Color.dynamic(
    new Color("#60718C"),
    new Color("#A8B7CE")
  ),

  blue: Color.dynamic(
    new Color("#1D65CB"),
    new Color("#7FB9FF")
  ),

  latestCard: Color.dynamic(
    new Color("#DEEAFB"),
    new Color("#172B48")
  ),

  chartCard: Color.dynamic(
    new Color("#F7FAFF"),
    new Color("#1A263A")
  ),

  footerCard: Color.dynamic(
    new Color("#E4EBF6"),
    new Color("#1D293E")
  ),

  outline: Color.dynamic(
    new Color("#9DBEEE"),
    new Color("#397AC5")
  ),

  divider: Color.dynamic(
    new Color("#CBD6E7"),
    new Color("#3A4A64")
  ),

  amber: Color.dynamic(
    new Color("#96520B"),
    new Color("#FFCB7A")
  ),

  amberBG: Color.dynamic(
    new Color("#FBEACB"),
    new Color("#563A21")
  ),

  green: Color.dynamic(
    new Color("#136C51"),
    new Color("#9BE3BC")
  ),

  greenBG: Color.dynamic(
    new Color("#D9F1E8"),
    new Color("#24493F")
  )
};

// ================= TEXT HELPER =================

function text(
  parent,
  value,
  size,
  color,
  bold = false,
  minScale = 0.75
) {
  const v = parent.addText(String(value));

  v.font = bold
    ? Font.boldSystemFont(size)
    : Font.systemFont(size);

  v.textColor = color;
  v.lineLimit = 1;
  v.minimumScaleFactor = minScale;

  return v;
}

// ================= FORMATTING =================

function num(value) {
  return Number(
    String(value == null ? "" : value)
      .replace(/,/g, "")
  );
}

function commas(value) {
  return Number(value).toLocaleString("en-CA");
}

function dateShort(iso) {
  const parts = String(iso).split("-");

  const months = [
    "Jan", "Feb", "Mar", "Apr",
    "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec"
  ];

  return `${months[Number(parts[1]) - 1]} ${Number(parts[2])}`;
}

function lastChecked(date) {
  const f = new DateFormatter();

  f.locale = "en_CA";
  f.dateFormat = "MMM d, HH:mm";

  return `Last checked: ${f.string(date)}`;
}

function shortRoundName(name) {
  return String(name)
    .replace(
      /,?\s*\d{4}\s*-\s*Version\s*\d+/gi,
      ""
    )
    .replace(
      /Canadian Experience Class/gi,
      "CEC"
    )
    .replace(
      /Provincial Nominee Program/gi,
      "PNP"
    )
    .replace(
      /French-Language proficiency/gi,
      "French"
    )
    .trim();
}

// ================= IRCC DATA =================

async function fetchDraws() {
  const request = new Request(SETTINGS.DATA_URL);

  request.timeoutInterval = SETTINGS.TIMEOUT_SECONDS;

  const raw = await request.loadJSON();

  if (
    request.response &&
    request.response.statusCode >= 400
  ) {
    throw new Error(
      `IRCC HTTP ${request.response.statusCode}`
    );
  }

  if (!raw || !Array.isArray(raw.rounds)) {
    throw new Error("Invalid IRCC rounds JSON");
  }

  const rounds = raw.rounds
    .map(r => {
      if (!r || typeof r !== "object") {
        return null;
      }

      return {
        number: num(r.drawNumber),
        date: String(r.drawDate || ""),
        crs: num(r.drawCRS),
        ita: num(r.drawSize),
        name: String(r.drawName || "").trim()
      };
    })
    .filter(r =>
      r &&
      Number.isInteger(r.number) &&
      r.number > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
      Number.isInteger(r.crs) &&
      r.crs > 0 &&
      Number.isInteger(r.ita) &&
      r.ita > 0 &&
      r.name
    )
    .sort(
      (a, b) => b.number - a.number
    );

  const cec = rounds.filter(r =>
    /^Canadian Experience Class(?:,?\s*\d{4}\s*-\s*Version\s*\d+)?$/i
      .test(r.name)
  );

  if (!rounds.length || !cec.length) {
    throw new Error("No valid CEC draws");
  }

  return {
    cec,
    overall: rounds[0],
    checkedAt: new Date()
  };
}

// ================= CRS CALCULATION =================

// Assumes no accompanying spouse.
// Additional points must be verified separately.

function agePoints(age) {
  if (age < 18 || age >= 45) return 0;
  if (age === 18) return 99;
  if (age === 19) return 105;
  if (age <= 29) return 110;

  return [
    105, 99, 94, 88, 83,
    77, 72, 66, 61, 55,
    50, 39, 28, 17, 6
  ][age - 30] || 0;
}

function educationPoints(level) {
  return {
    none: 0,
    high_school: 30,
    one_year: 90,
    two_year: 98,
    bachelor: 120,
    two_or_more: 128,
    masters: 135,
    phd: 150
  }[level] || 0;
}

function languagePoints(clb) {
  if (clb < 4) return 0;
  if (clb <= 5) return 6;
  if (clb === 6) return 9;
  if (clb === 7) return 17;
  if (clb === 8) return 23;
  if (clb === 9) return 31;

  return 34;
}

function canadianWorkPoints(years) {
  if (years < 1) return 0;
  if (years < 2) return 40;
  if (years < 3) return 53;
  if (years < 4) return 64;
  if (years < 5) return 72;

  return 80;
}

function crsFrom(p) {
  if (Number.isInteger(p.CRS_OVERRIDE)) {
    return p.CRS_OVERRIDE;
  }

  const levels = ["L", "R", "W", "S"]
    .map(k => Number(p.CELPIP[k]));

  const all7 = levels.every(n => n >= 7);
  const all9 = levels.every(n => n >= 9);

  const work = Number(p.CANADIAN_WORK_YEARS);
  const foreign = Number(p.FOREIGN_WORK_YEARS);
  const edu = p.EDUCATION;

  const twoDegrees = [
    "two_or_more",
    "masters",
    "phd"
  ].includes(edu);

  const postSecondary =
    twoDegrees ||
    [
      "one_year",
      "two_year",
      "bachelor"
    ].includes(edu);

  // Education + language
  const eduLanguage = !postSecondary
    ? 0
    : all9
      ? (twoDegrees ? 50 : 25)
      : all7
        ? (twoDegrees ? 25 : 13)
        : 0;

  // Education + Canadian work
  const eduWork = !postSecondary
    ? 0
    : work >= 2
      ? (twoDegrees ? 50 : 25)
      : work >= 1
        ? (twoDegrees ? 25 : 13)
        : 0;

  const eduTransfer = Math.min(
    50,
    eduLanguage + eduWork
  );

  // Foreign work + language
  const foreignLanguage = foreign >= 3
    ? (all9 ? 50 : all7 ? 25 : 0)
    : foreign >= 1
      ? (all9 ? 25 : all7 ? 13 : 0)
      : 0;

  // Foreign work + Canadian work
  const foreignWork = foreign >= 3
    ? (work >= 2 ? 50 : work >= 1 ? 25 : 0)
    : foreign >= 1
      ? (work >= 2 ? 25 : work >= 1 ? 13 : 0)
      : 0;

  const foreignTransfer = Math.min(
    50,
    foreignLanguage + foreignWork
  );

  const transfer = Math.min(
    100,
    eduTransfer + foreignTransfer
  );

  // Canadian work points + verified high-wage bonus,
  // OR verified job-offer points.
  const labour = Math.max(
    canadianWorkPoints(work) +
      (
        work >= 1
          ? Number(p.HIGH_WAGE_WORK_POINTS)
          : 0
      ),
    Number(p.JOB_OFFER_POINTS)
  );

  const language = levels.reduce(
    (sum, level) => sum + languagePoints(level),
    0
  );

  return (
    agePoints(Number(p.AGE)) +
    educationPoints(edu) +
    language +
    labour +
    transfer +
    Number(p.CANADIAN_EDUCATION_POINTS) +
    Number(p.OTHER_ADDITIONAL_POINTS)
  );
}

// ================= PERSONAL STATUS =================

function personalStatus() {
  const required = MY.NOC_TEER <= 1 ? 7 : 5;

  const missingLanguage = ["L", "R", "W", "S"]
    .some(k => MY.CELPIP[k] < required);

  const missingSpeaking = MY.CELPIP.S < required;

  const missingWork =
    MY.CANADIAN_WORK_YEARS < 1 ||
    !MY.CANADIAN_WORK_VERIFIED;

  let expired = false;

  if (MY.LANGUAGE_TEST_DATE) {
    const test = new Date(
      MY.LANGUAGE_TEST_DATE + "T12:00:00"
    );

    if (isNaN(test.getTime())) {
      expired = true;
    } else {
      const until = new Date(test);

      until.setFullYear(
        until.getFullYear() + 2
      );

      expired = new Date() >= until;
    }
  }

  const baseline = {
    ...MY,
    CRS_OVERRIDE: null
  };

  const current = crsFrom(baseline);

  // Speaking improvement
  const speaking = {
    ...baseline,
    CELPIP: {
      ...MY.CELPIP,
      S: Math.max(MY.CELPIP.S, required)
    }
  };

  // CLB 10 goal
  const goal = {
    ...baseline,
    CELPIP: Object.fromEntries(
      ["L", "R", "W", "S"].map(k => [
        k,
        Math.max(
          MY.CELPIP[k],
          MY.LANGUAGE_TARGET_CLB
        )
      ])
    )
  };

  // One year of Canadian work
  const year = {
    ...baseline,
    CANADIAN_WORK_YEARS: Math.max(
      1,
      MY.CANADIAN_WORK_YEARS
    )
  };

  return {
    score: crsFrom(MY),

    status:
      missingLanguage || missingWork || expired
        ? "NOT YET"
        : "REVIEW",

    missingSpeaking,
    missingLanguage,
    missingWork,
    expired,
    required,

    speakingGain: crsFrom(speaking) - current,
    goalGain: crsFrom(goal) - current,
    workGain: crsFrom(year) - current
  };
}

// ================= LABELED CEC CHART =================

function chartImage(draws, width, height) {
  const values = draws.map(r => r.crs);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(6, max - min);

  const low = min - range * 0.15;
  const high = max + range * 0.15;

  const padX = 12;
  const top = 15;
  const bottom = height - 3;

  const points = values.map(
    (v, i) => new Point(
      padX +
        (
          values.length === 1
            ? (width - 2 * padX) / 2
            : i * (width - 2 * padX) /
              (values.length - 1)
        ),
      top +
        ((high - v) / (high - low)) *
        (bottom - top)
    )
  );

  const ctx = new DrawContext();

  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  // Colors usable in both light and dark themes.
  const blue = new Color("#458CE3");
  const labelColor = new Color("#628FC6");

  // Trend line
  if (points.length > 1) {
    const line = new Path();
    line.move(points[0]);

    points.slice(1).forEach(
      p => line.addLine(p)
    );

    ctx.addPath(line);
    ctx.setStrokeColor(blue);
    ctx.setLineWidth(2);
    ctx.strokePath();
  }

  // Data points
  ctx.setFillColor(blue);

  points.forEach((p, i) => {
    const r =
      i === points.length - 1 ? 3 : 2;

    ctx.fillEllipse(
      new Rect(
        p.x - r,
        p.y - r,
        2 * r,
        2 * r
      )
    );
  });

  // Score labels
  ctx.setTextAlignedCenter();

  ctx.setFont(
    Font.boldSystemFont(
      values.length >= 8 ? 7.5 : 8
    )
  );

  ctx.setTextColor(labelColor);

  points.forEach((p, i) => {
    ctx.drawTextInRect(
      String(values[i]),
      new Rect(
        p.x - 12,
        p.y - 13,
        24,
        11
      )
    );
  });

  return ctx.getImage();
}

function addTrend(
  parent,
  cec,
  count,
  width,
  height
) {
  const history = cec
    .slice(0, Math.max(2, count))
    .reverse();

  const image = parent.addImage(
    chartImage(history, width, height)
  );

  image.imageSize = new Size(width, height);
  image.leftAlignImage();

  return history;
}

// ================= BASE WIDGET =================

function baseWidget(isSmall) {
  const w = new ListWidget();

  w.backgroundColor = C.background;
  w.url = SETTINGS.PAGE_URL;

  w.setPadding(
    isSmall ? 10 : 7,
    10,
    isSmall ? 9 : 7,
    10
  );

  w.refreshAfterDate = new Date(
    Date.now() +
    SETTINGS.REFRESH_HOURS * 3600000
  );

  return w;
}

// ================= STATUS BADGE =================

function pill(parent, value, warning) {
  const badge = parent.addStack();

  badge.backgroundColor = warning
    ? C.amberBG
    : C.greenBG;

  badge.cornerRadius = 7;

  badge.setPadding(2, 6, 2, 6);

  text(
    badge,
    value,
    9,
    warning ? C.amber : C.green,
    true
  );

  return badge;
}

// ================= IMPROVEMENT ROW =================

// Fixed width ensures all gains align to the right.

function improvementRow(parent, name, gain) {
  const row = parent.addStack();

  row.size = new Size(
    LAYOUT.RIGHT_WIDTH,
    0
  );

  row.centerAlignContent();

  text(
    row,
    name,
    9.3,
    C.muted,
    false,
    0.72
  );

  // Flexible spacer pushes the gain to the trailing edge.
  row.addSpacer();

  text(
    row,
    `+${gain}`,
    10,
    C.ink,
    true
  );

  return row;
}

// ================= ROW DIVIDER =================

function improvementDivider(parent) {
  const line = parent.addStack();

  line.size = new Size(
    LAYOUT.RIGHT_WIDTH,
    0.65
  );

  line.backgroundColor = C.divider;
}

// ================= FOOTER =================

// Latest overall and Last checked share ONE line.
// Text scales down when the category name is long.

function addFooter(widget, data, includeOverall) {
  const footer = widget.addStack();

  if (includeOverall) {
    footer.size = new Size(
      LAYOUT.LEFT_WIDTH +
      7 + 1 + 8 +
      LAYOUT.RIGHT_WIDTH,
      0
    );
  }

  footer.layoutVertically();
  footer.backgroundColor = C.footerCard;
  footer.cornerRadius = 9;

  footer.setPadding(4, 6, 4, 6);

  if (includeOverall) {
    const line =
      `Latest overall: ${
        shortRoundName(data.overall.name)
      } · ${
        data.overall.crs
      } CRS · ${
        dateShort(data.overall.date)
      }   |   ${
        lastChecked(data.checkedAt)
      }`;

    // Choose a smaller initial font for longer lines.
    const fontSize =
      line.length > 98
        ? 7.0
        : line.length > 82
          ? 7.4
          : 8.0;

    text(
      footer,
      line,
      fontSize,
      C.ink,
      false,
      0.55
    );
  } else {
    text(
      footer,
      lastChecked(data.checkedAt),
      8,
      C.muted
    );
  }
}

// ===============================================
// MEDIUM WIDGET
// ===============================================

function mediumWidget(data) {
  const w = baseWidget(false);

  const latest = data.cec[0];
  const mine = personalStatus();

  // ================= TWO COLUMNS =================

  const body = w.addStack();
  body.topAlignContent();

  // LEFT COLUMN
  const left = body.addStack();

  left.layoutVertically();

  left.size = new Size(
    LAYOUT.LEFT_WIDTH,
    0
  );

  // ============================================
  // LEFT TOP — LATEST CEC DRAW
  // ============================================

  const latestCard = left.addStack();

  // Match the chart card width exactly.
  latestCard.size = new Size(
    LAYOUT.LEFT_WIDTH,
    0
  );

  latestCard.layoutVertically();

  latestCard.backgroundColor = C.latestCard;
  latestCard.cornerRadius = 11;

  latestCard.borderColor = C.outline;
  latestCard.borderWidth = 0.7;

  latestCard.setPadding(4, 7, 4, 7);

  // Header: round number + date
  const head = latestCard.addStack();

  head.size = new Size(
    LAYOUT.LEFT_WIDTH - 14,
    0
  );

  head.centerAlignContent();

  text(
    head,
    `CEC #${latest.number}`,
    10.5,
    C.blue,
    true
  );

  // Keep the date on the trailing side.
  head.addSpacer();

  const dateBadge = head.addStack();

  dateBadge.setPadding(1, 4, 1, 4);
  dateBadge.cornerRadius = 6;
  dateBadge.backgroundColor = C.footerCard;

  text(
    dateBadge,
    dateShort(latest.date),
    8.5,
    C.ink,
    true
  );

  latestCard.addSpacer(1);

  // CRS score and ITAs
  const hero = latestCard.addStack();
  hero.centerAlignContent();

  text(
    hero,
    latest.crs,
    31,
    C.ink,
    true
  );

  hero.addSpacer(6);

  const heroMeta = hero.addStack();
  heroMeta.layoutVertically();

  text(
    heroMeta,
    "CRS CUTOFF",
    8,
    C.muted,
    true
  );

  text(
    heroMeta,
    `${commas(latest.ita)} ITAs`,
    10.5,
    C.ink,
    true
  );

  left.addSpacer(4);

  // ============================================
  // LEFT BOTTOM — CRS TREND CARD
  // ============================================

  const chartCard = left.addStack();

  // Same width as latestCard.
  chartCard.size = new Size(
    LAYOUT.LEFT_WIDTH,
    0
  );

  chartCard.layoutVertically();
  chartCard.backgroundColor = C.chartCard;
  chartCard.cornerRadius = 11;

  chartCard.setPadding(4, 7, 4, 7);

  const shown = Math.min(
    SETTINGS.MEDIUM_TREND_DRAWS,
    data.cec.length
  );

  text(
    chartCard,
    `CEC CRS · LAST ${shown}`,
    8.5,
    C.muted,
    true
  );

  chartCard.addSpacer(1);

  const history = addTrend(
    chartCard,
    data.cec,
    SETTINGS.MEDIUM_TREND_DRAWS,
    LAYOUT.TREND_IMAGE_WIDTH,
    35
  );

  text(
    chartCard,
    `${dateShort(history[0].date)} → ${
      dateShort(
        history[history.length - 1].date
      )
    }`,
    8,
    C.muted
  );

  // ============================================
  // VERTICAL COLUMN DIVIDER
  // ============================================

  body.addSpacer(7);

  const divider = body.addStack();

  divider.size = new Size(1, 118);
  divider.backgroundColor = C.divider;

  body.addSpacer(8);

  // ============================================
  // RIGHT — PERSONAL CRS
  // ============================================

  const right = body.addStack();

  // Fixed width for right-aligned gains.
  right.size = new Size(
    LAYOUT.RIGHT_WIDTH,
    0
  );

  right.layoutVertically();

  text(
    right,
    "MY CRS (EST.)",
    9,
    C.muted,
    true
  );

  right.addSpacer(1);

  text(
    right,
    mine.score,
    29,
    C.ink,
    true
  );

  right.addSpacer(1);

  pill(
    right,
    `CEC: ${mine.status}`,
    mine.status === "NOT YET"
  );

  right.addSpacer(7);

  // ============================================
  // IMPROVEMENT 1 — SPEAKING
  // ============================================

  const speakingName = mine.missingSpeaking
    ? `Speak ${MY.CELPIP.S} to ${mine.required}`
    : (
        mine.missingLanguage
          ? "Language gap"
          : "Speaking OK"
      );

  improvementRow(
    right,
    speakingName,
    mine.speakingGain
  );

  // Divider
  right.addSpacer(4);
  improvementDivider(right);
  right.addSpacer(4);

  // ============================================
  // IMPROVEMENT 2 — CLB 10
  // ============================================

  improvementRow(
    right,
    `All CLB${MY.LANGUAGE_TARGET_CLB}`,
    mine.goalGain
  );

  // Divider
  right.addSpacer(4);
  improvementDivider(right);
  right.addSpacer(4);

  // ============================================
  // IMPROVEMENT 3 — CANADIAN WORK
  // ============================================

  const workName =
    MY.CANADIAN_WORK_YEARS < 1
      ? "CA work 0 to 1y"
      : (
          mine.missingWork
            ? "Verify CA work"
            : "CA work OK"
        );

  improvementRow(
    right,
    workName,
    mine.workGain
  );

  if (mine.expired) {
    right.addSpacer(3);

    text(
      right,
      "LANGUAGE TEST EXPIRED",
      7.5,
      C.amber,
      true
    );
  }

  // ============================================
  // FULL-WIDTH ONE-LINE FOOTER
  // ============================================

  w.addSpacer(4);

  addFooter(
    w,
    data,
    true
  );

  return w;
}

// ===============================================
// SMALL WIDGET
// ===============================================

function smallWidget(data) {
  const w = baseWidget(true);

  const latest = data.cec[0];
  const mine = personalStatus();

  // Header
  const head = w.addStack();
  head.centerAlignContent();

  text(
    head,
    `CEC #${latest.number}`,
    10,
    C.blue,
    true
  );

  head.addSpacer();

  text(
    head,
    dateShort(latest.date),
    9,
    C.muted
  );

  w.addSpacer(2);

  // CRS score
  const score = w.addStack();
  score.centerAlignContent();

  text(
    score,
    latest.crs,
    37,
    C.ink,
    true
  );

  score.addSpacer(5);

  const meta = score.addStack();
  meta.layoutVertically();

  text(
    meta,
    "CRS CUTOFF",
    8,
    C.muted,
    true
  );

  text(
    meta,
    `${commas(latest.ita)} ITAs`,
    9,
    C.ink,
    true
  );

  w.addSpacer(3);

  // Chart
  const chart = w.addStack();

  chart.layoutVertically();
  chart.backgroundColor = C.chartCard;
  chart.cornerRadius = 9;

  chart.setPadding(4, 5, 3, 5);

  text(
    chart,
    "CEC CRS TREND",
    8,
    C.muted,
    true
  );

  addTrend(
    chart,
    data.cec,
    SETTINGS.SMALL_TREND_DRAWS,
    125,
    33
  );

  w.addSpacer(3);

  // Personal summary
  text(
    w,
    `MY CRS ${mine.score} (EST.) · CEC ${mine.status}`,
    9,
    mine.status === "NOT YET"
      ? C.amber
      : C.green,
    true
  );

  text(
    w,
    `Speak +${mine.speakingGain} · ` +
    `CLB${MY.LANGUAGE_TARGET_CLB} +${mine.goalGain} · ` +
    `Work +${mine.workGain}`,
    7.8,
    C.muted,
    false,
    0.65
  );

  w.addSpacer();

  // Last checked
  const checked = w.addStack();
  checked.addSpacer();

  text(
    checked,
    lastChecked(data.checkedAt),
    7.5,
    C.muted
  );

  return w;
}

// ===============================================
// ERROR WIDGET
// ===============================================

function errorWidget(isSmall) {
  const w = baseWidget(isSmall);

  text(
    w,
    "EXPRESS ENTRY",
    11,
    C.blue,
    true
  );

  w.addSpacer(10);

  text(
    w,
    "Could not load data",
    15,
    C.ink,
    true
  );

  w.addSpacer(4);

  text(
    w,
    "IRCC data is unavailable.",
    10,
    C.muted
  );

  w.addSpacer();

  text(
    w,
    "Will retry at the next refresh.",
    9,
    C.muted
  );

  return w;
}

// ===============================================
// MAIN
// ===============================================

async function main() {
  const family = config.runsInWidget
    ? config.widgetFamily
    : SETTINGS.PREVIEW_SIZE;

  const isSmall = family === "small";

  let widget;

  try {
    const data = await fetchDraws();

    widget = isSmall
      ? smallWidget(data)
      : mediumWidget(data);

  } catch (error) {
    console.error(
      `CEC widget: ${String(error)}`
    );

    widget = errorWidget(isSmall);
  }

  Script.setWidget(widget);

  if (!config.runsInWidget) {
    if (isSmall) {
      await widget.presentSmall();
    } else {
      await widget.presentMedium();
    }
  }

  Script.complete();
}

await main();
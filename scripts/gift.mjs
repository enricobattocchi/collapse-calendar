// The gift behind each door, as inline SVG. It perishes with the door's wear:
// stage 0 fresh (< 0.2), 1 a bit worn (< 0.5), 2 damaged (< 0.8), 3 ruined.
// Ported from the design canvas's Gift component.

const NAMES = {
  Tech: "chocolate phone",
  Transport: "toy plane",
  Public: "toy school bus",
  Money: "chocolate coin",
  Cyber: "toy fridge",
  Power: "light bulb",
  Calm: "plain chocolate",
};
const STATES = ["fresh", "a bit worn", "damaged", "ruined"];

export function gift(kind, wear) {
  if (!NAMES[kind]) kind = "Calm";
  const w = Math.max(0, Math.min(1, Number(wear) || 0));
  const s = w < 0.2 ? 0 : w < 0.5 ? 1 : w < 0.8 ? 2 : 3;
  const p = (a) => a[s];
  const label = `${NAMES[kind]}, ${STATES[s]}`;
  const tf =
    kind === "Transport"
      ? p(["rotate(0 60 50)", "rotate(-4 60 50)", "rotate(10 60 50)", "rotate(28 60 52) translate(4 4)"])
      : p(["rotate(0 60 50)", "rotate(0 60 50)", "rotate(-3 60 50)", "rotate(-16 60 50) skewX(-10) translate(8 6)"]);
  const crackOp = p([0, 1, 1, 0.9]);
  const bloomOp = kind === "Calm" ? p([0, 0.35, 0.8, 0.9]) : p([0, 0, 0.7, 0.95]);
  const meltOp = p([0, 0, 0, 1]);
  const chipOp = p([0, 0.9, 1, 1]);
  const body = kind === "Cyber" ? p(["#F4F4F0", "#EEEBE2", "#E2D6C2", "#9C8268"]) : p(["#F2F0EA", "#ECE8DE", "#E0D8C8", "#CFC4B0"]);
  let g = "";

  if (kind === "Tech") {
    const foilFull = p([1, 1, 0, 0]);
    const foilPeel = p([0, 0, 1, 0.8]);
    g = `<ellipse cx="66" cy="89" rx="${p([0, 0, 0, 24])}" ry="6" fill="#5A3420" opacity="${meltOp}"/>
<g transform="${tf}">
<rect x="40" y="10" width="40" height="74" rx="7" fill="#4A2A1A"/>
<rect x="40" y="10" width="40" height="74" rx="7" fill="#2E3A48" opacity="${foilFull}"/>
<path d="M40 30 L52 26 L66 40 L80 52 L80 84 L40 84 Z" fill="#2E3A48" opacity="${foilPeel}"/>
<path d="M66 40 L80 52 L80 34 Z" fill="#9AA4B0" opacity="${foilPeel}"/>
<rect x="45" y="18" width="30" height="54" rx="2" fill="${p(["#6FA8DC", "#4F7FA8", "#3A4654", "#2A2F36"])}" opacity="${p([1, 1, 0.35, 0])}"/>
<rect x="55" y="13" width="10" height="2" rx="1" fill="#11161C" opacity="${foilFull}"/>
<path d="M52 22 L60 36 L55 45 L66 58 L62 70 M60 36 L73 31 M55 45 L46 50" fill="none" stroke="#F4F8FF" stroke-width="1.2" opacity="${crackOp}"/>
<path d="M46 14 C52 20 58 16 64 22 M70 12 C74 18 78 16 79 22 M42 40 C48 44 50 40 54 46" fill="none" stroke="#E6DCCB" stroke-width="2.4" stroke-linecap="round" opacity="${bloomOp}"/>
</g>`;
  } else if (kind === "Transport") {
    const red = p(["#C8302B", "#B8473F", "#A65A50", "#8E6A5E"]);
    const stub = p([0, 0, 1, 1]);
    g = `<g transform="${tf}">
<rect x="46" y="72" width="28" height="8" rx="3" fill="${red}"/>
<path d="M64 38 L102 50 L102 58 L64 54 Z" fill="${red}" opacity="${p([1, 1, 1, 0])}"/>
<path d="M64 38 L84 44 L82 56 L64 54 Z" fill="${red}" opacity="${p([0, 0, 0, 1])}"/>
<path d="M56 38 L18 50 L18 58 L56 54 Z" fill="${red}" opacity="${p([1, 1, 0, 0])}"/>
<path d="M56 40 L44 44 L44 53 L56 53 Z" fill="${red}" opacity="${stub}"/>
<rect x="38" y="42" width="18" height="10" fill="rgba(240,230,196,0.85)" transform="rotate(-18 47 47)" opacity="${stub}"/>
<ellipse cx="60" cy="50" rx="9" ry="36" fill="${body}" stroke="#BDB8AC" stroke-width="1"/>
<ellipse cx="60" cy="26" rx="5" ry="7" fill="${p(["#6FA8DC", "#6A98C2", "#7C8C98", "#6E6A64"])}"/>
<circle cx="30" cy="53" r="2.4" fill="#EBD3BE" opacity="${chipOp}"/>
<circle cx="92" cy="54" r="2" fill="#EBD3BE" opacity="${chipOp}"/>
<circle cx="66" cy="76" r="1.8" fill="#EBD3BE" opacity="${chipOp}"/>
<circle cx="57" cy="62" r="1.6" fill="#A79E90" opacity="${chipOp}"/>
<path d="M56 16 L60 22 L57 28 L61 33" fill="none" stroke="#6E6457" stroke-width="1.2" opacity="${crackOp}"/>
</g>`;
  } else if (kind === "Money") {
    const dentOp = p([0, 1, 0, 0]);
    g = `<g opacity="${p([1, 1, 0, 0])}">
<circle cx="60" cy="52" r="30" fill="#D9AE3E"/>
<circle cx="60" cy="52" r="24" fill="none" stroke="#B8892A" stroke-width="2"/>
<path d="M60 36 L64 47 L75 47 L66 54 L69 65 L60 58 L51 65 L54 54 L45 47 L56 47 Z" fill="#E9C76A" stroke="#B8892A" stroke-width="1"/>
<path d="M40 38 A28 28 0 0 1 58 25" fill="none" stroke="#FFF1B8" stroke-width="2.5" stroke-linecap="round"/>
<ellipse cx="72" cy="44" rx="9" ry="6" fill="rgba(110,70,20,0.38)" opacity="${dentOp}"/>
<path d="M66 40 L74 46 M70 38 L78 48" stroke="rgba(110,70,20,0.45)" stroke-width="1" opacity="${dentOp}"/>
</g>
<g opacity="${p([0, 0, 1, 0])}">
<circle cx="60" cy="52" r="29" fill="#5A3420"/>
<path d="M48 36 C54 42 60 38 66 44 M44 56 C52 60 56 54 64 62 M66 66 C70 70 76 66 80 70" fill="none" stroke="#E6DCCB" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>
<path d="M60 22 A30 30 0 0 0 60 82 Z" fill="#D9AE3E"/>
<path d="M60 22 L74 14 L80 26 L66 30 Z" fill="#E9C76A" stroke="#B8892A" stroke-width="1"/>
</g>
<g opacity="${p([0, 0, 0, 1])}">
<path d="M32 66 L40 46 L54 50 L62 36 L78 44 L90 40 L86 62 L72 70 L56 66 L44 76 Z" fill="#C9A045" stroke="#8C6A22" stroke-width="1"/>
<path d="M40 46 L56 66 M62 36 L72 70 M78 44 L56 66 M86 62 L54 50" stroke="#F1D68A" stroke-width="1" opacity="0.8"/>
<circle cx="28" cy="82" r="2" fill="#5A3420"/><circle cx="94" cy="80" r="1.6" fill="#5A3420"/><circle cx="84" cy="86" r="2.4" fill="#C9BBA4"/>
</g>`;
  } else if (kind === "Cyber") {
    const insideOp = p([0, 1, 1, 1]);
    const scorchOp = p([0, 0, 0, 0.9]);
    const doorW = p([44, 22, 12, 0]);
    const handleX = p([76, 55, 45, 37]);
    const dripOp = p([0, 0, 1, 0]);
    g = `<ellipse cx="60" cy="88" rx="30" ry="7" fill="#2A1A10" opacity="${scorchOp}"/>
<path d="M50 6 C46 2 52 -2 48 -6 M62 8 C58 4 64 0 60 -4 M74 6 C70 2 76 -2 72 -6" fill="none" stroke="#FF7A3A" stroke-width="2" stroke-linecap="round" opacity="${p([0, 0, 1, 0.5])}" transform="translate(0 6)"/>
<rect x="38" y="14" width="44" height="72" rx="4" fill="${body}" stroke="#BDB8AC" stroke-width="1"/>
<rect x="41" y="17" width="38" height="66" rx="2" fill="${p(["#DDE8EE", "#FFB060", "#FF6A3A", "#3A2418"])}" opacity="${insideOp}"/>
<rect x="44" y="40" width="32" height="2" fill="#9EA2A8" opacity="${insideOp}"/>
<rect x="44" y="60" width="32" height="2" fill="#9EA2A8" opacity="${insideOp}"/>
<rect x="38" y="14" width="${doorW}" height="72" rx="4" fill="${body}" stroke="#BDB8AC" stroke-width="1"/>
<rect x="38" y="35" width="${doorW}" height="1.5" fill="#BDB8AC"/>
<rect x="${handleX}" y="22" width="3" height="10" rx="1.5" fill="#9EA2A8"/>
<rect x="${handleX}" y="42" width="3" height="16" rx="1.5" fill="#9EA2A8"/>
<circle cx="48" cy="92" r="2" fill="#8EC5E8" opacity="${dripOp}"/><circle cx="56" cy="95" r="1.5" fill="#8EC5E8" opacity="${dripOp}"/><circle cx="70" cy="93" r="2.2" fill="#8EC5E8" opacity="${dripOp}"/>
<ellipse cx="50" cy="70" rx="8" ry="10" fill="#3A2418" opacity="${scorchOp}"/>
<ellipse cx="72" cy="30" rx="6" ry="9" fill="#3A2418" opacity="${scorchOp}"/>
<path d="M38 80 C42 92 50 86 56 94 C62 88 70 96 82 82 L82 86 L38 86 Z" fill="${body}" opacity="${meltOp}"/>`;
  } else if (kind === "Power") {
    const glowOp = p([0.28, 0.1, 0, 0]);
    g = `<circle cx="60" cy="42" r="34" fill="#FF5A4A" opacity="${glowOp}"/>
<circle cx="60" cy="42" r="22" fill="#FF5A4A" opacity="${glowOp}"/>
<g opacity="${p([1, 1, 1, 0])}">
<path d="M60 12 C78 12 84 32 76 50 C72 58 68 62 68 68 L52 68 C52 62 48 58 44 50 C36 32 42 12 60 12 Z" fill="${p(["#FF4D4D", "#D9776A", "#6B5A55", "#6B5A55"])}"/>
<path d="M50 22 C46 28 46 36 48 42" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
<path d="M54 64 L57 46 L60 54 L63 46 L66 64" fill="none" stroke="${p(["#FFF3B0", "#E8D9A0", "#8A7A70", "#8A7A70"])}" stroke-width="1.4"/>
<path d="M58 50 L64 34 M66 40 L58 30" fill="none" stroke="#2A2420" stroke-width="1" opacity="${crackOp}"/>
</g>
<g transform="${p(["rotate(0 60 75)", "rotate(0 60 75)", "rotate(0 60 75)", "rotate(-24 60 80) translate(-6 6)"])}">
<rect x="51" y="68" width="18" height="14" rx="2" fill="#2C3A27"/>
<path d="M51 72 H69 M51 76 H69" stroke="#4A5A40" stroke-width="1"/>
</g>
<g opacity="${p([0, 0, 0, 1])}">
<path d="M24 88 L32 80 L36 90 Z" fill="#9E7A74"/><path d="M82 90 L90 82 L96 92 Z" fill="#B7948C"/><path d="M40 92 L44 86 L50 93 Z" fill="#8C6C66"/><path d="M70 86 L76 84 L74 92 Z" fill="#A98680"/>
<path d="M52 66 L56 58 L60 64 L64 56 L68 66 Z" fill="#9E7A74"/>
</g>`;
  } else if (kind === "Public") {
    const glass = p(["#8FC3E8", "#7FA9C8", "#6E8494", "#4A4E52"]);
    const busC = p(["#F2B705", "#E3AC2C", "#CDA458", "#9C7A4A"]);
    const rustOp = p([0, 0, 0.5, 1]);
    g = `<g transform="${p(["rotate(0 60 60)", "rotate(0 60 60)", "rotate(4 60 70)", "rotate(-20 60 70) translate(-4 4)"])}">
<rect x="18" y="28" width="84" height="10" rx="4" fill="${busC}"/>
<rect x="14" y="34" width="92" height="40" rx="6" fill="${busC}"/>
<rect x="22" y="40" width="12" height="12" rx="1.5" fill="${glass}"/>
<rect x="38" y="40" width="12" height="12" rx="1.5" fill="${glass}"/>
<rect x="54" y="40" width="12" height="12" rx="1.5" fill="${glass}"/>
<rect x="70" y="40" width="12" height="12" rx="1.5" fill="${glass}"/>
<rect x="88" y="40" width="14" height="18" rx="1.5" fill="${glass}"/>
<rect x="14" y="60" width="92" height="3" fill="#1E1914"/>
<rect x="100" y="64" width="6" height="5" rx="1" fill="#FFF3C4"/>
<circle cx="24" cy="50" r="2.4" fill="#9A948A" opacity="${chipOp}"/>
<circle cx="62" cy="68" r="2" fill="#9A948A" opacity="${chipOp}"/>
<circle cx="96" cy="36" r="1.8" fill="#9A948A" opacity="${chipOp}"/>
<ellipse cx="30" cy="66" rx="9" ry="5" fill="#7A3E1C" opacity="${rustOp}"/>
<ellipse cx="76" cy="34" rx="7" ry="3" fill="#7A3E1C" opacity="${rustOp}"/>
<ellipse cx="98" cy="70" rx="5" ry="4" fill="#7A3E1C" opacity="${rustOp}"/>
<path d="M40 42 L44 47 L41 51 M58 41 L62 46 L66 44 M90 42 L96 50 L92 56" fill="none" stroke="#F4F8FF" stroke-width="1" opacity="${crackOp}"/>
<g opacity="${p([1, 1, 1, 0])}"><circle cx="88" cy="76" r="8" fill="#222222"/><circle cx="88" cy="76" r="3" fill="#8A8A8A"/></g>
<g opacity="${p([1, 1, 0, 0])}"><circle cx="32" cy="76" r="8" fill="#222222"/><circle cx="32" cy="76" r="3" fill="#8A8A8A"/></g>
</g>
<g opacity="${p([0, 0, 1, 1])}"><circle cx="100" cy="88" r="6" fill="#222222"/><circle cx="100" cy="88" r="2.2" fill="#8A8A8A"/></g>`;
  } else {
    g = `<g opacity="${p([1, 1, 0, 0])}">
<rect x="36" y="26" width="48" height="48" rx="4" fill="#5A3420"/>
<path d="M60 26 V74 M36 50 H84" stroke="#3E2214" stroke-width="2"/>
<path d="M39 29 H57 M39 29 V47" stroke="#7A4A30" stroke-width="2"/>
</g>
<g opacity="${p([0, 0, 1, 0])}">
<path d="M36 30 Q36 26 40 26 L84 26 L84 54 L74 60 L66 74 L40 74 Q36 74 36 70 Z" fill="#5A3420"/>
<path d="M60 26 V74 M36 50 H80" stroke="#3E2214" stroke-width="2"/>
<path d="M88 66 L96 62 L98 72 Z" fill="#5A3420"/>
</g>
<g opacity="${p([0, 0, 0, 1])}">
<path d="M30 70 L44 58 L54 66 L48 80 L34 80 Z" fill="#6A4632"/>
<path d="M58 62 L72 56 L80 66 L70 76 L60 74 Z" fill="#6A4632"/>
<path d="M82 74 L92 70 L94 82 L84 82 Z" fill="#6A4632"/>
<circle cx="52" cy="86" r="2" fill="#6A4632"/><circle cx="76" cy="84" r="1.6" fill="#6A4632"/>
</g>
<path d="M40 34 C46 40 52 34 58 40 M64 30 C70 36 76 32 80 38 M40 60 C48 64 54 58 62 66 M34 74 C40 72 46 78 52 74" fill="none" stroke="#E6DCCB" stroke-width="2.4" stroke-linecap="round" opacity="${bloomOp}"/>`;
  }
  return `<svg class="gift" role="img" aria-label="${label}" viewBox="0 0 120 100" preserveAspectRatio="xMidYMid meet"><ellipse cx="60" cy="92" rx="32" ry="5" fill="rgba(0,0,0,0.35)"/>${g}</svg>`;
}

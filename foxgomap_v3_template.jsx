import { useState, useEffect, useRef } from "react";

const LOGO = "LOGO_PLACEHOLDER";

const ROT = "#8B1A1A";

let ENTRIES = [];


const TREEDATA = __TREEDATA__;
const ALL_TREES = TREEDATA.t.map(function (r) {
  return {
    land: TREEDATA.lands[r[0]],
    art: TREEDATA.arten[r[1]][0],
    wiss: TREEDATA.arten[r[1]][1],
    strasse: TREEDATA.strs[r[2]],
    ot: "",
    jahr: r[3] > 0 ? r[3] : "",
    lat: TREEDATA.bla + r[4] / 10000,
    lng: TREEDATA.blo + r[5] / 10000
  };
});

const KAND = __KAND__;
const KANDFARBE = ["#7B1FA2", "#E65100", "#37474F", "#00695C", "#AD1457"];
const ALL_KAND = KAND.r.map(function (r) {
  return {
    k: r[0], kind: KAND.kinds[r[0]], titel: r[1],
    autor: KAND.autoren[r[2]], ort: KAND.orte[r[3]],
    jahr: r[4] > 0 ? r[4] : "",
    lat: KAND.bla + r[5] / 10000, lng: KAND.blo + r[6] / 10000,
    farbe: KANDFARBE[r[0]]
  };
});
const TREEMETA = {
  "China": { f: "#C62828", p: "Nanjing (1988)", i: "Konfuzius-Institut Leipzig", k: "-", m: "bedeutende Community" },
  "Niederlande": { f: "#F57F17", p: "-", i: "-", k: "Honorarkonsul (pruefen)", m: "k.A." },
  "Japan": { f: "#AD1457", p: "-", i: "Deutsch-Japanische Gesellschaft Leipzig / Das Japanische Haus e.V.", k: "Honorarkonsul (pruefen)", m: "k.A." },
  "Ukraine/Krim": { f: "#1565C0", p: "Kiew (1961)", i: "Ukrainische Gemeinde Leipzig", k: "-", m: "13.109 (Platz 2)" },
  "Schweden": { f: "#0277BD", p: "-", i: "Growing-Cultures-Partner seit 2018", k: "Honorarkonsulat Schweden (bestaetigt)", m: "k.A." },
  "USA/Kanada": { f: "#4527A0", p: "Houston (1993)", i: "Quebec-Studienzentrum (Uni Leipzig)", k: "US-Generalkonsulat Leipzig (bestaetigt)", m: "k.A." },
  "Marokko/Atlas": { f: "#6D4C41", p: "-", i: "-", k: "-", m: "k.A." },
  "Italien": { f: "#2E7D32", p: "Bologna (1962)", i: "CiCi - Centro di cultura italiana (Uni Leipzig)", k: "Honorarkonsul (pruefen)", m: "k.A." },
  "Ungarn": { f: "#00695C", p: "-", i: "-", k: "Honorarkonsul (pruefen)", m: "k.A." },
  "Serbien": { f: "#37474F", p: "-", i: "-", k: "-", m: "k.A." },
  "Himalaja": { f: "#5D4037", p: "-", i: "-", k: "-", m: "-" },
  "Georgien/Kaukasus": { f: "#7B1FA2", p: "-", i: "-", k: "-", m: "k.A." },
  "China/Amur": { f: "#E65100", p: "s. China", i: "s. China", k: "-", m: "-" },
  "Frankreich": { f: "#283593", p: "Lyon (1964)", i: "Institut francais Leipzig", k: "Honorarkonsul (pruefen)", m: "k.A." },
  "Iran/Persien": { f: "#8B1A1A", p: "-", i: "-", k: "-", m: "k.A." },
  "Korea": { f: "#AD1457", p: "-", i: "-", k: "Honorarkonsul (pruefen)", m: "k.A." },
  "Portugal": { f: "#2E7D32", p: "-", i: "-", k: "-", m: "k.A." },
  "Libanon": { f: "#00695C", p: "-", i: "-", k: "-", m: "k.A." },
  "Russland/Sibirien": { f: "#37474F", p: "-", i: "-", k: "-", m: "Russland 8.282 (Platz 3)" },
  "Finnland": { f: "#0277BD", p: "-", i: "-", k: "Honorarkonsul (pruefen)", m: "k.A." }
};
const LUECKEN = [
  { land: "Syrien", m: "14.104 (Platz 1)", idee: "Baumpflanzung + Kulturanker als FoxGo-Community-Projekt" },
  { land: "Polen", m: "7.274 (Platz 4)", idee: "Polnische Laerche; Partnerstadt Krakau (1973); Polnisches Institut Filiale Leipzig als Partner" },
  { land: "Rumaenien", m: "5.889 (Platz 5)", idee: "Pflanzprojekt offen" },
  { land: "Vietnam", m: "4.140 (Platz 6)", idee: "Community seit DDR-Zeit; Pflanzprojekt offen" }
];

const BACKDROP = __BACKDROP__;
const STREETS = __STREETS__;
const STREET_LINES = STREETS.s.map(function (st) {
  const pts = [];
  for (let i = 0; i < st[1].length; i += 2) {
    pts.push([STREETS.bla + st[1][i] / 10000, STREETS.blo + st[1][i + 1] / 10000]);
  }
  return { n: st[0], pts: pts };
});

const WIKICACHE = {};
function wikiHol(titel, cb) {
  if (!titel) { cb(null); return; }
  if (WIKICACHE[titel] !== undefined) { cb(WIKICACHE[titel]); return; }
  const done = { d: false };
  setTimeout(function () { if (!done.d) { done.d = true; cb(null); } }, 4000);
  fetch("https://de.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(titel))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      const s = j && j.extract && j.type !== "disambiguation" ? { text: j.extract, url: (j.content_urls && j.content_urls.desktop ? j.content_urls.desktop.page : null) } : null;
      WIKICACHE[titel] = s;
      if (!done.d) { done.d = true; cb(s); }
    })
    .catch(function () { WIKICACHE[titel] = null; if (!done.d) { done.d = true; cb(null); } });
}

function PanZoomMap(props) {
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const ASPECT = 1.3;
  function fit() {
    const pts = [];
    (props.points || []).forEach(function (e) { pts.push([e.lat, e.lng]); });
    (props.trees || []).forEach(function (t) { pts.push([t.lat, t.lng]); });
    (props.kand || []).forEach(function (q) { pts.push([q.lat, q.lng]); });
    if (pts.length === 0) return { clat: 51.36, clng: 12.55, span: 0.5 };
    let miLa = 99, maLa = -99, miLo = 199, maLo = -199;
    pts.forEach(function (p) {
      if (p[0] < miLa) miLa = p[0]; if (p[0] > maLa) maLa = p[0];
      if (p[1] < miLo) miLo = p[1]; if (p[1] > maLo) maLo = p[1];
    });
    const clat = (miLa + maLa) / 2, clng = (miLo + maLo) / 2;
    const latSpan = (maLa - miLa) * 1.3 + 0.004;
    const lngSpanDeg = (maLo - miLo) * 1.3 + 0.006;
    const spanFromLng = lngSpanDeg * Math.cos(clat * Math.PI / 180) / ASPECT;
    return { clat: clat, clng: clng, span: Math.max(latSpan, spanFromLng, 0.006) };
  }
  const [vp, setVp] = useState(fit);
  const [userPos, setUserPos] = useState(null);
  const [tour, setTour] = useState(false);
  const [tourMode, setTourMode] = useState("auto");
  const [tourNow, setTourNow] = useState(null);
  const [tourNext, setTourNext] = useState(null);
  const playedRef = useRef({});
  const tourRef = useRef(false);
  const posRef = useRef(null);
  useEffect(function () { posRef.current = userPos; }, [userPos]);
  useEffect(function () { tourRef.current = tour; }, [tour]);
  function tourRadius() {
    if (tourMode === "fuss") return 2500;
    if (tourMode === "rad") return 8000;
    if (tourMode === "kfz") return 40000;
    const s = posRef.current && posRef.current.spd;
    if (s == null) return 2500;
    if (s < 2.5) return 2500;
    if (s < 7) return 8000;
    return 40000;
  }
  function distTo(e) {
    const p = posRef.current || { lat: vp.clat, lng: vp.clng };
    const dy = (e.lat - p.lat) * 111320;
    const dx = (e.lng - p.lng) * 111320 * Math.cos(p.lat * Math.PI / 180);
    return Math.sqrt(dx * dx + dy * dy);
  }
  function nextCandidates() {
    const r = tourRadius();
    function key(e) { return distTo(e) * (e.stufe === "B" ? 1.25 : 1); }
    return ENTRIES.filter(function (e) { return !playedRef.current[e.id] && distTo(e) <= r; })
      .sort(function (a, b) { return key(a) - key(b); });
  }
  function speakSeq(chunks, onDone) {
    if (!window.speechSynthesis) { onDone(); return; }
    let idx = 0;
    function one() {
      if (!tourRef.current) return;
      if (idx >= chunks.length) { onDone(); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx++]);
      u.lang = "de-DE"; u.rate = 0.95;
      u.onend = one; u.onerror = one;
      window.speechSynthesis.speak(u);
    }
    window.speechSynthesis.cancel();
    setTimeout(one, 120);
  }
  function playNext() {
    if (!tourRef.current) return;
    const c = nextCandidates();
    if (c.length === 0) {
      setTourNow(null); setTourNext(null);
      speakSeq(["Keine weiteren Orte in der Naehe. Die Tour ist beendet."], function () { setTour(false); });
      return;
    }
    const e = c[0];
    playedRef.current[e.id] = 1;
    setTourNow(e); setTourNext(c[1] || null);
    setVp(function (v) { return { clat: e.lat, clng: e.lng, span: v.span }; });
    wikiHol(e.title, function (w) {
      if (!tourRef.current) return;
      const km = distTo(e) >= 1000 ? " Entfernung: etwa " + (distTo(e) / 1000).toFixed(1).replace(".", ",") + " Kilometer." : "";
      let text = "In " + (e.address || "der Naehe") + "." + km + " " + e.title + ". " + (e.artist || "") + ". " + (e.excerpt || "").replace(/\n/g, " ") + " " + (e.ortstext || "").replace(/ Quelle: Wikidata\.?/, "");
      if (w && w.text) text += " Aus Wikipedia: " + w.text;
      const chunks = text.replace(/([.!?])\s+/g, "$1|").split("|").filter(function (s) { return s.trim().length > 0; });
      speakSeq(chunks, function () { setTimeout(playNext, 900); });
    });
  }
  function toggleTour() {
    if (tour) {
      tourRef.current = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setTour(false); setTourNow(null); setTourNext(null);
    } else {
      playedRef.current = {};
      tourRef.current = true;
      setTour(true);
      if (!userPos) locate();
      setTimeout(playNext, 300);
    }
  }
  function skipTour() {
    if (!tour) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setTimeout(playNext, 150);
  }
  const [geoErr, setGeoErr] = useState(null);
  const watchRef = useRef(null);

  useEffect(function () {
    return function () {
      if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  function locate() {
    setGeoErr(null);
    if (!navigator.geolocation) { setGeoErr("GPS nicht verfuegbar"); return; }
    if (watchRef.current !== null && userPos) {
      setVp({ clat: userPos.lat, clng: userPos.lng, span: 0.012 });
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(function (p) {
      const u = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, spd: (p.coords.speed == null ? null : p.coords.speed) };
      setUserPos(function (prev) {
        if (prev && prev.acc && prev.acc < 40 && u.acc > 120) return prev;
        if (!prev) setVp({ clat: u.lat, clng: u.lng, span: 0.008 });
        return u;
      });
    }, function () {
      setGeoErr("blocked");
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  }

  function demoWalk() {
    setGeoErr(null);
    let lat = 51.3669, lng = 12.7333, step = 0;
    setUserPos({ lat: lat, lng: lng, acc: 12 });
    setVp({ clat: lat, clng: lng, span: 0.008 });
    if (watchRef.current === "demo") return;
    watchRef.current = "demo";
    const iv = setInterval(function () {
      step++;
      lat += 0.00012; lng -= 0.0001;
      setUserPos({ lat: lat, lng: lng, acc: 12 });
      if (step > 40) clearInterval(iv);
    }, 2000);
  }

  useEffect(function () {
    setVp(fit());
  }, [props.fitKey]);

  const H = props.height || 300;
  const spanLng = vp.span * ASPECT / Math.cos(vp.clat * Math.PI / 180);

  function toXY(lat, lng) {
    return {
      x: ((lng - (vp.clng - spanLng / 2)) / spanLng) * 100,
      y: ((vp.clat + vp.span / 2 - lat) / vp.span) * 100
    };
  }
  function inView(lat, lng) {
    return lat > vp.clat - vp.span * 0.55 && lat < vp.clat + vp.span * 0.55 &&
      lng > vp.clng - spanLng * 0.55 && lng < vp.clng + spanLng * 0.55;
  }
  function zoom(f) {
    setVp({ clat: vp.clat, clng: vp.clng, span: Math.min(9, Math.max(0.0015, vp.span * f)) });
  }
  function zoomAt(clientX, clientY) {
    if (!boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const fx = (clientX - r.left) / r.width;
    const fy = (clientY - r.top) / r.height;
    const lat = vp.clat + vp.span / 2 - fy * vp.span;
    const lng = vp.clng - spanLng / 2 + fx * spanLng;
    setVp({ clat: lat, clng: lng, span: Math.max(0.0015, vp.span * 0.5) });
  }
  const tapRef = useRef({ t: 0, x: 0, y: 0 });
  const ptrsRef = useRef({});
  const pinchRef = useRef(null);

  function ptrCount() { let n = 0; for (const k in ptrsRef.current) n++; return n; }

  function onDown(ev) {
    ptrsRef.current[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    if (ptrCount() === 2) {
      const ids = Object.keys(ptrsRef.current);
      const a = ptrsRef.current[ids[0]], c = ptrsRef.current[ids[1]];
      pinchRef.current = { d0: Math.hypot(a.x - c.x, a.y - c.y), span0: vp.span };
      dragRef.current = null;
      return;
    }
    const now = Date.now();
    const lt = tapRef.current;
    if (now - lt.t < 300 && Math.abs(ev.clientX - lt.x) < 25 && Math.abs(ev.clientY - lt.y) < 25) {
      tapRef.current = { t: 0, x: 0, y: 0 };
      dragRef.current = null;
      zoomAt(ev.clientX, ev.clientY);
      return;
    }
    tapRef.current = { t: now, x: ev.clientX, y: ev.clientY };
    dragRef.current = { x: ev.clientX, y: ev.clientY, clat: vp.clat, clng: vp.clng };
  }
  function onMove(ev) {
    if (ptrsRef.current[ev.pointerId]) {
      ptrsRef.current[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    }
    if (pinchRef.current && ptrCount() >= 2) {
      const ids = Object.keys(ptrsRef.current);
      const a = ptrsRef.current[ids[0]], c = ptrsRef.current[ids[1]];
      const d = Math.hypot(a.x - c.x, a.y - c.y);
      if (d > 10) {
        const ns = Math.min(9, Math.max(0.0015, pinchRef.current.span0 * pinchRef.current.d0 / d));
        setVp({ clat: vp.clat, clng: vp.clng, span: ns });
      }
      return;
    }
    const d = dragRef.current;
    if (!d || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const dLat = (ev.clientY - d.y) / r.height * vp.span;
    const dLng = -(ev.clientX - d.x) / r.width * spanLng;
    setVp({ clat: d.clat + dLat, clng: d.clng + dLng, span: vp.span });
  }
  function onUp(ev) {
    delete ptrsRef.current[ev.pointerId];
    if (ptrCount() < 2) pinchRef.current = null;
    dragRef.current = null;
  }

  const showBackdrop = vp.span < 0.45;
  const bd = [];
  if (showBackdrop) {
    for (let i = 0; i < BACKDROP.pts.length; i++) {
      const la = BACKDROP.baseLat + BACKDROP.pts[i][0] / 1000;
      const lo = BACKDROP.baseLng + BACKDROP.pts[i][1] / 1000;
      if (inView(la, lo)) bd.push(toXY(la, lo));
    }
  }

  const DE_OUTLINE = [[54.9, 8.6], [54.5, 11.0], [54.4, 13.6], [53.4, 14.4], [52.3, 14.6], [51.0, 15.0], [50.3, 12.1], [49.7, 12.5], [48.7, 13.8], [47.5, 13.0], [47.6, 10.2], [47.5, 7.6], [48.9, 8.1], [49.4, 6.4], [50.3, 6.1], [51.0, 5.9], [51.8, 6.1], [53.2, 7.2], [53.9, 8.6], [54.9, 8.6]];
  const DE_RIVERS = [
    [[47.6, 7.6], [49.0, 8.3], [50.0, 8.3], [50.4, 7.6], [51.8, 6.1]],
    [[50.8, 14.2], [51.06, 13.74], [51.87, 12.65], [53.55, 9.99], [53.9, 8.7]],
    [[48.0, 8.5], [48.5, 10.0], [48.8, 11.4], [48.6, 13.5]]
  ];
  const DE_CITIES = [
    { n: "Berlin", la: 52.52, lo: 13.40, s: 6012 }, { n: "Hamburg", la: 53.55, lo: 9.99, s: 1226 },
    { n: "Muenchen", la: 48.14, lo: 11.58, s: 468 }, { n: "Koeln", la: 50.94, lo: 6.96, s: 373 },
    { n: "Frankfurt", la: 50.11, lo: 8.68, s: 876 }, { n: "Dresden", la: 51.05, lo: 13.74, s: 253 },
    { n: "Weimar", la: 50.98, lo: 11.33, s: 0 }, { n: "LEIPZIG", la: 51.34, lo: 12.37, s: 0 },
    { n: "Bonn", la: 50.73, lo: 7.10, s: 417 }, { n: "Duesseldorf", la: 51.23, lo: 6.78, s: 308 },
    { n: "Stuttgart", la: 48.78, lo: 9.18, s: 279 }, { n: "Kiel", la: 54.32, lo: 10.14, s: 275 }
  ];
  const national = vp.span >= 0.5;

  const RIVERS = [
    { name: "Mulde", pts: [[51.24, 12.76], [51.30, 12.745], [51.3669, 12.727], [51.43, 12.72], [51.50, 12.71]] },
    { name: "Weisse Elster", pts: [[51.27, 12.31], [51.32, 12.345], [51.345, 12.352], [51.39, 12.335], [51.46, 12.31]] }
  ];
  const ROADS = [
    { n: "A14", t: "A", pts: [[51.34, 12.32], [51.315, 12.44], [51.295, 12.54], [51.275, 12.64], [51.255, 12.74], [51.24, 12.84]] },
    { n: "B6", t: "B", pts: [[51.34, 12.40], [51.35, 12.47], [51.352, 12.53], [51.365, 12.63], [51.358, 12.705], [51.367, 12.732], [51.372, 12.80]] },
    { n: "B107", t: "B", pts: [[51.25, 12.72], [51.31, 12.735], [51.367, 12.732], [51.43, 12.74], [51.47, 12.745]] },
    { n: "", t: "R", pts: [[51.345, 12.383], [51.352, 12.46], [51.353, 12.53], [51.366, 12.62], [51.359, 12.703], [51.371, 12.737], [51.375, 12.82]] },
    { n: "Ring", t: "B", pts: [[51.347, 12.368], [51.344, 12.383], [51.335, 12.383], [51.332, 12.37], [51.336, 12.362], [51.345, 12.363], [51.347, 12.368]] },
    { n: "", t: "B", pts: [[51.347, 12.372], [51.362, 12.371], [51.38, 12.37]] },
    { n: "", t: "B", pts: [[51.334, 12.376], [51.31, 12.39], [51.29, 12.40]] },
    { n: "", t: "B", pts: [[51.34, 12.383], [51.335, 12.42], [51.33, 12.46]] }
  ];
  const CITIES = [
    { name: "LEIPZIG", lat: 51.315, lng: 12.375 },
    { name: "Wurzen", lat: 51.378, lng: 12.732 },
    { name: "Bennewitz", lat: 51.352, lng: 12.712 },
    { name: "Machern", lat: 51.375, lng: 12.63 },
    { name: "Borsdorf", lat: 51.35, lng: 12.53 }
  ];

  function riverPath(pts) {
    return pts.map(function (p, i) {
      const q = toXY(p[0], p[1]);
      return (i === 0 ? "M" : "L") + q.x.toFixed(1) + "," + q.y.toFixed(1);
    }).join(" ");
  }

  const visTrees = (props.trees || []).filter(function (t) { return inView(t.lat, t.lng); });
  const dense = visTrees.length > 350;
  const visKand = (props.kand || []).filter(function (q) { return inView(q.lat, q.lng); });
  const denseK = visKand.length > 350;

  return (
    <div ref={boxRef}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp}
      onDoubleClick={function (ev) { zoomAt(ev.clientX, ev.clientY); }}
      onWheel={function (ev) { zoom(ev.deltaY > 0 ? 1.4 : 0.7); }}
      style={{ position: "relative", height: H, minHeight: H, flexShrink: 0, borderRadius: 12, overflow: "hidden", border: "1px solid #C5D0C5", background: "#E8EDDF", cursor: "grab", touchAction: "none", userSelect: "none" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="100" fill="#E8EDDF" />
        {national && (
          <g>
            <path d={riverPath(DE_OUTLINE) + " Z"} fill="#EFEBDD" stroke="#A8A896" strokeWidth="0.5" />
            {DE_RIVERS.map(function (r, i) {
              return <path key={"nr" + i} d={riverPath(r)} stroke="#7FB3D3" strokeWidth="0.9" fill="none" opacity="0.8" />;
            })}
            {DE_CITIES.filter(function (c) { return inView(c.la, c.lo); }).map(function (c) {
              const p = toXY(c.la, c.lo);
              return (
                <g key={c.n}>
                  <circle cx={p.x} cy={p.y} r="0.9" fill="#5A6A5A" />
                  <text x={p.x + 1.6} y={p.y + 0.8} fontSize={c.n === "LEIPZIG" ? 3.2 : 2.5} fill="#5A6A5A" fontWeight="bold" fontFamily="sans-serif">{c.n}</text>
                  {c.s > 0 && <text x={p.x + 1.6} y={p.y + 3.4} fontSize="2" fill="#8B1A1A" fontFamily="sans-serif">{"\u266A " + c.s + " Songs"}</text>}
                </g>
              );
            })}
          </g>
        )}
        {!national && RIVERS.map(function (r) {
          return <path key={r.name} d={riverPath(r.pts)} stroke="#7FB3D3" strokeWidth={vp.span < 0.05 ? 2.2 : 1.3} fill="none" opacity="0.85" strokeLinecap="round" />;
        })}
        {!national && ROADS.map(function (r, ri) {
          const w = vp.span < 0.05 ? (r.t === "A" ? 2.4 : 1.6) : (r.t === "A" ? 1.6 : 1.0);
          if (r.t === "R") {
            return <path key={"rd" + ri} d={riverPath(r.pts)} stroke="#555" strokeWidth={w * 0.5} strokeDasharray="1.6,1.1" fill="none" opacity="0.75" />;
          }
          return (
            <g key={"rd" + ri}>
              <path d={riverPath(r.pts)} stroke={r.t === "A" ? "#D97B29" : "#B0B0A5"} strokeWidth={w} fill="none" opacity="0.9" strokeLinecap="round" />
              <path d={riverPath(r.pts)} stroke={r.t === "A" ? "#F2A65A" : "#FFFFFF"} strokeWidth={w * 0.55} fill="none" opacity="0.95" strokeLinecap="round" />
            </g>
          );
        })}
        {!national && ROADS.filter(function (r) { return r.n && r.n !== "Ring" && inView(r.pts[Math.floor(r.pts.length / 2)][0], r.pts[Math.floor(r.pts.length / 2)][1]); }).map(function (r, ri) {
          const mid = r.pts[Math.floor(r.pts.length / 2)];
          const p = toXY(mid[0], mid[1]);
          return (
            <g key={"rl" + ri}>
              <rect x={p.x - 3} y={p.y - 1.6} width="6" height="3" rx="0.7" fill={r.t === "A" ? "#D97B29" : "#F5D33F"} opacity="0.95" />
              <text x={p.x} y={p.y + 0.9} fontSize="2.1" fill={r.t === "A" ? "white" : "#333"} fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{r.n}</text>
            </g>
          );
        })}
        {vp.span < 0.13 && STREET_LINES.filter(function (s) {
          const m = s.pts[Math.floor(s.pts.length / 2)];
          return inView(m[0], m[1]);
        }).map(function (s, si) {
          return (
            <g key={"st" + si}>
              <path d={riverPath(s.pts)} stroke="#C9C9BC" strokeWidth={vp.span < 0.03 ? 1.1 : 0.55} fill="none" opacity="0.9" strokeLinecap="round" />
              {vp.span < 0.014 && s.n && (function () {
                const m = s.pts[Math.floor(s.pts.length / 2)];
                const p = toXY(m[0], m[1]);
                return <text x={p.x} y={p.y - 0.6} fontSize="1.5" fill="#8A8A7E" textAnchor="middle" fontFamily="sans-serif">{s.n}</text>;
              })()}
            </g>
          );
        })}
        {bd.map(function (p, i) {
          return <circle key={i} cx={p.x} cy={p.y} r={vp.span < 0.05 ? 1.0 : 0.6} fill="#8CA98C" opacity="0.85" />;
        })}
        {!national && CITIES.filter(function (c) { return inView(c.lat, c.lng); }).map(function (c) {
          const p = toXY(c.lat, c.lng);
          return (
            <text key={c.name} x={p.x} y={p.y} fontSize={c.name === "LEIPZIG" ? 3.6 : 2.8} fill="#5A6A5A" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif" opacity="0.8">{c.name}</text>
          );
        })}
        {dense && visTrees.map(function (t, i) {
          const p = toXY(t.lat, t.lng);
          return <circle key={"dt" + i} cx={p.x} cy={p.y} r="0.7" fill={t.farbe} opacity="0.85" />;
        })}
        {denseK && visKand.map(function (q, i) {
          const p = toXY(q.lat, q.lng);
          return <rect key={"dk" + i} x={p.x - 0.4} y={p.y - 0.4} width="0.8" height="0.8" fill={q.farbe} opacity="0.8" />;
        })}
        {(props.routeLine || []).length > 1 && (
          <path d={riverPath(props.routeLine)} stroke="#8B1A1A" strokeWidth={vp.span < 0.05 ? 1.6 : 1.1} strokeDasharray="2.4,1.4" fill="none" opacity="0.9" strokeLinecap="round" />
        )}
        {userPos && inView(userPos.lat, userPos.lng) && (function () {
          const p = toXY(userPos.lat, userPos.lng);
          const accR = Math.min(20, (userPos.acc / 111320) / vp.span * 100);
          return (
            <g>
              <circle cx={p.x} cy={p.y} r={accR} fill="#4285F4" opacity="0.12" />
              <circle cx={p.x} cy={p.y} r="1.6" fill="#4285F4" stroke="white" strokeWidth="0.5" />
            </g>
          );
        })()}
      </svg>
      {vp.span < 0.7 && (function () {
        const z = Math.max(6, Math.min(17, Math.round(Math.log2(1100 / (vp.span * ASPECT)))));
        const n = Math.pow(2, z);
        function xt(lng) { return (lng + 180) / 360 * n; }
        function yt(lat) { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n; }
        function lngOf(x) { return x / n * 360 - 180; }
        function latOf(y) { return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI; }
        const lngSpan = vp.span * ASPECT;
        const x0 = Math.floor(xt(vp.clng - lngSpan / 2)), x1 = Math.floor(xt(vp.clng + lngSpan / 2));
        const y0 = Math.floor(yt(vp.clat + vp.span / 2)), y1 = Math.floor(yt(vp.clat - vp.span / 2));
        if ((x1 - x0 + 1) * (y1 - y0 + 1) > 30) return null;
        const imgs = [];
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
          if (y < 0 || y >= n) continue;
          const p1 = toXY(latOf(y), lngOf(x)), p2 = toXY(latOf(y + 1), lngOf(x + 1));
          imgs.push(<img key={z + "_" + x + "_" + y} src={"https://tile.openstreetmap.org/" + z + "/" + ((x % n) + n) % n + "/" + y + ".png"} alt="" draggable={false}
            style={{ position: "absolute", left: p1.x + "%", top: p1.y + "%", width: (p2.x - p1.x) + "%", height: (p2.y - p1.y) + "%", userSelect: "none", pointerEvents: "none" }} />);
        }
        return (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#E8E4DC" }}>
            {imgs}
            <div style={{ position: "absolute", left: 4, bottom: 2, fontSize: 9, color: "#555", background: "rgba(255,255,255,0.7)", padding: "1px 4px", borderRadius: 3 }}>{"\u00a9 OpenStreetMap-Mitwirkende"}</div>
          </div>
        );
      })()}
      {!dense && visTrees.map(function (t, i) {
        const p = toXY(t.lat, t.lng);
        return (
          <button key={"t" + i} onClick={function () { props.onSelectTree(t); }}
            title={t.art + (t.jahr ? " (" + t.jahr + ")" : "")}
            style={{ position: "absolute", left: p.x + "%", top: p.y + "%", width: 11, height: 11, borderRadius: "50%", background: t.farbe, border: "1.5px solid white", transform: "translate(-50%,-50%)", cursor: "pointer", padding: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        );
      })}
      {!denseK && visKand.map(function (q, i) {
        const p = toXY(q.lat, q.lng);
        return (
          <button key={"q" + i} onClick={function () { props.onSelectKand(q); }}
            title={q.kind + ": " + q.titel}
            style={{ position: "absolute", left: p.x + "%", top: p.y + "%", width: 10, height: 10, borderRadius: 3, background: q.farbe, border: "1.5px solid white", transform: "translate(-50%,-50%) rotate(45deg)", cursor: "pointer", padding: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        );
      })}
      {(props.points || []).filter(function (e) { if (e.stufe === "B" && vp.span > 0.35) return false; return inView(e.lat, e.lng); }).map(function (e) {
        const p = toXY(e.lat, e.lng);
        return (
          <button key={"p" + e.id} onClick={function () { props.onSelect(e); }} title={e.title}
            style={{ position: "absolute", left: p.x + "%", top: p.y + "%", width: 32, height: 32, borderRadius: "50%", background: e.color, border: "2px solid white", transform: "translate(-50%,-50%)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: "0 2px 6px rgba(0,0,0,0.35)", opacity: e.status === "pruefung" ? 0.55 : 1, padding: 0 }}>
            {e.icon}
            {e.routeIdx > 0 && (
              <span style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: "#8B1A1A", color: "white", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid white" }}>{e.routeIdx}</span>
            )}
          </button>
        );
      })}
      <div style={{ position: "absolute", right: 8, top: 8, display: "flex", flexDirection: "column", gap: 5 }}>
        <button onClick={function () { zoom(0.45); }} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #CCC", background: "white", fontSize: 18, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>+</button>
        <button onClick={function () { zoom(2.4); }} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #CCC", background: "white", fontSize: 18, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{"\u2212"}</button>
        <button onClick={function () { setVp(fit()); }} title="Gesamtansicht" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #CCC", background: "white", fontSize: 16, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{"\u2302"}</button>
        <button onClick={toggleTour} title="Bewegungs-Tour" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid " + (tour ? "#8B1A1A" : "#CCC"), background: tour ? "#8B1A1A" : "white", color: tour ? "white" : "#333", fontSize: 15, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{tour ? "\u25A0" : "\u25B6"}</button>
        <button onClick={locate} title="Mein Standort" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid " + (userPos ? "#4285F4" : "#CCC"), background: userPos ? "#E8F0FE" : "white", fontSize: 15, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>{"\uD83D\uDCCD"}</button>
      </div>
      {tour && (
        <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, background: "rgba(255,255,255,0.96)", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.25)", padding: "8px 11px" }}>
          <div style={{ display: "flex", gap: 5, marginBottom: tourNow ? 6 : 0, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#8B1A1A" }}>TOUR</span>
            {[["auto", "Automatik"], ["fuss", "Zu Fuss"], ["rad", "Rad"], ["kfz", "Auto"]].map(function (m) {
              const on = tourMode === m[0];
              return (
                <button key={m[0]} onClick={function () { setTourMode(m[0]); }}
                  style={{ padding: "4px 8px", borderRadius: 11, border: "1px solid " + (on ? "#8B1A1A" : "#DDD"), background: on ? "#8B1A1A" : "white", color: on ? "white" : "#666", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                  {m[1]}
                </button>
              );
            })}
          </div>
          {tourNow && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div onClick={function () { props.onSelect(tourNow); }} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                <div style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span style={{ color: "#8B1A1A", fontWeight: 800 }}>{"\u266B "}</span>
                  <span style={{ fontWeight: 700 }}>{tourNow.title}</span>
                </div>
                {tourNext && <div style={{ fontSize: 10.5, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{"Danach: " + tourNext.title}</div>}
              </div>
              <button onClick={skipTour} style={{ background: "#8B1A1A", color: "white", border: "none", borderRadius: 8, padding: "7px 11px", fontWeight: 800, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>{"\u23ED Weiter"}</button>
            </div>
          )}
          {!tourNow && <div style={{ fontSize: 11, color: "#888" }}>Suche den naechsten Ort...</div>}
        </div>
      )}
      {geoErr === "blocked" && (
        <div style={{ position: "absolute", top: 8, left: 8, background: "white", border: "1px solid #E0B0B0", fontSize: 10.5, padding: "7px 10px", borderRadius: 10, maxWidth: "68%", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          <div style={{ color: "#8B1A1A", fontWeight: 700, marginBottom: 4 }}>GPS in der Vorschau blockiert</div>
          <div style={{ color: "#666", marginBottom: 6 }}>In der gehosteten App funktioniert es normal.</div>
          <button onClick={demoWalk} style={{ background: "#4285F4", color: "white", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>
            {"\u25B6 Demo: Spaziergang in Wurzen"}
          </button>
        </div>
      )}
      {geoErr && geoErr !== "blocked" && (
        <div style={{ position: "absolute", top: 8, left: 8, background: "#FDECEC", color: "#8B1A1A", fontSize: 10.5, padding: "5px 9px", borderRadius: 8, maxWidth: "60%" }}>{geoErr}</div>
      )}
      {dense && (
        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,0.9)", color: "#555", fontSize: 10, padding: "4px 8px", borderRadius: 8 }}>
          {visTrees.length + " Baeume - zoomen zum Antippen"}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 5, left: 8, fontSize: 9, color: "#7A8A7A", pointerEvents: "none" }}>
        {showBackdrop ? "Basiskarte: 182.099 Stadtbaeume Leipzig (Open Data)" : "Herauszoomen fuer Basiskarte"}
      </div>
    </div>
  );
}

const PROV = 0.045;

function fmtEUR(x) { return (x == null ? "" : x.toFixed(2).replace(".", ",") + " \u20ac"); }

export default function App() {
  const [view, setView] = useState("map");
  const [sel, setSel] = useState(null);
  const [ortFilter, setOrtFilter] = useState("alle");
  const [entries, setEntries] = useState(ENTRIES);
  const [sales, setSales] = useState([]);
  const [rTxt, setRTxt] = useState("");
  const [rOrt, setROrt] = useState("");
  const [rDone, setRDone] = useState(false);

  const [fName, setFName] = useState("");
  const [fWerk, setFWerk] = useState("");
  const [fOrt, setFOrt] = useState("");
  const [fBezug, setFBezug] = useState("");
  const [fPreis, setFPreis] = useState("");
  const [fKat, setFKat] = useState("Lyrik");
  const [fAuszug, setFAuszug] = useState("");
  const [fVerb, setFVerb] = useState("entstanden");
  const [fRechte, setFRechte] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selLand, setSelLand] = useState(null);
  const [selTree, setSelTree] = useState(null);
  const [selKand, setSelKand] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introGo, setIntroGo] = useState(false);
  const [autoLoc, setAutoLoc] = useState(false);
  const [curtain, setCurtain] = useState(false);
  useEffect(function () {
    if (curtain) { const t = setTimeout(function () { setCurtain(false); }, 1500); return function () { clearTimeout(t); }; }
  }, [curtain]);
  function openCurtain() { setShowIntro(false); setCurtain(true); }
  const [transport, setTransport] = useState("fuss");
   const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  function sprich(text) {
    if (!window.speechSynthesis) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE"; u.rate = 0.95;
    u.onend = function () { setSpeaking(false); };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }
  const [route, setRoute] = useState(function () { try { return JSON.parse(localStorage.getItem("kulisso_route")) || []; } catch (e) { return []; } });
  useEffect(function () { try { localStorage.setItem("kulisso_route", JSON.stringify(route)); } catch (e) {} }, [route]);
  function inRoute(id) { return route.indexOf(id) >= 0; }
  function toggleRoute(id) {
    if (inRoute(id)) setRoute(route.filter(function (x) { return x !== id; }));
    else setRoute(route.concat([id]));
  }
  function hav(a, b) {
    const R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  const routeEntries = route.map(function (id) {
    for (let i = 0; i < entries.length; i++) if (entries[i].id === id) return entries[i];
    return null;
  }).filter(function (x) { return x; });
  let routeDist = 0;
  for (let i = 1; i < routeEntries.length; i++) routeDist += hav(routeEntries[i - 1], routeEntries[i]);
  function moveRoute(i, d) {
    const n = route.slice(); const j = i + d;
    if (j < 0 || j >= n.length) return;
    const t = n[i]; n[i] = n[j]; n[j] = t; setRoute(n);
  }
  function optimizeRoute() {
    if (routeEntries.length < 3) return;
    const rest = routeEntries.slice(1); const ordered = [routeEntries[0]];
    while (rest.length) {
      const last = ordered[ordered.length - 1];
      let bi = 0, bd2 = 1e9;
      for (let i = 0; i < rest.length; i++) {
        const d = hav(last, rest[i]);
        if (d < bd2) { bd2 = d; bi = i; }
      }
      ordered.push(rest.splice(bi, 1)[0]);
    }
    setRoute(ordered.map(function (e) { return e.id; }));
  }
  const [layers, setLayers] = useState({ buecher: true, musik: true, natur: true, geschichte: true, film: true, buehne: true, baeume: false, kandidaten: false });
  function toggleLayer(k) {
    const n = {}; for (const key in layers) n[key] = layers[key];
    n[k] = !n[k]; setLayers(n);
  }
  function catLayer(cat) {
    if (cat === "Musik") return "musik";
    if (cat === "Natur") return "natur";
    if (cat === "Geschichte") return "geschichte";
    if (cat === "Film") return "film";
    if (cat === "Buehne") return "buehne";
    return "buecher"; // inkl. Literatur, Lyrik, Biografie
  }

  const bezugOk = fBezug.trim().length >= 30;
  const formOk = fName.trim() && fWerk.trim() && fOrt.trim() && bezugOk && fRechte;

  const filtered = entries.filter(function (e) {
    const okOrt = ortFilter === "alle" || e.ort === ortFilter ||
      (ortFilter === "muldental" && (e.ort === "wurzen" || e.ort === "bennewitz"));
    return okOrt && layers[catLayer(e.category)];
  });
  const treesActive = layers.baeume && (ortFilter === "alle" || ortFilter === "leipzig");
  const shownTrees = treesActive ? (selLand ? ALL_TREES.filter(function (t) { return t.land === selLand; }) : ALL_TREES) : [];
  const shownKand = layers.kandidaten ? ALL_KAND : [];

  function open(e) { setSel(e); setView("detail"); setRTxt(""); setRDone(false); }
  function back() { if (window.speechSynthesis) window.speechSynthesis.cancel(); setSpeaking(false); setSel(null); setView("map"); }
  const [korb, setKorb] = useState(function () { try { return JSON.parse(localStorage.getItem("kulisso_korb")) || []; } catch (e) { return []; } });
  useEffect(function () { try { localStorage.setItem("kulisso_korb", JSON.stringify(korb)); } catch (e) {} }, [korb]);
  const [korbOpen, setKorbOpen] = useState(false);
  const [suchQ, setSuchQ] = useState("");
  const [wikiSum, setWikiSum] = useState(null);
  useEffect(function () {
    setWikiSum(null);
    if (view === "detail" && sel) wikiHol(sel.title, function (w) { setWikiSum(w); });
  }, [view, sel]);
  function imKorb(id) { return korb.some(function (x) { return x.id === id; }); }
  function toggleKorb(e) {
    setKorb(function (k) { return imKorb(e.id) ? k.filter(function (x) { return x.id !== e.id; }) : k.concat([e]); });
  }
  function kaufen(e) {
    setSales(sales.concat([{ id: Date.now(), titel: e.work, artist: e.artist, preis: e.preis, provision: (e.preis || 0) * 0.07 }]));
    const url = e.shop || ("https://www.genialokal.de/Suche/?q[]=" + encodeURIComponent((e.kauf || e.title || "") + " " + (e.artist || "")));
    window.open(url, "_blank");
  }
  function einreichen() {
    if (!formOk) return;
    setEntries(entries.concat([{
      id: Date.now(), ort: "wurzen", icon: "\u23F3", color: "#9E9E9E",
      title: fOrt, address: fOrt, category: fKat, artist: fName, work: fWerk,
      distance: "neu", lat: 51.368, lng: 12.731,
      excerpt: fAuszug.trim() ? fAuszug.trim() : "(Werkauszug folgt nach Freigabe)", ortstext: ({ entstanden: "Hier entstanden: ", inspiriert: "Inspirationsort: ", gelebt: "Lebens-/Wirkungsort: ", handlung: "Schauplatz des Werks: " })[fVerb] + fBezug,
      frage: "Was loest dieses Werk in Ihnen aus?",
      kauf: "Direktverkauf", preis: parseFloat(fPreis) || 15, status: "pruefung"
    }]));
    setSubmitted(true);
    setFName(""); setFWerk(""); setFOrt(""); setFBezug(""); setFPreis(""); setFAuszug(""); setFRechte(false);
  }

  const gesamt = sales.reduce(function (s, v) { return s + v.provision; }, 0);
  const lats = filtered.map(function (e) { return e.lat; }).concat(shownTrees.map(function (t) { return t.lat; })).concat(shownKand.map(function (q) { return q.lat; }));
  const lngs = filtered.map(function (e) { return e.lng; }).concat(shownTrees.map(function (t) { return t.lng; })).concat(shownKand.map(function (q) { return q.lng; }));
  const b = filtered.length > 0 ? {
    minLat: Math.min.apply(null, lats) - 0.004,
    maxLat: Math.max.apply(null, lats) + 0.004,
    minLng: Math.min.apply(null, lngs) - 0.006,
    maxLng: Math.max.apply(null, lngs) + 0.006
  } : { minLat: 51.3, maxLat: 51.4, minLng: 12.3, maxLng: 12.8 };
  const tabs = [["map", "Karte"], ["route", "Route"], ["baeume", "Baeume"], ["kuenstler", "Kuenstler"], ["umsatz", "Umsatz"]];

  if (showIntro) {
    return (
      <div style={{ maxWidth: 430, margin: "0 auto", height: "100vh", position: "relative", overflow: "hidden", background: "#2B0A0A", fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <style>{"@keyframes startL{to{transform:translateX(-102%)}}@keyframes startR{to{transform:translateX(102%)}}@keyframes fadeC{to{opacity:0;visibility:hidden}}@keyframes glow{0%,100%{opacity:0.85}50%{opacity:1}}"}</style>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "51%",
          background: "repeating-linear-gradient(90deg,#4A0D0D 0px,#7A1515 22px,#5E0F0F 44px,#8B1A1A 66px,#4A0D0D 88px)",
          boxShadow: "inset -30px 0 60px rgba(0,0,0,0.55), inset 0 -80px 90px rgba(0,0,0,0.35)",
          animation: introGo ? "startL 1.5s cubic-bezier(0.7,0,0.3,1) forwards" : "none" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "51%",
          background: "repeating-linear-gradient(90deg,#4A0D0D 0px,#8B1A1A 22px,#5E0F0F 44px,#7A1515 66px,#4A0D0D 88px)",
          boxShadow: "inset 30px 0 60px rgba(0,0,0,0.55), inset 0 -80px 90px rgba(0,0,0,0.35)",
          animation: introGo ? "startR 1.5s cubic-bezier(0.7,0,0.3,1) forwards" : "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 26,
          background: "linear-gradient(180deg,#3A0B0B,#5E0F0F)", borderBottom: "3px solid #C9A227",
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)", zIndex: 3 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 2, padding: "0 30px", textAlign: "center",
          animation: introGo ? "fadeC 0.7s ease forwards" : "none" }}>
          <div style={{ width: 108, height: 108, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #FFF7E0, #F3E3B8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 3px #C9A227, 0 0 40px rgba(201,162,39,0.45), 0 10px 30px rgba(0,0,0,0.5)", marginBottom: 26 }}>
            <img src={LOGO} alt="" style={{ width: 72, height: 72 }} />
          </div>
          <div style={{ color: "#F5E9C8", fontSize: 44, fontWeight: 700, letterSpacing: "0.04em", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>Kulisso</div>
          <div style={{ color: "#C9A227", fontSize: 13.5, letterSpacing: "0.28em", textTransform: "uppercase", marginTop: 10, marginBottom: 44, animation: "glow 3s ease-in-out infinite" }}>Orte mit offenem Vorhang</div>
          <button onClick={function () { setAutoLoc(true); setIntroGo(true); setTimeout(function () { setShowIntro(false); }, 1450); }}
            style={{ background: "linear-gradient(180deg,#E4C766,#C9A227 55%,#A8861D)", color: "#2B0A0A", border: "none",
              borderRadius: 30, padding: "16px 42px", fontSize: 17, fontWeight: 700, fontFamily: "inherit", letterSpacing: "0.03em",
              cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)" }}>
            {"Vorhang auf"}
          </button>
          <button onClick={function () { setIntroGo(true); setTimeout(function () { setShowIntro(false); }, 1450); }}
            style={{ background: "none", border: "none", color: "rgba(245,233,200,0.65)", fontSize: 12.5, marginTop: 20, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em", textDecoration: "underline", textUnderlineOffset: 3 }}>
            {"ohne Standort ansehen"}
          </button>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", zIndex: 2, color: "rgba(245,233,200,0.4)", fontSize: 10.5, letterSpacing: "0.12em", animation: introGo ? "fadeC 0.5s ease forwards" : "none" }}>
          {"5.114 ORTE \u00b7 LITERATUR \u00b7 MUSIK \u00b7 FILM \u00b7 GESCHICHTE"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "#F2F2F2", fontFamily: "system-ui, sans-serif", overflow: "hidden", position: "relative" }}>

      {menuOpen && (
        <div onClick={function () { setMenuOpen(false); }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50 }}>
          <div onClick={function (ev) { ev.stopPropagation(); }} style={{ width: "76%", height: "100%", background: "white", padding: "18px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px 16px", borderBottom: "1px solid #E5E5E5" }}>
              <img src={LOGO} alt="" style={{ width: 40, height: 40 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Kulisso</div>
                <div style={{ fontSize: 10.5, color: "#6B6B6B" }}>Orte mit offenem Vorhang</div>
              </div>
            </div>
            {[["hilfe", "Hilfe & Infos"], ["einstellungen", "Einstellungen"], ["impressum", "Impressum"], ["datenschutz", "Datenschutz"]].map(function (m) {
              return (
                <button key={m[0]} onClick={function () {
                  setMenuOpen(false);
                  if (m[0] === "einstellungen") setShowIntro(true); else setPage(m[0]);
                }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "17px 18px", border: "none", borderBottom: "1px solid #EFEFEF", background: "transparent", fontSize: 17, color: "#1A1A1A", cursor: "pointer" }}>
                  {m[1]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {curtain && (
        <div style={{ position: "absolute", inset: 0, zIndex: 90, pointerEvents: "none", overflow: "hidden" }}>
          <style>{"@keyframes kulL{to{transform:translateX(-101%)}}@keyframes kulR{to{transform:translateX(101%)}}"}</style>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "51%", background: "linear-gradient(90deg,#5E0F0F,#8B1A1A 60%,#6E1414)", boxShadow: "inset -18px 0 30px rgba(0,0,0,0.4)", animation: "kulL 1.2s ease-in-out 0.15s forwards" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "51%", background: "linear-gradient(270deg,#5E0F0F,#8B1A1A 60%,#6E1414)", boxShadow: "inset 18px 0 30px rgba(0,0,0,0.4)", animation: "kulR 1.2s ease-in-out 0.15s forwards" }} />
        </div>
      )}
      {view === "map" && (
        <div style={{ position: "absolute", left: 10, right: 56, top: 10, zIndex: 65 }}>
          <input value={suchQ} onChange={function (ev) { setSuchQ(ev.target.value); }}
            placeholder="Suche: Werk, Kuenstler, Ort..."
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 13px", borderRadius: 22, border: "1px solid #CCC", fontSize: 13, background: "rgba(255,255,255,0.97)", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", outline: "none" }} />
          {suchQ.trim().length >= 2 && (
            <div style={{ background: "white", borderRadius: 12, marginTop: 6, boxShadow: "0 4px 14px rgba(0,0,0,0.25)", maxHeight: 260, overflowY: "auto" }}>
              {ENTRIES.filter(function (e) {
                const q = suchQ.trim().toLowerCase();
                return (e.title || "").toLowerCase().indexOf(q) >= 0 || (e.artist || "").toLowerCase().indexOf(q) >= 0 || (e.address || "").toLowerCase().indexOf(q) >= 0 || (e.work || "").toLowerCase().indexOf(q) >= 0;
              }).slice(0, 20).map(function (e) {
                return (
                  <div key={"s" + e.id} onClick={function () { setSuchQ(""); open(e); }}
                    style={{ display: "flex", gap: 9, alignItems: "center", padding: "9px 12px", borderBottom: "1px solid #F0F0F0", cursor: "pointer" }}>
                    <span style={{ fontSize: 16 }}>{e.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                      <div style={{ fontSize: 10.5, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(e.artist || "") + " \u00b7 " + (e.address || "")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {korb.length > 0 && view === "map" && (
        <button onClick={function () { setKorbOpen(true); }} style={{ position: "absolute", right: 12, bottom: 84, zIndex: 70, background: ROT, color: "white", border: "none", borderRadius: 24, padding: "11px 15px", fontWeight: 800, fontSize: 13.5, boxShadow: "0 3px 10px rgba(0,0,0,0.35)", cursor: "pointer" }}>
          {"\uD83E\uDDFA " + korb.length + (korb.some(function (x) { return x.preis != null; }) ? " \u00b7 ab " + fmtEUR(korb.reduce(function (s, x) { return s + (x.preis || 0); }, 0)) : "")}
        </button>
      )}
      {korbOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 95, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end" }} onClick={function () { setKorbOpen(false); }}>
          <div onClick={function (ev) { ev.stopPropagation(); }} style={{ background: "white", width: "100%", maxHeight: "75%", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{"\uD83E\uDDFA Ihr Tour-Korb"}</div>
            <div style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>Die Werke Ihrer Route - gesammelt zum Bestellen.</div>
            {korb.map(function (x) {
              return (
                <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #EEE" }}>
                  <span style={{ fontSize: 18 }}>{x.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.kauf}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{x.title}</div>
                  </div>
                  <button onClick={function () { kaufen(x); }} style={{ background: ROT, color: "white", border: "none", borderRadius: 8, padding: "7px 10px", fontWeight: 700, fontSize: 11.5, cursor: "pointer", flexShrink: 0 }}>{x.preis != null ? fmtEUR(x.preis) + " kaufen" : "Zum Shop"}</button>
                  <button onClick={function () { toggleKorb(x); }} style={{ background: "none", border: "none", color: "#999", fontSize: 15, cursor: "pointer", flexShrink: 0 }}>{"\u2715"}</button>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14, padding: "12px 0 4px" }}>
              <span>Gesamt</span><span>{fmtEUR(korb.reduce(function (s, x) { return s + (x.preis || 0); }, 0))}</span>
            </div>
            <div style={{ fontSize: 10.5, color: "#999", marginTop: 6 }}>Jeder Kauf oeffnet den jeweiligen Shop. Buecher gern gesammelt beim lokalen Buchhandel bestellen.</div>
          </div>
        </div>
      )}
      {view !== "detail" && view !== "treedetail" && view !== "kanddetail" && (
        <div style={{ background: "white", padding: "12px 16px", borderBottom: "1px solid #E0E0E0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO} alt="Kulisso" style={{ width: 38, height: 38, objectFit: "contain" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1A1A1A" }}>Kulisso</div>
              <div style={{ fontSize: 11, color: "#6B6B6B" }}>Orte mit offenem Vorhang</div>
            </div>
            <div style={{ marginLeft: "auto", background: "#E8F5E9", color: "#2E7D32", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              {entries.filter(function (e) { return e.status === "live"; }).length + " LIVE"}
            </div>
            <button onClick={function () { setMenuOpen(true); }} style={{ border: "none", background: "transparent", fontSize: 22, cursor: "pointer", color: "#8B1A1A", padding: "0 2px" }}>{"\u2630"}</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {view === "detail" && sel && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ background: sel.color, padding: "15px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <button onClick={back} style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 8, color: "white", padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>{"\u2190"}</button>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{sel.title}</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>{sel.address}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 26 }}>{sel.icon}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
              {sel.status === "vorbereitung" && (
                <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 8, padding: "8px 12px", fontSize: 11.5, color: "#E65100", marginBottom: 12, fontWeight: 600 }}>
                  In Vorbereitung - Textauszug folgt
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 2 }}>KUENSTLER / ANKER</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>{sel.artist}</div>
                <div style={{ fontSize: 12.5, color: sel.color, fontStyle: "italic", marginTop: 2 }}>{sel.work}</div>
              </div>
              <div style={{ background: "#F7F2F2", border: "1px solid #E5D5D5", borderRadius: 10, padding: "13px 15px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: sel.color, textTransform: "uppercase", marginBottom: 6 }}>DER ORT</div>
                <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.65 }}>{sel.ortstext}</div>
                {wikiSum && wikiSum.text && (
                  <div style={{ marginTop: 14, padding: "12px 14px", background: "#F7F5F0", borderLeft: "3px solid #C9A227", borderRadius: "0 10px 10px 0" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "#8B7A3C", marginBottom: 6 }}>AUS WIKIPEDIA</div>
                    <div style={{ fontSize: 12.5, color: "#333", lineHeight: 1.6 }}>{wikiSum.text}</div>
                    {wikiSum.url && (
                      <a href={wikiSum.url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: "#8B1A1A", fontWeight: 700 }}>
                        {"Ganzer Artikel \u2192 (Wikipedia, CC BY-SA)"}
                      </a>
                    )}
                  </div>
                )}
              </div>
              {sel.event && (
                <div style={{ background: "#FFF3E0", border: "1.5px solid #E8820C", borderRadius: 10, padding: "11px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#E65100", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{"\uD83C\uDF9F LIVE-VERANSTALTUNG"}</div>
                  <div style={{ fontSize: 12.5, color: "#5D4037", lineHeight: 1.55 }}>{sel.event}</div>
                </div>
              )}
              <div style={{ background: "#FAFAFA", borderRadius: 10, borderLeft: "4px solid " + sel.color, padding: "13px 15px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", marginBottom: 8 }}>DAS WERK</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, lineHeight: 1.8, color: "#2A2A2A", whiteSpace: "pre-line", fontStyle: "italic" }}>{sel.excerpt}</div>
              </div>
              <button onClick={function () { sprich(sel.excerpt.replace(/\n/g, " ") + ". " + sel.ortstext + (wikiSum && wikiSum.text ? " Aus Wikipedia: " + wikiSum.text : "")); }}
                style={{ width: "100%", background: speaking ? "#555" : "#D9D9D9", border: "none", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#333", flexShrink: 0 }}>{speaking ? "\u25A0" : "\u25B6"}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: speaking ? "white" : "#1A1A1A" }}>{speaking ? "Wiedergabe stoppen" : "Dieses Werk jetzt anhoeren"}</span>
              </button>
              <button onClick={function () { kaufen(sel); }} style={{ width: "100%", background: ROT, color: "white", border: "none", borderRadius: 10, padding: "13px 16px", fontWeight: 700, fontSize: 14, marginBottom: 6, cursor: "pointer" }}>
                {sel.preis != null ? "\uD83D\uDED2 Werk kaufen \u00b7 " + sel.kauf + " \u00b7 " + fmtEUR(sel.preis) : "\uD83D\uDED2 Im Shop ansehen \u00b7 " + sel.kauf}
              </button>
              <button onClick={function () { toggleKorb(sel); }} style={{ width: "100%", background: imKorb(sel.id) ? "#555" : "white", color: imKorb(sel.id) ? "white" : ROT, border: "2px solid " + ROT, borderRadius: 10, padding: "11px 16px", fontWeight: 700, fontSize: 13.5, marginBottom: 6, cursor: "pointer" }}>
                {imKorb(sel.id) ? "\u2713 Im Tour-Korb" : "\uD83E\uDDFA In den Tour-Korb"}
              </button>
              <div style={{ fontSize: 11, color: "#6B6B6B", textAlign: "center", marginBottom: 16 }}>Kaufen oeffnet den Shop - der Tour-Korb sammelt fuer spaeter</div>
              <button onClick={function () { toggleRoute(sel.id); }}
                style={{ width: "100%", padding: 12, background: inRoute(sel.id) ? "#555" : "#2E7D32", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", marginBottom: 16 }}>
                {inRoute(sel.id) ? "\u2713 In Route - entfernen" : "\uD83E\uDDED Zur Route hinzufuegen"}
              </button>
              <div style={{ background: "white", borderRadius: 10, border: "1.5px solid #DDD", padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A", marginBottom: 8 }}>{"\uD83D\uDCAC Ihre Resonanz auf dieses Werk"}</div>
                <div style={{ fontSize: 12, color: "#6B6B6B", lineHeight: 1.55, fontStyle: "italic", borderBottom: "1px solid #E0E0E0", paddingBottom: 10, marginBottom: 12 }}>{sel.frage}</div>
                {!rDone && (
                  <div>
                    <input value={rOrt} onChange={function (ev) { setROrt(ev.target.value); }}
                      placeholder="Wo haben Sie das Werk gelesen/gehoert? (optional, z.B. Strandkorb Warnemuende)"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box", border: "1.5px solid #E0E0E0", fontSize: 12.5, outline: "none", marginBottom: 8 }} />
                    <textarea value={rTxt} onChange={function (ev) { setRTxt(ev.target.value); }}
                      placeholder="Was hat das Werk mit Ihnen gemacht - verankert an diesem Ort..."
                      style={{ width: "100%", minHeight: 80, borderRadius: 8, boxSizing: "border-box", border: "1.5px solid #E0E0E0", padding: "10px 12px", fontSize: 13, fontFamily: "Georgia, serif", resize: "vertical", outline: "none" }} />
                    <button onClick={function () { if (rTxt.trim().length >= 10) setRDone(true); }}
                      style={{ marginTop: 10, width: "100%", padding: 11, background: rTxt.trim().length >= 10 ? sel.color : "#CCC", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Resonanz hinterlegen
                    </button>
                  </div>
                )}
                {rDone && (
                  <div style={{ background: "#E8F5E9", borderRadius: 8, padding: 14, textAlign: "center" }}>
                    <div style={{ fontWeight: 700, color: "#2E7D32", fontSize: 13 }}>{"\u2713 Ihre Resonanz wurde gespeichert"}</div>
                    {rOrt.trim() && <div style={{ fontSize: 11.5, color: "#555", marginTop: 6 }}>{"Ihr Lese-Ort: " + rOrt + " - als zweiter Anker vermerkt"}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "map" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[["alle", "Alle"], ["leipzig", "Leipzig"], ["muldental", "Muldental"], ["de", "Deutschland"]].map(function (f) {
                const on = ortFilter === f[0];
                return (
                  <button key={f[0]} onClick={function () { setOrtFilter(f[0]); }}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: on ? ROT : "white", color: on ? "white" : "#6B6B6B", border: "1px solid " + (on ? ROT : "#E0E0E0") }}>
                    {f[1]}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[["buecher", "\uD83D\uDCD6 Buecher"], ["musik", "\uD83C\uDFB5 Musik"], ["film", "\uD83C\uDFAC Film"], ["buehne", "\uD83C\uDFAD Buehne"], ["natur", "\uD83C\uDF3F Natur"], ["geschichte", "\uD83C\uDFF0 Geschichte"], ["baeume", "\uD83C\uDF33 Baeume"]].map(function (l) {
                const on = layers[l[0]];
                return (
                  <button key={l[0]} onClick={function () { toggleLayer(l[0]); }}
                    style={{ padding: "5px 10px", borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: "pointer", background: on ? "#2E7D32" : "white", color: on ? "white" : "#999", border: "1.5px solid " + (on ? "#2E7D32" : "#DDD"), opacity: on ? 1 : 0.75 }}>
                    {(on ? "\u2713 " : "") + l[1]}
                  </button>
                );
              })}
            </div>
            {layers.baeume && ortFilter !== "alle" && ortFilter !== "leipzig" && (
              <div style={{ fontSize: 10.5, color: "#E65100", background: "#FFF3E0", borderRadius: 8, padding: "6px 10px" }}>
                Baumdaten liegen bisher nur fuer Leipzig vor - weitere Staedte folgen im Rollout
              </div>
            )}

            <PanZoomMap
              points={filtered.map(function (e) { const i = route.indexOf(e.id); return Object.assign({}, e, { routeIdx: i >= 0 ? i + 1 : 0 }); })}
              routeLine={routeEntries.map(function (e) { return [e.lat, e.lng]; })}
              trees={shownTrees.map(function (t) { return { lat: t.lat, lng: t.lng, art: t.art, jahr: t.jahr, strasse: t.strasse, ot: t.ot, wiss: t.wiss, land: t.land, farbe: (TREEMETA[t.land] || {}).f || "#2E7D32" }; })}
              kand={shownKand}
              onSelect={open}
              onSelectTree={function (t) { setSelTree(t); setView("treedetail"); }}
              onSelectKand={function (q) { setSelKand(q); setView("kanddetail"); }}
              autoLocate={autoLoc}
              fitKey={ortFilter + "|" + treesActive + "|" + layers.kandidaten}
              height={300}
            />

            <div style={{ background: "white", borderRadius: 10, border: "1px solid #E0E0E0", padding: "9px 14px", display: "flex", fontSize: 12, color: "#6B6B6B" }}>
              <span>{filtered.length + " Kulturorte" + (treesActive ? " + " + shownTrees.length + " Baeume" : "") + (layers.kandidaten ? " + " + shownKand.length + " Funde" : "")}</span>
              <span style={{ marginLeft: "auto" }}>Alle Werke gemeinfrei</span>
            </div>

            {filtered.map(function (e) {
              return (
                <div key={e.id} onClick={function () { open(e); }}
                  style={{ background: "white", borderRadius: 10, border: "1px solid #E0E0E0", padding: "12px 14px", cursor: "pointer", display: "flex", gap: 11, alignItems: "center", opacity: e.status === "pruefung" ? 0.65 : 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "#F5F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{e.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A" }}>{e.title}</div>
                      <div style={{ background: e.status === "pruefung" ? "#FFF3E0" : e.status === "vorbereitung" ? "#FFF3E0" : "#E8820C", color: e.status === "live" ? "white" : "#E65100", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {e.status === "pruefung" ? "Pruefung" : e.status === "vorbereitung" ? "bald" : e.distance}
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#6B6B6B" }}>{e.artist}</div>
                    <div style={{ fontSize: 11.5, color: e.color, fontStyle: "italic" }}>{e.work}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "kanddetail" && selKand && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ background: selKand.farbe, padding: "15px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <button onClick={function () { setSelKand(null); setView("map"); }}
                style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 8, color: "white", padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>{"\u2190"}</button>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "white", fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{selKand.titel}</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{selKand.ort}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 24 }}>{"\uD83D\uDDC2"}</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
              <div style={{ display: "inline-block", border: "1.5px solid " + selKand.farbe, borderRadius: 20, padding: "3px 11px", marginBottom: 14, fontSize: 11, fontWeight: 700, color: selKand.farbe, textTransform: "uppercase" }}>{selKand.kind}</div>
              <div style={{ background: "#F7F7F7", borderRadius: 10, padding: "13px 15px", fontSize: 13, lineHeight: 1.75, marginBottom: 14 }}>
                {selKand.autor && <div><b>Info:</b> {selKand.autor}</div>}
                {selKand.jahr && <div><b>Jahr:</b> {selKand.jahr}</div>}
                <div><b>Ort:</b> {selKand.ort}</div>
                <div><b>Quelle:</b> Wikidata (CC0) - Massen-Ernte Phase 3</div>
                <div><b>Status:</b> Kandidat - noch nicht redaktionell ausgearbeitet</div>
              </div>
              <button onClick={function () { setFOrt(selKand.ort); setSelKand(null); setView("kuenstler"); }}
                style={{ width: "100%", padding: 12, background: "#8B1A1A", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                {"Zu vollem Eintrag ausarbeiten"}
              </button>
            </div>
          </div>
        )}

        {view === "treedetail" && selTree && (function () {
          const m = TREEMETA[selTree.land] || {};
          const tf = m.f || "#2E7D32";
          return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              <div style={{ background: tf, padding: "15px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <button onClick={function () { setSelTree(null); setView("map"); }}
                  style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 8, color: "white", padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>{"\u2190"}</button>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{selTree.art}</div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{(selTree.strasse || "Leipzig") + (selTree.ot ? ", " + selTree.ot : "")}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 26 }}>{"\uD83C\uDF33"}</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
                <div style={{ display: "inline-block", border: "1.5px solid " + tf, borderRadius: 20, padding: "3px 11px", marginBottom: 14, fontSize: 11, fontWeight: 700, color: tf, textTransform: "uppercase" }}>{selTree.land}</div>
                <div style={{ background: "#F4F8F4", border: "1px solid #D5E5D5", borderRadius: 10, padding: "13px 15px", marginBottom: 14, fontSize: 13, lineHeight: 1.7 }}>
                  <div><b>Botanisch:</b> {selTree.wiss || "-"}</div>
                  <div><b>Pflanzjahr:</b> {selTree.jahr || "unbekannt"}</div>
                  <div><b>Standort:</b> {(selTree.strasse || "-") + (selTree.ot ? ", " + selTree.ot : "")}</div>
                  <div><b>Quelle:</b> Baumkataster Stadt Leipzig (Open Data)</div>
                </div>
                <div style={{ background: "white", borderRadius: 10, border: "2px solid " + tf, padding: 13, fontSize: 12.5, lineHeight: 1.65, marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: tf, marginBottom: 5 }}>{"Kultur-Verknuepfung " + selTree.land}</div>
                  <div>{"\uD83C\uDFDB Partnerstadt: " + (m.p || "-")}</div>
                  <div>{"\uD83C\uDF93 Institut/Verein: " + (m.i || "-")}</div>
                  <div>{"\uD83C\uDFE2 Konsulat: " + (m.k || "-")}</div>
                  <div>{"\uD83D\uDC65 Migration Leipzig: " + (m.m || "-")}</div>
                </div>
                <button onClick={function () { setFOrt((selTree.strasse || "Leipzig") + ", Leipzig"); setSelTree(null); setView("kuenstler"); }}
                  style={{ width: "100%", padding: 12, background: "#8B1A1A", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: "pointer", marginBottom: 8 }}>
                  {"\uD83C\uDFA8 Kunstwerk an diesem Baum verorten"}
                </button>
                <div style={{ fontSize: 11, color: "#6B6B6B", textAlign: "center" }}>
                  Der Standort wird ins Kuenstler-Formular uebernommen
                </div>
              </div>
            </div>
          );
        })()}

        {view === "baeume" && (function () {
          const tlats = ALL_TREES.map(function (t) { return t.lat; });
          const tlngs = ALL_TREES.map(function (t) { return t.lng; });
          const tb = {
            minLat: Math.min.apply(null, tlats) - 0.005, maxLat: Math.max.apply(null, tlats) + 0.005,
            minLng: Math.min.apply(null, tlngs) - 0.007, maxLng: Math.max.apply(null, tlngs) + 0.007
          };
          const shown = selLand ? ALL_TREES.filter(function (t) { return t.land === selLand; }) : ALL_TREES;
          function tc(land) { return (TREEMETA[land] || {}).f || "#666"; }
          const m = selLand ? TREEMETA[selLand] : null;
          return (
            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
              <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 8 }}>
                {"Alle " + ALL_TREES.length + " Leipziger Baeume mit Laendernamen aus 20 Laendern - jeder ein potenzieller Kulturanker."}
              </div>
              <PanZoomMap
                points={[]}
                trees={shown.map(function (t) { return { lat: t.lat, lng: t.lng, art: t.art, jahr: t.jahr, strasse: t.strasse, ot: t.ot, wiss: t.wiss, land: t.land, farbe: tc(t.land) }; })}
                onSelect={function () {}}
                onSelectTree={function (t) { setSelTree(t); setView("treedetail"); }}
                fitKey={"b|" + (selLand || "alle")}
                height={290}
              />
              <div style={{ height: 8 }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                <button onClick={function () { setSelLand(null); }}
                  style={{ padding: "4px 9px", borderRadius: 14, fontSize: 10, fontWeight: 600, cursor: "pointer", background: selLand === null ? "#8B1A1A" : "white", color: selLand === null ? "white" : "#555", border: "1px solid #DDD" }}>
                  Alle
                </button>
                {TREEDATA.summary.map(function (s) {
                  const on = selLand === s.land;
                  return (
                    <button key={s.land} onClick={function () { setSelLand(on ? null : s.land); }}
                      style={{ padding: "4px 9px", borderRadius: 14, fontSize: 10, fontWeight: 600, cursor: "pointer", background: on ? tc(s.land) : "white", color: on ? "white" : "#555", border: "1px solid " + tc(s.land) }}>
                      {s.land + " (" + s.anzahl + ")"}
                    </button>
                  );
                })}
              </div>
              {m && (
                <div style={{ background: "white", borderRadius: 10, border: "2px solid " + m.f, padding: 12, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: m.f, marginBottom: 4 }}>{selLand}</div>
                  <div>{"\uD83C\uDFDB Partnerstadt: " + m.p}</div>
                  <div>{"\uD83C\uDF93 Institut/Verein: " + m.i}</div>
                  <div>{"\uD83C\uDFE2 Konsulat: " + m.k}</div>
                  <div>{"\uD83D\uDC65 Migration Leipzig: " + m.m}</div>
                </div>
              )}
              <div style={{ background: "#FFF8E1", border: "1px solid #E6A817", borderRadius: 10, padding: 11, fontSize: 11.5, lineHeight: 1.55 }}>
                <b>Luecke als Chance:</b> Groesste Migrantengruppen ohne eigenen Landesbaum:
                {LUECKEN.map(function (l) {
                  return <div key={l.land} style={{ marginTop: 3 }}>{"\u2022 " + l.land + " (" + l.m + ") - " + l.idee}</div>;
                })}
                <div style={{ marginTop: 5, fontSize: 10, color: "#7A5C00" }}>Quelle Migration: Stadt Leipzig, Einwohnerregister 2024</div>
              </div>
            </div>
          );
        })()}

        {view === "route" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            <div style={{ background: "#8B1A1A", borderRadius: 12, padding: 16, color: "white", marginBottom: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Meine Kulturroute</div>
              <div style={{ fontSize: 26, fontWeight: 800, margin: "3px 0" }}>{routeEntries.length + " Stationen"}</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{routeEntries.length > 1 ? "Gesamtstrecke (Luftlinie): " + routeDist.toFixed(1) + " km" : "Fuegen Sie Orte ueber die Detailseiten hinzu"}</div>
            </div>
            {routeEntries.length >= 3 && (
              <button onClick={optimizeRoute}
                style={{ width: "100%", padding: 10, background: "#2E7D32", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginBottom: 10 }}>
                {"\u26A1 Route optimieren (kuerzeste Reihenfolge)"}
              </button>
            )}
            {routeEntries.map(function (e, i) {
              return (
                <div key={e.id} style={{ background: "white", borderRadius: 10, border: "1px solid #E0E0E0", padding: "10px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#8B1A1A", color: "white", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A" }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: "#6B6B6B" }}>{e.artist + (i > 0 ? " \u00b7 +" + hav(routeEntries[i - 1], e).toFixed(1) + " km" : "")}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button onClick={function () { moveRoute(i, -1); }} style={{ border: "1px solid #DDD", background: "white", borderRadius: 6, cursor: "pointer", fontSize: 11, padding: "1px 7px" }}>{"\u25B2"}</button>
                    <button onClick={function () { moveRoute(i, 1); }} style={{ border: "1px solid #DDD", background: "white", borderRadius: 6, cursor: "pointer", fontSize: 11, padding: "1px 7px" }}>{"\u25BC"}</button>
                  </div>
                  <button onClick={function () { toggleRoute(e.id); }} style={{ border: "none", background: "#FDECEC", color: "#8B1A1A", borderRadius: 8, cursor: "pointer", fontSize: 15, width: 30, height: 30, fontWeight: 700 }}>{"\u00d7"}</button>
                </div>
              );
            })}
            {routeEntries.length === 0 && (
              <div style={{ background: "white", borderRadius: 10, border: "1px dashed #CCC", padding: 20, textAlign: "center", fontSize: 12.5, color: "#888", lineHeight: 1.6 }}>
                Noch keine Stationen.<br />Oeffnen Sie einen Kulturort auf der Karte und tippen Sie auf<br /><b style={{ color: "#2E7D32" }}>Zur Route hinzufuegen</b>.
              </div>
            )}
            {routeEntries.length > 1 && (
              <div style={{ fontSize: 11, color: "#6B6B6B", textAlign: "center", marginTop: 6 }}>
                Die Route wird auf der Karte als rote Linie mit Nummern angezeigt
              </div>
            )}
            {routeEntries.length > 0 && (
              <button onClick={function () { setRoute([]); }}
                style={{ width: "100%", padding: 9, background: "white", color: "#8B1A1A", border: "1px solid #8B1A1A", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", marginTop: 8 }}>
                Route leeren
              </button>
            )}
          </div>
        )}

        {view === "kuenstler" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E0E0E0", padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1A1A1A", marginBottom: 4 }}>Werk einreichen</div>
              <div style={{ fontSize: 12, color: "#6B6B6B", lineHeight: 1.5, marginBottom: 16 }}>
                Pflicht: die Verbindung zwischen Werk und Ort. Ohne Werkbezug kein Eintrag.
              </div>
              {submitted && (
                <div style={{ background: "#E8F5E9", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12.5, color: "#2E7D32", fontWeight: 600 }}>
                  {"\u2713 Eingereicht - Status: In Pruefung. Wir melden uns innerhalb von 48 Stunden. Ihr Eintrag erscheint bis dahin grau auf der Karte."}
                </div>
              )}
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#444", marginBottom: 4 }}>Name / Kuenstlername</div>
              <input value={fName} onChange={function (e) { setFName(e.target.value); }} placeholder="z.B. Anna Beispiel"
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E0E0E0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#444", marginBottom: 4 }}>Werktitel</div>
              <input value={fWerk} onChange={function (e) { setFWerk(e.target.value); }} placeholder="z.B. Muldenlied (2026)"
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E0E0E0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#444", marginBottom: 4 }}>Kategorie</div>
                  <select value={fKat} onChange={function (e) { setFKat(e.target.value); }}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E0E0E0", borderRadius: 8, fontSize: 13, outline: "none", background: "white" }}>
                    <option>Lyrik</option><option>Musik</option><option>Literatur</option><option>Biografie</option><option>Bildende Kunst</option><option>Natur</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#444", marginBottom: 4 }}>{"Preis (\u20ac)"}</div>
                  <input value={fPreis} onChange={function (e) { setFPreis(e.target.value); }} placeholder="15"
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E0E0E0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#444", marginBottom: 4 }}>Ort (Adresse)</div>
              <input value={fOrt} onChange={function (e) { setFOrt(e.target.value); }} placeholder="z.B. Jacobsgasse 12, Wurzen"
                style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E0E0E0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#444", marginBottom: 4 }}>Art der Verbindung</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {[["entstanden", "Hier entstanden"], ["inspiriert", "Hier inspiriert"], ["gelebt", "Hier gelebt/gewirkt"], ["handlung", "Hier spielt das Werk"]].map(function (v) {
                  const on = fVerb === v[0];
                  return (
                    <button key={v[0]} onClick={function () { setFVerb(v[0]); }}
                      style={{ padding: "7px 11px", borderRadius: 18, border: "1.5px solid " + (on ? "#8B1A1A" : "#DDD"), background: on ? "#8B1A1A" : "white", color: on ? "white" : "#555", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                      {v[1]}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: bezugOk ? "#2E7D32" : ROT, marginBottom: 4 }}>
                {"Werk-Ort-Verbindung (Pflicht, min. 30 Zeichen) " + (bezugOk ? "\u2713" : "")}
              </div>
              <textarea value={fBezug} onChange={function (e) { setFBezug(e.target.value); }}
                placeholder="Warum gehoert dieses Werk genau an diesen Ort?"
                style={{ width: "100%", minHeight: 80, padding: "9px 12px", border: "1.5px solid " + (bezugOk ? "#2E7D32" : "#E0B0B0"), borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", marginBottom: 4 }} />
              <div style={{ fontSize: 10.5, color: "#999", marginBottom: 14 }}>{fBezug.trim().length + " / 30 Zeichen"}</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#444", marginBottom: 4 }}>Werkauszug (optional)</div>
              <textarea value={fAuszug} onChange={function (e) { setFAuszug(e.target.value.slice(0, 500)); }}
                placeholder="Einige Zeilen aus Ihrem Werk - erscheinen auf der Detailseite und in der Sprachausgabe"
                style={{ width: "100%", minHeight: 70, padding: "9px 12px", border: "1.5px solid #E0E0E0", borderRadius: 8, fontSize: 13, fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", resize: "vertical", marginBottom: 4 }} />
              <div style={{ fontSize: 10.5, color: "#999", marginBottom: 14 }}>{fAuszug.length + " / 500 Zeichen"}</div>
              <button onClick={function () { setFRechte(!fRechte); }}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", padding: "10px 12px", border: "1.5px solid " + (fRechte ? "#2E7D32" : "#E0E0E0"), borderRadius: 8, background: fRechte ? "#F1F8F1" : "white", cursor: "pointer", textAlign: "left", marginBottom: 14 }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: "2px solid " + (fRechte ? "#2E7D32" : "#BBB"), background: fRechte ? "#2E7D32" : "white", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{fRechte ? "\u2713" : ""}</span>
                <span style={{ fontSize: 11.5, color: "#444", lineHeight: 1.5 }}>
                  <b>Rechtefreigabe (Pflicht):</b> Ich bin Urheber bzw. verfuege ueber die erforderlichen Nutzungsrechte (ggf. Verlagsfreigabe) und raeume FoxGo ein einfaches, widerrufliches Nutzungsrecht zur Darstellung von Werkauszug und Werkdaten ein.
                </span>
              </button>
              <button onClick={einreichen} disabled={!formOk}
                style={{ width: "100%", padding: 12, background: formOk ? ROT : "#CCC", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: formOk ? "pointer" : "not-allowed" }}>
                Eintrag einreichen
              </button>
              <div style={{ marginTop: 14, padding: 12, background: "#FFF8E1", borderRadius: 8, fontSize: 11.5, color: "#7A5C00", lineHeight: 1.5 }}>
                <b>DSGVO-Hinweis:</b> Mit dem Einreichen stimmen Sie der Veroeffentlichung von Name, Werk und Ortsbezug zu. Kontaktdaten werden nicht veroeffentlicht.
              </div>
            </div>
          </div>
        )}

        {view === "umsatz" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <div style={{ background: ROT, borderRadius: 12, padding: 18, color: "white", marginBottom: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Plattform-Provision (Test)</div>
              <div style={{ fontSize: 30, fontWeight: 800, margin: "4px 0" }}>{fmtEUR(gesamt)}</div>
              <div style={{ fontSize: 11.5, opacity: 0.85 }}>{sales.length + " simulierte Kaeufe \u00b7 4,5 % Affiliate"}</div>
            </div>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E0E0E0", padding: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#1A1A1A" }}>Provisionsmodelle</div>
              <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6 }}>
                <b>Affiliate (jetzt):</b> Plattform 4,5 % vom Amazon-Kauf. Kuenstler erhaelt normale Verlags-Tantiemen.<br /><br />
                <b>Direktverkauf (spaeter):</b> Kuenstler 90 %, Plattform 10 %.
              </div>
            </div>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E0E0E0", padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#1A1A1A" }}>Transaktionen</div>
              {sales.length === 0 && (
                <div style={{ fontSize: 12, color: "#999", fontStyle: "italic" }}>Noch keine Testkaeufe.</div>
              )}
              {sales.map(function (s) {
                return (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0F0F0", fontSize: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1A1A1A" }}>{s.titel}</div>
                      <div style={{ color: "#999", fontSize: 11 }}>{s.artist}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#666" }}>{fmtEUR(s.preis)}</div>
                      <div style={{ color: "#2E7D32", fontWeight: 700 }}>{"+" + fmtEUR(s.provision)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {view !== "detail" && view !== "treedetail" && view !== "kanddetail" && (
        <div style={{ background: "white", borderTop: "1px solid #E0E0E0", display: "flex", padding: "8px 0", flexShrink: 0 }}>
          {tabs.map(function (t) {
            const on = view === t[0];
            return (
              <button key={t[0]} onClick={function () { setView(t[0]); }}
                style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer", color: on ? ROT : "#6B6B6B", fontSize: 12.5, fontWeight: on ? 700 : 400, padding: "7px 0" }}>
                {t[1]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

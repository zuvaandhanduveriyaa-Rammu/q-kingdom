const CONFIG = {
  requiredHandle: "MuazXinthi",
  requiredUserId: "1014939397",
  followUrl: "https://x.com/intent/follow?screen_name=MuazXinthi",
  profileUrl: "https://x.com/MuazXinthi",
  xClientId: "",
  scopes: "tweet.read users.read follows.read follows.write offline.access"
};

const SKILL_KEYS = ["TYPE", "IQ", "EQ", "SQ", "AQ", "CQ"];

const defaultState = () => ({
  user: null,
  followed: false,
  lives: 3,
  coins: 0,
  typeCleared: 0,
  typeBest: {},
  quiz: { IQ: { xp: 0, best: 0, done: 0 }, EQ: { xp: 0, best: 0, done: 0 }, SQ: { xp: 0, best: 0, done: 0 }, AQ: { xp: 0, best: 0, done: 0 }, CQ: { xp: 0, best: 0, done: 0 } },
  typeXp: 0
});

let S = defaultState();
let typeSession = null;
let quizSession = null;

function storeKey() { return "qkingdom:" + (S.user?.username || "guest"); }
function save() { try { localStorage.setItem(storeKey(), JSON.stringify(S)); } catch (_) {} }
function loadFor(username) {
  try {
    const raw = localStorage.getItem("qkingdom:" + username);
    if (raw) {
      const parsed = JSON.parse(raw);
      S = Object.assign(defaultState(), parsed);
      S.user = parsed.user || S.user;
    }
  } catch (_) {}
}
function skillLevel(xp) { return Math.min(99, Math.floor(Math.sqrt(xp / 8))); }
function beep(kind) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    const map = { coin: [880, 0.08], jump: [520, 0.07], ok: [660, 0.12], bad: [180, 0.18], flag: [784, 0.2] };
    const [f, t] = map[kind] || [440, 0.08];
    o.frequency.value = f;
    o.type = kind === "bad" ? "sawtooth" : "square";
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t);
    o.start(); o.stop(ctx.currentTime + t);
  } catch (_) {}
}
function $(id) { return document.getElementById(id); }
function show(scene) {
  document.querySelectorAll(".scene").forEach((el) => el.classList.remove("active"));
  const node = $("scene-" + scene);
  if (node) node.classList.add("active");
  renderHud();
}
function renderHud() {
  $("hud-user").textContent = S.user ? "@" + S.user.username : "GUEST";
  $("hud-coins").textContent = S.coins;
  $("hud-lives").textContent = "x" + S.lives;
  $("hud-type").textContent = S.typeCleared + "/100";
}
function renderTitle() { show("title"); }
function renderGate() {
  show("gate");
  $("follow-status").className = "status" + (S.followed ? " ok" : "");
  $("follow-status").textContent = S.followed
    ? "FOLLOW CHECK: CLEAR. The castle gate is open."
    : "FOLLOW CHECK: LOCKED. Follow @" + CONFIG.requiredHandle + " then confirm.";
  $("btn-enter").disabled = !S.followed || !S.user;
}
function kingdomUnlocked(k) { return !k.need || S.typeCleared >= k.need; }
function renderWorld() {
  show("world");
  $("world-sub").textContent = S.user
    ? "Welcome @" + S.user.username + " — train skills like old-school XP."
    : "Wanderer.";
  const box = $("kingdoms");
  box.innerHTML = "";
  KINGDOMS.forEach((k) => {
    const open = kingdomUnlocked(k);
    const pct = k.id === "TYPE" ? S.typeCleared : Math.min(100, (S.quiz[k.id]?.done || 0) * 12);
    const el = document.createElement("div");
    el.className = "card" + (open ? "" : " locked");
    el.innerHTML = `<div class="badge">${open ? "OPEN" : "NEED T-" + k.need}</div><h3>${k.name}</h3><p>${k.desc}</p><div class="progress-bar"><i style="width:${pct}%"></i></div>`;
    el.onclick = () => {
      if (!open) { beep("bad"); return; }
      if (k.id === "TYPE") renderTypeSelect();
      else startQuiz(k.id);
    };
    box.appendChild(el);
  });
  $("skills").innerHTML =
    `<div class="skill">TYPE<br><b>Lv ${skillLevel(S.typeXp)}</b> · ${S.typeCleared} flags</div>` +
    SKILL_KEYS.filter((k) => k !== "TYPE").map((k) =>
      `<div class="skill">${k}<br><b>Lv ${skillLevel(S.quiz[k].xp)}</b> · best ${S.quiz[k].best}</div>`
    ).join("");
}
function renderTypeSelect() {
  show("levels");
  const grid = $("level-grid");
  grid.innerHTML = "";
  for (let i = 1; i <= 100; i++) {
    const b = document.createElement("button");
    const done = S.typeCleared >= i;
    const locked = i > S.typeCleared + 1;
    b.className = "lvl" + (done ? " done" : "") + (locked ? " locked" : "") + (i === S.typeCleared + 1 ? " current" : "");
    b.textContent = i;
    b.onclick = () => { if (!locked) startType(i); };
    grid.appendChild(b);
  }
}
function startType(level) {
  const t = typingTarget(level);
  const text = makePassage(level);
  typeSession = { level, text, t, started: 0, index: 0, typed: "", wrong: 0, finished: false };
  $("type-title").textContent = "WORLD 1-" + String(level).padStart(2, "0");
  $("need-wpm").textContent = t.wpm;
  $("need-acc").textContent = t.acc + "%";
  $("live-wpm").textContent = "0";
  $("live-acc").textContent = "100%";
  $("type-input").value = "";
  $("type-input").disabled = false;
  paintPassage();
  show("type");
  setTimeout(() => $("type-input").focus(), 50);
}
function paintPassage() {
  const s = typeSession;
  $("passage").innerHTML = s.text.split("").map((ch, i) => {
    if (i < s.typed.length) return `<span class="${s.typed[i] === ch ? "ok" : "bad"}">${escapeHtml(ch)}</span>`;
    if (i === s.typed.length) return `<span class="cur">${escapeHtml(ch)}</span>`;
    return escapeHtml(ch);
  }).join("");
}
function escapeHtml(ch) {
  if (ch === " ") return "·";
  if (ch === "<") return "<";
  if (ch === "&") return "&";
  return ch;
}
function onTypeInput(e) {
  const s = typeSession;
  if (!s || s.finished) return;
  const val = e.target.value;
  if (!s.started) s.started = Date.now();
  s.typed = val.slice(0, s.text.length);
  let wrong = 0;
  for (let i = 0; i < s.typed.length; i++) if (s.typed[i] !== s.text[i]) wrong++;
  s.wrong = wrong;
  paintPassage();
  const mins = Math.max((Date.now() - s.started) / 60000, 1 / 120);
  const wpm = Math.round((s.typed.length / 5) / mins);
  const acc = s.typed.length ? Math.max(0, Math.round(100 * (s.typed.length - wrong) / s.typed.length)) : 100;
  $("live-wpm").textContent = String(wpm);
  $("live-acc").textContent = acc + "%";
  if (s.typed.length >= s.text.length) finishType(wpm, acc);
}
function finishType(wpm, acc) {
  const s = typeSession;
  s.finished = true;
  $("type-input").disabled = true;
  const pass = wpm >= s.t.wpm && acc >= s.t.acc;
  if (pass) {
    beep("flag");
    if (s.level > S.typeCleared) S.typeCleared = s.level;
    S.coins += s.level;
    S.typeXp += 10 + s.level;
    S.typeBest[s.level] = { wpm, acc };
    if (S.lives < 5 && s.level % 10 === 0) S.lives += 1;
    save();
    openModal("FLAG GET", `Stage ${s.level} cleared.\n${wpm} WPM · ${acc}% ACC\n+${s.level} coins`, [
      { label: "MAP", fn: renderWorld },
      { label: S.typeCleared < 100 ? "NEXT PIPE" : "KINGDOMS", fn: () => S.typeCleared < 100 ? startType(s.level + 1) : renderWorld() }
    ]);
  } else {
    beep("bad");
    S.lives = Math.max(0, S.lives - s.t.livesCost);
    save();
    if (S.lives <= 0) {
      S.lives = 3; save();
      openModal("GAME OVER", `Need ${s.t.wpm} WPM and ${s.t.acc}%.\nYou hit ${wpm} / ${acc}%.\nLives reset. The kingdom is patient.`, [
        { label: "RETRY", fn: () => startType(s.level) },
        { label: "MAP", fn: renderWorld }
      ]);
    } else {
      openModal("MISS", `Need ${s.t.wpm} WPM and ${s.t.acc}%.\nYou hit ${wpm} / ${acc}%.\nLives left: ${S.lives}`, [
        { label: "RETRY", fn: () => startType(s.level) },
        { label: "MAP", fn: renderWorld }
      ]);
    }
  }
  renderHud();
}
function startQuiz(kind) {
  const bank = QUIZZES[kind].slice().sort(() => Math.random() - 0.5).slice(0, 8);
  quizSession = { kind, bank, i: 0, score: 0, locked: false };
  $("quiz-title").textContent = kind + " TRIAL";
  renderQuizQ();
  show("quiz");
}
function renderQuizQ() {
  const qs = quizSession;
  const item = qs.bank[qs.i];
  qs.locked = false;
  $("quiz-progress").textContent = (qs.i + 1) + " / " + qs.bank.length;
  $("q-text").textContent = item.q;
  const box = $("choices");
  box.innerHTML = "";
  $("quiz-result").classList.add("hidden");
  item.a.forEach((ans, idx) => {
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = ans;
    b.onclick = () => pickQuiz(idx, b);
    box.appendChild(b);
  });
}
function pickQuiz(idx, btn) {
  const qs = quizSession;
  if (qs.locked) return;
  qs.locked = true;
  const item = qs.bank[qs.i];
  [...$("choices").children][item.c].classList.add("correct");
  if (idx !== item.c) { btn.classList.add("wrong"); beep("bad"); }
  else { qs.score += 1; beep("ok"); }
  setTimeout(() => {
    qs.i += 1;
    if (qs.i >= qs.bank.length) finishQuiz();
    else renderQuizQ();
  }, 650);
}
function finishQuiz() {
  const qs = quizSession;
  const total = qs.bank.length;
  const pct = Math.round(100 * qs.score / total);
  const rec = S.quiz[qs.kind];
  rec.done += 1;
  rec.xp += qs.score * 12;
  rec.best = Math.max(rec.best, pct);
  S.coins += qs.score * 5;
  save();
  openModal(qs.kind + " CLEAR", `Score ${qs.score}/${total} (${pct}%)\nBest ${rec.best}% · Skill Lv ${skillLevel(rec.xp)}`, [
    { label: "MAP", fn: renderWorld },
    { label: "AGAIN", fn: () => startQuiz(qs.kind) }
  ]);
}
function openModal(title, body, actions) {
  $("m-title").textContent = title;
  $("m-body").textContent = body;
  const row = $("m-actions");
  row.innerHTML = "";
  actions.forEach((a) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.style.minWidth = "0";
    b.style.fontSize = "10px";
    b.textContent = a.label;
    b.onclick = () => { closeModal(); a.fn(); };
    row.appendChild(b);
  });
  $("modal").classList.add("show");
}
function closeModal() { $("modal").classList.remove("show"); }
function randomStr(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => ("0" + b.toString(16)).slice(-2)).join("");
}
async function sha256b64url(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function loginWithX() {
  if (!CONFIG.xClientId) {
    show("gate");
    $("oauth-note").textContent = "No X Client ID in this build. Use handle login below, or add a Client ID in js/app.js to enable real OAuth.";
    return;
  }
  const verifier = randomStr(32);
  const challenge = await sha256b64url(verifier);
  const state = randomStr(12);
  sessionStorage.setItem("pkce_verifier", verifier);
  sessionStorage.setItem("oauth_state", state);
  const redirect = location.origin + location.pathname;
  const url = "https://x.com/i/oauth2/authorize?" + new URLSearchParams({
    response_type: "code",
    client_id: CONFIG.xClientId,
    redirect_uri: redirect,
    scope: CONFIG.scopes,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  }).toString();
  location.href = url;
}
async function consumeOAuth() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code) return false;
  if (state !== sessionStorage.getItem("oauth_state")) return false;
  const verifier = sessionStorage.getItem("pkce_verifier");
  const redirect = location.origin + location.pathname;
  try {
    const body = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: CONFIG.xClientId,
      redirect_uri: redirect,
      code_verifier: verifier
    });
    const tok = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    }).then((r) => r.json());
    if (!tok.access_token) throw new Error(tok.error || "token failed");
    const me = await fetch("https://api.x.com/2/users/me", {
      headers: { Authorization: "Bearer " + tok.access_token }
    }).then((r) => r.json());
    const username = me.data?.username;
    const id = me.data?.id;
    if (!username) throw new Error("no user");
    loadFor(username);
    S.user = { username, id, token: tok.access_token };
    let followed = false;
    try {
      const rel = await fetch(`https://api.x.com/2/users/${id}/following?max_results=1000`, {
        headers: { Authorization: "Bearer " + tok.access_token }
      }).then((r) => r.json());
      followed = (rel.data || []).some((u) =>
        String(u.id) === CONFIG.requiredUserId || (u.username || "").toLowerCase() === CONFIG.requiredHandle.toLowerCase()
      );
      if (!followed) {
        await fetch(`https://api.x.com/2/users/${id}/following`, {
          method: "POST",
          headers: { Authorization: "Bearer " + tok.access_token, "Content-Type": "application/json" },
          body: JSON.stringify({ target_user_id: CONFIG.requiredUserId })
        });
        followed = true;
      }
    } catch (_) { followed = S.followed; }
    S.followed = followed;
    save();
    history.replaceState({}, "", location.pathname);
    return true;
  } catch (err) {
    console.warn(err);
    $("oauth-note").textContent = "OAuth handshake failed. Use handle login or check Client ID + callback URL.";
    return false;
  }
}
function handleLogin() {
  const raw = ($("handle-input").value || "").trim().replace(/^@/, "");
  if (!raw || !/^[A-Za-z0-9_]{1,15}$/.test(raw)) {
    $("follow-status").className = "status bad";
    $("follow-status").textContent = "Enter a real X handle (letters, numbers, _).";
    beep("bad");
    return;
  }
  loadFor(raw);
  S.user = { username: raw, id: null, token: null };
  save();
  renderGate();
  beep("coin");
}
function confirmFollow() {
  if (!S.user) {
    $("follow-status").className = "status bad";
    $("follow-status").textContent = "Login with a handle first.";
    return;
  }
  if (!$("did-follow").checked) {
    $("follow-status").className = "status bad";
    $("follow-status").textContent = "Open the Follow intent, then tick the box.";
    beep("bad");
    return;
  }
  S.followed = true;
  save();
  beep("flag");
  renderGate();
}
function logout() { S = defaultState(); renderTitle(); renderHud(); }
function bind() {
  $("btn-x").onclick = loginWithX;
  $("btn-handle").onclick = handleLogin;
  $("btn-follow").onclick = () => window.open(CONFIG.followUrl, "_blank");
  $("btn-confirm").onclick = confirmFollow;
  $("btn-enter").onclick = () => { if (S.followed && S.user) { beep("jump"); renderWorld(); } };
  $("btn-play").onclick = () => { if (S.user && S.followed) renderWorld(); else show("gate"); };
  $("btn-how").onclick = () => openModal("HOW TO PLAY",
    "1. Follow @MuazXinthi and enter your X handle.\n2. Clear Type Kingdom pipes 1–100 (WPM + accuracy flags).\n3. Other Q worlds unlock as you climb.\n4. Skills gain XP like an old RPG. Lives drop on failed flags.",
    [{ label: "OK", fn: () => {} }]);
  $("btn-map").onclick = renderWorld;
  $("btn-levels-back").onclick = renderWorld;
  $("btn-type-back").onclick = renderTypeSelect;
  $("btn-quiz-back").onclick = renderWorld;
  $("btn-logout").onclick = logout;
  $("type-input").addEventListener("input", onTypeInput);
  $("handle-input").addEventListener("keydown", (e) => { if (e.key === "Enter") handleLogin(); });
}
async function boot() {
  bind();
  const ok = await consumeOAuth();
  renderHud();
  if (ok && S.user) {
    if (S.followed) renderWorld();
    else renderGate();
    return;
  }
  renderTitle();
}
boot();

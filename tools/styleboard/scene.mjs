// One sample scene (1080x1920, shown at 540x960) whose look is set by the 7 choices.
// Every frame is a pure function of time: window.__t(seconds). Same scene, same copy in every sample; only the chosen variable changes.

const lum = (hex) => {
  const h = hex.replace("#", ""), n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (bg, a = "#ffffff", b = "#111111") => (lum(bg) > 0.4 ? b : a);

// Three palettes from one brand palette: A brand as it is, B inverted, C solid brand colour.
export function palettes(p) {
  const dark = lum(p.bg) < 0.4;
  const A = { name: "Brand", bg: p.bg, fg: p.fg, accent: p.accent, card: dark ? "#ffffff14" : "#ffffff", ink: p.fg };
  const bgB = dark ? (p.light || "#f6f5ff") : (p.dark || "#141414");
  const B = { name: dark ? "Light" : "Dark", bg: bgB, fg: contrast(bgB), accent: lum(bgB) > 0.4 ? (lum(p.brand) < 0.4 ? p.brand : p.dark || "#141414") : p.accent, card: lum(bgB) < 0.4 ? "#ffffff14" : "#ffffff", ink: contrast(bgB) };
  const C = { name: "Bold brand colour", bg: p.brand, fg: contrast(p.brand), accent: lum(p.brand) < 0.4 ? p.accent : (p.alt || p.fg), card: lum(p.brand) < 0.4 ? "#ffffff22" : "#ffffffcc", ink: contrast(p.brand) };
  return { A, B, C };
}

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Positions at 1080x1920. Content stays inside the safe area: x 84..996, y 150..1670.
export const LAYOUTS = {
  A: { name: "Centered stack", logo: { x: 84, y: 190, w: 912, a: "center" }, hook: { x: 84, y: 430, w: 912, a: "center", fs: 108 }, sub: { x: 84, y: 930, w: 912, a: "center", fs: 50 }, card: { x: 160, y: 1080, w: 760, h: 300 }, cta: { x: 190, y: 1500, w: 700, a: "center" } },
  B: { name: "Right-aligned block", logo: { x: 84, y: 190, w: 912, a: "right" }, hook: { x: 84, y: 400, w: 912, a: "right", fs: 112 }, sub: { x: 84, y: 980, w: 912, a: "right", fs: 50 }, card: { x: 236, y: 1120, w: 760, h: 280 }, cta: { x: 296, y: 1520, w: 700, a: "center" } },
  C: { name: "Image block + text strip", logo: { x: 84, y: 190, w: 912, a: "left" }, hook: { x: 84, y: 800, w: 912, a: "right", fs: 88 }, sub: { x: 84, y: 1090, w: 912, a: "right", fs: 50 }, card: { x: 84, y: 1210, w: 912, h: 220 }, cta: { x: 190, y: 1520, w: 700, a: "center" } },
};

const ease = { out: (p) => 1 - (1 - p) ** 3 };

// cfg: { palette, layout:'A|B|C', text:'A|B|C', style:'A|B|C', anim:'A|B|C', speed (time scale, 1 = normal), t (still time), hook, sub, cta, wordmark, site, fonts:{ css, display, latin }, safeGuide }
export function sceneHtml(cfg) {
  const P = cfg.palette, L = LAYOUTS[cfg.layout], st = cfg.style, f = cfg.fonts;
  const words = String(cfg.hook).trim().split(/\s+/);
  const hookHtml = cfg.text === "B"
    ? words.map((w, i) => `<span class="w" data-i="${i}">${esc(w)}</span>`).join(" ")
    : (st === "B" ? `<span class="mk">${esc(cfg.hook)}</span>` : esc(cfg.hook));
  const railed = cfg.text === "C";
  const hookBox = railed ? { x: 84, y: 1260, w: 912, a: "right", fs: 66 } : L.hook;
  const cardBox = railed ? { ...L.card, y: 760 } : L.card;
  const hard = st === "C" ? `box-shadow:12px 12px 0 ${contrast(P.bg, "#000000", "#000000")};border:6px solid ${contrast(P.bg, "#000000", "#000000")};` : "";
  const css = `
${f.css || ""}
*{box-sizing:border-box;margin:0}html,body{width:540px;height:960px;overflow:hidden;background:#000}
#stage{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:scale(.5);transform-origin:0 0;background:${P.bg};color:${P.fg};direction:rtl;font-family:"${f.display}","${f.latin}",system-ui,sans-serif;overflow:hidden}
.bgdeco{position:absolute;inset:0;pointer-events:none}
.el{position:absolute;will-change:transform,opacity}
.logo{font:700 52px "${f.latin}",sans-serif;letter-spacing:.04em;color:${Math.abs(lum(P.accent) - lum(P.bg)) > 0.3 ? P.accent : P.fg};direction:ltr;text-align:${L.logo.a}}
.hook{font-weight:700;line-height:1.28;color:${P.fg}}
.hook .w{display:inline-block}
.sub{font-weight:400;line-height:1.5;opacity:.85}
.cta{display:flex;align-items:center;justify-content:center;height:128px;font-weight:700;font-size:54px;color:${contrast(P.accent)};background:${P.accent};border-radius:${st === "C" ? 0 : 64}px;${hard}}
.card{background:${st === "C" ? (lum(P.bg) < 0.4 ? "#161233" : "#ffffff") : P.card};border-radius:${st === "C" ? 0 : 44}px;padding:36px;display:flex;gap:28px;align-items:center;${st === "A" ? "box-shadow:0 24px 60px rgba(0,0,0,.18);" : ""}${hard}}
.av{width:104px;height:104px;border-radius:${st === "C" ? 0 : 52}px;background:${P.accent};flex:none}
.bars{flex:1;display:grid;gap:22px}.bars i{display:block;height:24px;border-radius:${st === "C" ? 0 : 12}px;background:${P.ink};opacity:.22}.bars i:nth-child(2){width:62%}
.tick{width:76px;height:76px;border-radius:50%;background:${P.accent};flex:none;display:grid;place-items:center}
.tick:after{content:"";width:22px;height:38px;border:solid ${contrast(P.accent)};border-width:0 8px 8px 0;transform:rotate(45deg) translate(-4px,-4px)}
${st === "B" ? `
.bgdeco{background:radial-gradient(circle at 18% 12%,${P.accent}33 0 160px,transparent 161px),radial-gradient(circle at 88% 82%,${P.fg}14 0 220px,transparent 221px),repeating-radial-gradient(circle at 50% 50%,${P.fg}08 0 2px,transparent 2px 14px)}
.hook .mk{background:${P.accent};color:${contrast(P.accent)};padding:2px 16px;-webkit-box-decoration-break:clone;box-decoration-break:clone;line-height:1.6}
.card{transform-origin:center;border-radius:12px;background:${lum(P.bg) < 0.4 ? "#f4ecdc" : "#fffdf5"};border:3px solid ${P.ink}33}.card .bars i{background:#1f1f1f}.card:before{content:"";position:absolute;top:-26px;left:50%;width:150px;height:48px;margin-left:-75px;background:${P.accent};opacity:.8;transform:rotate(-3deg)}
.cta{border-radius:6px;clip-path:polygon(0 8%,4% 0,18% 6%,40% 0,64% 7%,86% 0,100% 6%,98% 92%,82% 100%,56% 93%,30% 100%,6% 94%)}
` : ""}
${st === "C" ? `.hook{font-weight:700;font-size:inherit}.bgdeco{background:linear-gradient(135deg,transparent 0 60%,${P.accent}33 60% 100%)}` : ""}
${cfg.layout === "C" && !railed ? `.hook{background:${P.bg};padding:24px 36px;${st === "C" ? "border:6px solid #000;" : ""}}` : ""}
${railed ? `.hook{background:${P.bg}d9;padding:26px 40px;border-radius:${st === "C" ? 0 : 20}px}` : ""}
${railed ? ".sub{display:none}" : ""}
.safe{position:absolute;left:0;right:0;top:150px;bottom:250px;border:3px dashed ${P.fg}55;pointer-events:none;display:${cfg.safeGuide ? "block" : "none"}}
${cfg.layout === "C" ? `.block{position:absolute;left:84px;right:84px;top:300px;height:560px;background:${P.accent};${st === "C" ? hard : `border-radius:${st === "B" ? 8 : 44}px;`}}.block:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 35%,${contrast(P.accent, "#ffffff55", "#00000022")} 0 120px,transparent 121px),radial-gradient(circle at 72% 62%,${contrast(P.accent, "#ffffff33", "#00000018")} 0 180px,transparent 181px)}` : ""}
`;
  const box = (b) => `left:${b.x}px;top:${b.y}px;width:${b.w}px;${b.a ? `text-align:${b.a};` : ""}`;
  const html = `<!doctype html><meta charset="utf-8">${f.link || ""}<style>${css}</style>
<div id="stage"><div class="bgdeco"></div>${cfg.layout === "C" ? '<div class="block el" data-k="block"></div>' : ""}
<div class="el logo" data-k="logo" style="${box(L.logo)}">${esc(cfg.wordmark)}</div>
<div class="el hook" data-k="hook" style="${box(hookBox)}font-size:${hookBox.fs}px">${hookHtml}</div>
<div class="el sub" data-k="sub" style="${box(L.sub)}font-size:${L.sub.fs}px">${esc(cfg.sub)}</div>
<div class="el card" data-k="card" style="left:${cardBox.x}px;top:${cardBox.y}px;width:${cardBox.w}px;min-height:${cardBox.h}px"><div class="av"></div><div class="bars"><i></i><i></i><i></i></div><div class="tick"></div></div>
<div class="el cta" data-k="cta" style="${box(L.cta)}">${esc(cfg.cta)}</div>
<div class="safe"></div></div>
<script>
const S=${Number(cfg.speed || 1)}, ANIM=${JSON.stringify(cfg.anim || "A")}, KIND=${JSON.stringify(cfg.text || "A")};
const BEAT={block:0,logo:0,hook:0.1,sub:0.9,card:1.3,cta:2.0}, DUR=0.6;
const clamp=(x)=>Math.max(0,Math.min(1,x)), out=(p)=>1-Math.pow(1-p,3);
const spring=(p)=>p>=1?1:1-Math.exp(-7*p)*Math.cos(11*p);
function apply(el,p){
  let sc=1,ty=0,op=1,bl=0;
  if(ANIM==="A"){sc=0.6+0.4*spring(p);op=Math.min(1,p*4)}
  else if(ANIM==="B"){ty=(1-out(p))*140;op=Math.min(1,p*3)}
  else {sc=1.35-0.35*out(p);bl=(1-p)*18;op=Math.min(1,p*2)}
  el.style.opacity=op;el.style.transform="translateY("+ty+"px) scale("+sc+")";el.style.filter=bl>0.1?"blur("+bl+"px)":"none";
}
const STACK=${railed ? "false" : "true"};
function relayout(){
  if(!STACK)return;
  const q=(k)=>document.querySelector('[data-k="'+k+'"]'),h=q("hook"),s=q("sub"),cd=q("card");
  let y=parseFloat(h.style.top)+h.offsetHeight+40;s.style.top=y+"px";
  y+=s.offsetHeight+46;cd.style.top=y+"px";
}
window.__t=function(t){
  document.querySelectorAll(".el").forEach((el)=>{
    const k=el.dataset.k,start=(BEAT[k]||0)*S;
    if(k==="hook"&&KIND==="B"){el.style.opacity=1;el.style.transform="none";el.style.filter="none";
      el.querySelectorAll(".w").forEach((w,i)=>{const p=clamp((t-start-i*0.18*S)/(DUR*S*0.7));w.style.opacity=p;w.style.transform="translateY("+(1-out(p))*60+"px)"});return}
    apply(el,clamp((t-start)/(DUR*S)));
  });
};
Promise.race([document.fonts.ready,new Promise((r)=>setTimeout(r,4000))]).then(()=>{window.__ready=true;relayout();window.__t(${Number(cfg.t ?? 99)})});
</script>`;
  return html;
}

// Total time a scene needs at speed s (used for the loop length).
export const sceneLength = (s) => (2.0 + DUR_AFTER) * s + 0.9;
const DUR_AFTER = 0.6;

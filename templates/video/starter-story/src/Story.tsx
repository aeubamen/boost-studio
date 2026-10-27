import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { brand } from "./brand";

export const FPS = 30;
export const DURATION = 450; // 15 s

const ip = (f: number, a: number, b: number, c: number, d: number) =>
  interpolate(f, [a, b], [c, d], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.22, 1, 0.36, 1) });

const { colors: C, text: T } = brand;
const base: React.CSSProperties = { fontFamily: brand.font, direction: "rtl", color: C.text };

const Bubble: React.FC<{ at: number; side: "left" | "right"; top: number; me?: boolean; children: React.ReactNode }> = ({ at, side, top, me, children }) => {
  const f = useCurrentFrame();
  const p = ip(f, at, at + 12, 0, 1);
  return (
    <div style={{ position: "absolute", top: top + (1 - p) * 20, [side]: 40, maxWidth: 560, padding: "20px 28px", borderRadius: 32, fontSize: 38, lineHeight: 1.5, opacity: p, background: me ? C.primary : "#fff", color: me ? "#fff" : C.text, boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
      {children}
    </div>
  );
};

export const Story: React.FC = () => {
  const f = useCurrentFrame();
  const hook = ip(f, 0, 14, 0, 1) * ip(f, 40, 52, 1, 0);
  const phone = ip(f, 40, 60, 0, 1) * ip(f, 300, 316, 1, 0);
  const click = f >= 250 && f < 258 ? 0.95 : 1;
  const end = ip(f, 316, 340, 0, 1);
  return (
    <AbsoluteFill style={{ ...base, background: `radial-gradient(120% 80% at 50% 0%, #fff, ${C.bg})` }}>
      {/* hook */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: hook }}>
        <div style={{ fontSize: 118, fontWeight: 700, textAlign: "center" }}>{T.hook}</div>
        <div style={{ height: 14, width: 520, background: C.accent, borderRadius: 8, marginTop: 24 }} />
      </AbsoluteFill>
      {/* phone with chat */}
      <div style={{ position: "absolute", left: 190, top: 330, width: 700, height: 1260, borderRadius: 90, background: "#15161a", padding: 20, opacity: phone, transform: `scale(${0.92 + 0.08 * phone})` }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 72, background: "#e9edf3", overflow: "hidden" }}>
          <Bubble at={80} side="right" top={140} me>{T.customer}</Bubble>
          <Bubble at={140} side="left" top={310}>{T.reply}</Bubble>
          <div style={{ position: "absolute", left: 60, right: 60, bottom: 160, height: 110, borderRadius: 24, background: C.primary, color: "#fff", fontSize: 44, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", opacity: ip(f, 200, 214, 0, 1), transform: `scale(${click})` }}>
            {T.button}
          </div>
        </div>
      </div>
      {/* end card */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: end, gap: 28 }}>
        <div style={{ fontSize: 96, fontWeight: 700 }}>{brand.name}</div>
        <div style={{ fontSize: 64, color: C.primary, direction: "ltr" }}>{brand.url}</div>
        <div style={{ background: C.accent, borderRadius: 60, padding: "14px 44px", fontSize: 52, fontWeight: 700 }}>{T.end}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

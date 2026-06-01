import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "NBA Watch — czy warto obejrzeć ten mecz?";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0e15",
          color: "#f4f6fb",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 48 }}>
          <div
            style={{
              width: 96,
              height: 96,
              background: "#ff6b2c",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontWeight: 900,
              color: "#0a0e15",
            }}
          >
            N
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
            <span>NBA</span>
            <span style={{ color: "#ff6b2c" }}>WATCH</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, gap: 24 }}>
          <span>Czy warto</span>
          <span style={{ color: "#ff6b2c" }}>obejrzeć?</span>
        </div>
        <div style={{ fontSize: 34, color: "#9aa4b5", marginTop: 32, maxWidth: 900 }}>
          Wskaźnik oglądalności meczów NBA 0–100. Zobacz jak dobry był mecz — bez
          spoilerów.
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: "#1d140f",
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(255,180,120,0.8), transparent 40%), radial-gradient(circle at 10% 80%, rgba(255,120,90,0.5), transparent 35%)",
          color: "#fff",
          padding: 80
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.8 }}>Modern Personal Blog</div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 16 }}>Customer Blog</div>
        <div style={{ fontSize: 30, opacity: 0.85, marginTop: 20 }}>Next.js 14+ App Router · SEO · MDX</div>
      </div>
    ),
    {
      ...size
    }
  );
}

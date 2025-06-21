import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site-config";

async function loadAssets(): Promise<
  { name: string; data: Buffer; weight: 400 | 600; style: "normal" }[]
> {
  const [
    { base64Font: normal },
    { base64Font: mono },
    { base64Font: semibold },
  ] = await Promise.all([
    import("./geist-regular-otf.json").then((mod) => mod.default || mod),
    import("./geistmono-regular-otf.json").then((mod) => mod.default || mod),
    import("./geist-semibold-otf.json").then((mod) => mod.default || mod),
  ]);

  return [
    {
      name: "Geist",
      data: Buffer.from(normal, "base64"),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist Mono",
      data: Buffer.from(mono, "base64"),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: Buffer.from(semibold, "base64"),
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? siteConfig.tagline;
  const description = searchParams.get("description") ?? siteConfig.description;
  const url =
    searchParams.get("url") ?? siteConfig?.url.replace(/https?:\/\//, "");

  const [fonts] = await Promise.all([loadAssets()]);

  return new ImageResponse(
    (
      <div
        tw="flex h-full w-full text-white relative"
        style={{
          fontFamily: "Geist Sans",
          background: "linear-gradient(135deg, #faf8f5 0%, #f5f5f4 100%)",
        }}
      >
        {/* Background decoration */}
        <div
          tw="absolute top-20 right-20 w-32 h-32 rounded-full opacity-20"
          style={{
            background: "linear-gradient(135deg, #fda4af 0%, #fbbf24 100%)",
          }}
        />
        <div
          tw="absolute bottom-40 left-20 w-24 h-24 rounded-full opacity-15"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #fda4af 100%)",
          }}
        />
        <div
          tw="absolute top-1/2 left-1/3 w-16 h-16 rounded-full opacity-10"
          style={{ background: "#a8a29e" }}
        />

        {/* Content container */}
        <div tw="flex flex-col justify-center items-start px-16 py-16 w-full">
          {/* Logo and brand */}
          <div tw="flex items-center mb-8">
            <div
              tw="w-12 h-12 rounded-full flex items-center justify-center mr-4"
              style={{
                background: "linear-gradient(135deg, #fda4af 0%, #fbbf24 100%)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  fill="white"
                />
              </svg>
            </div>
            <span tw="text-4xl text-stone-800" style={{ fontFamily: "serif" }}>
              lunra
            </span>
          </div>

          {/* Main title */}
          <div
            tw="text-stone-800 mb-6 leading-tight"
            style={{
              fontSize:
                title && title.length > 40
                  ? 48
                  : title && title.length > 20
                  ? 64
                  : 80,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            tw="text-stone-600 mb-8 leading-relaxed"
            style={{
              fontSize: 32,
              fontWeight: 400,
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            {description}
          </div>

          {/* URL */}
          <div tw="text-stone-500 text-2xl" style={{ fontWeight: 400 }}>
            {url}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 628,
      fonts,
    }
  );
}

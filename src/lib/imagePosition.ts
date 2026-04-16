export type ParsedImagePosition = {
  x: number;
  y: number;
  zoom: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseAxis = (value?: string, fallback = 50) => {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  if (normalized === "center") return 50;
  if (normalized === "left" || normalized === "top") return 0;
  if (normalized === "right" || normalized === "bottom") return 100;

  const numeric = Number.parseFloat(normalized.replace("%", ""));
  return Number.isFinite(numeric) ? clamp(numeric, 0, 100) : fallback;
};

export const parseImagePosition = (value?: string | null): ParsedImagePosition => {
  if (!value) return { x: 50, y: 50, zoom: 1 };

  const [positionPart, zoomPart] = value.split("|");
  const [xRaw, yRaw] = (positionPart || "center center").trim().split(/\s+/);
  const parsedZoom = Number.parseFloat((zoomPart || "1").trim());

  return {
    x: parseAxis(xRaw, 50),
    y: parseAxis(yRaw, 50),
    zoom: Number.isFinite(parsedZoom) ? clamp(parsedZoom, 1, 3) : 1,
  };
};

export const stringifyImagePosition = (x: number, y: number, zoom = 1) => {
  const safeX = clamp(Math.round(x), 0, 100);
  const safeY = clamp(Math.round(y), 0, 100);
  const safeZoom = clamp(Number(zoom.toFixed(2)), 1, 3);
  return `${safeX}% ${safeY}%|${safeZoom}`;
};

export const getImagePositionStyle = ({ x, y, zoom }: ParsedImagePosition) => ({
  objectPosition: `${x}% ${y}%`,
  transform: `scale(${zoom})`,
  transformOrigin: `${x}% ${y}%`,
});
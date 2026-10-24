const HUE_BUCKETS = 12;

function hue(red: number, green: number, blue: number) {
  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);

  if (delta === 0) return 0;

  let h: number;
  if (max === red) h = ((green - blue) / delta) % 6;
  else if (max === green) h = (blue - red) / delta + 2;
  else h = (red - green) / delta + 4;

  h *= 60;
  return h < 0 ? h + 360 : h;
}

export function coverColor(pixels: Uint8Array) {
  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({
    red: 0,
    green: 0,
    blue: 0,
    weight: 0,
  }));
  const all = { red: 0, green: 0, blue: 0, weight: 0 };

  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i] ?? 0;
    const green = pixels[i + 1] ?? 0;
    const blue = pixels[i + 2] ?? 0;

    const max = Math.max(red, green, blue);
    const saturation = max === 0 ? 0 : (max - Math.min(red, green, blue)) / max;
    const brightness = max / 255;

    all.red += red;
    all.green += green;
    all.blue += blue;
    all.weight += 1;

    if (saturation < 0.2 || brightness < 0.15 || brightness > 0.95) continue;

    const index = Math.floor((hue(red, green, blue) / 360) * HUE_BUCKETS);
    const bucket = buckets[index % HUE_BUCKETS]!;
    bucket.red += red * saturation;
    bucket.green += green * saturation;
    bucket.blue += blue * saturation;
    bucket.weight += saturation;
  }

  const best = buckets.reduce((a, b) => (b.weight > a.weight ? b : a));
  const pick = best.weight > 0 ? best : all; // black-and-white cover: plain average
  if (pick.weight === 0) return null;

  const r = Math.round(pick.red / pick.weight);
  const g = Math.round(pick.green / pick.weight);
  const b = Math.round(pick.blue / pick.weight);
  return `rgb(${r} ${g} ${b})`;
}

export const PLACEMENT_TOP = "top";
export const PLACEMENT_BOTTOM = "bottom";
export const PLACEMENT_HIDDEN = "hidden";

export function computeDefaultGeometry(workArea, placement, heightPercent = 50) {
  const percent = clampNumber(heightPercent, 10, 100);
  const height = Math.round((workArea.height * percent) / 100);
  const y =
    placement === PLACEMENT_BOTTOM
      ? workArea.y + workArea.height - height
      : workArea.y;

  return {
    x: workArea.x,
    y,
    width: workArea.width,
    height,
  };
}

export function clampGeometry(geometry, workArea) {
  const width = clampNumber(geometry.width, 1, workArea.width);
  const height = clampNumber(geometry.height, 1, workArea.height);
  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;

  return {
    x: clampNumber(geometry.x, workArea.x, maxX),
    y: clampNumber(geometry.y, workArea.y, maxY),
    width,
    height,
  };
}

export function parseGeometry(value) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!isFiniteRect(parsed)) return null;
    return {
      x: Math.round(parsed.x),
      y: Math.round(parsed.y),
      width: Math.round(parsed.width),
      height: Math.round(parsed.height),
    };
  } catch {
    return null;
  }
}

export function serializeGeometry(geometry) {
  return JSON.stringify({
    x: Math.round(geometry.x),
    y: Math.round(geometry.y),
    width: Math.round(geometry.width),
    height: Math.round(geometry.height),
  });
}

export function keyForPlacement(placement) {
  if (placement === PLACEMENT_BOTTOM) return "bottom-geometry";
  return "top-geometry";
}

function isFiniteRect(value) {
  return (
    value &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    value.width > 0 &&
    value.height > 0
  );
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(Math.round(value), min), max);
}

import {
  PLACEMENT_BOTTOM,
  PLACEMENT_TOP,
  anchorGeometryToPlacement,
  clampGeometry,
  computeDefaultGeometry,
  keyForPlacement,
  parseGeometry,
  serializeGeometry,
} from "../warp-visor@local/geometry.js";

function assertEqual(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${label}: expected ${expectedJson}, got ${actualJson}`);
  }
}

const workArea = { x: 0, y: 32, width: 1920, height: 1048 };

assertEqual(
  computeDefaultGeometry(workArea, PLACEMENT_TOP, 50),
  { x: 0, y: 32, width: 1920, height: 524 },
  "top default geometry"
);

assertEqual(
  computeDefaultGeometry(workArea, PLACEMENT_BOTTOM, 50),
  { x: 0, y: 556, width: 1920, height: 524 },
  "bottom default geometry"
);

assertEqual(
  clampGeometry({ x: -50, y: 0, width: 3000, height: 2000 }, workArea),
  { x: 0, y: 32, width: 1920, height: 1048 },
  "clamp oversized offscreen geometry"
);

assertEqual(
  clampGeometry({ x: 1800, y: 1000, width: 400, height: 300 }, workArea),
  { x: 1520, y: 780, width: 400, height: 300 },
  "clamp partially offscreen geometry"
);

assertEqual(
  anchorGeometryToPlacement(
    { x: 20, y: 224, width: 1200, height: 384 },
    workArea,
    PLACEMENT_TOP
  ),
  { x: 0, y: 32, width: 1920, height: 384 },
  "anchor saved top geometry to work area top"
);

assertEqual(
  anchorGeometryToPlacement(
    { x: 20, y: 224, width: 1200, height: 384 },
    workArea,
    PLACEMENT_BOTTOM
  ),
  { x: 0, y: 696, width: 1920, height: 384 },
  "anchor saved bottom geometry to work area bottom"
);

assertEqual(
  anchorGeometryToPlacement(
    { x: 320, y: 32, width: 640, height: 608 },
    workArea,
    PLACEMENT_TOP
  ),
  { x: 0, y: 32, width: 1920, height: 608 },
  "saved narrow width expands to full work area width"
);

const encoded = serializeGeometry({ x: 1.2, y: 2.7, width: 300.2, height: 400.8 });
assertEqual(
  parseGeometry(encoded),
  { x: 1, y: 3, width: 300, height: 401 },
  "serialize and parse geometry"
);

assertEqual(parseGeometry("not json"), null, "invalid JSON geometry");
assertEqual(parseGeometry('{"x":0,"y":0,"width":0,"height":1}'), null, "invalid rect geometry");
assertEqual(keyForPlacement(PLACEMENT_TOP), "top-geometry", "top geometry key");
assertEqual(keyForPlacement(PLACEMENT_BOTTOM), "bottom-geometry", "bottom geometry key");

console.log("geometry tests passed");

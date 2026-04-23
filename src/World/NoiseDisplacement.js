/**
 * Implémentation légère et déterministe d'un bruit Perlin-like (value noise lissé)
 * et d'un FBM utilisable pour déformer des géométries Three.js.
 */

const hash = (x, y, z) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

const smooth = (t) => t * t * (3 - 2 * t);

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Value noise 3D lissé dans [-1, 1].
 */
export const valueNoise3D = (x, y, z) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;

  const u = smooth(xf);
  const v = smooth(yf);
  const w = smooth(zf);

  const c000 = hash(xi, yi, zi);
  const c100 = hash(xi + 1, yi, zi);
  const c010 = hash(xi, yi + 1, zi);
  const c110 = hash(xi + 1, yi + 1, zi);
  const c001 = hash(xi, yi, zi + 1);
  const c101 = hash(xi + 1, yi, zi + 1);
  const c011 = hash(xi, yi + 1, zi + 1);
  const c111 = hash(xi + 1, yi + 1, zi + 1);

  const x00 = lerp(c000, c100, u);
  const x10 = lerp(c010, c110, u);
  const x01 = lerp(c001, c101, u);
  const x11 = lerp(c011, c111, u);

  const y0 = lerp(x00, x10, v);
  const y1 = lerp(x01, x11, v);

  return lerp(y0, y1, w) * 2 - 1;
};

/**
 * Bruit fractal (FBM) sommant {@link valueNoise3D} sur plusieurs octaves.
 */
export const fbm = (x, y, z, octaves = 4, lacunarity = 2.0, gain = 0.5) => {
  let amp = 1;
  let freq = 1;
  let total = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    total += amp * valueNoise3D(x * freq, y * freq, z * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }

  return total / norm;
};

/**
 * Applique un déplacement FBM sur l'axe choisi d'une BufferGeometry.
 * Retourne la géométrie modifiée (sans recalcul des normales).
 */
export const applyFbmDisplacement = (geometry, options) => {
  const {
    frequency = 0.2,
    amplitude = 0.5,
    octaves = 4,
    axis = "y",
    seed = 0,
  } = options;

  const position = geometry.attributes.position;
  const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const noise = fbm(
      x * frequency + seed,
      y * frequency + seed,
      z * frequency + seed,
      octaves,
    );

    const currentAxisValue = position.getComponent(i, axisIndex);
    position.setComponent(i, axisIndex, currentAxisValue + noise * amplitude);
  }

  position.needsUpdate = true;
  return geometry;
};

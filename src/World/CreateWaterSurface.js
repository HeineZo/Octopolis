import * as THREE from "three";
import { SCENE_CONFIG } from "@config/SceneConfig";

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform float uWaveFrequency;
  uniform float uWaveSpeed;
  uniform float uRippleAmplitude;
  uniform float uRippleFrequency;
  uniform float uRippleSpeed;

  varying float vElevation;
  varying vec2 vUv;

  /**
   * Somme de 2 houles croisées + rides haute fréquence.
   * Donne des vagues lisibles mais pas trop grillagées.
   */
  float waveHeight(vec2 p) {
    float t = uTime * uWaveSpeed;
    float w1 = sin(p.x * uWaveFrequency + t) * uWaveAmplitude;
    float w2 = sin(p.y * uWaveFrequency * 0.8 + t * 1.3) * uWaveAmplitude * 0.7;
    float w3 = sin((p.x + p.y) * uWaveFrequency * 1.6 + t * 0.7) * uWaveAmplitude * 0.4;

    float rt = uTime * uRippleSpeed;
    float r = sin(p.x * uRippleFrequency + rt) *
              cos(p.y * uRippleFrequency * 0.9 + rt * 1.1);

    return w1 + w2 + w3 + r * uRippleAmplitude;
  }

  void main() {
    vUv = uv;

    vec3 displaced = position;
    float h = waveHeight(position.xz);
    displaced.y += h;
    vElevation = h;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uCausticColor;
  uniform float uOpacity;
  uniform vec3 uFogColor;
  uniform float uFogDensity;

  varying float vElevation;
  varying vec2 vUv;

  /**
   * Pattern de caustiques bon marché: somme de vagues radiales mobiles.
   * Assez convaincant pour suggérer la lumière qui perce.
   */
  float caustics(vec2 p) {
    float t = uTime * 0.7;
    float c = 0.0;
    c += sin(p.x * 6.0 + t) * sin(p.y * 6.0 - t);
    c += sin((p.x + p.y) * 4.5 + t * 1.3);
    c += sin((p.x - p.y) * 5.2 - t * 0.9);
    return smoothstep(0.6, 1.6, c);
  }

  void main() {
    float h = clamp((vElevation / uWaveAmplitude) * 0.5 + 0.5, 0.0, 1.0);

    vec3 base = mix(uDeepColor, uShallowColor, pow(h, 1.6));

    float c = caustics(vUv * 12.0);
    base += uCausticColor * c * 0.35;

    float depth = gl_FragCoord.z / gl_FragCoord.w;
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);
    vec3 col = mix(base, uFogColor, clamp(fogFactor, 0.0, 1.0));

    gl_FragColor = vec4(col, uOpacity);
  }
`;

/**
 * Surface de l'eau
 */
export const createWaterSurface = () => {
  const {
    size,
    segments,
    y,
    deepColor,
    shallowColor,
    causticColor,
    opacity,
    waveAmplitude,
    waveFrequency,
    waveSpeed,
    rippleAmplitude,
    rippleFrequency,
    rippleSpeed,
  } = SCENE_CONFIG.waterSurface;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uTime: { value: 0 },
      uWaveAmplitude: { value: waveAmplitude },
      uWaveFrequency: { value: waveFrequency },
      uWaveSpeed: { value: waveSpeed },
      uRippleAmplitude: { value: rippleAmplitude },
      uRippleFrequency: { value: rippleFrequency },
      uRippleSpeed: { value: rippleSpeed },
      uDeepColor: { value: deepColor.clone() },
      uShallowColor: { value: shallowColor.clone() },
      uCausticColor: { value: causticColor.clone() },
      uOpacity: { value: opacity },
      uFogColor: { value: SCENE_CONFIG.fog.color.clone() },
      uFogDensity: { value: SCENE_CONFIG.fog.density },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  mesh.name = "water-surface";

  const update = (deltaSec) => {
    material.uniforms.uTime.value += deltaSec;
  };

  return { mesh, update };
};

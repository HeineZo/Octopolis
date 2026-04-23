import * as THREE from "three";

export const SCENE_CONFIG = {
  fog: {
    color: new THREE.Color(0x0a2a3a),
    density: 0.005,
  },
  background: {
    color: new THREE.Color(0x0a2a3a),
    texturePath: "/background.jpeg",
  },
  camera: {
    fov: 55,
    near: 0.1,
    far: 600,
    position: new THREE.Vector3(-140, 120, 140),
    target: new THREE.Vector3(0, 0, 0),
  },
  octopus: {
    spawn: {
      position: new THREE.Vector3(0, 0, 0),
      clearance: 15,
    },
  },
  controls: {
    minDistance: 50,
    maxDistance: 200,
    maxPolarAngle: Math.PI,
  },
  lights: {
    ambientColor: new THREE.Color(0x1d4a66),
    ambientIntensity: 0.35,
    directionalColor: new THREE.Color(0x7ec9e6),
    directionalIntensity: 2.0,
    directionalPosition: new THREE.Vector3(4, 10, 2),
    fillColor: new THREE.Color(0x0f3550),
    fillIntensity: 0.6,
  },
  seabed: {
    size: 80,
    segments: 160,
    color: new THREE.Color(0x9a8a6d),
    heightNoiseScale: 0.18,
    heightAmplitude: 0.6,
  },
  miniWorld: {
    radius: 20,
    segments: 192,
    color: new THREE.Color(0x9a8a6d),
    reliefAmplitude: 2,
    reliefFrequency: 0.08,
    reliefOctaves: 4,
  },
  rocks: {
    count: 150,
    minScale: 0.35,
    maxScale: 2,
    color: new THREE.Color(0x6b6a64),
    buryRatio: 0.35,
  },
  corals: {
    count: 150,
    minScale: 0.6,
    maxScale: 2,
    colors: [
      new THREE.Color(0xff4d9e),
      new THREE.Color(0xff7a4b),
      new THREE.Color(0xb66bff),
      new THREE.Color(0xffd166),
      new THREE.Color(0xe04848),
      new THREE.Color(0xff9ec4),
    ],
  },
  algae: {
    count: 2000,
    minHeight: 0.6,
    maxHeight: 2,
    baseRadius: 0.08,
    tipRadius: 0.025,
    color: new THREE.Color(0x2f8f5e),
    swaySpeed: 1.4,
    swayAmplitude: 0.18,
  },
  particles: {
    count: 1500,
    areaSize: 24,
    height: 12,
    baseSize: 0.05,
    color: new THREE.Color(0xcde8ff),
  },
  postFx: {
    bloomStrength: 0.35,
    bloomRadius: 0.6,
    bloomThreshold: 0.85,
    exposure: 0.95,
  },
};

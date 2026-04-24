import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { SCENE_CONFIG } from "@config/SceneConfig";

const randBetween = (min, max) => min + Math.random() * (max - min);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const buildResult = ({ ok, group, error }) => ({
  ok,
  group,
  error,
  update: (delta) => {
    if (!ok) return;

    group.userData.time += delta;

    const t = group.userData.time;
    const schools = group.userData.schools;
    const cfg = group.userData.fishesConfig;
    const safeDelta = Math.max(0.0001, delta);

    const tmpTarget = new THREE.Vector3();
    const tmpVel = new THREE.Vector3();
    const tmpLook = new THREE.Vector3();
    const tmpMatrix = new THREE.Matrix4();
    const desiredQuat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const orientationQuat = group.userData.orientationQuat;
    orientationQuat.setFromAxisAngle(up, cfg.orientation?.yawOffset ?? 0);

    // Update les centres des bancs
    for (const school of schools) {
      school.angle += school.angularSpeed * delta;

      school.center.x = Math.cos(school.angle) * school.radius;
      school.center.z = Math.sin(school.angle) * school.radius;
      school.center.y =
        school.baseY + Math.sin(t * 0.6 + school.wobblePhase) * school.yAmp;
    }

    for (const fish of group.children) {
      const data = fish.userData;
      if (!data) continue;

      const wobble =
        Math.sin(t * data.wobbleSpeed + data.wobblePhase) * data.wobbleAmp;

      data.prevPos.copy(fish.position);

      if (data.kind === "school") {
        const school = schools[data.schoolIndex];
        data.localAngle += data.localAngularSpeed * delta;

        const ox = Math.cos(data.localAngle) * data.localRadius;
        const oz = Math.sin(data.localAngle) * data.localRadius;
        const oy = Math.sin(t * 0.9 + data.wobblePhase) * data.localYAmp;

        tmpTarget.set(
          school.center.x + ox,
          school.center.y + oy,
          school.center.z + oz,
        );

        const follow = clamp01(cfg.schooling.followStrength * delta);
        fish.position.lerp(tmpTarget, follow);
      } else {
        data.angle += data.angularSpeed * delta;

        tmpTarget.set(
          Math.cos(data.angle) * data.radius,
          data.baseY + Math.sin(t * 0.8 + data.wobblePhase) * data.yAmp,
          Math.sin(data.angle) * data.radius,
        );

        const follow = clamp01(2.2 * delta);
        fish.position.lerp(tmpTarget, follow);
      }

      tmpVel.copy(fish.position).sub(data.prevPos).divideScalar(safeDelta);
      if (tmpVel.lengthSq() > 0.000001) {
        tmpLook.copy(fish.position).add(tmpVel);
        tmpMatrix.lookAt(fish.position, tmpLook, up);
        desiredQuat.setFromRotationMatrix(tmpMatrix);
        desiredQuat.multiply(orientationQuat);
        fish.quaternion.slerp(
          desiredQuat,
          clamp01(cfg.schooling.turnSpeed * delta),
        );
      }

      // Petit wobble visuel
      fish.rotateZ(wobble * 0.05);
      fish.rotateX(wobble * 0.03);
    }
  },
});

const prepareFishModel = (root) => {
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = false;
    }
  });
};

const computeModelBaseScale = (root) => {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);

  // On prend la "taille" comme la plus grande dimension du modèle.
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maxDim) || maxDim <= 0) return 1;

  // Cible arbitraire en "unités scène"
  const TARGET_SIZE = 1;
  return TARGET_SIZE / maxDim;
};

const cloneModel = (root) => {
  const cloned = SkeletonUtils.clone(root);
  return cloned;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Charge plusieurs modèles de poissons et instancie un "banc" de poissons aléatoirement
 */
export const createFishes = async ({ urls }) => {
  const loader = new GLTFLoader();
  const group = new THREE.Group();
  group.name = "fishes";
  group.userData.time = 0;
  group.userData.schools = [];
  group.userData.fishesConfig = SCENE_CONFIG.fishes;
  group.userData.orientationQuat = new THREE.Quaternion();

  try {
    const settled = await Promise.allSettled(
      urls.map(async (url) => {
        const gltf = await loader.loadAsync(url);
        const root = gltf.scene;
        prepareFishModel(root);
        root.userData.baseScale = computeModelBaseScale(root);
        return root;
      }),
    );

    const models = settled
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    if (models.length === 0) {
      return buildResult({
        ok: false,
        group,
        error: new Error("Aucun modèle de poisson n'a pu être chargé"),
      });
    }

    const {
      count,
      minRadius,
      maxRadius,
      minY,
      maxY,
      minScale,
      maxScale,
      schooling,
      swim,
    } = SCENE_CONFIG.fishes;

    for (let i = 0; i < schooling.schoolsCount; i++) {
      const radius = randBetween(minRadius, maxRadius);
      const angle = Math.random() * Math.PI * 2;
      const speed = randBetween(swim.minSpeed, swim.maxSpeed);

      group.userData.schools.push({
        radius,
        angle,
        angularSpeed: speed / Math.max(radius, 1),
        baseY: randBetween(minY, maxY),
        yAmp: randBetween(2, 10),
        wobblePhase: Math.random() * Math.PI * 2,
        center: new THREE.Vector3(),
      });
    }

    for (let i = 0; i < count; i++) {
      const base = pick(models);
      const fish = cloneModel(base);
      fish.name = `fish-${i}`;

      const scale = minScale + Math.random() * (maxScale - minScale);
      const baseScale = Number(base.userData.baseScale) || 1;
      fish.scale.setScalar(baseScale * scale);

      const isSchool = Math.random() < schooling.ratio;
      if (isSchool) {
        const schoolIndex = Math.floor(
          Math.random() * group.userData.schools.length,
        );

        fish.userData = {
          kind: "school",
          schoolIndex,
          localRadius: randBetween(0.8, schooling.radius),
          localAngle: Math.random() * Math.PI * 2,
          localAngularSpeed: randBetween(0.6, 1.6),
          localYAmp: randBetween(0.4, 2.0),
          wobbleAmp: swim.wobbleAmp * (0.6 + Math.random() * 0.8),
          wobbleSpeed: swim.wobbleSpeed * (0.7 + Math.random() * 1.1),
          wobblePhase: Math.random() * Math.PI * 2,
          prevPos: new THREE.Vector3(),
        };
      } else {
        const radius = randBetween(minRadius, maxRadius);
        const angle = Math.random() * Math.PI * 2;
        const speed = randBetween(swim.minSpeed, swim.maxSpeed);

        fish.userData = {
          kind: "solo",
          radius,
          angle,
          angularSpeed: speed / Math.max(radius, 1),
          baseY: randBetween(minY, maxY),
          yAmp: 1.5 + Math.random() * 5.0,
          wobbleAmp: swim.wobbleAmp * (0.6 + Math.random() * 0.8),
          wobbleSpeed: swim.wobbleSpeed * (0.7 + Math.random() * 1.1),
          wobblePhase: Math.random() * Math.PI * 2,
          prevPos: new THREE.Vector3(),
        };
      }

      fish.position.set(
        randBetween(-1, 1),
        randBetween(minY, maxY),
        randBetween(-1, 1),
      );
      fish.userData.prevPos.copy(fish.position);

      group.add(fish);
    }

    return buildResult({ ok: true, group, error: undefined });
  } catch (error) {
    return buildResult({
      ok: false,
      group,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

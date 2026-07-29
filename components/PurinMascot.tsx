"use client";

import { useEffect, useRef, useState } from "react";

export type OutfitId =
  | "classic"
  | "soft"
  | "scarf"
  | "berry"
  | "raincoat"
  | "sailor"
  | "bee"
  | "wizard"
  | "royal"
  | "pajamas"
  | "chef"
  | "detective"
  | "banana"
  | "pudding"
  | "sushi"
  | "ufo";

export type PetCondition =
  | "radiant"
  | "content"
  | "calm"
  | "hungry"
  | "lonely"
  | "dirty"
  | "sleepy"
  | "critical";

export type GrowthStageId =
  | "child"
  | "teen"
  | "adult"
  | "middle"
  | "senior";

type PurinMascotProps = {
  outfit: OutfitId;
  condition: PetCondition;
  action?: string | null;
  name: string;
  baby?: boolean;
  growthStage?: GrowthStageId;
  interactive?: boolean;
  environment?: string;
  preview?: boolean;
};

type SpriteSheet = "core" | "adventure" | "fancy" | "funny";
type IdlePose =
  | "breathe"
  | "curious"
  | "sniff"
  | "sway"
  | "sploot"
  | "selfplay"
  | "nap"
  | "delighted";
type CinematicPose =
  | "sploot"
  | "selfplay"
  | "nap"
  | "feed"
  | "bath"
  | "play"
  | "sleepy"
  | "critical";

type SpriteMeta = {
  sheet: SpriteSheet;
  column: 0 | 1;
  row: 0 | 1;
};

type PoseMeta = {
  sheet: "idle" | "care";
  column: 0 | 1;
  row: 0 | 1;
};

type DrawMotion = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

type StageProfile = {
  overall: number;
  y: number;
  rotation: number;
  lean: number;
  headWidth: number;
  chestWidth: number;
  bellyWidth: number;
  hipWidth: number;
  footWidth: number;
  headHeight: number;
  torsoHeight: number;
  legHeight: number;
};

type PoseTransition = "steady" | "exit" | "enter";

const SPRITES: Record<OutfitId, SpriteMeta> = {
  classic: { sheet: "core", column: 0, row: 0 },
  soft: { sheet: "core", column: 1, row: 0 },
  scarf: { sheet: "core", column: 0, row: 1 },
  berry: { sheet: "core", column: 1, row: 1 },
  raincoat: { sheet: "adventure", column: 0, row: 0 },
  sailor: { sheet: "adventure", column: 1, row: 0 },
  bee: { sheet: "adventure", column: 0, row: 1 },
  wizard: { sheet: "adventure", column: 1, row: 1 },
  royal: { sheet: "fancy", column: 0, row: 0 },
  pajamas: { sheet: "fancy", column: 1, row: 0 },
  chef: { sheet: "fancy", column: 0, row: 1 },
  detective: { sheet: "fancy", column: 1, row: 1 },
  banana: { sheet: "funny", column: 0, row: 0 },
  pudding: { sheet: "funny", column: 1, row: 0 },
  sushi: { sheet: "funny", column: 0, row: 1 },
  ufo: { sheet: "funny", column: 1, row: 1 },
};

const SHEET_FILE: Record<SpriteSheet, string> = {
  core: "core-outfits.webp",
  adventure: "adventure-outfits.webp",
  fancy: "fancy-outfits.webp",
  funny: "funny-outfits.webp",
};

const POSES: Record<CinematicPose, PoseMeta> = {
  sploot: { sheet: "idle", column: 0, row: 0 },
  selfplay: { sheet: "idle", column: 1, row: 0 },
  nap: { sheet: "idle", column: 0, row: 1 },
  feed: { sheet: "idle", column: 1, row: 1 },
  bath: { sheet: "care", column: 0, row: 0 },
  play: { sheet: "care", column: 1, row: 0 },
  sleepy: { sheet: "care", column: 0, row: 1 },
  critical: { sheet: "care", column: 1, row: 1 },
};

const POSE_FILE: Record<PoseMeta["sheet"], string> = {
  idle: "idle-poses.webp",
  care: "care-poses.webp",
};

const STAGE_PROFILE: Record<GrowthStageId, StageProfile> = {
  child: {
    overall: 0.92,
    y: 0.035,
    rotation: 0,
    lean: 0,
    headWidth: 1.14,
    chestWidth: 0.95,
    bellyWidth: 0.91,
    hipWidth: 0.92,
    footWidth: 1.03,
    headHeight: 1.13,
    torsoHeight: 0.9,
    legHeight: 0.9,
  },
  teen: {
    overall: 0.98,
    y: 0.012,
    rotation: -0.004,
    lean: -0.006,
    headWidth: 0.95,
    chestWidth: 0.92,
    bellyWidth: 0.86,
    hipWidth: 0.9,
    footWidth: 0.93,
    headHeight: 0.95,
    torsoHeight: 1.08,
    legHeight: 1.06,
  },
  adult: {
    overall: 1,
    y: 0,
    rotation: 0,
    lean: 0,
    headWidth: 1,
    chestWidth: 1.035,
    bellyWidth: 1,
    hipWidth: 1,
    footWidth: 1,
    headHeight: 1,
    torsoHeight: 1,
    legHeight: 1,
  },
  middle: {
    overall: 0.995,
    y: 0.01,
    rotation: 0.006,
    lean: 0.004,
    headWidth: 0.99,
    chestWidth: 1.07,
    bellyWidth: 1.13,
    hipWidth: 1.09,
    footWidth: 1.02,
    headHeight: 0.98,
    torsoHeight: 1.04,
    legHeight: 0.97,
  },
  senior: {
    overall: 0.94,
    y: 0.035,
    rotation: -0.024,
    lean: -0.016,
    headWidth: 1.06,
    chestWidth: 0.93,
    bellyWidth: 1.02,
    hipWidth: 0.96,
    footWidth: 0.9,
    headHeight: 1.04,
    torsoHeight: 0.94,
    legHeight: 0.87,
  },
};

const ENVIRONMENT_TINT: Record<string, string> = {
  cozy: "rgba(255, 178, 82, 0.055)",
  cafe: "rgba(255, 190, 126, 0.045)",
  garden: "rgba(154, 213, 118, 0.035)",
  camp: "rgba(255, 144, 54, 0.06)",
  rainy: "rgba(111, 166, 211, 0.075)",
  beach: "rgba(255, 218, 120, 0.045)",
  moon: "rgba(101, 133, 218, 0.105)",
  bakery: "rgba(255, 173, 116, 0.045)",
  arcade: "rgba(195, 92, 221, 0.075)",
  snow: "rgba(177, 219, 255, 0.075)",
  puddingland: "rgba(255, 144, 190, 0.055)",
  upside: "rgba(185, 132, 215, 0.055)",
  neutral: "rgba(255, 205, 126, 0.018)",
};

const POSE_SCALE: Record<CinematicPose, number> = {
  sploot: 1.15,
  selfplay: 1.07,
  nap: 1.12,
  feed: 1.055,
  bath: 1.09,
  play: 1.06,
  sleepy: 1.07,
  critical: 1.07,
};

const IDLE_POSES: IdlePose[] = [
  "breathe",
  "curious",
  "breathe",
  "sway",
  "sniff",
  "breathe",
  "selfplay",
  "breathe",
  "sploot",
  "breathe",
  "nap",
];

const ACTION_COPY: Record<string, string> = {
  feed: "一啖一啖食緊…",
  bath: "洗白白中…",
  play: "追住玩具跑緊！",
  sleep: "進入甜甜夢鄉…",
  gift: "拆緊今日禮物…",
  level: "成長慶祝中！",
  event: "諗緊點樣選擇…",
  baby: "陪緊小寶寶…",
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function petAssetPath(folder: "purin-sprites" | "purin-poses", file: string) {
  return `./${folder}/${file}`;
}

function loadCanvasImage(path: string) {
  const url = new URL(path, window.location.href).href;
  const cached = imageCache.get(url);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${path}`));
    image.src = url;
  });
  imageCache.set(url, pending);
  return pending;
}

function cinematicPoseFor(
  action: string | null,
  condition: PetCondition,
  idlePose: IdlePose,
): CinematicPose | null {
  if (action === "feed" || action === "bath" || action === "play") {
    return action;
  }
  if (action === "sleep") return "nap";
  if (action) return null;
  if (condition === "critical") return "critical";
  if (condition === "sleepy") return "sleepy";
  if (
    idlePose === "sploot" ||
    idlePose === "selfplay" ||
    idlePose === "nap"
  ) {
    return idlePose;
  }
  return null;
}

function motionFor(
  time: number,
  action: string | null,
  condition: PetCondition,
  idlePose: IdlePose,
  petted: boolean,
): DrawMotion {
  const slow = Math.sin(time * 0.0021);
  const medium = Math.sin(time * 0.0042);
  const fast = Math.sin(time * 0.008);
  const motion: DrawMotion = {
    x: 0,
    y: slow * 0.0015,
    rotation: slow * 0.0025,
    scaleX: 1 + slow * 0.0025,
    scaleY: 1 - slow * 0.002,
  };

  if (action === "feed") {
    return { ...motion, y: medium * 0.006, scaleX: 1 + fast * 0.008, scaleY: 1 - fast * 0.012 };
  }
  if (action === "bath") {
    return { ...motion, y: medium * 0.005, rotation: medium * 0.022 };
  }
  if (action === "play") {
    return {
      ...motion,
      y: -Math.abs(Math.sin(time * 0.0048)) * 0.028,
      rotation: medium * 0.016,
      scaleX: 1 + Math.abs(fast) * 0.008,
      scaleY: 1 - Math.abs(fast) * 0.008,
    };
  }
  if (action === "sleep") {
    return { ...motion, y: slow * 0.003, rotation: -0.012, scaleY: 1 + slow * 0.008 };
  }
  if (action) {
    return {
      ...motion,
      y: -Math.abs(Math.sin(time * 0.0044)) * 0.018,
      rotation: medium * 0.016,
    };
  }

  if (petted || idlePose === "delighted") {
    return {
      ...motion,
      y: -Math.abs(Math.sin(time * 0.0055)) * 0.015,
      rotation: medium * 0.012,
      scaleX: 1 + Math.abs(fast) * 0.007,
      scaleY: 1 - Math.abs(fast) * 0.006,
    };
  }
  if (condition === "radiant") {
    return {
      ...motion,
      y: slow * 0.0018,
      rotation: medium * 0.0035,
      scaleX: 1 + slow * 0.003,
      scaleY: 1 - slow * 0.0025,
    };
  }
  if (condition === "hungry") {
    return { ...motion, y: 0.016 + slow * 0.006, scaleX: 1.01, scaleY: 0.97 };
  }
  if (condition === "lonely") {
    return { ...motion, y: 0.022 + slow * 0.006, rotation: medium * 0.009, scaleY: 0.965 };
  }
  if (condition === "dirty") {
    return { ...motion, x: Math.sin(time * 0.015) * 0.006, rotation: fast * 0.012 };
  }
  if (condition === "critical") {
    return { ...motion, y: 0.025 + slow * 0.004, rotation: medium * 0.008, scaleY: 0.955 };
  }
  if (idlePose === "curious") {
    return { ...motion, rotation: -0.035 + slow * 0.008 };
  }
  if (idlePose === "sniff") {
    return { ...motion, x: fast * 0.005, rotation: fast * 0.008 };
  }
  if (idlePose === "sway") {
    return { ...motion, x: medium * 0.007, rotation: medium * 0.016 };
  }
  return motion;
}

function transitionMotionFor(
  time: number,
  transition: PoseTransition,
  startedAt: number,
): DrawMotion {
  if (transition === "exit") {
    const progress = Math.min(1, Math.max(0, (time - startedAt) / 130));
    const eased = 1 - Math.pow(1 - progress, 2);
    return {
      x: 0,
      y: 0.005 * eased,
      rotation: 0,
      scaleX: 1 + 0.018 * eased,
      scaleY: 1 - 0.035 * eased,
    };
  }

  if (transition === "enter") {
    const progress = Math.min(1, Math.max(0, (time - startedAt) / 420));
    const remaining = 1 - progress;
    const settle = Math.sin(progress * Math.PI * 2.2) * remaining;
    return {
      x: 0,
      y: 0.005 * remaining,
      rotation: settle * 0.004,
      scaleX: 1 - 0.018 * remaining + 0.007 * settle,
      scaleY: 1 + 0.025 * remaining - 0.009 * settle,
    };
  }

  return {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };
}

function gaussian(value: number, center: number, spread: number) {
  return Math.exp(-Math.pow((value - center) / spread, 2));
}

function drawStageDetails(
  context: CanvasRenderingContext2D,
  stage: GrowthStageId,
  drawSize: number,
) {
  if (stage !== "middle" && stage !== "senior") return;

  const faceY = -drawSize * 0.135;
  const lensX = drawSize * 0.098;
  const lensRadius = drawSize * (stage === "senior" ? 0.052 : 0.048);

  context.save();
  context.globalCompositeOperation = "source-over";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(1.15, drawSize * 0.008);
  context.strokeStyle =
    stage === "senior"
      ? "rgba(101, 68, 51, 0.82)"
      : "rgba(91, 58, 43, 0.78)";

  for (const direction of [-1, 1]) {
    context.beginPath();
    context.arc(direction * lensX, faceY, lensRadius, 0, Math.PI * 2);
    context.stroke();
  }
  context.beginPath();
  context.moveTo(-lensX + lensRadius, faceY);
  context.lineTo(lensX - lensRadius, faceY);
  context.stroke();

  if (stage === "senior") {
    context.fillStyle = "rgba(247, 231, 197, 0.48)";
    context.beginPath();
    context.ellipse(
      0,
      -drawSize * 0.075,
      drawSize * 0.09,
      drawSize * 0.045,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();

    context.strokeStyle = "rgba(126, 83, 52, 0.88)";
    context.lineWidth = Math.max(2, drawSize * 0.014);
    context.beginPath();
    context.moveTo(drawSize * 0.235, drawSize * 0.075);
    context.quadraticCurveTo(
      drawSize * 0.285,
      drawSize * 0.035,
      drawSize * 0.285,
      drawSize * 0.11,
    );
    context.lineTo(drawSize * 0.27, drawSize * 0.34);
    context.stroke();
  }
  context.restore();
}

function drawSculptedSprite(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  meta: SpriteMeta | PoseMeta,
  drawSize: number,
  time: number,
  animated: boolean,
  stage: GrowthStageId,
  environment: string,
) {
  const sourceWidth = image.naturalWidth / 2;
  const sourceHeight = image.naturalHeight / 2;
  const slices = 36;
  const sourceSlice = sourceHeight / slices;
  const profile = STAGE_PROFILE[stage];
  const breathe = animated ? Math.sin(time * 0.00165) : 0;
  const settle = animated ? Math.sin(time * 0.00082 + 0.7) : 0;
  const verticalWeights = Array.from({ length: slices }, (_, index) => {
    const middle = (index + 0.5) / slices;
    return (
      1 +
      (profile.headHeight - 1) * gaussian(middle, 0.35, 0.22) +
      (profile.torsoHeight - 1) * gaussian(middle, 0.64, 0.23) +
      (profile.legHeight - 1) * gaussian(middle, 0.84, 0.12)
    );
  });
  const totalVerticalWeight = verticalWeights.reduce(
    (total, weight) => total + weight,
    0,
  );
  let destinationTop = -drawSize / 2;

  for (let index = 0; index < slices; index += 1) {
    const middle = (index + 0.5) / slices;
    const sourceTop = index * sourceSlice;
    const sourceOverlapTop = index === 0 ? 0 : 0.65;
    const sourceOverlapBottom = index === slices - 1 ? 0 : 0.65;
    const sourceY =
      meta.row * sourceHeight + sourceTop - sourceOverlapTop;
    const sourceDrawHeight =
      sourceSlice + sourceOverlapTop + sourceOverlapBottom;

    const headInfluence = gaussian(middle, 0.35, 0.21);
    const chestInfluence = gaussian(middle, 0.53, 0.16);
    const bellyInfluence = gaussian(middle, 0.67, 0.18);
    const hipInfluence = gaussian(middle, 0.77, 0.14);
    const footInfluence = gaussian(middle, 0.86, 0.1);
    const silhouetteWidth =
      1 +
      (profile.headWidth - 1) * headInfluence +
      (profile.chestWidth - 1) * chestInfluence +
      (profile.bellyWidth - 1) * bellyInfluence +
      (profile.hipWidth - 1) * hipInfluence +
      (profile.footWidth - 1) * footInfluence;
    const localWidth =
      silhouetteWidth +
      breathe * 0.006 * chestInfluence -
      breathe * 0.0025 * headInfluence;
    const localShift =
      drawSize *
      (profile.lean * (0.5 - middle) +
        settle * 0.0028 * headInfluence -
        settle * 0.0012 * footInfluence);
    const localLift =
      drawSize * breathe * 0.0018 * (headInfluence - footInfluence);
    const destinationWidth = drawSize * localWidth;
    const destinationSlice =
      (drawSize * verticalWeights[index]) / totalVerticalWeight;
    const destinationY =
      destinationTop - (index === 0 ? 0 : 0.7) + localLift;
    const destinationHeight =
      destinationSlice +
      (index === 0 || index === slices - 1 ? 0.7 : 1.4);

    context.drawImage(
      image,
      meta.column * sourceWidth,
      sourceY,
      sourceWidth,
      sourceDrawHeight,
      -destinationWidth / 2 + localShift,
      destinationY,
      destinationWidth,
      destinationHeight,
    );
    destinationTop += destinationSlice;
  }

  const environmentTint =
    ENVIRONMENT_TINT[environment] ?? ENVIRONMENT_TINT.neutral;
  context.save();
  context.globalCompositeOperation = "source-atop";
  context.fillStyle = environmentTint;
  context.fillRect(
    -drawSize * 0.58,
    -drawSize * 0.58,
    drawSize * 1.16,
    drawSize * 1.16,
  );
  context.restore();
  if (meta.sheet !== "idle" && meta.sheet !== "care") {
    drawStageDetails(context, stage, drawSize);
  }
}

function ConditionEffects({ condition }: { condition: PetCondition }) {
  if (condition === "radiant") {
    return (
      <span className="mascot-fx radiant-fx" aria-hidden="true">
        <i>✦</i><i>✧</i><i>✦</i><i>·</i>
      </span>
    );
  }
  if (condition === "hungry") {
    return (
      <span className="mascot-fx hungry-fx" aria-hidden="true">
        <i>布甸…</i><i className="tummy-rumble">〰</i>
      </span>
    );
  }
  if (condition === "lonely") {
    return (
      <span className="mascot-fx lonely-fx" aria-hidden="true">
        <i>●</i><i>●</i>
      </span>
    );
  }
  if (condition === "dirty") {
    return (
      <span className="mascot-fx dirty-fx" aria-hidden="true">
        <i /><i /><i>〰</i>
      </span>
    );
  }
  if (condition === "sleepy") {
    return (
      <span className="mascot-fx sleepy-fx" aria-hidden="true">
        <i>z</i><i>Z</i><i>✦</i>
      </span>
    );
  }
  if (condition === "critical") {
    return (
      <span className="mascot-fx critical-fx" aria-hidden="true">
        <i>!</i><i>💧</i><i>〰</i>
      </span>
    );
  }
  return null;
}

export function PurinMascot({
  outfit,
  condition,
  action = null,
  name,
  baby = false,
  growthStage = "adult",
  interactive = false,
  environment = "neutral",
  preview = false,
}: PurinMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const petTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poseTransitionStarted = useRef(0);
  const [idlePose, setIdlePose] = useState<IdlePose>("breathe");
  const [petted, setPetted] = useState(false);
  const [touchPulse, setTouchPulse] = useState(0);
  const effectiveStage = baby ? "child" : growthStage;
  const sprite = SPRITES[outfit];
  const desiredCinematicPose =
    interactive && !baby
      ? cinematicPoseFor(action, condition, idlePose)
      : null;
  const [renderPose, setRenderPose] = useState<CinematicPose | null>(
    desiredCinematicPose,
  );
  const renderPoseRef = useRef<CinematicPose | null>(desiredCinematicPose);
  const [poseTransition, setPoseTransition] =
    useState<PoseTransition>("steady");
  const poseMeta = renderPose ? POSES[renderPose] : null;

  useEffect(() => {
    if (!interactive || action) return;
    let poseIndex = Math.floor(Math.random() * IDLE_POSES.length);
    const timer = window.setInterval(() => {
      poseIndex = (poseIndex + 1) % IDLE_POSES.length;
      setIdlePose(IDLE_POSES[poseIndex]);
    }, 11_000);
    return () => window.clearInterval(timer);
  }, [action, interactive]);

  useEffect(
    () => () => {
      if (petTimer.current) clearTimeout(petTimer.current);
      if (poseTimer.current) clearTimeout(poseTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!interactive) return;
    void Promise.all([
      loadCanvasImage(petAssetPath("purin-poses", POSE_FILE.idle)),
      loadCanvasImage(petAssetPath("purin-poses", POSE_FILE.care)),
    ]).catch(() => {
      // Preloading is optional; the base pose can still render.
    });
  }, [interactive]);

  useEffect(() => {
    if (desiredCinematicPose === renderPoseRef.current) return;
    if (poseTimer.current) clearTimeout(poseTimer.current);
    poseTransitionStarted.current = performance.now();
    setPoseTransition("exit");
    poseTimer.current = setTimeout(() => {
      renderPoseRef.current = desiredCinematicPose;
      setRenderPose(desiredCinematicPose);
      poseTransitionStarted.current = performance.now();
      setPoseTransition("enter");
      poseTimer.current = setTimeout(() => {
        setPoseTransition("steady");
      }, 420);
    }, 130);
  }, [desiredCinematicPose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let cancelled = false;
    let animationFrame = 0;
    let baseImage: HTMLImageElement | null = null;
    let cinematicImage: HTMLImageElement | null = null;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const shouldAnimate =
      !prefersReducedMotion && (interactive || Boolean(action));

    const paint = (time: number) => {
      if (cancelled || !baseImage || width <= 0 || height <= 0) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const activeImage =
        renderPose && cinematicImage ? cinematicImage : baseImage;
      const activeMeta =
        renderPose && poseMeta ? poseMeta : sprite;
      const profile = STAGE_PROFILE[effectiveStage];
      const motion = motionFor(time, action, condition, idlePose, petted);
      const transitionMotion = transitionMotionFor(
        time,
        prefersReducedMotion ? "steady" : poseTransition,
        poseTransitionStarted.current,
      );
      const poseScale = renderPose ? POSE_SCALE[renderPose] : 1;
      const drawSize =
        Math.min(width, height) * 1.075 * profile.overall * poseScale;

      context.save();
      context.globalAlpha = condition === "critical" ? 0.9 : 1;
      context.translate(
        width * (0.5 + motion.x + transitionMotion.x),
        height * (0.5 + profile.y + motion.y + transitionMotion.y),
      );
      context.rotate(
        profile.rotation + motion.rotation + transitionMotion.rotation,
      );
      context.scale(
        motion.scaleX * transitionMotion.scaleX,
        motion.scaleY * transitionMotion.scaleY,
      );
      drawSculptedSprite(
        context,
        activeImage,
        activeMeta,
        drawSize,
        time,
        shouldAnimate,
        effectiveStage,
        environment,
      );
      context.restore();
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
      const nextWidth = Math.round(width * pixelRatio);
      const nextHeight = Math.round(height * pixelRatio);
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      paint(performance.now());
    };

    const loop = (time: number) => {
      paint(time);
      animationFrame = window.requestAnimationFrame(loop);
    };

    const basePath = petAssetPath(
      "purin-sprites",
      SHEET_FILE[sprite.sheet],
    );
    const cinematicPath =
      poseMeta &&
      petAssetPath("purin-poses", POSE_FILE[poseMeta.sheet]);
    Promise.all([
      loadCanvasImage(basePath),
      cinematicPath ? loadCanvasImage(cinematicPath) : Promise.resolve(null),
    ])
      .then(([loadedBase, loadedCinematic]) => {
        if (cancelled) return;
        baseImage = loadedBase;
        cinematicImage = loadedCinematic;
        resize();
        if (shouldAnimate) {
          animationFrame = window.requestAnimationFrame(loop);
        }
      })
      .catch(() => {
        // The surrounding UI remains usable if an image is unavailable.
      });

    const observer =
      "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [
    action,
    condition,
    effectiveStage,
    environment,
    idlePose,
    interactive,
    outfit,
    petted,
    poseMeta,
    poseTransition,
    renderPose,
    sprite,
  ]);

  const reactToPet = (
    target?: HTMLElement,
    clientX?: number,
    clientY?: number,
  ) => {
    if (!interactive || action) return;
    if (
      target &&
      typeof clientX === "number" &&
      typeof clientY === "number"
    ) {
      const bounds = target.getBoundingClientRect();
      target.style.setProperty(
        "--pet-touch-x",
        `${((clientX - bounds.left) / bounds.width) * 100}%`,
      );
      target.style.setProperty(
        "--pet-touch-y",
        `${((clientY - bounds.top) / bounds.height) * 100}%`,
      );
    }
    if (petTimer.current) clearTimeout(petTimer.current);
    setPetted(true);
    setTouchPulse((current) => current + 1);
    setIdlePose("delighted");
    petTimer.current = setTimeout(() => {
      setPetted(false);
      setIdlePose("breathe");
    }, 900);
  };

  return (
    <span
      className={`purin-mascot canvas-mascot condition-${condition} outfit-${outfit} stage-${effectiveStage} idle-${idlePose} ${
        baby ? "is-baby" : ""
      } ${interactive ? "is-interactive" : ""} ${
        petted ? "is-petted" : ""
      } ${preview ? "is-growth-preview" : ""} ${
        renderPose ? `has-cinematic-pose pose-${renderPose}` : ""
      } pose-transition-${poseTransition}`}
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive
          ? `${name}，目前狀態：${condition}${
              action ? `，正在${ACTION_COPY[action] ?? "活動"}` : "，輕按可以摸摸佢"
            }`
          : `${name}，目前狀態：${condition}`
      }
      onPointerMove={(event) => {
        if (!interactive || action) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        event.currentTarget.style.setProperty("--pet-tilt-x", `${x * 4}deg`);
        event.currentTarget.style.setProperty("--pet-tilt-y", `${y * -2.5}deg`);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--pet-tilt-x", "0deg");
        event.currentTarget.style.setProperty("--pet-tilt-y", "0deg");
      }}
      onPointerDown={(event) =>
        reactToPet(
          event.currentTarget,
          event.clientX,
          event.clientY,
        )
      }
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          reactToPet(event.currentTarget);
        }
      }}
    >
      <span className="mascot-stage-shell">
        <span className={`mascot-rig mascot-action-${action ?? "idle"}`}>
          <span className="mascot-ground-shadow" aria-hidden="true" />
          <span className="mascot-environment-glow" aria-hidden="true" />
          <canvas ref={canvasRef} className="mascot-canvas" aria-hidden="true" />
          <span className="mascot-depth-glow" aria-hidden="true" />
          <span className="care-action-fx" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <ConditionEffects condition={condition} />
          <span
            className="petting-response"
            aria-hidden="true"
            key={touchPulse}
          >
            <i className="touch-ripple" />
            <i className="touch-sparkle">✦</i>
          </span>
          {action && ACTION_COPY[action] && (
            <span className="mascot-action-caption" aria-hidden="true">
              {ACTION_COPY[action]}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}

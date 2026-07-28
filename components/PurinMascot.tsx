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

const STAGE_SHAPE: Record<
  GrowthStageId,
  { overall: number; width: number; height: number; y: number; rotation: number }
> = {
  child: { overall: 0.9, width: 1.08, height: 0.88, y: 0.055, rotation: 0 },
  teen: { overall: 0.97, width: 0.91, height: 1.055, y: 0.008, rotation: 0 },
  adult: { overall: 1, width: 1, height: 1, y: 0, rotation: 0 },
  middle: { overall: 1, width: 1.075, height: 0.975, y: 0.015, rotation: 0 },
  senior: {
    overall: 0.96,
    width: 0.965,
    height: 0.91,
    y: 0.045,
    rotation: -0.018,
  },
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

function drawSoftMesh(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  meta: SpriteMeta | PoseMeta,
  drawSize: number,
  time: number,
  animated: boolean,
) {
  const sourceWidth = image.naturalWidth / 2;
  const sourceHeight = image.naturalHeight / 2;
  const slices = 30;
  const sourceSlice = sourceHeight / slices;
  const destinationSlice = drawSize / slices;
  const breathe = animated ? Math.sin(time * 0.00165) : 0;
  const settle = animated ? Math.sin(time * 0.00082 + 0.7) : 0;

  for (let index = 0; index < slices; index += 1) {
    const middle = (index + 0.5) / slices;
    const sourceTop = index * sourceSlice;
    const sourceOverlapTop = index === 0 ? 0 : 0.65;
    const sourceOverlapBottom = index === slices - 1 ? 0 : 0.65;
    const sourceY =
      meta.row * sourceHeight + sourceTop - sourceOverlapTop;
    const sourceDrawHeight =
      sourceSlice + sourceOverlapTop + sourceOverlapBottom;

    const headInfluence = Math.exp(-Math.pow((middle - 0.34) / 0.22, 2));
    const chestInfluence = Math.exp(-Math.pow((middle - 0.62) / 0.25, 2));
    const footInfluence = Math.exp(-Math.pow((middle - 0.82) / 0.13, 2));
    const localWidth =
      1 +
      breathe * 0.006 * chestInfluence -
      breathe * 0.0025 * headInfluence;
    const localShift =
      drawSize *
      (settle * 0.0028 * headInfluence -
        settle * 0.0012 * footInfluence);
    const localLift =
      drawSize * breathe * 0.0018 * (headInfluence - footInfluence);
    const destinationWidth = drawSize * localWidth;
    const destinationY =
      -drawSize / 2 +
      index * destinationSlice -
      (index === 0 ? 0 : 0.7) +
      localLift;
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
  }
}

function ConditionEffects({ condition }: { condition: PetCondition }) {
  if (condition === "radiant") {
    return (
      <span className="mascot-fx radiant-fx" aria-hidden="true">
        <i>✦</i><i>✧</i><i>✦</i><i>♡</i>
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
}: PurinMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const petTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [idlePose, setIdlePose] = useState<IdlePose>("breathe");
  const [petted, setPetted] = useState(false);
  const effectiveStage = baby ? "child" : growthStage;
  const sprite = SPRITES[outfit];
  const cinematicPose =
    interactive && !baby
      ? cinematicPoseFor(action, condition, idlePose)
      : null;
  const poseMeta = cinematicPose ? POSES[cinematicPose] : null;

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
    },
    [],
  );

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
    let transitionStarted = 0;
    const previousFrame = document.createElement("canvas");
    previousFrame.width = canvas.width;
    previousFrame.height = canvas.height;
    const previousContext = previousFrame.getContext("2d");
    const hasPreviousFrame =
      canvas.width > 1 && canvas.height > 1 && Boolean(previousContext);
    if (hasPreviousFrame) {
      previousContext?.drawImage(canvas, 0, 0);
    }
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
        cinematicPose && cinematicImage ? cinematicImage : baseImage;
      const activeMeta =
        cinematicPose && poseMeta ? poseMeta : sprite;
      const shape = STAGE_SHAPE[effectiveStage];
      const motion = motionFor(time, action, condition, idlePose, petted);
      const poseScale = cinematicPose ? POSE_SCALE[cinematicPose] : 1;
      const drawSize =
        Math.min(width, height) * 1.075 * shape.overall * poseScale;
      const transitionProgress =
        !shouldAnimate || !hasPreviousFrame
          ? 1
          : Math.min(1, Math.max(0, (time - transitionStarted) / 520));

      context.save();
      context.globalAlpha =
        (condition === "critical" ? 0.9 : 1) * transitionProgress;
      context.translate(
        width * (0.5 + motion.x),
        height * (0.5 + shape.y + motion.y),
      );
      context.rotate(shape.rotation + motion.rotation);
      context.scale(
        shape.width * motion.scaleX,
        shape.height * motion.scaleY,
      );
      drawSoftMesh(
        context,
        activeImage,
        activeMeta,
        drawSize,
        time,
        shouldAnimate,
      );
      context.restore();

      if (hasPreviousFrame && transitionProgress < 1) {
        context.save();
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.globalAlpha = 1 - transitionProgress;
        context.drawImage(
          previousFrame,
          0,
          0,
          previousFrame.width,
          previousFrame.height,
          0,
          0,
          width,
          height,
        );
        context.restore();
      }
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
        transitionStarted = performance.now();
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
    cinematicPose,
    condition,
    effectiveStage,
    idlePose,
    interactive,
    outfit,
    petted,
    poseMeta,
    sprite,
  ]);

  const reactToPet = () => {
    if (!interactive || action) return;
    if (petTimer.current) clearTimeout(petTimer.current);
    setPetted(true);
    setIdlePose("delighted");
    petTimer.current = setTimeout(() => {
      setPetted(false);
      setIdlePose("breathe");
    }, 1800);
  };

  return (
    <span
      className={`purin-mascot canvas-mascot condition-${condition} outfit-${outfit} stage-${effectiveStage} idle-${idlePose} ${
        baby ? "is-baby" : ""
      } ${interactive ? "is-interactive" : ""} ${
        petted ? "is-petted" : ""
      } ${cinematicPose ? `has-cinematic-pose pose-${cinematicPose}` : ""}`}
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
      onPointerDown={reactToPet}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          reactToPet();
        }
      }}
    >
      <span className="mascot-stage-shell">
        <span className={`mascot-rig mascot-action-${action ?? "idle"}`}>
          <span className="mascot-ground-shadow" aria-hidden="true" />
          <canvas ref={canvasRef} className="mascot-canvas" aria-hidden="true" />
          <span className="mascot-depth-glow" aria-hidden="true" />
          <span className="growth-details" aria-hidden="true">
            <i className="age-glasses" />
            <i className="age-muzzle" />
            <i className="age-cane" />
          </span>
          <span className="care-action-fx" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <ConditionEffects condition={condition} />
          <span className="petting-hearts" aria-hidden="true">
            <i>♥</i><i>♡</i><i>♥</i>
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

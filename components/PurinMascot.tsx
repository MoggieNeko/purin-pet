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
  showStageDesign?: boolean;
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

type StagePlacement = {
  overall: number;
  y: number;
  rotation: number;
  motion: number;
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

const STAGE_PLACEMENT: Record<GrowthStageId, StagePlacement> = {
  child: {
    overall: 0.8,
    y: 0.075,
    rotation: 0,
    motion: 0.82,
  },
  teen: {
    overall: 0.91,
    y: 0.035,
    rotation: -0.006,
    motion: 1.18,
  },
  adult: {
    overall: 1,
    y: 0,
    rotation: 0,
    motion: 1,
  },
  middle: {
    overall: 0.96,
    y: 0.025,
    rotation: 0.005,
    motion: 0.72,
  },
  senior: {
    overall: 0.88,
    y: 0.065,
    rotation: -0.012,
    motion: 0.46,
  },
};

const STAGE_FILE: Record<GrowthStageId, string> = {
  child: "child.png",
  teen: "teen.png",
  adult: "adult.png",
  middle: "middle.png",
  senior: "senior.png",
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

function petAssetPath(
  folder: "purin-sprites" | "purin-poses" | "purin-stages",
  file: string,
) {
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
  allowAmbientPose: boolean,
): CinematicPose | null {
  if (action === "feed" || action === "bath" || action === "play") {
    return action;
  }
  if (action === "sleep") return "nap";
  if (action) return null;
  if (!allowAmbientPose) return null;
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

function scaleDrawMotion(
  motion: DrawMotion,
  strength: number,
): DrawMotion {
  return {
    x: motion.x * strength,
    y: motion.y * strength,
    rotation: motion.rotation * strength,
    scaleX: 1 + (motion.scaleX - 1) * strength,
    scaleY: 1 + (motion.scaleY - 1) * strength,
  };
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

function drawWholeSprite(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  meta: SpriteMeta | PoseMeta | null,
  drawSize: number,
  environment: string,
) {
  const sourceWidth = meta ? image.naturalWidth / 2 : image.naturalWidth;
  const sourceHeight = meta ? image.naturalHeight / 2 : image.naturalHeight;
  const sourceX = meta ? meta.column * sourceWidth : 0;
  const sourceY = meta ? meta.row * sourceHeight : 0;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    -drawSize / 2,
    -drawSize / 2,
    drawSize,
    drawSize,
  );

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
  showStageDesign = false,
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
  const useStageArtwork =
    preview ||
    showStageDesign ||
    baby ||
    outfit === "classic" ||
    outfit === "soft";
  const baseMeta: SpriteMeta | null = useStageArtwork ? null : sprite;
  const desiredCinematicPose =
    interactive && !baby
      ? cinematicPoseFor(
          action,
          condition,
          idlePose,
          effectiveStage === "adult",
        )
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
        renderPose && poseMeta ? poseMeta : baseMeta;
      const placement = STAGE_PLACEMENT[effectiveStage];
      const motion = scaleDrawMotion(
        motionFor(time, action, condition, idlePose, petted),
        placement.motion,
      );
      const transitionMotion = transitionMotionFor(
        time,
        prefersReducedMotion ? "steady" : poseTransition,
        poseTransitionStarted.current,
      );
      const poseScale = renderPose ? POSE_SCALE[renderPose] : 1;
      const drawSize =
        Math.min(width, height) *
        1.075 *
        placement.overall *
        poseScale;

      context.save();
      context.globalAlpha = condition === "critical" ? 0.9 : 1;
      context.translate(
        width * (0.5 + motion.x + transitionMotion.x),
        height *
          (0.5 + placement.y + motion.y + transitionMotion.y),
      );
      context.rotate(
        placement.rotation +
          motion.rotation +
          transitionMotion.rotation,
      );
      context.scale(
        motion.scaleX * transitionMotion.scaleX,
        motion.scaleY * transitionMotion.scaleY,
      );
      drawWholeSprite(
        context,
        activeImage,
        activeMeta,
        drawSize,
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

    const basePath = useStageArtwork
      ? petAssetPath("purin-stages", STAGE_FILE[effectiveStage])
      : petAssetPath("purin-sprites", SHEET_FILE[sprite.sheet]);
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
    baseMeta,
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
    showStageDesign,
    sprite,
    useStageArtwork,
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
        useStageArtwork ? "uses-stage-artwork" : ""
      } ${
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

"use client";

import { useEffect, useRef, useState } from "react";
import {
  STILL_SOFT_MESH_POSE,
  createSoftMeshRenderer,
  type SoftMeshLandmarks,
  type SoftMeshPose,
} from "./purinSoftMesh";

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
  | "ufo"
  | "dlc-gintoki"
  | "dlc-feitan"
  | "dlc-tsuna"
  | "dlc-mafuyu"
  | "dlc-ritsuka"
  | "dlc-haruki"
  | "dlc-akihiko"
  | "dlc-chihiro";

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

export type TouchReaction =
  | "head-pat"
  | "cheek-poke"
  | "belly-tickle"
  | "paw-tap";

type DlcPersona =
  | "gintoki"
  | "feitan"
  | "tsuna"
  | "mafuyu"
  | "ritsuka"
  | "haruki"
  | "akihiko"
  | "chihiro";

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
  moving?: boolean;
  moveDirection?: -1 | 0 | 1;
  dragging?: boolean;
  onTouchReaction?: (reaction: TouchReaction) => void;
};

type IdlePose =
  | "breathe"
  | "curious"
  | "sniff"
  | "sway"
  | "toddle"
  | "energetic"
  | "stretch"
  | "glasses"
  | "cane"
  | "doze"
  | "selfplay"
  | "nap"
  | "delighted"
  | "yawn"
  | "groom"
  | "listen";

type DrawMotion = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
};

type StagePlacement = {
  overall: number;
  y: number;
  motion: number;
  idleSpeed: number;
  walkSpeed: number;
};

type StageFit = {
  hatY: number;
  headY: number;
  headW: number;
  neckY: number;
  bodyY: number;
  bodyW: number;
  bodyH: number;
  groundY: number;
  shoulderW: number;
  bellyW: number;
  hemY: number;
  armX: number;
  armY: number;
  footX: number;
  footY: number;
};

type PoseTransition = "steady" | "exit" | "enter";

const POSE_EXIT_MS = 320;
const POSE_ENTER_MS = 760;

type RenderMotion = {
  key: string;
  action: string | null;
  condition: PetCondition;
  idlePose: IdlePose;
  moving: boolean;
  direction: -1 | 1;
  startedAt: number;
};

const ACTION_DURATION_MS: Record<string, number> = {
  feed: 6500,
  bath: 7200,
  play: 6200,
  sleep: 7800,
  gift: 4200,
  level: 4300,
  event: 4200,
  baby: 4800,
};

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

const smoothStep = (value: number) => {
  const clamped = clampUnit(value);
  return clamped * clamped * (3 - 2 * clamped);
};

const actionProgressFor = (action: string | null, elapsed: number) =>
  action
    ? clampUnit(elapsed / (ACTION_DURATION_MS[action] ?? 4200))
    : 0;

function stagedPulse(
  progress: number,
  start: number,
  end: number,
) {
  if (progress <= start || progress >= end) return 0;
  return Math.sin(
    ((progress - start) / Math.max(0.001, end - start)) * Math.PI,
  );
}

function repeatedPulse(
  progress: number,
  start: number,
  end: number,
  repeats: number,
) {
  if (progress <= start || progress >= end) return 0;
  const local = ((progress - start) / (end - start)) * repeats;
  return Math.sin((local % 1) * Math.PI);
}

const STAGE_PLACEMENT: Record<GrowthStageId, StagePlacement> = {
  child: {
    overall: 0.8,
    y: 0.075,
    motion: 1,
    idleSpeed: 1.12,
    walkSpeed: 1,
  },
  teen: {
    overall: 0.91,
    y: 0.035,
    motion: 1.22,
    idleSpeed: 1.2,
    walkSpeed: 1.08,
  },
  adult: {
    overall: 1,
    y: 0,
    motion: 1,
    idleSpeed: 1,
    walkSpeed: 0.88,
  },
  middle: {
    overall: 0.96,
    y: 0.025,
    motion: 0.82,
    idleSpeed: 0.78,
    walkSpeed: 0.66,
  },
  senior: {
    overall: 0.88,
    y: 0.065,
    motion: 0.66,
    idleSpeed: 0.62,
    walkSpeed: 0.48,
  },
};

const STAGE_FIT: Record<GrowthStageId, StageFit> = {
  child: {
    hatY: -0.405,
    headY: -0.15,
    headW: 0.61,
    neckY: 0.06,
    bodyY: 0.2,
    bodyW: 0.33,
    bodyH: 0.31,
    groundY: 0.365,
    shoulderW: 0.18,
    bellyW: 0.205,
    hemY: 0.292,
    armX: 0.235,
    armY: 0.17,
    footX: 0.1,
    footY: 0.315,
  },
  teen: {
    hatY: -0.425,
    headY: -0.195,
    headW: 0.54,
    neckY: -0.06,
    bodyY: 0.18,
    bodyW: 0.32,
    bodyH: 0.46,
    groundY: 0.43,
    shoulderW: 0.18,
    bellyW: 0.215,
    hemY: 0.325,
    armX: 0.19,
    armY: 0.045,
    footX: 0.12,
    footY: 0.385,
  },
  adult: {
    hatY: -0.415,
    headY: -0.205,
    headW: 0.6,
    neckY: -0.04,
    bodyY: 0.205,
    bodyW: 0.41,
    bodyH: 0.4,
    groundY: 0.415,
    shoulderW: 0.22,
    bellyW: 0.275,
    hemY: 0.33,
    armX: 0.225,
    armY: 0.105,
    footX: 0.135,
    footY: 0.365,
  },
  middle: {
    hatY: -0.42,
    headY: -0.195,
    headW: 0.61,
    neckY: -0.025,
    bodyY: 0.21,
    bodyW: 0.46,
    bodyH: 0.4,
    groundY: 0.415,
    shoulderW: 0.24,
    bellyW: 0.295,
    hemY: 0.335,
    armX: 0.235,
    armY: 0.13,
    footX: 0.14,
    footY: 0.365,
  },
  senior: {
    hatY: -0.39,
    headY: -0.15,
    headW: 0.55,
    neckY: 0.03,
    bodyY: 0.205,
    bodyW: 0.44,
    bodyH: 0.38,
    groundY: 0.395,
    shoulderW: 0.23,
    bellyW: 0.275,
    hemY: 0.33,
    armX: 0.23,
    armY: 0.135,
    footX: 0.13,
    footY: 0.35,
  },
};

const DLC_FACE_FIT: Record<
  GrowthStageId,
  { headY: number; eyeGap: number; mouthY: number; eyeScale: number }
> = {
  child: { headY: -0.037, eyeGap: 0.072, mouthY: 0.052, eyeScale: 0.9 },
  teen: { headY: -0.081, eyeGap: 0.094, mouthY: 0.05, eyeScale: 0.9 },
  adult: { headY: -0.117, eyeGap: 0.084, mouthY: 0.05, eyeScale: 0.88 },
  middle: { headY: -0.147, eyeGap: 0.079, mouthY: 0.049, eyeScale: 0.86 },
  senior: { headY: -0.094, eyeGap: 0.073, mouthY: 0.048, eyeScale: 0.84 },
};

const STANDARD_FACE_FIT: Record<
  GrowthStageId,
  { headY: number; eyeGap: number; mouthY: number; eyeScale: number }
> = {
  child: { headY: -0.097, eyeGap: 0.103, mouthY: 0.055, eyeScale: 0.88 },
  teen: { headY: -0.132, eyeGap: 0.097, mouthY: 0.055, eyeScale: 0.88 },
  adult: { headY: -0.136, eyeGap: 0.103, mouthY: 0.052, eyeScale: 0.86 },
  middle: { headY: -0.091, eyeGap: 0.097, mouthY: 0.05, eyeScale: 0.84 },
  senior: { headY: -0.074, eyeGap: 0.093, mouthY: 0.05, eyeScale: 0.82 },
};

const DLC_LANDMARK_ADJUST: Record<
  GrowthStageId,
  { headY: number; bodyY: number; armY: number; footY: number; headRadius: number }
> = {
  child: { headY: 0.075, bodyY: -0.01, armY: -0.03, footY: 0, headRadius: 1 },
  teen: { headY: 0.035, bodyY: -0.045, armY: 0, footY: -0.01, headRadius: 0.96 },
  adult: { headY: 0.07, bodyY: -0.065, armY: -0.038, footY: -0.015, headRadius: 0.86 },
  middle: { headY: 0.055, bodyY: -0.055, armY: -0.028, footY: -0.012, headRadius: 0.9 },
  senior: { headY: 0.055, bodyY: -0.04, armY: 0.008, footY: 0.018, headRadius: 0.92 },
};

const STANDARD_LANDMARK_ADJUST: Record<
  GrowthStageId,
  { headY: number; bodyY: number; armY: number; footY: number; headRadius: number }
> = {
  child: { headY: 0.055, bodyY: -0.049, armY: -0.046, footY: 0.036, headRadius: 0.96 },
  teen: { headY: 0.074, bodyY: 0, armY: 0.014, footY: 0.022, headRadius: 0.94 },
  adult: { headY: 0.087, bodyY: -0.042, armY: -0.046, footY: 0.038, headRadius: 0.88 },
  middle: { headY: 0.12, bodyY: -0.043, armY: -0.065, footY: 0.037, headRadius: 0.9 },
  senior: { headY: 0.083, bodyY: -0.012, armY: -0.051, footY: 0.05, headRadius: 0.9 },
};

const STANDARD_ACTION_FRONT_Y: Record<GrowthStageId, number> = {
  child: 0.17,
  teen: 0.23,
  adult: 0.24,
  middle: 0.24,
  senior: 0.25,
};

const DLC_ACTION_FRONT_Y: Record<GrowthStageId, number> = {
  child: 0.21,
  teen: 0.18,
  adult: 0.19,
  middle: 0.21,
  senior: 0.22,
};

const STAGE_FILE: Record<GrowthStageId, string> = {
  child: "child.png",
  teen: "teen.png",
  adult: "adult.png",
  middle: "middle.png",
  senior: "senior.png",
};

const STAGE_OUTFIT_ATLAS: Record<GrowthStageId, string> = {
  child: "child.png",
  teen: "teen.png",
  adult: "adult.png",
  middle: "middle.png",
  senior: "senior.png",
};

const DLC_OUTFIT_ATLAS: Partial<Record<OutfitId, string>> = {
  "dlc-gintoki": "gintoki.webp",
  "dlc-feitan": "feitan.webp",
  "dlc-tsuna": "tsuna.webp",
  "dlc-mafuyu": "mafuyu.webp",
  "dlc-ritsuka": "ritsuka.webp",
  "dlc-haruki": "haruki.webp",
  "dlc-akihiko": "akihiko.webp",
  "dlc-chihiro": "chihiro.webp",
};

const DLC_PERSONA: Partial<Record<OutfitId, DlcPersona>> = {
  "dlc-gintoki": "gintoki",
  "dlc-feitan": "feitan",
  "dlc-tsuna": "tsuna",
  "dlc-mafuyu": "mafuyu",
  "dlc-ritsuka": "ritsuka",
  "dlc-haruki": "haruki",
  "dlc-akihiko": "akihiko",
  "dlc-chihiro": "chihiro",
};

const DLC_STAGE_ATLAS_INDEX: Record<GrowthStageId, number> = {
  child: 0,
  teen: 1,
  adult: 2,
  middle: 3,
  senior: 4,
};

const OUTFIT_ATLAS_INDEX: Partial<Record<OutfitId, number>> = {
  classic: 0,
  soft: 1,
  scarf: 2,
  berry: 3,
  raincoat: 4,
  sailor: 5,
  bee: 6,
  wizard: 7,
  royal: 8,
  pajamas: 9,
  chef: 10,
  detective: 11,
  banana: 12,
  pudding: 13,
  sushi: 14,
  ufo: 15,
};

const ACTION_PROP_ATLAS_INDEX: Record<string, number> = {
  feed: 0,
  bath: 1,
  play: 2,
  sleep: 3,
  gift: 4,
  level: 5,
  event: 6,
  baby: 7,
};

const OUTFIT_ATLAS_PLACEMENT: Record<
  GrowthStageId,
  { scale: number; y: number }
> = {
  child: { scale: 0.72, y: 0.065 },
  teen: { scale: 0.93, y: 0.025 },
  adult: { scale: 0.99, y: -0.005 },
  middle: { scale: 0.94, y: 0.025 },
  senior: { scale: 0.82, y: 0.095 },
};

const STAGE_IDLE_POSES: Record<GrowthStageId, IdlePose[]> = {
  child: [
    "breathe",
    "toddle",
    "curious",
    "selfplay",
    "groom",
    "yawn",
    "doze",
  ],
  teen: [
    "breathe",
    "energetic",
    "sway",
    "selfplay",
    "stretch",
    "listen",
    "sniff",
  ],
  adult: [
    "breathe",
    "curious",
    "sway",
    "stretch",
    "selfplay",
    "groom",
    "listen",
  ],
  middle: [
    "breathe",
    "glasses",
    "stretch",
    "sway",
    "groom",
    "yawn",
    "doze",
    "curious",
  ],
  senior: [
    "breathe",
    "cane",
    "doze",
    "nap",
    "yawn",
    "listen",
    "curious",
    "breathe",
  ],
};

const PERSONA_IDLE_POSES: Record<DlcPersona, IdlePose[]> = {
  gintoki: ["breathe", "yawn", "doze", "sniff", "groom"],
  feitan: ["breathe", "listen", "curious", "groom"],
  tsuna: ["breathe", "curious", "energetic", "listen", "stretch"],
  mafuyu: ["breathe", "sway", "listen", "doze", "curious"],
  ritsuka: ["breathe", "listen", "sway", "energetic", "groom"],
  haruki: ["breathe", "sway", "listen", "groom", "stretch"],
  akihiko: ["breathe", "sway", "stretch", "listen", "groom"],
  chihiro: ["breathe", "listen", "curious", "groom", "stretch"],
};

const STAGE_IDLE_INTERVAL: Record<GrowthStageId, number> = {
  child: 7_600,
  teen: 7_000,
  adult: 9_200,
  middle: 10_600,
  senior: 12_200,
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
  "dlc-yorozuya": "rgba(255, 183, 105, 0.048)",
  "dlc-spider-hideout": "rgba(103, 112, 145, 0.105)",
  "dlc-namimori-home": "rgba(255, 207, 133, 0.045)",
  "dlc-given-studio": "rgba(189, 104, 118, 0.072)",
  "dlc-kagurabachi-shop": "rgba(79, 141, 157, 0.085)",
  neutral: "rgba(255, 205, 126, 0.018)",
};

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

const STAGE_ACTION_PREFIX: Record<GrowthStageId, string> = {
  child: "寶寶",
  teen: "活力滿滿咁",
  adult: "精神十足咁",
  middle: "慢慢咁",
  senior: "悠閒咁",
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function petAssetPath(file: string) {
  return `./purin-stages/${file}`;
}

function outfitAssetPath(file: string) {
  return `./purin-outfits/${file}`;
}

function dlcOutfitAssetPath(file: string) {
  return `./purin-dlc/outfits/${file}`;
}

function actionAssetPath(file: string) {
  return `./purin-action/${file}`;
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

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(
    0,
    Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2),
  );
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - r,
    y + height,
  );
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function fillEllipse(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  fill: string | CanvasGradient,
  stroke?: string,
  lineWidth = 1,
) {
  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
}

function drawStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  points = 5,
) {
  context.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const localRadius = index % 2 === 0 ? radius : radius * 0.43;
    const px = x + Math.cos(angle) * localRadius;
    const py = y + Math.sin(angle) * localRadius;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fillStyle = fill;
  context.fill();
}

function torsoPath(
  context: CanvasRenderingContext2D,
  fit: StageFit,
  drawSize: number,
  widthFactor = 1,
  lengthFactor = 1,
) {
  const top = fit.neckY * drawSize;
  const bottom =
    (fit.neckY + (fit.hemY - fit.neckY) * lengthFactor) * drawSize;
  const shoulder = fit.shoulderW * widthFactor * drawSize;
  const belly = fit.bellyW * widthFactor * drawSize;
  context.beginPath();
  context.moveTo(-shoulder, top);
  context.bezierCurveTo(
    -belly,
    top + (bottom - top) * 0.25,
    -belly,
    bottom - (bottom - top) * 0.15,
    -belly * 0.73,
    bottom,
  );
  context.quadraticCurveTo(0, bottom + drawSize * 0.018, belly * 0.73, bottom);
  context.bezierCurveTo(
    belly,
    bottom - (bottom - top) * 0.15,
    belly,
    top + (bottom - top) * 0.25,
    shoulder,
    top,
  );
  context.quadraticCurveTo(0, top + drawSize * 0.045, -shoulder, top);
  context.closePath();
}

function drawBeret(
  context: CanvasRenderingContext2D,
  fit: StageFit,
  drawSize: number,
  stage: GrowthStageId,
) {
  const rotations: Record<GrowthStageId, number> = {
    child: -0.02,
    teen: -0.075,
    adult: 0,
    middle: 0.025,
    senior: -0.045,
  };
  const widthFactor: Record<GrowthStageId, number> = {
    child: 0.45,
    teen: 0.43,
    adult: 0.47,
    middle: 0.45,
    senior: 0.41,
  };
  const y = fit.hatY * drawSize;
  const width = fit.headW * widthFactor[stage] * drawSize;
  const height = drawSize * (stage === "child" ? 0.055 : 0.061);
  context.save();
  context.translate(0, y);
  context.rotate(rotations[stage]);
  const gradient = context.createLinearGradient(0, -height, 0, height);
  gradient.addColorStop(0, "#8b3f24");
  gradient.addColorStop(1, "#542315");
  fillEllipse(
    context,
    0,
    0,
    width / 2,
    height,
    gradient,
    "rgba(73, 27, 13, 0.48)",
    Math.max(1, drawSize * 0.005),
  );
  fillEllipse(
    context,
    drawSize * (stage === "teen" ? 0.02 : 0),
    -height * 0.95,
    drawSize * 0.015,
    drawSize * 0.021,
    "#6d2d18",
  );
  context.restore();
}

function drawBow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  context.save();
  context.translate(x, y);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, 0);
  context.bezierCurveTo(-size, -size * 0.8, -size * 1.4, size, 0, size * 0.42);
  context.bezierCurveTo(size * 1.4, size, size, -size * 0.8, 0, 0);
  context.fill();
  fillEllipse(context, 0, size * 0.18, size * 0.28, size * 0.28, "#8d4057");
  context.restore();
}

function drawAgeTailoring(
  context: CanvasRenderingContext2D,
  stage: GrowthStageId,
  fit: StageFit,
  drawSize: number,
  accent: string,
) {
  const centerY = (fit.bodyY + 0.035) * drawSize;
  context.save();
  context.strokeStyle = accent;
  context.fillStyle = accent;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(1, drawSize * 0.008);

  if (stage === "child") {
    fillEllipse(
      context,
      0,
      centerY,
      drawSize * 0.038,
      drawSize * 0.038,
      accent,
    );
  } else if (stage === "teen") {
    context.beginPath();
    context.moveTo(-drawSize * 0.055, centerY + drawSize * 0.028);
    context.lineTo(drawSize * 0.01, centerY - drawSize * 0.03);
    context.lineTo(drawSize * 0.055, centerY + drawSize * 0.012);
    context.stroke();
  } else if (stage === "adult") {
    drawStar(context, 0, centerY, drawSize * 0.035, accent);
  } else if (stage === "middle") {
    roundedRect(
      context,
      -drawSize * 0.095,
      centerY,
      drawSize * 0.07,
      drawSize * 0.05,
      drawSize * 0.012,
    );
    context.fill();
    roundedRect(
      context,
      drawSize * 0.025,
      centerY,
      drawSize * 0.07,
      drawSize * 0.05,
      drawSize * 0.012,
    );
    context.fill();
  } else {
    context.beginPath();
    context.arc(0, fit.neckY * drawSize, drawSize * 0.12, 0.12, Math.PI - 0.12);
    context.stroke();
  }
  context.restore();
}

function drawOutfitBack(
  context: CanvasRenderingContext2D,
  outfit: OutfitId,
  stage: GrowthStageId,
  fit: StageFit,
  drawSize: number,
) {
  const bodyY = fit.bodyY * drawSize;
  const bodyWidth = fit.bodyW * drawSize;
  context.save();

  if (outfit === "bee") {
    const wingY = (fit.bodyY - 0.025) * drawSize;
    const wingW = bodyWidth * (stage === "teen" ? 0.4 : 0.35);
    const wingH = fit.bodyH * drawSize * 0.34;
    for (const direction of [-1, 1]) {
      context.save();
      context.translate(direction * bodyWidth * 0.47, wingY);
      context.rotate(direction * -0.32);
      const wingGradient = context.createRadialGradient(0, 0, 0, 0, 0, wingH);
      wingGradient.addColorStop(0, "rgba(240, 252, 255, 0.76)");
      wingGradient.addColorStop(1, "rgba(143, 212, 222, 0.4)");
      fillEllipse(
        context,
        0,
        0,
        wingW,
        wingH,
        wingGradient,
        "rgba(255, 255, 255, 0.7)",
        Math.max(1, drawSize * 0.006),
      );
      context.restore();
    }
  }

  if (outfit === "wizard" || outfit === "royal") {
    const capeColor = outfit === "wizard" ? "#4f367f" : "#a94547";
    context.beginPath();
    context.moveTo(-bodyWidth * 0.35, fit.neckY * drawSize);
    context.quadraticCurveTo(
      -bodyWidth * 0.72,
      bodyY + fit.bodyH * drawSize * 0.28,
      -bodyWidth * 0.53,
      bodyY + fit.bodyH * drawSize * 0.52,
    );
    context.quadraticCurveTo(
      0,
      bodyY + fit.bodyH * drawSize * 0.66,
      bodyWidth * 0.53,
      bodyY + fit.bodyH * drawSize * 0.52,
    );
    context.quadraticCurveTo(
      bodyWidth * 0.72,
      bodyY + fit.bodyH * drawSize * 0.28,
      bodyWidth * 0.35,
      fit.neckY * drawSize,
    );
    context.closePath();
    context.fillStyle = capeColor;
    context.fill();
  }

  if (outfit === "banana") {
    const bananaWidth = fit.headW * drawSize * 0.52;
    const top = (fit.hatY - 0.04) * drawSize;
    const bottom = (fit.groundY + 0.025) * drawSize;
    context.lineCap = "round";
    context.lineWidth = Math.max(drawSize * 0.065, 8);
    const gradient = context.createLinearGradient(0, top, 0, bottom);
    gradient.addColorStop(0, "#fff16a");
    gradient.addColorStop(1, "#e7b71f");
    context.strokeStyle = gradient;
    for (const direction of [-1, 1]) {
      context.beginPath();
      context.moveTo(direction * bananaWidth * 0.62, top);
      context.quadraticCurveTo(
        direction * bananaWidth,
        bodyY,
        direction * bananaWidth * 0.68,
        bottom,
      );
      context.stroke();
    }
  }

  if (outfit === "ufo") {
    const saucerY = (fit.bodyY + fit.bodyH * 0.08) * drawSize;
    const saucerWidth = bodyWidth * 0.75;
    fillEllipse(
      context,
      0,
      saucerY,
      saucerWidth,
      drawSize * 0.09,
      "#6d7d8e",
      "#dce8ef",
      Math.max(1, drawSize * 0.009),
    );
  }
  context.restore();
}

function drawOutfitFront(
  context: CanvasRenderingContext2D,
  outfit: OutfitId,
  stage: GrowthStageId,
  fit: StageFit,
  drawSize: number,
) {
  const bodyWidth = fit.bodyW * drawSize;
  const bodyY = fit.bodyY * drawSize;
  const neckY = fit.neckY * drawSize;
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  if (outfit === "classic") {
    drawBeret(context, fit, drawSize, stage);
    context.restore();
    return;
  }
  if (outfit === "soft") {
    context.restore();
    return;
  }

  if (outfit === "scarf") {
    const scarfGradient = context.createLinearGradient(
      0,
      neckY - drawSize * 0.04,
      0,
      neckY + drawSize * 0.08,
    );
    scarfGradient.addColorStop(0, "#c8793d");
    scarfGradient.addColorStop(1, "#9d4e2f");
    fillEllipse(
      context,
      0,
      neckY,
      bodyWidth * 0.42,
      drawSize * (stage === "child" ? 0.052 : 0.045),
      scarfGradient,
      "rgba(117, 54, 33, 0.48)",
      Math.max(1, drawSize * 0.006),
    );
    context.fillStyle = "#ac5934";
    roundedRect(
      context,
      bodyWidth * 0.12,
      neckY + drawSize * 0.025,
      drawSize * (stage === "senior" ? 0.055 : 0.075),
      drawSize * (stage === "teen" ? 0.16 : 0.12),
      drawSize * 0.016,
    );
    context.fill();
    context.restore();
    return;
  }

  if (outfit === "berry") {
    const berryGradient = context.createLinearGradient(0, neckY, 0, bodyY + drawSize * 0.25);
    berryGradient.addColorStop(0, "#f59bb1");
    berryGradient.addColorStop(1, stage === "senior" ? "#bc6683" : "#db668b");
    torsoPath(context, fit, drawSize, stage === "child" ? 0.9 : 1, stage === "teen" ? 0.88 : 1);
    context.fillStyle = berryGradient;
    context.fill();
    context.strokeStyle = "rgba(128, 54, 82, 0.36)";
    context.lineWidth = Math.max(1, drawSize * 0.006);
    context.stroke();
    drawBow(
      context,
      stage === "teen" ? -drawSize * 0.055 : 0,
      neckY + drawSize * 0.02,
      drawSize * (stage === "child" ? 0.055 : 0.042),
      "#f7b1c1",
    );
    drawAgeTailoring(context, stage, fit, drawSize, "#fff0d8");
  }

  if (outfit === "raincoat") {
    const rainGradient = context.createLinearGradient(0, neckY, 0, bodyY + drawSize * 0.3);
    rainGradient.addColorStop(0, "#ffe56f");
    rainGradient.addColorStop(1, "#e7ad29");
    torsoPath(
      context,
      fit,
      drawSize,
      stage === "child" ? 1.02 : 1.08,
      stage === "teen" ? 0.9 : stage === "senior" ? 0.94 : 1.05,
    );
    context.fillStyle = rainGradient;
    context.fill();
    context.strokeStyle = "#c58b20";
    context.lineWidth = Math.max(1, drawSize * 0.007);
    context.stroke();
    context.beginPath();
    context.arc(
      0,
      fit.headY * drawSize,
      fit.headW * drawSize * 0.42,
      Math.PI * 0.86,
      Math.PI * 0.14,
    );
    context.strokeStyle = "rgba(239, 184, 38, 0.78)";
    context.lineWidth = drawSize * 0.025;
    context.stroke();
    for (const yOffset of [0.06, 0.13]) {
      fillEllipse(
        context,
        0,
        (fit.bodyY + yOffset) * drawSize,
        drawSize * 0.012,
        drawSize * 0.012,
        "#a66a2c",
      );
    }
    drawAgeTailoring(context, stage, fit, drawSize, "#fff7c4");
  }

  if (outfit === "sailor") {
    torsoPath(context, fit, drawSize, 1, stage === "teen" ? 0.85 : 0.94);
    context.fillStyle = "#f7f1df";
    context.fill();
    context.strokeStyle = "#345b82";
    context.lineWidth = Math.max(1, drawSize * 0.008);
    context.stroke();
    context.beginPath();
    context.moveTo(-bodyWidth * 0.34, neckY);
    context.lineTo(0, neckY + drawSize * 0.105);
    context.lineTo(bodyWidth * 0.34, neckY);
    context.strokeStyle = "#315f8e";
    context.lineWidth = drawSize * 0.026;
    context.stroke();
    drawBow(context, 0, neckY + drawSize * 0.08, drawSize * 0.031, "#d95e58");
    drawAgeTailoring(context, stage, fit, drawSize, "#d5ad4a");
  }

  if (outfit === "bee") {
    torsoPath(context, fit, drawSize, 0.96, stage === "teen" ? 0.9 : 1);
    const beeGradient = context.createLinearGradient(0, neckY, 0, bodyY + drawSize * 0.28);
    beeGradient.addColorStop(0, "#ffd84d");
    beeGradient.addColorStop(1, "#eeb62e");
    context.fillStyle = beeGradient;
    context.fill();
    context.save();
    torsoPath(context, fit, drawSize, 0.96, stage === "teen" ? 0.9 : 1);
    context.clip();
    context.fillStyle = "#5a4027";
    for (const offset of [0.065, 0.155, 0.245]) {
      context.fillRect(
        -bodyWidth * 0.58,
        (fit.bodyY - 0.12 + offset) * drawSize,
        bodyWidth * 1.16,
        drawSize * 0.035,
      );
    }
    context.restore();
    context.strokeStyle = "#5a4027";
    context.lineWidth = Math.max(1, drawSize * 0.008);
    context.beginPath();
    context.arc(0, fit.hatY * drawSize, fit.headW * drawSize * 0.22, Math.PI, 0);
    context.stroke();
    for (const direction of [-1, 1]) {
      context.beginPath();
      context.moveTo(direction * drawSize * 0.055, (fit.hatY - 0.01) * drawSize);
      context.lineTo(direction * drawSize * 0.075, (fit.hatY - 0.075) * drawSize);
      context.stroke();
      fillEllipse(
        context,
        direction * drawSize * 0.078,
        (fit.hatY - 0.08) * drawSize,
        drawSize * 0.014,
        drawSize * 0.014,
        "#5a4027",
      );
    }
    drawAgeTailoring(context, stage, fit, drawSize, "#fff2ac");
  }

  if (outfit === "wizard") {
    torsoPath(context, fit, drawSize, 0.95, 0.92);
    context.fillStyle = "#7254a5";
    context.fill();
    drawAgeTailoring(context, stage, fit, drawSize, "#ffd875");
    context.save();
    context.translate(0, (fit.hatY - 0.035) * drawSize);
    context.rotate(stage === "teen" ? -0.08 : stage === "senior" ? 0.04 : -0.025);
    context.fillStyle = "#513778";
    context.beginPath();
    context.moveTo(-drawSize * 0.16, drawSize * 0.035);
    context.lineTo(drawSize * 0.03, -drawSize * 0.235);
    context.lineTo(drawSize * 0.15, drawSize * 0.035);
    context.closePath();
    context.fill();
    fillEllipse(context, 0, drawSize * 0.035, drawSize * 0.19, drawSize * 0.04, "#604487");
    drawStar(context, drawSize * 0.02, -drawSize * 0.09, drawSize * 0.032, "#ffd86b");
    context.restore();
  }

  if (outfit === "royal") {
    torsoPath(context, fit, drawSize, 0.98, 0.98);
    const royalGradient = context.createLinearGradient(0, neckY, 0, bodyY + drawSize * 0.3);
    royalGradient.addColorStop(0, "#42659b");
    royalGradient.addColorStop(1, "#203b6a");
    context.fillStyle = royalGradient;
    context.fill();
    context.strokeStyle = "#f2c45a";
    context.lineWidth = drawSize * 0.012;
    context.beginPath();
    context.moveTo(0, neckY + drawSize * 0.02);
    context.lineTo(0, (fit.bodyY + 0.18) * drawSize);
    context.stroke();
    drawAgeTailoring(context, stage, fit, drawSize, "#f6d477");
    const crownY = (fit.hatY - 0.045) * drawSize;
    const crownW = fit.headW * drawSize * (stage === "child" ? 0.26 : 0.3);
    context.beginPath();
    context.moveTo(-crownW / 2, crownY + drawSize * 0.07);
    context.lineTo(-crownW * 0.43, crownY);
    context.lineTo(-crownW * 0.16, crownY + drawSize * 0.045);
    context.lineTo(0, crownY - drawSize * 0.03);
    context.lineTo(crownW * 0.16, crownY + drawSize * 0.045);
    context.lineTo(crownW * 0.43, crownY);
    context.lineTo(crownW / 2, crownY + drawSize * 0.07);
    context.closePath();
    context.fillStyle = "#f2c14d";
    context.fill();
    context.strokeStyle = "#a86c21";
    context.lineWidth = Math.max(1, drawSize * 0.006);
    context.stroke();
  }

  if (outfit === "pajamas") {
    torsoPath(context, fit, drawSize, 1, 1);
    context.fillStyle = stage === "senior" ? "#7b8caf" : "#657cb8";
    context.fill();
    context.strokeStyle = "#e9e1ca";
    context.lineWidth = drawSize * 0.01;
    context.beginPath();
    context.moveTo(0, neckY + drawSize * 0.025);
    context.lineTo(0, (fit.bodyY + 0.18) * drawSize);
    context.stroke();
    drawAgeTailoring(context, stage, fit, drawSize, "#f5e7a1");
    context.save();
    context.translate(-drawSize * 0.015, (fit.hatY - 0.025) * drawSize);
    context.rotate(stage === "child" ? -0.12 : 0.05);
    context.fillStyle = "#556ca9";
    context.beginPath();
    context.moveTo(-drawSize * 0.145, drawSize * 0.035);
    context.quadraticCurveTo(
      0,
      -drawSize * 0.17,
      drawSize * 0.15,
      drawSize * 0.035,
    );
    context.quadraticCurveTo(0, drawSize * 0.08, -drawSize * 0.145, drawSize * 0.035);
    context.fill();
    fillEllipse(
      context,
      drawSize * 0.145,
      drawSize * 0.03,
      drawSize * 0.025,
      drawSize * 0.025,
      "#f7e6a8",
    );
    context.restore();
  }

  if (outfit === "chef") {
    torsoPath(context, fit, drawSize, 0.96, 0.96);
    context.fillStyle = "#f8f4e7";
    context.fill();
    context.strokeStyle = "#c98753";
    context.lineWidth = drawSize * 0.008;
    context.stroke();
    drawAgeTailoring(context, stage, fit, drawSize, "#d99158");
    const chefY = (fit.hatY - 0.055) * drawSize;
    fillEllipse(context, 0, chefY, drawSize * 0.15, drawSize * 0.055, "#fffdf2");
    for (const x of [-0.075, 0, 0.075]) {
      fillEllipse(
        context,
        x * drawSize,
        chefY - drawSize * 0.05,
        drawSize * 0.065,
        drawSize * 0.075,
        "#fffdf2",
        "rgba(140, 101, 76, 0.16)",
        Math.max(1, drawSize * 0.004),
      );
    }
  }

  if (outfit === "detective") {
    torsoPath(context, fit, drawSize, 1, stage === "teen" ? 0.9 : 1);
    context.fillStyle = stage === "senior" ? "#9a8069" : "#b58b63";
    context.fill();
    context.strokeStyle = "#6f513b";
    context.lineWidth = drawSize * 0.009;
    context.beginPath();
    context.moveTo(-bodyWidth * 0.32, neckY + drawSize * 0.015);
    context.lineTo(0, neckY + drawSize * 0.115);
    context.lineTo(bodyWidth * 0.32, neckY + drawSize * 0.015);
    context.stroke();
    drawAgeTailoring(context, stage, fit, drawSize, "#e2be81");
    context.save();
    context.translate(0, fit.hatY * drawSize);
    context.rotate(stage === "teen" ? -0.075 : 0.02);
    fillEllipse(context, 0, 0, drawSize * 0.17, drawSize * 0.052, "#8a6244");
    fillEllipse(context, -drawSize * 0.052, -drawSize * 0.035, drawSize * 0.105, drawSize * 0.07, "#a77a55");
    fillEllipse(context, drawSize * 0.052, -drawSize * 0.035, drawSize * 0.105, drawSize * 0.07, "#a77a55");
    context.restore();
  }

  if (outfit === "banana") {
    context.fillStyle = "#ffdf39";
    for (const direction of [-1, 1]) {
      context.beginPath();
      context.moveTo(direction * fit.headW * drawSize * 0.24, (fit.hatY - 0.03) * drawSize);
      context.quadraticCurveTo(
        direction * fit.headW * drawSize * 0.48,
        fit.headY * drawSize,
        direction * bodyWidth * 0.58,
        (fit.bodyY + fit.bodyH * 0.35) * drawSize,
      );
      context.quadraticCurveTo(
        direction * bodyWidth * 0.35,
        (fit.bodyY + fit.bodyH * 0.18) * drawSize,
        direction * fit.headW * drawSize * 0.2,
        (fit.hatY + 0.04) * drawSize,
      );
      context.fill();
    }
    roundedRect(
      context,
      -drawSize * 0.018,
      (fit.hatY - 0.09) * drawSize,
      drawSize * 0.036,
      drawSize * 0.075,
      drawSize * 0.012,
    );
    context.fillStyle = "#6b4a22";
    context.fill();
    drawAgeTailoring(context, stage, fit, drawSize, "#fff4a3");
  }

  if (outfit === "pudding") {
    torsoPath(context, fit, drawSize, 1.08, 1);
    const puddingGradient = context.createLinearGradient(0, neckY, 0, bodyY + drawSize * 0.28);
    puddingGradient.addColorStop(0, "#fff0a1");
    puddingGradient.addColorStop(1, "#e9bd4b");
    context.fillStyle = puddingGradient;
    context.fill();
    context.strokeStyle = "#b96d34";
    context.lineWidth = drawSize * 0.009;
    context.stroke();
    fillEllipse(
      context,
      0,
      neckY + drawSize * 0.015,
      bodyWidth * 0.42,
      drawSize * 0.055,
      "#8e4226",
    );
    context.fillStyle = "#a84b27";
    for (const x of [-0.08, 0.005, 0.075]) {
      roundedRect(
        context,
        x * drawSize,
        neckY + drawSize * 0.025,
        drawSize * 0.034,
        drawSize * (0.04 + Math.abs(x) * 0.22),
        drawSize * 0.012,
      );
      context.fill();
    }
    drawAgeTailoring(context, stage, fit, drawSize, "#fff7cf");
  }

  if (outfit === "sushi") {
    torsoPath(context, fit, drawSize, 1.03, 0.94);
    context.fillStyle = "#f7f1df";
    context.fill();
    roundedRect(
      context,
      -bodyWidth * 0.54,
      (fit.bodyY - 0.03) * drawSize,
      bodyWidth * 1.08,
      drawSize * 0.14,
      drawSize * 0.035,
    );
    context.fillStyle = "#273d36";
    context.fill();
    context.save();
    context.translate(0, (fit.hatY + 0.01) * drawSize);
    context.rotate(-0.06);
    roundedRect(
      context,
      -drawSize * 0.16,
      -drawSize * 0.035,
      drawSize * 0.32,
      drawSize * 0.095,
      drawSize * 0.04,
    );
    const shrimpGradient = context.createLinearGradient(
      -drawSize * 0.16,
      0,
      drawSize * 0.16,
      0,
    );
    shrimpGradient.addColorStop(0, "#f19c7f");
    shrimpGradient.addColorStop(0.5, "#fff0dc");
    shrimpGradient.addColorStop(1, "#df796d");
    context.fillStyle = shrimpGradient;
    context.fill();
    context.restore();
    drawAgeTailoring(context, stage, fit, drawSize, "#f4bd7a");
  }

  if (outfit === "ufo") {
    const saucerY = (fit.bodyY + fit.bodyH * 0.08) * drawSize;
    const saucerWidth = bodyWidth * 0.77;
    fillEllipse(
      context,
      0,
      saucerY - drawSize * 0.005,
      saucerWidth,
      drawSize * 0.065,
      "#b6c5cc",
      "#eef7fa",
      drawSize * 0.009,
    );
    fillEllipse(
      context,
      0,
      saucerY + drawSize * 0.02,
      saucerWidth * 0.72,
      drawSize * 0.045,
      "#536779",
    );
    for (const x of [-0.12, 0, 0.12]) {
      fillEllipse(
        context,
        x * drawSize,
        saucerY + drawSize * 0.02,
        drawSize * 0.014,
        drawSize * 0.014,
        x === 0 ? "#ffd75d" : "#f4869c",
      );
    }
    context.beginPath();
    context.arc(
      0,
      fit.headY * drawSize,
      fit.headW * drawSize * 0.39,
      Math.PI,
      0,
    );
    context.strokeStyle = "rgba(220, 244, 250, 0.66)";
    context.lineWidth = drawSize * 0.018;
    context.stroke();
    drawAgeTailoring(context, stage, fit, drawSize, "#d4eff5");
  }

  context.restore();
}

const BODY_OUTFITS = new Set<OutfitId>([
  "berry",
  "raincoat",
  "sailor",
  "bee",
  "wizard",
  "royal",
  "pajamas",
  "chef",
  "detective",
  "pudding",
  "sushi",
]);

function drawGarmentFinish(
  context: CanvasRenderingContext2D,
  outfit: OutfitId,
  stage: GrowthStageId,
  fit: StageFit,
  drawSize: number,
) {
  if (!BODY_OUTFITS.has(outfit)) return;

  const neckY = fit.neckY * drawSize;
  const hemY = fit.hemY * drawSize;
  const bodyWidth = fit.bellyW * 2 * drawSize;
  const roomy =
    stage === "child" ? 0.9 : stage === "teen" ? 0.94 : stage === "senior" ? 1.04 : 1;

  context.save();
  torsoPath(context, fit, drawSize, roomy, stage === "teen" ? 0.9 : 1);
  context.clip();

  const sheen = context.createLinearGradient(
    -bodyWidth * 0.5,
    neckY,
    bodyWidth * 0.5,
    hemY,
  );
  sheen.addColorStop(0, "rgba(255,255,255,0.32)");
  sheen.addColorStop(0.34, "rgba(255,255,255,0.08)");
  sheen.addColorStop(0.72, "rgba(87,45,32,0.035)");
  sheen.addColorStop(1, "rgba(74,38,28,0.12)");
  context.fillStyle = sheen;
  context.fillRect(-bodyWidth, neckY, bodyWidth * 2, hemY - neckY + drawSize * 0.08);

  context.strokeStyle = "rgba(255,255,255,0.42)";
  context.lineWidth = Math.max(1, drawSize * 0.004);
  context.beginPath();
  context.moveTo(-bodyWidth * 0.27, neckY + drawSize * 0.055);
  context.quadraticCurveTo(
    -bodyWidth * 0.4,
    (neckY + hemY) * 0.5,
    -bodyWidth * 0.29,
    hemY - drawSize * 0.025,
  );
  context.stroke();

  if (outfit === "berry") {
    for (const [x, y] of [
      [-0.11, 0.1],
      [0.12, 0.13],
      [-0.03, 0.22],
      [0.14, 0.27],
    ]) {
      fillEllipse(
        context,
        x * drawSize,
        (fit.bodyY - 0.04 + y) * drawSize,
        drawSize * 0.012,
        drawSize * 0.012,
        "rgba(255,231,237,0.72)",
      );
    }
  }

  if (outfit === "pajamas") {
    context.strokeStyle = "rgba(255,239,169,0.72)";
    context.lineWidth = Math.max(1, drawSize * 0.006);
    for (const [x, y] of [
      [-0.11, 0.1],
      [0.1, 0.18],
      [-0.03, 0.28],
    ]) {
      context.beginPath();
      context.arc(
        x * drawSize,
        (fit.bodyY - 0.05 + y) * drawSize,
        drawSize * 0.018,
        -Math.PI * 0.45,
        Math.PI * 0.55,
      );
      context.stroke();
    }
  }

  if (outfit === "chef" || outfit === "detective") {
    context.fillStyle =
      outfit === "chef"
        ? "rgba(174,113,69,0.58)"
        : "rgba(87,57,42,0.5)";
    for (const y of [0.08, 0.15, 0.22]) {
      fillEllipse(
        context,
        0,
        (fit.bodyY - 0.04 + y) * drawSize,
        drawSize * 0.008,
        drawSize * 0.008,
        context.fillStyle as string,
      );
    }
  }

  context.restore();

  context.save();
  context.strokeStyle = "rgba(77,45,32,0.2)";
  context.lineWidth = Math.max(1, drawSize * 0.006);
  context.beginPath();
  context.moveTo(-bodyWidth * 0.32, hemY);
  context.quadraticCurveTo(0, hemY + drawSize * 0.016, bodyWidth * 0.32, hemY);
  context.stroke();
  context.restore();
}

function drawStageOcclusion(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  stage: GrowthStageId,
  fit: StageFit,
  drawSize: number,
) {
  const headHeight = Math.max(0.16, (fit.neckY - fit.headY) * 0.9);
  const armY = fit.armY * drawSize;
  const armX = fit.armX * drawSize;
  const footY = fit.footY * drawSize;
  const footX = fit.footX * drawSize;

  context.save();
  context.beginPath();
  context.ellipse(
    0,
    fit.headY * drawSize,
    fit.headW * drawSize * 0.53,
    headHeight * drawSize,
    0,
    0,
    Math.PI * 2,
  );
  for (const direction of [-1, 1]) {
    context.ellipse(
      direction * armX,
      armY,
      drawSize * (stage === "child" ? 0.058 : stage === "teen" ? 0.072 : 0.064),
      drawSize * (stage === "teen" ? 0.095 : stage === "child" ? 0.075 : 0.1),
      direction * -0.08,
      0,
      Math.PI * 2,
    );
    context.ellipse(
      direction * footX,
      footY,
      drawSize * (stage === "teen" ? 0.078 : 0.072),
      drawSize * (stage === "child" ? 0.047 : 0.052),
      0,
      0,
      Math.PI * 2,
    );
  }
  if (stage === "senior") {
    context.rect(
      -fit.bodyW * drawSize * 0.78,
      (fit.neckY - 0.03) * drawSize,
      drawSize * 0.15,
      (fit.groundY - fit.neckY + 0.08) * drawSize,
    );
  }
  context.clip();
  drawStageSprite(context, image, drawSize);
  context.restore();
}

function drawOutfitAccessoryFront(
  context: CanvasRenderingContext2D,
  outfit: OutfitId,
  stage: GrowthStageId,
  fit: StageFit,
  drawSize: number,
) {
  const neckY = fit.neckY * drawSize;
  const bodyWidth = fit.bodyW * drawSize;
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  if (outfit === "classic") {
    drawBeret(context, fit, drawSize, stage);
  } else if (outfit === "scarf") {
    const scarf = context.createLinearGradient(0, neckY - drawSize * 0.04, 0, neckY + drawSize * 0.12);
    scarf.addColorStop(0, "#d2874b");
    scarf.addColorStop(1, "#93452a");
    fillEllipse(
      context,
      0,
      neckY,
      bodyWidth * 0.43,
      drawSize * (stage === "child" ? 0.052 : 0.045),
      scarf,
      "rgba(105,48,29,0.4)",
      Math.max(1, drawSize * 0.005),
    );
  } else if (outfit === "berry") {
    drawBow(
      context,
      stage === "teen" ? -drawSize * 0.055 : 0,
      neckY + drawSize * 0.02,
      drawSize * (stage === "child" ? 0.055 : 0.042),
      "#f7b1c1",
    );
  } else if (outfit === "raincoat") {
    context.beginPath();
    context.arc(
      0,
      fit.headY * drawSize,
      fit.headW * drawSize * 0.43,
      Math.PI * 0.86,
      Math.PI * 0.14,
    );
    context.strokeStyle = "rgba(239,184,38,0.9)";
    context.lineWidth = drawSize * 0.026;
    context.stroke();
  } else if (outfit === "sailor") {
    drawBow(context, 0, neckY + drawSize * 0.08, drawSize * 0.031, "#d95e58");
  } else if (outfit === "bee") {
    context.strokeStyle = "#5a4027";
    context.lineWidth = Math.max(1, drawSize * 0.008);
    for (const direction of [-1, 1]) {
      context.beginPath();
      context.moveTo(direction * drawSize * 0.055, (fit.hatY - 0.01) * drawSize);
      context.lineTo(direction * drawSize * 0.075, (fit.hatY - 0.075) * drawSize);
      context.stroke();
      fillEllipse(
        context,
        direction * drawSize * 0.078,
        (fit.hatY - 0.08) * drawSize,
        drawSize * 0.014,
        drawSize * 0.014,
        "#5a4027",
      );
    }
  } else if (outfit === "wizard") {
    context.translate(0, (fit.hatY - 0.035) * drawSize);
    context.rotate(stage === "teen" ? -0.08 : stage === "senior" ? 0.04 : -0.025);
    context.fillStyle = "#513778";
    context.beginPath();
    context.moveTo(-drawSize * 0.16, drawSize * 0.035);
    context.lineTo(drawSize * 0.03, -drawSize * 0.235);
    context.lineTo(drawSize * 0.15, drawSize * 0.035);
    context.closePath();
    context.fill();
    fillEllipse(context, 0, drawSize * 0.035, drawSize * 0.19, drawSize * 0.04, "#604487");
    drawStar(context, drawSize * 0.02, -drawSize * 0.09, drawSize * 0.032, "#ffd86b");
  } else if (outfit === "royal") {
    const crownY = (fit.hatY - 0.045) * drawSize;
    const crownW = fit.headW * drawSize * (stage === "child" ? 0.26 : 0.3);
    context.beginPath();
    context.moveTo(-crownW / 2, crownY + drawSize * 0.07);
    context.lineTo(-crownW * 0.43, crownY);
    context.lineTo(-crownW * 0.16, crownY + drawSize * 0.045);
    context.lineTo(0, crownY - drawSize * 0.03);
    context.lineTo(crownW * 0.16, crownY + drawSize * 0.045);
    context.lineTo(crownW * 0.43, crownY);
    context.lineTo(crownW / 2, crownY + drawSize * 0.07);
    context.closePath();
    context.fillStyle = "#f2c14d";
    context.fill();
    context.strokeStyle = "#a86c21";
    context.lineWidth = Math.max(1, drawSize * 0.006);
    context.stroke();
  } else if (outfit === "pajamas") {
    context.translate(-drawSize * 0.015, (fit.hatY - 0.025) * drawSize);
    context.rotate(stage === "child" ? -0.12 : 0.05);
    context.fillStyle = "#556ca9";
    context.beginPath();
    context.moveTo(-drawSize * 0.145, drawSize * 0.035);
    context.quadraticCurveTo(0, -drawSize * 0.17, drawSize * 0.15, drawSize * 0.035);
    context.quadraticCurveTo(0, drawSize * 0.08, -drawSize * 0.145, drawSize * 0.035);
    context.fill();
    fillEllipse(context, drawSize * 0.145, drawSize * 0.03, drawSize * 0.025, drawSize * 0.025, "#f7e6a8");
  } else if (outfit === "chef") {
    const chefY = (fit.hatY - 0.055) * drawSize;
    fillEllipse(context, 0, chefY, drawSize * 0.15, drawSize * 0.055, "#fffdf2");
    for (const x of [-0.075, 0, 0.075]) {
      fillEllipse(
        context,
        x * drawSize,
        chefY - drawSize * 0.05,
        drawSize * 0.065,
        drawSize * 0.075,
        "#fffdf2",
        "rgba(140,101,76,0.16)",
        Math.max(1, drawSize * 0.004),
      );
    }
  } else if (outfit === "detective") {
    context.translate(0, fit.hatY * drawSize);
    context.rotate(stage === "teen" ? -0.075 : 0.02);
    fillEllipse(context, 0, 0, drawSize * 0.17, drawSize * 0.052, "#8a6244");
    fillEllipse(context, -drawSize * 0.052, -drawSize * 0.035, drawSize * 0.105, drawSize * 0.07, "#a77a55");
    fillEllipse(context, drawSize * 0.052, -drawSize * 0.035, drawSize * 0.105, drawSize * 0.07, "#a77a55");
  } else if (outfit === "banana") {
    roundedRect(
      context,
      -drawSize * 0.018,
      (fit.hatY - 0.09) * drawSize,
      drawSize * 0.036,
      drawSize * 0.075,
      drawSize * 0.012,
    );
    context.fillStyle = "#6b4a22";
    context.fill();
  } else if (outfit === "sushi") {
    context.translate(0, (fit.hatY + 0.01) * drawSize);
    context.rotate(-0.06);
    roundedRect(
      context,
      -drawSize * 0.16,
      -drawSize * 0.035,
      drawSize * 0.32,
      drawSize * 0.095,
      drawSize * 0.04,
    );
    const shrimp = context.createLinearGradient(-drawSize * 0.16, 0, drawSize * 0.16, 0);
    shrimp.addColorStop(0, "#f19c7f");
    shrimp.addColorStop(0.5, "#fff0dc");
    shrimp.addColorStop(1, "#df796d");
    context.fillStyle = shrimp;
    context.fill();
  } else if (outfit === "ufo") {
    context.beginPath();
    context.arc(
      0,
      fit.headY * drawSize,
      fit.headW * drawSize * 0.39,
      Math.PI,
      0,
    );
    context.strokeStyle = "rgba(220,244,250,0.78)";
    context.lineWidth = drawSize * 0.018;
    context.stroke();
  }

  context.restore();
}

function drawMovementEffects(
  context: CanvasRenderingContext2D,
  fit: StageFit,
  drawSize: number,
  time: number,
  stage: GrowthStageId,
  direction: -1 | 1,
) {
  const placement = STAGE_PLACEMENT[stage];
  const stride = Math.sin(time * 0.0052 * placement.walkSpeed);
  const footGap = fit.bodyW * drawSize * 0.18;
  const groundY = fit.groundY * drawSize;
  for (const side of [-1, 1]) {
    const contact = 0.58 + side * stride * 0.24;
    fillEllipse(
      context,
      side * footGap - direction * stride * drawSize * 0.009,
      groundY,
      drawSize * 0.04 * contact,
      drawSize * 0.011,
      `rgba(99, 66, 42, ${0.08 + contact * 0.11})`,
    );
  }
  const puffOpacity = Math.max(0, (Math.abs(stride) - 0.5) / 0.5);
  if (puffOpacity > 0) {
    const puffX = -direction * fit.bodyW * drawSize * 0.34;
    for (const offset of [0, 1, 2]) {
      fillEllipse(
        context,
        puffX - direction * offset * drawSize * 0.018,
        groundY - offset * drawSize * 0.01,
        drawSize * (0.013 + offset * 0.004),
        drawSize * (0.009 + offset * 0.003),
        `rgba(255, 240, 202, ${
          puffOpacity * (0.24 - offset * 0.055)
        })`,
      );
    }
  }
  if (stage === "senior" && stride > 0.5) {
    context.beginPath();
    context.arc(
      direction * drawSize * 0.2,
      groundY,
      drawSize * 0.035,
      0,
      Math.PI * 2,
    );
    context.strokeStyle = `rgba(130, 88, 54, ${
      Math.max(0, stride - 0.5) * 0.34
    })`;
    context.lineWidth = Math.max(1, drawSize * 0.005);
    context.stroke();
  }
}

function drawActionAtlasCell(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  index: number,
  x: number,
  y: number,
  size: number,
  rotation = 0,
  opacity = 1,
) {
  const row = Math.floor(index / 4);
  const column = index % 4;
  const cellWidth = atlas.naturalWidth / 4;
  const cellHeight = atlas.naturalHeight / 2;
  const sourceSize = Math.min(cellWidth, cellHeight);
  const sourceX =
    column * cellWidth + (cellWidth - sourceSize) / 2;
  const sourceY =
    row * cellHeight + (cellHeight - sourceSize) / 2;
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.globalAlpha = opacity;
  context.drawImage(
    atlas,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    -size / 2,
    -size / 2,
    size,
    size,
  );
  context.restore();
}

function drawAuthoredActionProp(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  action: string | null,
  idlePose: IdlePose,
  stage: GrowthStageId,
  persona: DlcPersona | undefined,
  fit: StageFit,
  drawSize: number,
  slow: number,
  fast: number,
  actionElapsed: number,
) {
  const frontY =
    (persona
      ? DLC_ACTION_FRONT_Y[stage]
      : STANDARD_ACTION_FRONT_Y[stage]) * drawSize;
  const authoredHeadY = persona
    ? DLC_FACE_FIT[stage].headY
    : STANDARD_FACE_FIT[stage].headY;
  const selectedAction =
    action ??
    (idlePose === "selfplay"
      ? "play"
      : idlePose === "nap" || idlePose === "doze"
        ? "sleep"
        : null);
  if (!selectedAction) return false;
  const atlasIndex = ACTION_PROP_ATLAS_INDEX[selectedAction];
  if (atlasIndex === undefined) return false;
  const progress = actionProgressFor(action, actionElapsed);

  if (selectedAction === "feed") {
    const y = frontY + drawSize * 0.035;
    drawActionAtlasCell(
      context,
      atlas,
      atlasIndex,
      0,
      y,
      drawSize * 0.3,
      fast * 0.006,
    );
    const biteWindow =
      progress > 0.13 && progress < 0.77
        ? ((progress - 0.13) / 0.64) * 3
        : -1;
    const biteLocal = biteWindow >= 0 ? biteWindow % 1 : 0;
    const spoonLift =
      biteWindow >= 0
        ? Math.sin(smoothStep(biteLocal) * Math.PI)
        : 0;
    const spoonStartX = drawSize * 0.09;
    const spoonStartY = y - drawSize * 0.045;
    const spoonTargetX = drawSize * 0.012;
    const spoonTargetY =
      (authoredHeadY + 0.125) * drawSize;
    const spoonX =
      spoonStartX + (spoonTargetX - spoonStartX) * spoonLift;
    const spoonY =
      spoonStartY + (spoonTargetY - spoonStartY) * spoonLift;
    context.save();
    context.translate(spoonX, spoonY);
    context.rotate(-0.52 + spoonLift * 0.28);
    context.lineCap = "round";
    context.strokeStyle = "#ead8bd";
    context.lineWidth = Math.max(2, drawSize * 0.012);
    context.beginPath();
    context.moveTo(0, drawSize * 0.075);
    context.lineTo(0, -drawSize * 0.052);
    context.stroke();
    fillEllipse(
      context,
      0,
      -drawSize * 0.07,
      drawSize * 0.025,
      drawSize * 0.034,
      "#fff0c7",
      "rgba(136, 87, 58, 0.34)",
      Math.max(1, drawSize * 0.003),
    );
    if (spoonLift < 0.84) {
      fillEllipse(
        context,
        0,
        -drawSize * 0.078,
        drawSize * 0.019,
        drawSize * 0.012,
        "#ffd166",
      );
    }
    context.restore();
    if (spoonLift > 0.82) {
      for (let index = 0; index < 3; index += 1) {
        fillEllipse(
          context,
          drawSize * (0.035 + index * 0.018),
          (authoredHeadY + 0.052 - index * 0.012) * drawSize,
          drawSize * 0.006,
          drawSize * 0.006,
          `rgba(255, 219, 96, ${0.82 - index * 0.18})`,
        );
      }
    }
    for (const x of [-0.045, 0.025]) {
      context.beginPath();
      context.arc(
        x * drawSize,
        y - drawSize * (0.105 + slow * 0.008),
        drawSize * 0.025,
        Math.PI * 0.15,
        Math.PI * 0.85,
      );
      context.strokeStyle = "rgba(255, 250, 232, 0.76)";
      context.lineWidth = drawSize * 0.007;
      context.stroke();
    }
  } else if (selectedAction === "bath") {
    const splash = repeatedPulse(progress, 0.16, 0.76, 3);
    drawActionAtlasCell(
      context,
      atlas,
      atlasIndex,
      0,
      (fit.bodyY + fit.bodyH * 0.22) * drawSize,
      drawSize * 0.52,
      fast * 0.008,
    );
    for (let index = 0; index < 4; index += 1) {
      const angle = index * 1.7 + slow;
      fillEllipse(
        context,
        Math.cos(angle) * drawSize * 0.2,
        (fit.bodyY - 0.02 - splash * 0.035) * drawSize +
          Math.sin(angle) * drawSize * 0.16,
        drawSize * (0.015 + (index % 2) * 0.008),
        drawSize * (0.015 + (index % 2) * 0.008),
        "rgba(231, 252, 255, 0.64)",
        "rgba(255, 255, 255, 0.82)",
        drawSize * 0.003,
      );
    }
    if (progress > 0.82) {
      drawStar(
        context,
        drawSize * 0.2,
        (fit.headY - 0.03) * drawSize,
        drawSize * 0.026,
        `rgba(255, 250, 194, ${stagedPulse(progress, 0.8, 1)})`,
        4,
      );
    }
  } else if (selectedAction === "play") {
    const idleScale = action === "play" ? 1 : 0.72;
    const catchPulse = action
      ? repeatedPulse(progress, 0.08, 0.86, 4)
      : Math.abs(fast);
    const side = action
      ? Math.sin(progress * Math.PI * 8)
      : slow;
    drawActionAtlasCell(
      context,
      atlas,
      atlasIndex,
      (side * 0.15 + (action === "play" ? 0 : 0.08)) * drawSize,
      (fit.bodyY + fit.bodyH * 0.34 - catchPulse * 0.13) *
        drawSize,
      drawSize * 0.2 * idleScale,
      fast * 0.16,
    );
  } else if (selectedAction === "sleep") {
    const isFullSleep = action === "sleep";
    const settle = isFullSleep
      ? smoothStep(progress / 0.18)
      : 0.72;
    drawActionAtlasCell(
      context,
      atlas,
      atlasIndex,
      0,
      (fit.bodyY + fit.bodyH * (0.3 + (1 - settle) * 0.08)) * drawSize,
      drawSize * (isFullSleep ? 0.58 : 0.48) * (0.9 + settle * 0.1),
      slow * 0.005,
      (isFullSleep ? 0.98 : 0.78) * settle,
    );
    const sleepOpacity = isFullSleep
      ? stagedPulse(progress, 0.2, 0.92)
      : 0.75;
    context.fillStyle = `rgba(255, 250, 222, ${0.92 * sleepOpacity})`;
    context.font = `800 ${Math.max(10, drawSize * 0.07)}px ui-rounded, sans-serif`;
    context.fillText(
      "z",
      drawSize * 0.18,
      (authoredHeadY - 0.08 - slow * 0.02) * drawSize,
    );
    context.font = `800 ${Math.max(12, drawSize * 0.09)}px ui-rounded, sans-serif`;
    context.fillText(
      "Z",
      drawSize * 0.25,
      (authoredHeadY - 0.17 - slow * 0.025) * drawSize,
    );
  } else if (selectedAction === "gift") {
    const reveal = smoothStep((progress - 0.18) / 0.32);
    drawActionAtlasCell(
      context,
      atlas,
      atlasIndex,
      0,
      frontY - reveal * drawSize * 0.025,
      drawSize * (0.29 + reveal * 0.05),
      fast * (0.018 - reveal * 0.01),
    );
    if (reveal > 0.25) {
      for (let index = 0; index < 5; index += 1) {
        const angle = index * 1.27 + slow * 0.18;
        drawStar(
          context,
          Math.cos(angle) * drawSize * (0.14 + reveal * 0.06),
          frontY - drawSize * 0.1 +
            Math.sin(angle) * drawSize * 0.12,
          drawSize * 0.014,
          `rgba(255, 241, 159, ${reveal * 0.9})`,
          4,
        );
      }
    }
  } else if (selectedAction === "level") {
    drawActionAtlasCell(
      context,
      atlas,
      atlasIndex,
      0,
      fit.bodyY * drawSize,
      drawSize * 0.64,
      slow * 0.08,
      0.9,
    );
  } else if (selectedAction === "event") {
    drawActionAtlasCell(
      context,
      atlas,
      atlasIndex,
      drawSize * 0.22,
      (authoredHeadY - 0.12 - slow * 0.01) * drawSize,
      drawSize * 0.22,
      slow * 0.025,
    );
  } else if (selectedAction === "baby") {
    drawActionAtlasCell(
      context,
      atlas,
      atlasIndex,
      0,
      frontY + drawSize * 0.03,
      drawSize * 0.4,
      slow * 0.012,
    );
  }
  return true;
}

function drawActionProps(
  context: CanvasRenderingContext2D,
  actionPropsAtlas: HTMLImageElement | null,
  action: string | null,
  idlePose: IdlePose,
  stage: GrowthStageId,
  persona: DlcPersona | undefined,
  fit: StageFit,
  drawSize: number,
  time: number,
  actionElapsed: number,
) {
  const slow = Math.sin(time * 0.003 * STAGE_PLACEMENT[stage].idleSpeed);
  const fast = Math.sin(time * 0.009 * STAGE_PLACEMENT[stage].idleSpeed);
  const frontY = (fit.bodyY + fit.bodyH * 0.31) * drawSize;
  context.save();

  if (
    actionPropsAtlas &&
    drawAuthoredActionProp(
      context,
      actionPropsAtlas,
      action,
      idlePose,
      stage,
      persona,
      fit,
      drawSize,
      slow,
      fast,
      actionElapsed,
    )
  ) {
    context.restore();
    return;
  }

  if (action === "feed") {
    const bowlY = frontY + drawSize * 0.025;
    const bowlGradient = context.createLinearGradient(0, bowlY - drawSize * 0.04, 0, bowlY + drawSize * 0.05);
    bowlGradient.addColorStop(0, "#fff0cc");
    bowlGradient.addColorStop(1, "#d97e62");
    fillEllipse(
      context,
      0,
      bowlY,
      drawSize * 0.105,
      drawSize * 0.045,
      bowlGradient,
      "#9e563f",
      drawSize * 0.006,
    );
    fillEllipse(
      context,
      0,
      bowlY - drawSize * 0.018,
      drawSize * 0.085,
      drawSize * 0.022,
      "#8d492e",
    );
    context.save();
    context.translate(drawSize * 0.07, bowlY - drawSize * 0.05);
    context.rotate(-0.55 + fast * 0.15);
    context.strokeStyle = "#e8d8be";
    context.lineWidth = drawSize * 0.012;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, -drawSize * 0.13);
    context.stroke();
    fillEllipse(context, 0, -drawSize * 0.145, drawSize * 0.025, drawSize * 0.034, "#f6ead7");
    context.restore();
    for (const x of [-0.04, 0.025]) {
      context.beginPath();
      context.arc(
        x * drawSize,
        bowlY - drawSize * (0.09 + slow * 0.008),
        drawSize * 0.025,
        Math.PI * 0.15,
        Math.PI * 0.85,
      );
      context.strokeStyle = "rgba(255, 250, 232, 0.72)";
      context.lineWidth = drawSize * 0.008;
      context.stroke();
    }
  } else if (action === "bath") {
    const bubbleCount = stage === "child" ? 9 : stage === "senior" ? 6 : 8;
    for (let index = 0; index < bubbleCount; index += 1) {
      const angle = (index / bubbleCount) * Math.PI * 2;
      const radius = drawSize * (0.12 + (index % 3) * 0.045);
      const x = Math.cos(angle) * radius;
      const y = fit.bodyY * drawSize + Math.sin(angle) * radius + fast * drawSize * 0.008;
      fillEllipse(
        context,
        x,
        y,
        drawSize * (0.022 + (index % 2) * 0.009),
        drawSize * (0.022 + (index % 2) * 0.009),
        "rgba(230, 251, 255, 0.67)",
        "rgba(255, 255, 255, 0.86)",
        drawSize * 0.004,
      );
    }
    fillEllipse(
      context,
      0,
      (fit.hatY + 0.015) * drawSize,
      fit.headW * drawSize * 0.22,
      drawSize * 0.05,
      "rgba(245, 253, 255, 0.82)",
    );
  } else if (action === "play" || idlePose === "selfplay") {
    const ballScale = action === "play" ? 1 : 0.72;
    const ballX = (slow * 0.16 + (action === "play" ? 0 : 0.09)) * drawSize;
    const ballY =
      (fit.bodyY + fit.bodyH * 0.35 - Math.abs(fast) * 0.08) * drawSize;
    const ballGradient = context.createRadialGradient(
      ballX - drawSize * 0.02,
      ballY - drawSize * 0.025,
      0,
      ballX,
      ballY,
      drawSize * 0.065 * ballScale,
    );
    ballGradient.addColorStop(0, "#fff4a8");
    ballGradient.addColorStop(0.55, "#ed8b72");
    ballGradient.addColorStop(1, "#b94e5b");
    fillEllipse(
      context,
      ballX,
      ballY,
      drawSize * 0.06 * ballScale,
      drawSize * 0.06 * ballScale,
      ballGradient,
      "#fff2d3",
      drawSize * 0.005,
    );
  } else if (action === "sleep" || idlePose === "nap" || idlePose === "doze") {
    const blanketY = (fit.bodyY + fit.bodyH * 0.3) * drawSize;
    context.globalAlpha = action === "sleep" ? 0.88 : 0.58;
    context.beginPath();
    context.moveTo(-fit.bodyW * drawSize * 0.52, blanketY);
    context.quadraticCurveTo(
      0,
      blanketY - drawSize * 0.07,
      fit.bodyW * drawSize * 0.52,
      blanketY,
    );
    context.lineTo(fit.bodyW * drawSize * 0.43, blanketY + drawSize * 0.13);
    context.quadraticCurveTo(
      0,
      blanketY + drawSize * 0.17,
      -fit.bodyW * drawSize * 0.43,
      blanketY + drawSize * 0.13,
    );
    context.closePath();
    context.fillStyle = stage === "senior" ? "#9fb0cf" : "#99a7d2";
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = "rgba(255, 250, 222, 0.9)";
    context.font = `700 ${Math.max(10, drawSize * 0.07)}px ui-rounded, sans-serif`;
    context.fillText("z", drawSize * 0.18, (fit.headY - 0.08 - slow * 0.02) * drawSize);
    context.font = `700 ${Math.max(12, drawSize * 0.09)}px ui-rounded, sans-serif`;
    context.fillText("Z", drawSize * 0.25, (fit.headY - 0.17 - slow * 0.025) * drawSize);
  } else if (action === "gift") {
    const boxY = frontY;
    roundedRect(
      context,
      -drawSize * 0.09,
      boxY - drawSize * 0.055,
      drawSize * 0.18,
      drawSize * 0.14,
      drawSize * 0.018,
    );
    context.fillStyle = "#ef8796";
    context.fill();
    context.fillStyle = "#fff0b8";
    context.fillRect(-drawSize * 0.018, boxY - drawSize * 0.055, drawSize * 0.036, drawSize * 0.14);
    drawBow(context, 0, boxY - drawSize * 0.06, drawSize * 0.036, "#fff0b8");
  } else if (action === "level") {
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2 + slow * 0.2;
      drawStar(
        context,
        Math.cos(angle) * drawSize * 0.27,
        fit.bodyY * drawSize + Math.sin(angle) * drawSize * 0.25,
        drawSize * (0.018 + (index % 2) * 0.008),
        index % 2 ? "#fff2a8" : "#ef94a3",
      );
    }
  } else if (action === "event") {
    fillEllipse(
      context,
      drawSize * 0.22,
      (fit.headY - 0.12) * drawSize,
      drawSize * 0.065,
      drawSize * 0.065,
      "rgba(255, 250, 231, 0.9)",
      "rgba(116, 77, 56, 0.22)",
      drawSize * 0.005,
    );
    context.fillStyle = "#855c48";
    context.font = `900 ${Math.max(12, drawSize * 0.085)}px ui-rounded, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("?", drawSize * 0.22, (fit.headY - 0.115) * drawSize);
  } else if (action === "baby") {
    for (const direction of [-1, 1]) {
      context.save();
      context.translate(direction * drawSize * 0.18, fit.bodyY * drawSize);
      context.rotate(direction * 0.18);
      context.fillStyle = "rgba(244, 139, 158, 0.88)";
      context.beginPath();
      context.moveTo(0, drawSize * 0.035);
      context.bezierCurveTo(
        -drawSize * 0.06,
        -drawSize * 0.01,
        -drawSize * 0.045,
        -drawSize * 0.07,
        0,
        -drawSize * 0.035,
      );
      context.bezierCurveTo(
        drawSize * 0.045,
        -drawSize * 0.07,
        drawSize * 0.06,
        -drawSize * 0.01,
        0,
        drawSize * 0.035,
      );
      context.fill();
      context.restore();
    }
  } else if (idlePose === "curious") {
    const bubbleX = drawSize * 0.2;
    const bubbleY = (fit.headY - 0.1 - slow * 0.008) * drawSize;
    fillEllipse(
      context,
      bubbleX,
      bubbleY,
      drawSize * 0.048,
      drawSize * 0.048,
      "rgba(255, 250, 224, 0.82)",
      "rgba(139, 91, 60, 0.17)",
      drawSize * 0.004,
    );
    context.fillStyle = "#93624c";
    context.font = `900 ${Math.max(10, drawSize * 0.058)}px ui-rounded, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("?", bubbleX, bubbleY);
    drawStar(
      context,
      -drawSize * 0.2,
      (fit.headY - 0.03 + fast * 0.006) * drawSize,
      drawSize * 0.018,
      "rgba(255, 242, 170, 0.88)",
      4,
    );
  } else if (idlePose === "sniff") {
    context.strokeStyle = "rgba(255, 245, 213, 0.74)";
    context.lineWidth = Math.max(1, drawSize * 0.006);
    context.lineCap = "round";
    for (let index = 0; index < 3; index += 1) {
      const x = drawSize * (0.12 + index * 0.045);
      const y = (fit.headY + 0.03 - index * 0.035) * drawSize;
      context.beginPath();
      context.moveTo(x, y);
      context.bezierCurveTo(
        x + drawSize * 0.025,
        y - drawSize * 0.025,
        x - drawSize * 0.012,
        y - drawSize * 0.055,
        x + drawSize * 0.018,
        y - drawSize * 0.075,
      );
      context.stroke();
    }
  } else if (idlePose === "sway") {
    context.fillStyle = "rgba(255, 244, 185, 0.78)";
    context.font = `800 ${Math.max(10, drawSize * 0.055)}px ui-rounded, sans-serif`;
    context.fillText(
      "♪",
      -drawSize * 0.23,
      (fit.headY - 0.05 + slow * 0.018) * drawSize,
    );
    context.font = `800 ${Math.max(9, drawSize * 0.045)}px ui-rounded, sans-serif`;
    context.fillText(
      "♫",
      drawSize * 0.2,
      (fit.headY + 0.025 - slow * 0.014) * drawSize,
    );
  } else if (idlePose === "stretch") {
    for (const direction of [-1, 1]) {
      drawStar(
        context,
        direction * drawSize * 0.24,
        (fit.bodyY - 0.12 + slow * 0.008) * drawSize,
        drawSize * 0.018,
        "rgba(255, 245, 188, 0.84)",
        4,
      );
    }
  } else if (idlePose === "glasses") {
    drawStar(
      context,
      drawSize * 0.16,
      (fit.headY - 0.035 + slow * 0.006) * drawSize,
      drawSize * 0.025,
      "rgba(255, 246, 181, 0.9)",
      4,
    );
  } else if (idlePose === "cane") {
    context.beginPath();
    context.arc(
      drawSize * 0.19,
      fit.groundY * drawSize,
      drawSize * (0.025 + Math.abs(slow) * 0.015),
      0,
      Math.PI * 2,
    );
    context.strokeStyle = "rgba(126, 82, 50, 0.25)";
    context.lineWidth = drawSize * 0.005;
    context.stroke();
  } else if (idlePose === "energetic" || idlePose === "toddle") {
    context.strokeStyle = "rgba(255, 246, 198, 0.68)";
    context.lineWidth = drawSize * 0.007;
    for (const direction of [-1, 1]) {
      context.beginPath();
      context.moveTo(
        direction * drawSize * 0.23,
        (fit.bodyY - 0.08) * drawSize,
      );
      context.lineTo(
        direction * drawSize * 0.3,
        (fit.bodyY - 0.12 + fast * 0.01) * drawSize,
      );
      context.stroke();
    }
  }
  context.restore();
}

type FaceMood =
  | "default"
  | "bright"
  | "closed-happy"
  | "sleeping"
  | "half-lidded"
  | "focused"
  | "surprised"
  | "sad"
  | "wink"
  | "squint";

type MouthMood =
  | "default"
  | "smile"
  | "open"
  | "chew"
  | "sad"
  | "smirk"
  | "tiny";

function drawFacialExpression(
  context: CanvasRenderingContext2D,
  stage: GrowthStageId,
  fit: StageFit,
  drawSize: number,
  time: number,
  actionElapsed: number,
  action: string | null,
  condition: PetCondition,
  idlePose: IdlePose,
  touchReaction: TouchReaction | null,
  touchElapsed: number,
  persona: DlcPersona | undefined,
  pose: SoftMeshPose,
) {
  const progress = actionProgressFor(action, actionElapsed);
  const blinkPhase = (time % 5100) / 5100;
  const naturalBlink = blinkPhase > 0.945 && blinkPhase < 0.985;
  let mood: FaceMood = naturalBlink ? "sleeping" : "default";
  let mouth: MouthMood = "default";
  let gazeX = 0;
  let browTilt = 0;
  let drawFace = naturalBlink;

  if (persona === "gintoki") {
    mood = naturalBlink ? "sleeping" : "half-lidded";
    mouth = "smirk";
    browTilt = -0.04;
  } else if (persona === "feitan") {
    mood = naturalBlink ? "sleeping" : "focused";
    mouth = "tiny";
    browTilt = 0.22;
    gazeX = Math.sin(time * 0.0008) * 0.22;
  } else if (persona === "tsuna") {
    mood = stage === "child" || stage === "teen" ? "surprised" : "bright";
    mouth = stage === "child" ? "tiny" : "smile";
    browTilt = stage === "child" ? -0.18 : 0.08;
  } else if (persona === "mafuyu") {
    mood = naturalBlink ? "sleeping" : "half-lidded";
    mouth = "tiny";
    gazeX = -0.12;
  } else if (persona === "ritsuka") {
    mood = naturalBlink ? "sleeping" : "focused";
    mouth = "tiny";
    browTilt = 0.12;
  } else if (persona === "haruki") {
    mood = naturalBlink ? "sleeping" : "bright";
    mouth = "smile";
  } else if (persona === "akihiko") {
    mood = naturalBlink ? "sleeping" : "half-lidded";
    mouth = "smirk";
    browTilt = 0.08;
  } else if (persona === "chihiro") {
    mood = naturalBlink ? "sleeping" : "focused";
    mouth = "tiny";
    browTilt = 0.18;
  }

  if (condition === "hungry") {
    mood = "sad";
    mouth = "sad";
    browTilt = -0.2;
    drawFace = true;
  } else if (condition === "lonely") {
    mood = "sad";
    mouth = "sad";
    browTilt = -0.28;
    drawFace = true;
  } else if (condition === "dirty") {
    mood = Math.sin(time * 0.009) > 0.25 ? "squint" : "focused";
    mouth = "tiny";
    drawFace = true;
  } else if (condition === "sleepy" || condition === "critical") {
    mood = condition === "critical" ? "sad" : "half-lidded";
    mouth = condition === "critical" ? "sad" : "tiny";
    browTilt = -0.2;
    drawFace = true;
  } else if (condition === "radiant") {
    mood = naturalBlink ? "closed-happy" : "bright";
    mouth = "smile";
    drawFace = true;
  }

  if (idlePose === "doze" || idlePose === "nap") {
    mood = "sleeping";
    mouth = "tiny";
    drawFace = true;
  } else if (idlePose === "yawn") {
    mood = "closed-happy";
    mouth = "open";
    drawFace = true;
  } else if (idlePose === "groom") {
    mood = "wink";
    mouth = "smile";
    drawFace = true;
  } else if (idlePose === "listen" || idlePose === "curious") {
    gazeX = Math.sin(time * 0.0018) * 0.35;
    drawFace = true;
  }

  if (action === "feed") {
    const bite = repeatedPulse(progress, 0.13, 0.77, 3);
    mood = bite > 0.7 ? "closed-happy" : "bright";
    mouth = bite > 0.7 ? "open" : progress > 0.16 && progress < 0.84 ? "chew" : "smile";
    drawFace = true;
  } else if (action === "bath") {
    const splash = repeatedPulse(progress, 0.16, 0.76, 3);
    mood = splash > 0.6 ? "squint" : progress > 0.82 ? "bright" : "default";
    mouth = splash > 0.6 ? "open" : "smile";
    drawFace = true;
  } else if (action === "play") {
    const catchPulse = repeatedPulse(progress, 0.08, 0.86, 4);
    mood = catchPulse > 0.76 ? "closed-happy" : "focused";
    mouth = catchPulse > 0.76 ? "open" : "smile";
    gazeX = Math.sin(progress * Math.PI * 8) * 0.42;
    drawFace = true;
  } else if (action === "sleep") {
    if (progress < 0.16) {
      mood = "half-lidded";
      mouth = "tiny";
    } else if (progress < 0.88) {
      mood = "sleeping";
      mouth = "tiny";
    } else {
      mood = "closed-happy";
      mouth = "open";
    }
    drawFace = true;
  } else if (action === "gift") {
    mood = progress < 0.3 ? "surprised" : "closed-happy";
    mouth = progress < 0.3 ? "open" : "smile";
    drawFace = true;
  } else if (action === "level") {
    mood = "closed-happy";
    mouth = "open";
    drawFace = true;
  } else if (action === "event") {
    mood = progress < 0.36 ? "surprised" : "focused";
    mouth = progress < 0.36 ? "open" : "tiny";
    gazeX = Math.sin(progress * Math.PI * 3) * 0.38;
    drawFace = true;
  } else if (action === "baby") {
    mood = "half-lidded";
    mouth = "smile";
    drawFace = true;
  }

  if (touchReaction) {
    const reactionPulse = stagedPulse(
      clampUnit(touchElapsed / 1600),
      0,
      0.98,
    );
    drawFace = true;
    if (touchReaction === "head-pat") {
      mood = "closed-happy";
      mouth = "smile";
    } else if (touchReaction === "cheek-poke") {
      mood = "wink";
      mouth = "smirk";
      gazeX = reactionPulse * 0.32;
    } else if (touchReaction === "belly-tickle") {
      mood = "closed-happy";
      mouth = "open";
    } else {
      mood = "surprised";
      mouth = "tiny";
      browTilt = -0.16;
    }
  }

  if (!drawFace) return;

  const authoredFace = persona
    ? DLC_FACE_FIT[stage]
    : STANDARD_FACE_FIT[stage];
  const faceY = drawSize * 0.012;
  const eyeGap = authoredFace.eyeGap * drawSize;
  const eyeRadiusX =
    drawSize *
    (stage === "child" ? 0.024 : 0.021) *
    authoredFace.eyeScale;
  const eyeRadiusY =
    drawSize *
    (stage === "child" ? 0.034 : 0.032) *
    authoredFace.eyeScale;
  const mouthY = drawSize * authoredFace.mouthY;
  const coverColor = stage === "senior" ? "255, 218, 77" : "255, 219, 57";
  const eyeCoverRadius = drawSize * 0.038;
  const hasMouthMotion =
    Boolean(action) ||
    Boolean(touchReaction) ||
    idlePose === "yawn" ||
    condition === "hungry" ||
    condition === "lonely" ||
    condition === "critical";
  const shouldRedrawMouth =
    hasMouthMotion &&
    (stage !== "child" ||
      action === "feed" ||
      idlePose === "yawn");

  context.save();
  context.translate(
    pose.headX * drawSize,
    (authoredFace.headY + pose.headY) * drawSize,
  );
  context.rotate(pose.headAngle);

  for (const direction of [-1, 1]) {
    const cover = context.createRadialGradient(
      direction * eyeGap,
      faceY,
      0,
      direction * eyeGap,
      faceY,
      eyeCoverRadius,
    );
    cover.addColorStop(0, `rgba(${coverColor}, 0.98)`);
    cover.addColorStop(0.62, `rgba(${coverColor}, 0.92)`);
    cover.addColorStop(1, `rgba(${coverColor}, 0)`);
    fillEllipse(
      context,
      direction * eyeGap,
      faceY,
      eyeCoverRadius,
      eyeCoverRadius * 0.86,
      cover,
    );
  }

  if (shouldRedrawMouth) {
    const mouthCover = context.createRadialGradient(
      0,
      mouthY,
      0,
      0,
      mouthY,
      drawSize * (stage === "child" && action === "feed" ? 0.09 : 0.07),
    );
    mouthCover.addColorStop(0, `rgba(${coverColor}, 0.97)`);
    mouthCover.addColorStop(0.7, `rgba(${coverColor}, 0.9)`);
    mouthCover.addColorStop(1, `rgba(${coverColor}, 0)`);
    fillEllipse(
      context,
      0,
      mouthY,
      drawSize * (stage === "child" && action === "feed" ? 0.09 : 0.07),
      drawSize * 0.065,
      mouthCover,
    );
  }

  const eyeOpen: [number, number] = ({
    default: [1, 1],
    bright: [1.08, 1.08],
    "closed-happy": [0.05, 0.05],
    sleeping: [0, 0],
    "half-lidded": [0.42, 0.42],
    focused: [0.5, 0.5],
    surprised: [1.25, 1.25],
    sad: [0.62, 0.62],
    wink: [0.04, 1],
    squint: [0.08, 0.08],
  } satisfies Record<FaceMood, [number, number]>)[mood];
  context.lineCap = "round";
  for (const [index, direction] of ([-1, 1] as const).entries()) {
    const openness = eyeOpen[index];
    const eyeX = direction * eyeGap;
    if (openness <= 0.12) {
      context.beginPath();
      context.moveTo(eyeX - eyeRadiusX, faceY);
      context.quadraticCurveTo(
        eyeX,
        faceY + (mood === "sleeping" ? drawSize * 0.013 : -drawSize * 0.014),
        eyeX + eyeRadiusX,
        faceY,
      );
      context.strokeStyle = "#65371f";
      context.lineWidth = Math.max(2, drawSize * 0.008);
      context.stroke();
    } else {
      fillEllipse(
        context,
        eyeX,
        faceY,
        eyeRadiusX,
        eyeRadiusY * openness,
        "#65331e",
        "rgba(84, 38, 20, 0.5)",
        Math.max(1, drawSize * 0.0025),
      );
      fillEllipse(
        context,
        eyeX + gazeX * eyeRadiusX * 0.38 - eyeRadiusX * 0.25,
        faceY - eyeRadiusY * openness * 0.28,
        eyeRadiusX * 0.25,
        eyeRadiusX * 0.31,
        "rgba(255,255,238,0.94)",
      );
    }
    if (mood === "focused" || mood === "sad" || mood === "surprised") {
      context.save();
      context.translate(eyeX, faceY - drawSize * 0.052);
      const emotionalTilt =
        mood === "sad" || mood === "surprised"
          ? direction * 0.16
          : -direction * (0.2 + browTilt);
      context.rotate(emotionalTilt);
      context.beginPath();
      context.moveTo(-eyeRadiusX * 0.85, 0);
      context.quadraticCurveTo(0, -drawSize * 0.005, eyeRadiusX * 0.85, 0);
      context.strokeStyle = "rgba(103, 56, 31, 0.78)";
      context.lineWidth = Math.max(1.4, drawSize * 0.005);
      context.stroke();
      context.restore();
    }
  }

  if (shouldRedrawMouth) {
    fillEllipse(
      context,
      0,
      mouthY - drawSize * 0.027,
      drawSize * 0.014,
      drawSize * 0.011,
      "#744126",
    );
    context.strokeStyle = "#6f3527";
    context.fillStyle = "#6f3527";
    context.lineWidth = Math.max(1.8, drawSize * 0.007);
    if (mouth === "open") {
      fillEllipse(
        context,
        0,
        mouthY + drawSize * 0.014,
        drawSize * 0.032,
        drawSize * 0.037,
        "#6b2f2b",
      );
      fillEllipse(
        context,
        0,
        mouthY + drawSize * 0.034,
        drawSize * 0.021,
        drawSize * 0.011,
        "#ef8a88",
      );
    } else if (mouth === "chew") {
      fillEllipse(
        context,
        Math.sin(time * 0.02) * drawSize * 0.008,
        mouthY + drawSize * 0.012,
        drawSize * 0.018,
        drawSize * 0.014,
        "#76402f",
      );
    } else {
      context.beginPath();
      if (mouth === "sad") {
        context.moveTo(-drawSize * 0.025, mouthY + drawSize * 0.023);
        context.quadraticCurveTo(0, mouthY - drawSize * 0.006, drawSize * 0.025, mouthY + drawSize * 0.023);
      } else if (mouth === "smirk") {
        context.moveTo(-drawSize * 0.025, mouthY + drawSize * 0.009);
        context.quadraticCurveTo(drawSize * 0.004, mouthY + drawSize * 0.026, drawSize * 0.034, mouthY - drawSize * 0.005);
      } else if (mouth === "tiny") {
        context.moveTo(-drawSize * 0.013, mouthY + drawSize * 0.01);
        context.quadraticCurveTo(0, mouthY + drawSize * 0.018, drawSize * 0.013, mouthY + drawSize * 0.01);
      } else {
        context.moveTo(-drawSize * 0.032, mouthY);
        context.quadraticCurveTo(-drawSize * 0.017, mouthY + drawSize * 0.027, 0, mouthY + drawSize * 0.012);
        context.quadraticCurveTo(drawSize * 0.017, mouthY + drawSize * 0.027, drawSize * 0.032, mouthY);
      }
      context.stroke();
    }
  }
  context.restore();
}

function softMeshPoseFor(
  time: number,
  state: RenderMotion,
  stage: GrowthStageId,
  petted: boolean,
  touchReaction: TouchReaction | null,
  touchElapsed: number,
  persona: DlcPersona | undefined,
  transition: PoseTransition,
  transitionStartedAt: number,
): SoftMeshPose {
  const placement = STAGE_PLACEMENT[stage];
  const idleTime = time * placement.idleSpeed;
  const slow = Math.sin(idleTime * 0.002);
  const medium = Math.sin(idleTime * 0.0045);
  const fast = Math.sin(idleTime * 0.009);
  const transitionMotion = transitionMotionFor(
    time,
    transition,
    transitionStartedAt,
  );
  const pose: SoftMeshPose = {
    ...STILL_SOFT_MESH_POSE,
    x: transitionMotion.x,
    y: transitionMotion.y,
    rotation: transitionMotion.rotation,
    scaleX: 1 + (transitionMotion.scaleX - 1) * 0.28,
    scaleY: 1 + (transitionMotion.scaleY - 1) * 0.28,
    bodyBreath: slow * 0.0045,
    bodyStretch: -slow * 0.0018,
    headAngle: slow * 0.0025,
    leftEarY: slow * 0.0012,
    rightEarY: -slow * 0.0012,
  };

  const ageStrength: Record<GrowthStageId, number> = {
    child: 1.08,
    teen: 1.18,
    adult: 1,
    middle: 0.78,
    senior: 0.58,
  };
  const strength = ageStrength[stage];

  if (persona === "gintoki") {
    pose.y += 0.004;
    pose.bodyLean -= 0.006;
    pose.headAngle += 0.01;
    pose.leftEarY += 0.004;
  } else if (persona === "feitan") {
    pose.bodyLean += 0.007;
    pose.headY += 0.004;
    pose.leftArmY += 0.004;
    pose.rightArmY += 0.004;
  } else if (persona === "tsuna") {
    pose.headY -= 0.002;
    pose.bodyStretch += 0.003;
  } else if (
    persona === "mafuyu" ||
    persona === "haruki"
  ) {
    pose.bodyLean += Math.sin(time * 0.0014) * 0.005;
    pose.headAngle -= Math.sin(time * 0.0014) * 0.004;
  } else if (
    persona === "ritsuka" ||
    persona === "akihiko"
  ) {
    pose.bodyLean += Math.sin(time * 0.0022) * 0.006;
    pose.headAngle -= Math.sin(time * 0.0022) * 0.005;
  } else if (persona === "chihiro") {
    pose.bodyLean += 0.004;
    pose.headAngle -= 0.006;
    pose.leftArmY += 0.003;
  }

  if (state.moving) {
    const gaitPhase = time * 0.0052 * placement.walkSpeed;
    const stride = Math.sin(gaitPhase);
    const leftLift = Math.pow(Math.max(0, stride), 1.35);
    const rightLift = Math.pow(Math.max(0, -stride), 1.35);
    const softContact = 0.5 - Math.cos(gaitPhase * 2) * 0.5;
    pose.y -=
      softContact * (stage === "senior" ? 0.0018 : 0.0038) * strength;
    pose.bodyLean = stride * 0.006 * strength;
    pose.headY = -softContact * 0.0022 * strength;
    pose.headAngle =
      stride * 0.005 * strength -
      state.direction * (stage === "senior" ? 0.003 : 0.005);
    pose.leftArmY = -rightLift * 0.01 * strength;
    pose.rightArmY = -leftLift * 0.01 * strength;
    pose.leftArmX = stride * 0.0035 * strength;
    pose.rightArmX = -stride * 0.0035 * strength;
    pose.leftArmAngle = stride * 0.13 * strength;
    pose.rightArmAngle = -stride * 0.13 * strength;
    pose.leftFootX = -stride * 0.007 * strength;
    pose.leftFootY = -leftLift * 0.018 * strength;
    pose.rightFootX = stride * 0.007 * strength;
    pose.rightFootY = -rightLift * 0.018 * strength;
    pose.leftFootAngle = -stride * 0.075 * strength;
    pose.rightFootAngle = stride * 0.075 * strength;
    pose.leftEarY = stride * 0.0028 * strength;
    pose.rightEarY = -stride * 0.0028 * strength;
    pose.leftEarAngle = stride * 0.018 * strength;
    pose.rightEarAngle = stride * 0.018 * strength;
    return pose;
  }

  const actionSpeed: Record<GrowthStageId, number> = {
    child: 1.08,
    teen: 1.22,
    adult: 1,
    middle: 0.78,
    senior: 0.62,
  };
  const actionTime = Math.max(0, state.action ? time - state.startedAt : time) *
    actionSpeed[stage];
  const actionProgress = actionProgressFor(
    state.action,
    Math.max(0, time - state.startedAt),
  );
  const actionSlow = Math.sin(actionTime * 0.0028);
  const actionFast = Math.sin(actionTime * 0.0068);
  const actionPulse = 0.5 - Math.cos(actionTime * 0.0068) * 0.5;

  if (state.action === "feed") {
    const reach = smoothStep(actionProgress / 0.12);
    const bite = repeatedPulse(actionProgress, 0.13, 0.77, 3);
    const satisfied = smoothStep((actionProgress - 0.78) / 0.18);
    pose.headY += bite * 0.01 * strength - satisfied * 0.004;
    pose.headAngle += (actionFast * 0.004 + bite * 0.012) * strength;
    pose.leftArmX = 0.024 * strength;
    pose.rightArmX = -0.024 * strength;
    pose.leftArmY = (0.006 + reach * 0.018) * strength;
    pose.rightArmY =
      (0.004 + reach * 0.006 - bite * 0.095) * strength;
    pose.leftArmAngle = (-0.08 - reach * 0.17 + satisfied * 0.06) * strength;
    pose.rightArmAngle =
      (0.12 + reach * 0.12 + bite * 0.16 - satisfied * 0.06) *
      strength;
    pose.bodyBreath += bite * 0.006 + satisfied * 0.004;
    return pose;
  }

  if (state.action === "bath") {
    const splash = repeatedPulse(actionProgress, 0.16, 0.76, 3);
    const dryOff = smoothStep((actionProgress - 0.78) / 0.2);
    pose.bodyLean = actionFast * 0.012 * strength;
    pose.headAngle += (-actionFast * 0.016 + splash * 0.01) * strength;
    pose.leftEarX = -actionFast * 0.012 * strength;
    pose.rightEarX = -actionFast * 0.012 * strength;
    pose.leftEarY = actionFast * 0.014 * strength;
    pose.rightEarY = -actionFast * 0.014 * strength;
    pose.leftArmX = -0.018 * strength;
    pose.rightArmX = 0.018 * strength;
    pose.leftArmY = -(splash * 0.022 + dryOff * 0.012) * strength;
    pose.rightArmY = -(splash * 0.022 + dryOff * 0.012) * strength;
    pose.leftArmAngle = (actionFast * 0.1 + splash * 0.09) * strength;
    pose.rightArmAngle = (actionFast * 0.1 + splash * 0.09) * strength;
    pose.leftEarAngle = -actionFast * 0.035 * strength;
    pose.rightEarAngle = -actionFast * 0.035 * strength;
    return pose;
  }

  if (state.action === "play") {
    const catchPulse = repeatedPulse(actionProgress, 0.08, 0.86, 4);
    pose.y -= catchPulse * (stage === "senior" ? 0.006 : 0.015) * strength;
    pose.headAngle += actionSlow * 0.009 * strength;
    pose.bodyLean = actionSlow * 0.009 * strength;
    pose.leftArmY = -Math.max(0, actionFast) * 0.025 * strength - catchPulse * 0.008;
    pose.rightArmY =
      -Math.max(0, -actionFast) * 0.025 * strength - catchPulse * 0.008;
    pose.leftArmAngle = actionFast * 0.22 * strength;
    pose.rightArmAngle = actionFast * 0.22 * strength;
    pose.leftFootY = -Math.max(0, -actionFast) * 0.016 * strength;
    pose.rightFootY = -Math.max(0, actionFast) * 0.016 * strength;
    pose.leftFootAngle = -actionFast * 0.095 * strength;
    pose.rightFootAngle = -actionFast * 0.095 * strength;
    pose.leftEarY = actionFast * 0.006 * strength;
    pose.rightEarY = -actionFast * 0.006 * strength;
    pose.leftEarAngle = actionFast * 0.028 * strength;
    pose.rightEarAngle = actionFast * 0.028 * strength;
    return pose;
  }

  if (state.action === "sleep") {
    const settle = smoothStep(actionProgress / 0.2);
    const wake = smoothStep((actionProgress - 0.87) / 0.13);
    const sleepBreath = Math.sin(actionTime * 0.00155);
    pose.y += 0.014 * settle - wake * 0.01;
    pose.bodyBreath = sleepBreath * 0.012 * settle;
    pose.bodyStretch = -0.026 * settle + wake * 0.022;
    pose.bodyLean = (stage === "child" ? -0.024 : -0.016) * settle;
    pose.headAngle += (stage === "senior" ? -0.042 : -0.055) * settle + wake * 0.035;
    pose.headY = 0.018 * settle - wake * 0.013;
    pose.leftEarY = 0.016 + slow * 0.003;
    pose.rightEarY = 0.018 - slow * 0.003;
    pose.leftEarAngle = 0.045;
    pose.rightEarAngle = -0.045;
    pose.leftArmY = 0.014 * settle - wake * 0.022;
    pose.rightArmY = 0.014 * settle - wake * 0.022;
    pose.leftArmAngle = 0.035 * settle + wake * 0.19;
    pose.rightArmAngle = -0.035 * settle - wake * 0.19;
    return pose;
  }

  if (state.action === "gift") {
    pose.y -= actionPulse * 0.012 * strength;
    pose.headAngle = actionSlow * 0.016;
    pose.leftArmX = 0.026 * strength;
    pose.rightArmX = -0.026 * strength;
    pose.leftArmY = -0.045 * strength;
    pose.rightArmY = -0.045 * strength;
    pose.leftArmAngle = (-0.2 - actionPulse * 0.08) * strength;
    pose.rightArmAngle = (0.2 + actionPulse * 0.08) * strength;
    return pose;
  }

  if (state.action === "level") {
    pose.y -= actionPulse * 0.02 * strength;
    pose.headAngle = actionFast * 0.014 * strength;
    pose.leftArmX = -0.016 * strength;
    pose.rightArmX = 0.016 * strength;
    pose.leftArmY = -0.042 * strength;
    pose.rightArmY = -0.042 * strength;
    pose.leftArmAngle = 0.28 * strength;
    pose.rightArmAngle = -0.28 * strength;
    pose.leftFootY = -Math.max(0, actionFast) * 0.018;
    pose.rightFootY = -Math.max(0, -actionFast) * 0.018;
    pose.leftFootAngle = -actionFast * 0.08;
    pose.rightFootAngle = -actionFast * 0.08;
    return pose;
  }

  if (state.action === "event") {
    pose.headAngle = -0.035 + actionSlow * 0.012;
    pose.headX = actionSlow * 0.006;
    pose.leftEarY = 0.006;
    pose.rightEarY = -0.006;
    pose.leftArmY = -0.012;
    pose.leftEarAngle = -0.055;
    pose.rightEarAngle = -0.018;
    pose.leftArmAngle = 0.12;
    return pose;
  }

  if (state.action === "baby") {
    pose.headY = actionPulse * 0.006;
    pose.headAngle = actionSlow * 0.012;
    pose.leftArmX = 0.032 * strength;
    pose.rightArmX = -0.032 * strength;
    pose.leftArmY = -0.02 * strength;
    pose.rightArmY = -0.02 * strength;
    pose.leftArmAngle = -0.12 * strength;
    pose.rightArmAngle = 0.12 * strength;
    pose.bodyBreath += slow * 0.006;
    return pose;
  }

  if (petted || touchReaction || state.idlePose === "delighted") {
    const touchTime = Math.max(0, touchElapsed);
    const touchWave = Math.sin(touchTime * 0.014) *
      Math.max(0, 1 - touchTime / 1800);
    const touchRise = Math.sin(clampUnit(touchTime / 760) * Math.PI);
    if (touchReaction === "head-pat") {
      pose.headY = touchRise * 0.011 * strength;
      pose.headAngle += touchWave * 0.009 * strength;
      pose.leftEarY = 0.007 + touchWave * 0.003;
      pose.rightEarY = 0.007 - touchWave * 0.003;
      pose.leftEarAngle = 0.025 + touchWave * 0.012;
      pose.rightEarAngle = -0.025 + touchWave * 0.012;
      pose.bodyBreath += touchRise * 0.006;
    } else if (touchReaction === "cheek-poke") {
      pose.headX = touchRise * 0.012;
      pose.headAngle += touchRise * 0.032;
      pose.rightEarY = -touchRise * 0.007;
      pose.rightEarAngle = -touchRise * 0.045;
      pose.rightArmY = -touchRise * 0.012;
      pose.rightArmAngle = -touchRise * 0.1;
    } else if (touchReaction === "belly-tickle") {
      pose.y -= Math.abs(touchWave) * (stage === "senior" ? 0.004 : 0.009) * strength;
      pose.bodyLean += touchWave * 0.012 * strength;
      pose.headAngle += touchWave * 0.016 * strength;
      pose.leftArmY = -Math.abs(touchWave) * 0.022 * strength;
      pose.rightArmY = -Math.abs(touchWave) * 0.022 * strength;
      pose.leftArmAngle = 0.16 * touchRise * strength;
      pose.rightArmAngle = -0.16 * touchRise * strength;
      pose.leftFootY = -Math.max(0, touchWave) * 0.008;
      pose.rightFootY = -Math.max(0, -touchWave) * 0.008;
    } else if (touchReaction === "paw-tap") {
      pose.headAngle += -touchRise * 0.018;
      pose.leftArmY = -touchRise * 0.035 * strength;
      pose.leftArmX = touchRise * 0.012;
      pose.leftArmAngle = touchRise * 0.24 * strength;
      pose.rightEarY = -touchRise * 0.004;
    } else {
      pose.y -= touchRise * (stage === "senior" ? 0.003 : 0.007) * strength;
    }
    return pose;
  }

  const idleElapsed = Math.max(0, time - transitionStartedAt);
  const idlePulse = (
    period: number,
    startRatio: number,
    durationRatio: number,
  ) => {
    const phase = (idleElapsed % period) / period;
    if (phase < startRatio || phase > startRatio + durationRatio) return 0;
    const raw = (phase - startRatio) / durationRatio;
    const eased = raw * raw * (3 - 2 * raw);
    return Math.sin(eased * Math.PI);
  };

  if (state.condition === "hungry") {
    pose.y += 0.014;
    pose.bodyStretch = -0.018;
    pose.leftArmX = 0.014;
    pose.rightArmX = -0.014;
    pose.leftArmAngle = -0.08;
    pose.rightArmAngle = 0.08;
    pose.headY = 0.008;
  } else if (state.condition === "lonely") {
    pose.y += 0.016;
    pose.headAngle = 0.025;
    pose.headY = 0.012;
    pose.leftEarY = 0.014;
    pose.rightEarY = 0.014;
    pose.leftEarAngle = 0.04;
    pose.rightEarAngle = -0.04;
    pose.leftArmY = 0.009;
    pose.rightArmY = 0.009;
  } else if (state.condition === "dirty") {
    pose.bodyLean = fast * 0.012;
    pose.leftArmY = -Math.max(0, fast) * 0.018;
    pose.rightArmY = -Math.max(0, -fast) * 0.018;
    pose.leftArmAngle = fast * 0.1;
    pose.rightArmAngle = fast * 0.1;
  } else if (state.condition === "sleepy") {
    pose.headY = 0.01 + Math.max(0, slow) * 0.008;
    pose.headAngle = -0.02;
    pose.leftEarY = 0.01;
    pose.rightEarY = 0.01;
    pose.leftEarAngle = 0.025;
    pose.rightEarAngle = -0.025;
  } else if (state.condition === "critical") {
    pose.y += 0.022;
    pose.bodyStretch = -0.025;
    pose.headY = 0.016;
    pose.headAngle = slow * 0.009;
    pose.leftEarY = 0.018;
    pose.rightEarY = 0.018;
    pose.leftEarAngle = 0.05;
    pose.rightEarAngle = -0.05;
  } else if (state.condition === "radiant") {
    pose.y -= Math.abs(medium) * 0.01 * strength;
    pose.leftEarY = fast * 0.007;
    pose.rightEarY = -fast * 0.007;
    pose.leftEarAngle = fast * 0.03 * strength;
    pose.rightEarAngle = fast * 0.03 * strength;
  }

  if (state.idlePose === "curious") {
    const gesture = idlePulse(7_800, 0.16, 0.5);
    pose.headAngle += -0.036 * gesture;
    pose.headX = 0.004 * gesture;
    pose.leftEarY -= 0.005 * gesture;
    pose.rightEarY += 0.006 * gesture;
    pose.leftEarAngle -= 0.065 * gesture;
    pose.rightEarAngle += 0.02 * gesture;
  } else if (state.idlePose === "sniff") {
    const gesture = idlePulse(6_600, 0.2, 0.34);
    const sniff = Math.sin(idleElapsed * 0.012) * gesture;
    pose.headX = sniff * 0.005;
    pose.headY = Math.max(0, sniff) * 0.004;
    pose.headAngle += sniff * 0.005;
  } else if (state.idlePose === "sway") {
    const gesture = idlePulse(8_200, 0.12, 0.68);
    const sway = Math.sin(idleElapsed * 0.0018) * gesture;
    pose.bodyLean += sway * 0.012 * strength;
    pose.headAngle -= sway * 0.007 * strength;
    pose.leftArmY = -Math.max(0, sway) * 0.007;
    pose.rightArmY = -Math.max(0, -sway) * 0.007;
    pose.leftArmAngle = sway * 0.07 * strength;
    pose.rightArmAngle = sway * 0.07 * strength;
  } else if (state.idlePose === "toddle") {
    const gesture = idlePulse(6_800, 0.2, 0.42);
    const step = Math.sin(idleElapsed * 0.0062) * gesture;
    const lift = 0.5 - Math.cos(idleElapsed * 0.0124) * 0.5;
    pose.y -= lift * gesture * 0.0035;
    pose.bodyLean += step * 0.012;
    pose.leftFootY = -Math.max(0, step) * 0.012;
    pose.rightFootY = -Math.max(0, -step) * 0.012;
    pose.leftFootAngle = -step * 0.07;
    pose.rightFootAngle = -step * 0.07;
    pose.leftArmY = -Math.max(0, -step) * 0.008;
    pose.rightArmY = -Math.max(0, step) * 0.008;
    pose.leftArmAngle = step * 0.1;
    pose.rightArmAngle = step * 0.1;
  } else if (state.idlePose === "energetic") {
    const gesture = idlePulse(7_000, 0.18, 0.34);
    const hop = Math.max(0, Math.sin(idleElapsed * 0.0064)) * gesture;
    const alternate = Math.sin(idleElapsed * 0.0064) * gesture;
    pose.y -= hop * 0.012;
    pose.headY = -hop * 0.003;
    pose.leftArmY = -Math.max(0, alternate) * 0.018;
    pose.rightArmY = -Math.max(0, -alternate) * 0.018;
    pose.leftArmAngle = alternate * 0.18;
    pose.rightArmAngle = alternate * 0.18;
    pose.leftFootY = -Math.max(0, -alternate) * 0.01;
    pose.rightFootY = -Math.max(0, alternate) * 0.01;
    pose.leftFootAngle = -alternate * 0.07;
    pose.rightFootAngle = -alternate * 0.07;
  } else if (state.idlePose === "stretch") {
    const gesture = idlePulse(8_600, 0.18, 0.58);
    pose.bodyStretch += 0.014 * gesture;
    pose.bodyBreath -= 0.007 * gesture;
    pose.headY = -0.007 * gesture;
    pose.leftArmX = -0.01 * gesture;
    pose.rightArmX = 0.01 * gesture;
    pose.leftArmY = -0.013 * gesture;
    pose.rightArmY = -0.013 * gesture;
    pose.leftArmAngle = 0.2 * gesture;
    pose.rightArmAngle = -0.2 * gesture;
    pose.leftEarAngle = -0.02 * gesture;
    pose.rightEarAngle = 0.02 * gesture;
  } else if (state.idlePose === "glasses") {
    const gesture = idlePulse(9_200, 0.27, 0.34);
    pose.headAngle += -0.014 * gesture;
    pose.leftArmX = 0.012 * gesture;
    pose.leftArmY = -0.019 * gesture;
    pose.leftArmAngle = 0.2 * gesture;
  } else if (state.idlePose === "cane") {
    const gesture = idlePulse(10_200, 0.14, 0.66);
    const weightShift = Math.sin(idleElapsed * 0.00125) * gesture;
    pose.bodyLean += -0.008 * gesture + weightShift * 0.003;
    pose.headAngle += 0.007 * gesture;
    pose.leftArmY = Math.max(0, weightShift) * 0.003;
    pose.leftArmAngle = weightShift * 0.035;
  } else if (state.idlePose === "doze" || state.idlePose === "nap") {
    const gesture = idlePulse(
      state.idlePose === "nap" ? 10_800 : 8_800,
      0.16,
      0.68,
    );
    pose.y += 0.005 * gesture;
    pose.bodyStretch -= 0.01 * gesture;
    pose.headAngle += -0.027 * gesture;
    pose.headY = 0.009 * gesture;
    pose.leftEarY = 0.007 * gesture;
    pose.rightEarY = 0.007 * gesture;
    pose.leftEarAngle = 0.035 * gesture;
    pose.rightEarAngle = -0.035 * gesture;
  } else if (state.idlePose === "selfplay") {
    const gesture = idlePulse(7_600, 0.18, 0.5);
    const playBeat = Math.sin(idleElapsed * 0.006) * gesture;
    pose.headAngle += playBeat * 0.008;
    pose.leftArmX = 0.013 * gesture;
    pose.rightArmX = -0.013 * gesture;
    pose.leftArmY = -Math.max(0, playBeat) * 0.016;
    pose.rightArmY = -Math.max(0, -playBeat) * 0.016;
    pose.leftArmAngle = playBeat * 0.18;
    pose.rightArmAngle = playBeat * 0.18;
    pose.leftFootY = -Math.max(0, -playBeat) * 0.007;
    pose.rightFootY = -Math.max(0, playBeat) * 0.007;
    pose.leftFootAngle = -playBeat * 0.06;
    pose.rightFootAngle = -playBeat * 0.06;
  } else if (state.idlePose === "yawn") {
    const gesture = idlePulse(9_400, 0.18, 0.58);
    pose.bodyStretch += gesture * 0.014;
    pose.headY -= gesture * 0.008;
    pose.headAngle -= gesture * 0.022;
    pose.leftArmX = -gesture * 0.012;
    pose.rightArmX = gesture * 0.012;
    pose.leftArmY = -gesture * 0.024;
    pose.rightArmY = -gesture * 0.024;
    pose.leftArmAngle = gesture * 0.24;
    pose.rightArmAngle = -gesture * 0.24;
    pose.leftEarY = gesture * 0.004;
    pose.rightEarY = gesture * 0.004;
  } else if (state.idlePose === "groom") {
    const gesture = idlePulse(7_700, 0.2, 0.5);
    const wipe = Math.sin(idleElapsed * 0.0075) * gesture;
    pose.headAngle += gesture * 0.018;
    pose.leftArmX = gesture * 0.026;
    pose.leftArmY = -gesture * 0.052 + wipe * 0.004;
    pose.leftArmAngle = gesture * 0.29 + wipe * 0.05;
    pose.leftEarY = wipe * 0.004;
  } else if (state.idlePose === "listen") {
    const gesture = idlePulse(8_300, 0.16, 0.62);
    const glance = Math.sin(idleElapsed * 0.0017) * gesture;
    pose.headAngle += -glance * 0.02;
    pose.headX = glance * 0.005;
    pose.leftEarY = -gesture * 0.007;
    pose.leftEarAngle = -gesture * 0.055;
    pose.rightEarY = gesture * 0.004;
    pose.rightEarAngle = gesture * 0.018;
  }

  return pose;
}

function softenPoseTransition(
  pose: SoftMeshPose,
  time: number,
  transition: PoseTransition,
  startedAt: number,
) {
  if (transition === "steady") return pose;
  const duration =
    transition === "exit" ? POSE_EXIT_MS : POSE_ENTER_MS;
  const progress = Math.min(
    1,
    Math.max(0, (time - startedAt) / duration),
  );
  const smooth = progress * progress * (3 - 2 * progress);
  const weight = transition === "exit" ? 1 - smooth : smooth;

  return {
    ...pose,
    bodyBreath: pose.bodyBreath * weight,
    bodyStretch: pose.bodyStretch * weight,
    bodyLean: pose.bodyLean * weight,
    headAngle: pose.headAngle * weight,
    headX: pose.headX * weight,
    headY: pose.headY * weight,
    leftEarX: pose.leftEarX * weight,
    leftEarY: pose.leftEarY * weight,
    leftEarAngle: pose.leftEarAngle * weight,
    rightEarX: pose.rightEarX * weight,
    rightEarY: pose.rightEarY * weight,
    rightEarAngle: pose.rightEarAngle * weight,
    leftArmX: pose.leftArmX * weight,
    leftArmY: pose.leftArmY * weight,
    leftArmAngle: pose.leftArmAngle * weight,
    rightArmX: pose.rightArmX * weight,
    rightArmY: pose.rightArmY * weight,
    rightArmAngle: pose.rightArmAngle * weight,
    leftFootX: pose.leftFootX * weight,
    leftFootY: pose.leftFootY * weight,
    leftFootAngle: pose.leftFootAngle * weight,
    rightFootX: pose.rightFootX * weight,
    rightFootY: pose.rightFootY * weight,
    rightFootAngle: pose.rightFootAngle * weight,
  };
}

function transitionMotionFor(
  time: number,
  transition: PoseTransition,
  startedAt: number,
): DrawMotion {
  if (transition === "exit") {
    const progress = Math.min(
      1,
      Math.max(0, (time - startedAt) / POSE_EXIT_MS),
    );
    const eased = 1 - Math.pow(1 - progress, 2);
    return {
      x: 0,
      y: 0.003 * eased,
      rotation: 0,
      scaleX: 1 + 0.007 * eased,
      scaleY: 1 - 0.012 * eased,
      skewX: 0,
    };
  }
  if (transition === "enter") {
    const progress = Math.min(
      1,
      Math.max(0, (time - startedAt) / POSE_ENTER_MS),
    );
    const remaining = 1 - progress;
    const settle = Math.sin(progress * Math.PI * 1.8) * remaining;
    return {
      x: 0,
      y: 0.003 * remaining,
      rotation: settle * 0.0025,
      scaleX: 1 - 0.007 * remaining + 0.003 * settle,
      scaleY: 1 + 0.011 * remaining - 0.004 * settle,
      skewX: settle * 0.0015,
    };
  }
  return {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
  };
}

function drawStageSprite(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  drawSize: number,
) {
  context.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    -drawSize / 2,
    -drawSize / 2,
    drawSize,
    drawSize,
  );
}

function softMeshLandmarksFor(
  stage: GrowthStageId,
  atlasKind: "standard" | "dlc" = "standard",
): SoftMeshLandmarks {
  const fit = STAGE_FIT[stage];
  const placement = STAGE_PLACEMENT[stage];
  const scale = 1.075 * placement.overall;
  const centerY = 0.5 + placement.y;
  const headY = centerY + fit.headY * scale;
  const bodyY = centerY + fit.bodyY * scale;
  const armY = centerY + fit.armY * scale;
  const footY = centerY + fit.footY * scale;
  const armX = fit.armX * scale;
  const footX = fit.footX * scale;
  const earX = fit.headW * scale * 0.43;
  const adjustment =
    atlasKind === "dlc"
      ? DLC_LANDMARK_ADJUST[stage]
      : STANDARD_LANDMARK_ADJUST[stage];
  const anchoredHeadY = headY + (adjustment?.headY ?? 0);
  const anchoredBodyY = bodyY + (adjustment?.bodyY ?? 0);
  const anchoredArmY = armY + (adjustment?.armY ?? 0);
  const anchoredFootY = footY + (adjustment?.footY ?? 0);
  const headRadius = adjustment?.headRadius ?? 1;
  const anchoredEarX = earX * headRadius;

  return {
    head: {
      x: 0.5,
      y: anchoredHeadY,
      radiusX: fit.headW * scale * 0.34 * headRadius,
      radiusY: Math.max(0.115, (fit.neckY - fit.headY) * scale * 0.72),
    },
    body: {
      x: 0.5,
      y: anchoredBodyY,
      radiusX: fit.bodyW * scale * 0.52,
      radiusY: fit.bodyH * scale * 0.46,
    },
    leftEar: {
      x: 0.5 - anchoredEarX,
      y: anchoredHeadY + 0.008,
      radiusX: fit.headW * scale * 0.19,
      radiusY: 0.105 * scale,
      pivotX: 0.5 - anchoredEarX * 0.64,
      pivotY: anchoredHeadY - 0.018 * scale,
    },
    rightEar: {
      x: 0.5 + anchoredEarX,
      y: anchoredHeadY + 0.008,
      radiusX: fit.headW * scale * 0.19,
      radiusY: 0.105 * scale,
      pivotX: 0.5 + anchoredEarX * 0.64,
      pivotY: anchoredHeadY - 0.018 * scale,
    },
    leftArm: {
      x: 0.5 - armX,
      y: anchoredArmY,
      radiusX: 0.075 * scale,
      radiusY: 0.11 * scale,
      pivotX: 0.5 - armX * 0.72,
      pivotY: anchoredArmY - 0.058 * scale,
    },
    rightArm: {
      x: 0.5 + armX,
      y: anchoredArmY,
      radiusX: 0.075 * scale,
      radiusY: 0.11 * scale,
      pivotX: 0.5 + armX * 0.72,
      pivotY: anchoredArmY - 0.058 * scale,
    },
    leftFoot: {
      x: 0.5 - footX,
      y: anchoredFootY,
      radiusX: 0.095 * scale,
      radiusY: 0.07 * scale,
      pivotX: 0.5 - footX,
      pivotY: anchoredFootY - 0.038 * scale,
    },
    rightFoot: {
      x: 0.5 + footX,
      y: anchoredFootY,
      radiusX: 0.095 * scale,
      radiusY: 0.07 * scale,
      pivotX: 0.5 + footX,
      pivotY: anchoredFootY - 0.038 * scale,
    },
  };
}

function drawCompositeTexture(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  outfitAtlas: HTMLImageElement | null,
  stage: GrowthStageId,
  outfit: OutfitId,
  environment: string,
  size: number,
) {
  if (outfitAtlas) {
    if (DLC_OUTFIT_ATLAS[outfit]) {
      drawDlcOutfitTexture(
        context,
        outfitAtlas,
        stage,
        environment,
        size,
      );
    } else {
      drawAtlasOutfitTexture(
        context,
        outfitAtlas,
        stage,
        outfit,
        environment,
        size,
      );
    }
    return;
  }
  if (!image) return;

  const placement = STAGE_PLACEMENT[stage];
  const fit = STAGE_FIT[stage];
  const drawSize = size * 1.075 * placement.overall;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.save();
  context.translate(size * 0.5, size * (0.5 + placement.y));
  drawOutfitBack(context, outfit, stage, fit, drawSize);
  drawStageSprite(context, image, drawSize);
  if (BODY_OUTFITS.has(outfit)) {
    context.save();
    torsoPath(context, fit, drawSize, 1.18, 1.12);
    context.clip();
    drawOutfitFront(context, outfit, stage, fit, drawSize);
    context.restore();
    drawGarmentFinish(context, outfit, stage, fit, drawSize);
    drawStageOcclusion(context, image, stage, fit, drawSize);
    drawOutfitAccessoryFront(context, outfit, stage, fit, drawSize);
  } else {
    drawOutfitFront(context, outfit, stage, fit, drawSize);
    if (outfit !== "soft" && outfit !== "classic") {
      drawStageOcclusion(context, image, stage, fit, drawSize);
      drawOutfitAccessoryFront(context, outfit, stage, fit, drawSize);
    }
  }
  applyEnvironmentTint(context, drawSize, environment);
  context.restore();
}

function drawAtlasOutfitTexture(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  stage: GrowthStageId,
  outfit: OutfitId,
  environment: string,
  size: number,
) {
  const atlasIndex = OUTFIT_ATLAS_INDEX[outfit];
  if (atlasIndex === undefined) return;
  const row = Math.floor(atlasIndex / 4);
  const column = atlasIndex % 4;
  const cellWidth = atlas.naturalWidth / 4;
  const cellHeight = atlas.naturalHeight / 4;
  const placement = OUTFIT_ATLAS_PLACEMENT[stage];
  const destinationSize = size * placement.scale;
  const destinationX = (size - destinationSize) / 2;
  const destinationY =
    size * (0.5 + placement.y) - destinationSize / 2;

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    atlas,
    column * cellWidth,
    row * cellHeight,
    cellWidth,
    cellHeight,
    destinationX,
    destinationY,
    destinationSize,
    destinationSize,
  );
  context.save();
  context.globalCompositeOperation = "source-atop";
  context.fillStyle =
    ENVIRONMENT_TINT[environment] ?? ENVIRONMENT_TINT.neutral;
  context.fillRect(0, 0, size, size);
  context.restore();
}

function drawDlcOutfitTexture(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  stage: GrowthStageId,
  environment: string,
  size: number,
) {
  const atlasIndex = DLC_STAGE_ATLAS_INDEX[stage];
  const row = Math.floor(atlasIndex / 3);
  const column = atlasIndex % 3;
  const cellWidth = atlas.naturalWidth / 3;
  const cellHeight = atlas.naturalHeight / 2;
  const placement = OUTFIT_ATLAS_PLACEMENT[stage];
  const destinationSize = size * placement.scale;
  const destinationX = (size - destinationSize) / 2;
  const destinationY = size * (0.5 + placement.y) - destinationSize / 2;

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    atlas,
    column * cellWidth,
    row * cellHeight,
    cellWidth,
    cellHeight,
    destinationX,
    destinationY,
    destinationSize,
    destinationSize,
  );
  context.save();
  context.globalCompositeOperation = "source-atop";
  context.fillStyle = ENVIRONMENT_TINT[environment] ?? ENVIRONMENT_TINT.neutral;
  context.fillRect(0, 0, size, size);
  context.restore();
}

function applyEnvironmentTint(
  context: CanvasRenderingContext2D,
  drawSize: number,
  environment: string,
) {
  context.save();
  context.globalCompositeOperation = "source-atop";
  context.fillStyle =
    ENVIRONMENT_TINT[environment] ?? ENVIRONMENT_TINT.neutral;
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
  moving = false,
  moveDirection = 1,
  dragging = false,
  onTouchReaction,
}: PurinMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const petTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poseTransitionStarted = useRef(0);
  const touchStartedAt = useRef(0);
  const effectiveStage = baby ? "child" : growthStage;
  const persona = DLC_PERSONA[outfit];
  const direction: -1 | 1 = moveDirection < 0 ? -1 : 1;
  const [idlePose, setIdlePose] = useState<IdlePose>("breathe");
  const [petted, setPetted] = useState(false);
  const [touchReaction, setTouchReaction] =
    useState<TouchReaction | null>(null);
  const [touchPulse, setTouchPulse] = useState(0);
  const desiredKey = moving
    ? `walk:${direction}`
    : action
      ? `action:${action}`
      : `idle:${idlePose}:${condition}`;
  const initialMotion: RenderMotion = {
    key: desiredKey,
    action,
    condition,
    idlePose,
    moving,
    direction,
    startedAt: 0,
  };
  const [renderMotion, setRenderMotion] =
    useState<RenderMotion>(initialMotion);
  const renderMotionRef = useRef<RenderMotion>(initialMotion);
  const [poseTransition, setPoseTransition] =
    useState<PoseTransition>("steady");

  useEffect(() => {
    if (preview || action || moving) return;
    const poses = persona
      ? PERSONA_IDLE_POSES[persona]
      : STAGE_IDLE_POSES[effectiveStage];
    let poseIndex = Math.floor(Math.random() * poses.length);
    const timer = window.setInterval(() => {
      poseIndex = (poseIndex + 1) % poses.length;
      setIdlePose(poses[poseIndex]);
    }, STAGE_IDLE_INTERVAL[effectiveStage]);
    return () => window.clearInterval(timer);
  }, [action, effectiveStage, moving, persona, preview]);

  useEffect(
    () => () => {
      if (petTimer.current) clearTimeout(petTimer.current);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (desiredKey === renderMotionRef.current.key) return;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    const requestedAt = performance.now();
    poseTransitionStarted.current = requestedAt;
    setPoseTransition("exit");
    transitionTimer.current = setTimeout(() => {
      const nextMotion: RenderMotion = {
        key: desiredKey,
        action,
        condition,
        idlePose,
        moving,
        direction,
        startedAt: requestedAt,
      };
      renderMotionRef.current = nextMotion;
      setRenderMotion(nextMotion);
      poseTransitionStarted.current = performance.now();
      setPoseTransition("enter");
      transitionTimer.current = setTimeout(() => {
        setPoseTransition("steady");
      }, POSE_ENTER_MS);
    }, POSE_EXIT_MS);
  }, [action, condition, desiredKey, direction, idlePose, moving]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fxCanvas = fxCanvasRef.current;
    if (!canvas || !fxCanvas) return;

    let cancelled = false;
    let animationFrame = 0;
    let textureReady = false;
    let outfitAtlas: HTMLImageElement | null = null;
    let actionPropsAtlas: HTMLImageElement | null = null;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const textureSize = preview ? 384 : 768;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = textureSize;
    textureCanvas.height = textureSize;
    const textureContext = textureCanvas.getContext("2d", { alpha: true });
    if (!textureContext) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const shouldAnimate = !prefersReducedMotion && !preview;
    const meshRenderer = shouldAnimate
      ? createSoftMeshRenderer(canvas)
      : null;
    const staticContext = meshRenderer
      ? null
      : canvas.getContext("2d", { alpha: true });
    const fxContext = fxCanvas.getContext("2d", { alpha: true });
    if (!meshRenderer && !staticContext) return;
    if (!fxContext) return;
    const landmarks = softMeshLandmarksFor(
      effectiveStage,
      persona ? "dlc" : "standard",
    );

    const paint = (time: number) => {
      if (cancelled || !textureReady || width <= 0 || height <= 0) return;
      const placement = STAGE_PLACEMENT[effectiveStage];
      const fit = STAGE_FIT[effectiveStage];
      const actionElapsed = renderMotion.startedAt
        ? Math.max(0, time - renderMotion.startedAt)
        : 0;
      const touchElapsed = touchStartedAt.current
        ? Math.max(0, time - touchStartedAt.current)
        : 0;
      const pose = softenPoseTransition(
        softMeshPoseFor(
          time,
          renderMotion,
          effectiveStage,
          petted,
          touchReaction,
          touchElapsed,
          persona,
          prefersReducedMotion ? "steady" : poseTransition,
          poseTransitionStarted.current,
        ),
        time,
        prefersReducedMotion ? "steady" : poseTransition,
        poseTransitionStarted.current,
      );
      const drawSize =
        Math.min(width, height) * 1.075 * placement.overall;

      if (meshRenderer) {
        meshRenderer.render(landmarks, pose, renderMotion.direction);
      } else if (staticContext) {
        staticContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        staticContext.clearRect(0, 0, width, height);
        staticContext.imageSmoothingEnabled = true;
        staticContext.imageSmoothingQuality = "high";
        staticContext.drawImage(textureCanvas, 0, 0, width, height);
      }

      fxContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      fxContext.clearRect(0, 0, width, height);
      fxContext.imageSmoothingEnabled = true;
      fxContext.imageSmoothingQuality = "high";
      fxContext.save();
      fxContext.translate(
        width * (0.5 + pose.x),
        height * (0.5 + placement.y + pose.y),
      );
      fxContext.rotate(pose.rotation);
      fxContext.scale(pose.scaleX, pose.scaleY);
      if (renderMotion.direction < 0) fxContext.scale(-1, 1);
      if (renderMotion.moving) {
        drawMovementEffects(
          fxContext,
          fit,
          drawSize,
          time,
          effectiveStage,
          renderMotion.direction,
        );
      }
      drawFacialExpression(
        fxContext,
        effectiveStage,
        fit,
        drawSize,
        time,
        actionElapsed,
        renderMotion.action,
        renderMotion.condition,
        renderMotion.idlePose,
        touchReaction,
        touchElapsed,
        persona,
        pose,
      );
      drawActionProps(
        fxContext,
        actionPropsAtlas,
        renderMotion.action,
        renderMotion.idlePose,
        effectiveStage,
        persona,
        fit,
        drawSize,
        time,
        actionElapsed,
      );
      fxContext.restore();
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
      if (
        fxCanvas.width !== nextWidth ||
        fxCanvas.height !== nextHeight
      ) {
        fxCanvas.width = nextWidth;
        fxCanvas.height = nextHeight;
      }
      paint(performance.now());
    };

    const loop = (time: number) => {
      paint(time);
      animationFrame = window.requestAnimationFrame(loop);
    };

    const dlcOutfitFile = DLC_OUTFIT_ATLAS[outfit];
    Promise.all([
      loadCanvasImage(
        dlcOutfitFile
          ? dlcOutfitAssetPath(dlcOutfitFile)
          : outfitAssetPath(STAGE_OUTFIT_ATLAS[effectiveStage]),
      ).catch(() => null),
      loadCanvasImage(
        actionAssetPath("action-props.png"),
      ).catch(() => null),
    ])
      .then(async ([loadedAtlas, loadedActionProps]) => {
        if (cancelled) return;
        outfitAtlas = loadedAtlas;
        actionPropsAtlas = loadedActionProps;
        const loadedBase = loadedAtlas
          ? null
          : await loadCanvasImage(
              petAssetPath(STAGE_FILE[effectiveStage]),
            );
        if (cancelled) return;
        drawCompositeTexture(
          textureContext,
          loadedBase,
          outfitAtlas,
          effectiveStage,
          outfit,
          environment,
          textureSize,
        );
        textureReady = true;
        meshRenderer?.upload(textureCanvas);
        resize();
        if (shouldAnimate) {
          animationFrame = window.requestAnimationFrame(loop);
        }
      })
      .catch(() => {
        // The surrounding game remains usable if an image is unavailable.
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
      meshRenderer?.destroy();
    };
  }, [
    condition,
    effectiveStage,
    environment,
    outfit,
    petted,
    persona,
    poseTransition,
    preview,
    renderMotion,
    showStageDesign,
    touchReaction,
  ]);

  const reactToPet = (
    target?: HTMLElement,
    clientX?: number,
    clientY?: number,
  ) => {
    if (!interactive || action || moving || dragging) return;
    let nextReaction: TouchReaction = "head-pat";
    if (
      target &&
      typeof clientX === "number" &&
      typeof clientY === "number"
    ) {
      const bounds = target.getBoundingClientRect();
      const normalX = (clientX - bounds.left) / bounds.width;
      const normalY = (clientY - bounds.top) / bounds.height;
      target.style.setProperty(
        "--pet-touch-x",
        `${normalX * 100}%`,
      );
      target.style.setProperty(
        "--pet-touch-y",
        `${normalY * 100}%`,
      );
      if (normalY < 0.43) {
        nextReaction = "head-pat";
      } else if (
        normalY < 0.62 &&
        (normalX < 0.39 || normalX > 0.61)
      ) {
        nextReaction = "cheek-poke";
      } else if (normalY < 0.79) {
        nextReaction = "belly-tickle";
      } else {
        nextReaction = "paw-tap";
      }
    }
    if (petTimer.current) clearTimeout(petTimer.current);
    touchStartedAt.current = performance.now();
    setTouchReaction(nextReaction);
    setPetted(true);
    setTouchPulse((current) => current + 1);
    onTouchReaction?.(nextReaction);
    const reactionDuration: Record<TouchReaction, number> = {
      "head-pat": 1450,
      "cheek-poke": 1100,
      "belly-tickle": 1750,
      "paw-tap": 1250,
    };
    petTimer.current = setTimeout(() => {
      setPetted(false);
      setTouchReaction(null);
    }, reactionDuration[nextReaction]);
  };

  const caption = action
    ? `${STAGE_ACTION_PREFIX[effectiveStage]}${ACTION_COPY[action] ?? "活動緊…"}`
    : "";

  return (
    <span
      className={`purin-mascot canvas-mascot uses-stage-artwork uses-outfit-atlas condition-${condition} outfit-${outfit} stage-${effectiveStage} idle-${renderMotion.idlePose} ${
        baby ? "is-baby" : ""
      } ${interactive ? "is-interactive" : ""} ${
        petted ? "is-petted" : ""
      } ${touchReaction ? `touch-${touchReaction}` : ""} ${
        preview ? "is-growth-preview" : ""
      } ${
        renderMotion.moving ? "is-moving" : ""
      } direction-${renderMotion.direction < 0 ? "left" : "right"} ${
        dragging ? "is-being-dragged" : ""
      } pose-transition-${poseTransition}`}
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive
          ? `${name}，${effectiveStage}，目前狀態：${condition}${
              action ? `，${caption}` : moving ? "，正在行路" : "，輕按可以摸摸佢"
            }`
          : `${name}，${effectiveStage}，目前狀態：${condition}`
      }
      onPointerMove={(event) => {
        if (
          event.pointerType === "touch" ||
          !interactive ||
          action ||
          moving ||
          dragging
        ) return;
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
          <span className="mascot-action-stage" aria-hidden="true" />
          <span className="mascot-environment-glow" aria-hidden="true" />
          <canvas ref={canvasRef} className="mascot-canvas" aria-hidden="true" />
          <canvas
            ref={fxCanvasRef}
            className="mascot-fx-canvas"
            aria-hidden="true"
          />
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
          {caption && (
            <span className="mascot-action-caption" aria-hidden="true">
              {caption}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}

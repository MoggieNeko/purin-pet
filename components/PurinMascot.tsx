"use client";

import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

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
type IdlePose = "breathe" | "curious" | "sniff" | "sway" | "delighted";

type SpriteMeta = {
  sheet: SpriteSheet;
  x: "0%" | "100%";
  y: "0%" | "100%";
};

const SPRITES: Record<OutfitId, SpriteMeta> = {
  classic: { sheet: "core", x: "0%", y: "0%" },
  soft: { sheet: "core", x: "100%", y: "0%" },
  scarf: { sheet: "core", x: "0%", y: "100%" },
  berry: { sheet: "core", x: "100%", y: "100%" },
  raincoat: { sheet: "adventure", x: "0%", y: "0%" },
  sailor: { sheet: "adventure", x: "100%", y: "0%" },
  bee: { sheet: "adventure", x: "0%", y: "100%" },
  wizard: { sheet: "adventure", x: "100%", y: "100%" },
  royal: { sheet: "fancy", x: "0%", y: "0%" },
  pajamas: { sheet: "fancy", x: "100%", y: "0%" },
  chef: { sheet: "fancy", x: "0%", y: "100%" },
  detective: { sheet: "fancy", x: "100%", y: "100%" },
  banana: { sheet: "funny", x: "0%", y: "0%" },
  pudding: { sheet: "funny", x: "100%", y: "0%" },
  sushi: { sheet: "funny", x: "0%", y: "100%" },
  ufo: { sheet: "funny", x: "100%", y: "100%" },
};

const SHEET_FILE: Record<SpriteSheet, string> = {
  core: "core-outfits.webp",
  adventure: "adventure-outfits.webp",
  fancy: "fancy-outfits.webp",
  funny: "funny-outfits.webp",
};

const IDLE_POSES: IdlePose[] = [
  "breathe",
  "curious",
  "sniff",
  "sway",
];

function ConditionEffects({ condition }: { condition: PetCondition }) {
  if (condition === "radiant") {
    return (
      <span className="mascot-fx radiant-fx" aria-hidden="true">
        <i>✦</i>
        <i>✧</i>
        <i>✦</i>
        <i>♡</i>
      </span>
    );
  }

  if (condition === "hungry") {
    return (
      <span className="mascot-fx hungry-fx" aria-hidden="true">
        <i>布甸…</i>
        <i className="tummy-rumble">〰</i>
      </span>
    );
  }

  if (condition === "lonely") {
    return (
      <span className="mascot-fx lonely-fx" aria-hidden="true">
        <i>●</i>
        <i>●</i>
      </span>
    );
  }

  if (condition === "dirty") {
    return (
      <span className="mascot-fx dirty-fx" aria-hidden="true">
        <i />
        <i />
        <i>〰</i>
      </span>
    );
  }

  if (condition === "sleepy") {
    return (
      <span className="mascot-fx sleepy-fx" aria-hidden="true">
        <i>z</i>
        <i>Z</i>
        <i>✦</i>
      </span>
    );
  }

  if (condition === "critical") {
    return (
      <span className="mascot-fx critical-fx" aria-hidden="true">
        <i>!</i>
        <i>💧</i>
        <i>〰</i>
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
  const sprite = SPRITES[outfit];
  const effectiveStage = baby ? "child" : growthStage;
  const [idlePose, setIdlePose] = useState<IdlePose>("breathe");
  const [petted, setPetted] = useState(false);
  const petTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spriteStyle: CSSProperties = {
    backgroundImage: `url("./purin-sprites/${SHEET_FILE[sprite.sheet]}")`,
    backgroundPosition: `${sprite.x} ${sprite.y}`,
  };

  useEffect(() => {
    if (!interactive) return;
    let poseIndex = 0;
    const timer = window.setInterval(() => {
      poseIndex = (poseIndex + 1) % IDLE_POSES.length;
      setIdlePose(IDLE_POSES[poseIndex]);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [interactive]);

  useEffect(
    () => () => {
      if (petTimer.current) clearTimeout(petTimer.current);
    },
    [],
  );

  const reactToPet = () => {
    if (!interactive) return;
    if (petTimer.current) clearTimeout(petTimer.current);
    setPetted(true);
    setIdlePose("delighted");
    petTimer.current = setTimeout(() => {
      setPetted(false);
      setIdlePose("breathe");
    }, 1350);
  };

  return (
    <span
      className={`purin-mascot condition-${condition} outfit-${outfit} stage-${effectiveStage} idle-${idlePose} ${
        baby ? "is-baby" : ""
      } ${interactive ? "is-interactive" : ""} ${
        petted ? "is-petted" : ""
      }`}
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive
          ? `${name}，目前狀態：${condition}，輕按可以摸摸佢`
          : `${name}，目前狀態：${condition}`
      }
      onPointerMove={(event) => {
        if (!interactive) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        event.currentTarget.style.setProperty(
          "--pet-tilt-x",
          `${x * 7}deg`,
        );
        event.currentTarget.style.setProperty(
          "--pet-tilt-y",
          `${y * -5}deg`,
        );
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
          <span
            className="mascot-sprite mascot-body-sprite"
            aria-hidden="true"
            style={spriteStyle}
          />
          <span
            className="mascot-sprite mascot-head-sprite"
            aria-hidden="true"
            style={spriteStyle}
          />
          <span className="mascot-depth-glow" aria-hidden="true" />
          <span className="growth-details" aria-hidden="true">
            <i className="age-glasses" />
            <i className="age-muzzle" />
            <i className="age-cane" />
          </span>
          <ConditionEffects condition={condition} />
          <span className="petting-hearts" aria-hidden="true">
            <i>♥</i>
            <i>♡</i>
            <i>♥</i>
          </span>
        </span>
      </span>
    </span>
  );
}

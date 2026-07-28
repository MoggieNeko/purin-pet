"use client";

import type { CSSProperties } from "react";

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

type PurinMascotProps = {
  outfit: OutfitId;
  condition: PetCondition;
  action?: string | null;
  name: string;
  baby?: boolean;
};

type SpriteSheet = "core" | "adventure" | "fancy" | "funny";

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
}: PurinMascotProps) {
  const sprite = SPRITES[outfit];
  const spriteStyle: CSSProperties = {
    backgroundImage: `url("./purin-sprites/${SHEET_FILE[sprite.sheet]}")`,
    backgroundPosition: `${sprite.x} ${sprite.y}`,
  } as CSSProperties;

  return (
    <span
      className={`purin-mascot condition-${condition} outfit-${outfit} ${
        baby ? "is-baby" : ""
      }`}
      role="img"
      aria-label={`${name}，目前狀態：${condition}`}
    >
      <span className={`mascot-rig mascot-action-${action ?? "idle"}`}>
        <span className="mascot-ground-shadow" aria-hidden="true" />
        <span
          className="mascot-sprite"
          aria-hidden="true"
          style={spriteStyle}
        />
        <ConditionEffects condition={condition} />
      </span>
    </span>
  );
}

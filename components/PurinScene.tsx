import type { CSSProperties } from "react";
import type { SceneId } from "./purinGame";

export function sceneImagePath(scene: SceneId) {
  return `./purin-scenes/${scene}.webp`;
}

export function PurinScene({ scene }: { scene: SceneId }) {
  const sceneStyle = {
    backgroundImage: `url("${sceneImagePath(scene)}")`,
  } as CSSProperties;

  return (
    <span className={`scene-world scene-world-${scene}`} aria-hidden="true">
      <span className="scene-illustration" style={sceneStyle} />
      <span className="scene-light" />
      <span className="scene-haze" />
      <span className="scene-particles">
        {Array.from({ length: 9 }, (_, index) => (
          <i key={index} />
        ))}
      </span>
      <span className="scene-foreground" />
    </span>
  );
}

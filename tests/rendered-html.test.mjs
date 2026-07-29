import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("uses independent stage artwork without the old slice renderer", async () => {
  const mascotSource = await readFile(
    new URL("../components/PurinMascot.tsx", import.meta.url),
    "utf8",
  );
  const gameSource = await readFile(
    new URL("../components/purinGame.ts", import.meta.url),
    "utf8",
  );
  const serviceWorker = await readFile(
    new URL("../public/sw.js", import.meta.url),
    "utf8",
  );
  const meshSource = await readFile(
    new URL("../components/purinSoftMesh.ts", import.meta.url),
    "utf8",
  );
  const globalStyles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    mascotSource,
    /drawSculptedSprite|const slices\s*=|purin-sprites|purin-poses/,
  );
  for (const stage of ["child", "teen", "adult", "middle", "senior"]) {
    assert.match(mascotSource, new RegExp(`${stage}: "${stage}\\.png"`));
    assert.match(serviceWorker, new RegExp(`purin-stages/${stage}\\.png`));
  }
  assert.match(mascotSource, /STAGE_IDLE_POSES/);
  assert.match(mascotSource, /STAGE_OUTFIT_ATLAS/);
  assert.match(mascotSource, /OUTFIT_ATLAS_INDEX/);
  assert.match(mascotSource, /drawAtlasOutfitTexture/);
  assert.match(mascotSource, /ACTION_PROP_ATLAS_INDEX/);
  assert.match(mascotSource, /drawAuthoredActionProp/);
  assert.match(mascotSource, /drawMovementEffects/);
  for (const stage of ["child", "teen", "adult", "middle", "senior"]) {
    assert.match(serviceWorker, new RegExp(`purin-outfits/${stage}\\.png`));
  }
  assert.match(serviceWorker, /purin-action\/action-props\.png/);
  assert.match(meshSource, /createSoftMeshRenderer/);
  assert.match(meshSource, /deformPoint/);
  assert.match(meshSource, /pivotX\?: number/);
  assert.match(meshSource, /leftArmAngle/);
  assert.match(mascotSource, /softenPoseTransition/);
  assert.match(mascotSource, /POSE_ENTER_MS = 760/);
  assert.match(meshSource, /UNPACK_FLIP_Y_WEBGL,\s*0/);
  assert.doesNotMatch(meshSource, /UNPACK_FLIP_Y_WEBGL,\s*1/);
  for (const anchor of [
    "shoulderW",
    "bellyW",
    "hemY",
    "armX",
    "footX",
  ]) {
    assert.match(mascotSource, new RegExp(`${anchor}:`));
  }
  assert.match(mascotSource, /const idlePulse/);
  assert.match(mascotSource, /softContact/);
  assert.match(globalStyles, /V11 final cascade/);
  assert.match(globalStyles, /V12 final cascade/);
  assert.match(globalStyles, /V13 last-write guard/);
  assert.match(globalStyles, /\.mascot-action-stage/);
  assert.match(globalStyles, /\.mascot-fx-canvas/);
  assert.match(globalStyles, /\.bottom-sheet\s*{[\s\S]*?height:\s*100%/);
  assert.match(globalStyles, /\.sheet-content\s*{[\s\S]*?overflow-y:\s*auto/);
  assert.match(globalStyles, /\.sheet-tabs\s*{[\s\S]*?position:\s*relative\s*!important/);
  assert.match(gameSource, /GROWTH_STAGE_RULES/);
  assert.match(gameSource, /stageAdjustedStatDelta/);
  assert.match(serviceWorker, /purin-pet-v13/);
});

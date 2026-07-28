"use client";

import {
  ChangeEvent,
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PurinMascot,
  type GrowthStageId,
  type OutfitId,
} from "./PurinMascot";
import { PurinScene, sceneImagePath } from "./PurinScene";
import {
  ACTION_EFFECTS,
  ACTION_META,
  DEFAULT_NOTE,
  EVENT_COOLDOWN_MS,
  FAMILY_BIRTH_GAP_MS,
  FAMILY_WAIT_MS,
  GROWTH_STAGES,
  OUTFITS,
  RANDOM_EVENTS,
  SCENES,
  STAT_META,
  STORAGE_KEY,
  actionAvailability,
  averageStats,
  clamp,
  conditionForStats,
  conditionLabel,
  daysTogether,
  formatCountdown,
  growthStageFor,
  localDateKey,
  nextGrowthStage,
  statStateLabel,
  xpRequired,
  type CareAction,
  type ChildPet,
  type ClosetTab,
  type GameState,
  type Panel,
  type PetAction,
  type SceneId,
  type StatKey,
} from "./purinGame";

type MiniGameState = {
  open: boolean;
  time: number;
  score: number;
  finished: boolean;
  playerX: number;
  combo: number;
  bestCombo: number;
  lives: number;
  feedback: string;
  feedbackId: number;
  items: MiniGameItem[];
};

type MiniGameItemKind = "pudding" | "berry" | "star" | "soap";

type MiniGameItem = {
  id: number;
  kind: MiniGameItemKind;
  x: number;
  y: number;
  speed: number;
  spin: number;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const MINI_GAME_DURATION = 24;
const MINI_GAME_ITEM_SCORE: Record<MiniGameItemKind, number> = {
  pudding: 2,
  berry: 3,
  star: 5,
  soap: -4,
};

const ACTION_DURATION: Record<string, number> = {
  feed: 6500,
  bath: 7200,
  play: 6200,
  sleep: 7800,
  gift: 4200,
  level: 4300,
  event: 4200,
  baby: 4800,
};

function makeMiniGameItem(id: number, firstWave = false): MiniGameItem {
  const roll = Math.random();
  const kind: MiniGameItemKind =
    roll < 0.48
      ? "pudding"
      : roll < 0.73
        ? "berry"
        : roll < 0.87
          ? "star"
          : "soap";
  return {
    id,
    kind,
    x: 9 + Math.random() * 82,
    y: firstWave ? -12 - Math.random() * 46 : -14,
    speed: 0.82 + Math.random() * 0.58,
    spin: -16 + Math.random() * 32,
  };
}

function miniGameReward(score: number) {
  return Math.min(75, 10 + Math.max(0, Math.floor(score * 0.75)));
}

function miniGameItemImagePath() {
  return "./purin-game/game-items.webp";
}

function makeInitialState(now = Date.now()): GameState {
  return {
    version: 3,
    petName: "布甸仔",
    level: 1,
    xp: 0,
    coins: 20,
    bond: 0,
    streak: 0,
    lastGiftDate: "",
    createdAt: now,
    lastUpdated: now,
    totalActions: 0,
    growthStageSeen: "child",
    sound: true,
    reminders: false,
    loveNote: DEFAULT_NOTE,
    selectedOutfit: "classic",
    ownedOutfits: ["classic", "soft"],
    selectedScene: "cozy",
    ownedScenes: ["cozy"],
    cooldowns: {
      feed: 0,
      bath: 0,
      play: 0,
      sleep: 0,
      game: 0,
    },
    stats: {
      fullness: 78,
      happiness: 82,
      cleanliness: 86,
      energy: 75,
    },
    lastEventAt: 0,
    pendingEventId: null,
    eventCount: 0,
    expectingUntil: 0,
    familyLastBirthAt: 0,
    children: [],
    log: [],
  };
}

type LegacyState = Partial<GameState> & {
  selectedAccessory?: "beret" | "scarf" | "bow" | "none";
};

function normalizeState(value: LegacyState, now: number): GameState {
  const base = makeInitialState(now);
  const stats = value.stats ?? base.stats;
  const legacyOutfit: Record<string, OutfitId> = {
    beret: "classic",
    none: "soft",
    scarf: "scarf",
    bow: "berry",
  };
  const validOutfits = new Set(OUTFITS.map((item) => item.id));
  const validScenes = new Set(SCENES.map((item) => item.id));
  const migratedOutfit =
    value.selectedOutfit && validOutfits.has(value.selectedOutfit)
      ? value.selectedOutfit
      : legacyOutfit[value.selectedAccessory ?? ""] ?? "classic";
  const ownedOutfits: OutfitId[] = Array.isArray(value.ownedOutfits)
    ? value.ownedOutfits.filter((item): item is OutfitId =>
        validOutfits.has(item),
      )
    : ["classic", "soft", migratedOutfit];
  const selectedScene =
    value.selectedScene && validScenes.has(value.selectedScene)
      ? value.selectedScene
      : "cozy";
  const ownedScenes: SceneId[] = Array.isArray(value.ownedScenes)
    ? value.ownedScenes.filter((item): item is SceneId => validScenes.has(item))
    : ["cozy"];
  const cooldowns = value.cooldowns ?? base.cooldowns;
  const createdAt = Number(value.createdAt) || now;
  const level = Math.max(1, Math.floor(Number(value.level) || 1));
  const derivedGrowthStage = growthStageFor(level, createdAt, now).id;
  const validGrowthStages = new Set<GrowthStageId>(
    GROWTH_STAGES.map((item) => item.id),
  );
  return {
    ...base,
    ...value,
    version: 3,
    lastUpdated: Number(value.lastUpdated) || now,
    createdAt,
    level,
    growthStageSeen:
      value.growthStageSeen && validGrowthStages.has(value.growthStageSeen)
        ? value.growthStageSeen
        : derivedGrowthStage,
    xp: Math.max(0, Number(value.xp) || 0),
    coins: Math.max(0, Math.floor(Number(value.coins) || 0)),
    bond: Math.max(
      0,
      Math.floor(Number(value.bond) || Math.min(180, (value.totalActions ?? 0) * 2)),
    ),
    selectedOutfit: migratedOutfit,
    ownedOutfits: Array.from(
      new Set<OutfitId>([
        "classic" as OutfitId,
        "soft" as OutfitId,
        migratedOutfit,
        ...ownedOutfits,
      ]),
    ),
    selectedScene,
    ownedScenes: Array.from(
      new Set<SceneId>(["cozy" as SceneId, ...ownedScenes]),
    ),
    cooldowns: {
      feed: Number(cooldowns.feed) || 0,
      bath: Number(cooldowns.bath) || 0,
      play: Number(cooldowns.play) || 0,
      sleep: Number(cooldowns.sleep) || 0,
      game: Number(cooldowns.game) || 0,
    },
    stats: {
      fullness: clamp(Number(stats.fullness) || 0),
      happiness: clamp(Number(stats.happiness) || 0),
      cleanliness: clamp(Number(stats.cleanliness) || 0),
      energy: clamp(Number(stats.energy) || 0),
    },
    pendingEventId: RANDOM_EVENTS.some(
      (event) => event.id === value.pendingEventId,
    )
      ? value.pendingEventId ?? null
      : null,
    children: Array.isArray(value.children)
      ? value.children
          .filter(
            (child): child is ChildPet =>
              Boolean(child && child.id && child.name && child.bornAt),
          )
          .slice(0, 3)
      : [],
    log: Array.isArray(value.log) ? value.log.slice(0, 16) : [],
  };
}

function applyTimeDecay(state: GameState, now = Date.now()): GameState {
  const elapsedMinutes = Math.min(
    16 * 60,
    Math.max(0, (now - state.lastUpdated) / 60_000),
  );
  if (elapsedMinutes < 5) return state;

  const nextStats = {
    fullness: clamp(state.stats.fullness - elapsedMinutes / 12),
    happiness: clamp(state.stats.happiness - elapsedMinutes / 22),
    cleanliness: clamp(state.stats.cleanliness - elapsedMinutes / 18),
    energy: clamp(state.stats.energy - elapsedMinutes / 15),
  };

  return { ...state, stats: nextStats, lastUpdated: now };
}

function addRewards(
  state: GameState,
  xpGain: number,
  coinGain: number,
  bondGain = 0,
): { state: GameState; leveled: boolean } {
  let level = state.level;
  let xp = Math.max(0, state.xp + xpGain);
  let leveled = false;

  while (xp >= xpRequired(level)) {
    xp -= xpRequired(level);
    level += 1;
    leveled = true;
  }

  return {
    state: {
      ...state,
      level,
      xp,
      coins: Math.max(0, state.coins + coinGain + (leveled ? 20 : 0)),
      bond: Math.max(0, state.bond + bondGain),
    },
    leveled,
  };
}

function formatLogTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-HK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function defaultPetMessage(state: GameState) {
  const condition = conditionForStats(state.stats);
  const conditionCopy = {
    critical: "我有幾樣嘢都唔舒服，好需要你…",
    hungry: "肚仔咕咕叫，食飽先有力玩～",
    lonely: "我今日有啲靜，想你陪多一陣…",
    dirty: "身上黏笠笠，耳仔都要洗吓喇…",
    sleepy: "眼瞓到企唔穩，想攬住枕頭…",
    radiant: "今日狀態超好！多謝你一直照顧我 ♡",
    content: "",
    calm: "",
  }[condition];
  if (conditionCopy) {
    return conditionCopy;
  }
  const growthStage = growthStageFor(
    state.level,
    state.createdAt,
    Date.now(),
  ).id;
  const growthCopy: Record<GrowthStageId, string> = {
    child: "今日又有咩新嘢玩？摸摸我先啦～",
    teen: "我而家精力充沛，陪我玩一陣啦！",
    adult: "你返嚟喇，我已經識得好好照顧屋企 ♡",
    middle: "慢慢嚟就好，有你陪住就最安心。",
    senior: "我行慢咗少少，但見到你依然最開心 ♡",
  };
  const hour = new Date().getHours();
  if (hour < 11) return "早晨呀！今日都要開心～";
  if (hour >= 22) return "夜喇，我哋一齊唞吓？";
  return growthCopy[growthStage];
}

function chooseEvent(state: GameState, now: number) {
  if (state.pendingEventId) return null;
  if (state.eventCount > 0 && now - state.lastEventAt < EVENT_COOLDOWN_MS) {
    return null;
  }
  const eligible = RANDOM_EVENTS.filter((event) => event.minLevel <= state.level);
  if (!eligible.length) return null;
  const guaranteedFirstEvent = state.eventCount === 0 && state.totalActions >= 2;
  if (!guaranteedFirstEvent && Math.random() > 0.2) return null;
  return eligible[Math.floor(Math.random() * eligible.length)].id;
}

export function PurinPet() {
  const [game, setGame] = useState<GameState>(() => makeInitialState(0));
  const [hydrated, setHydrated] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [closetTab, setClosetTab] = useState<ClosetTab>("outfits");
  const [action, setAction] = useState<PetAction | null>(null);
  const [speech, setSpeech] = useState("你返嚟喇！我等咗你好耐 ♡");
  const [toast, setToast] = useState("");
  const [currentDay, setCurrentDay] = useState("");
  const [clock, setClock] = useState(0);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventResult, setEventResult] = useState("");
  const [eventDisplayId, setEventDisplayId] = useState<string | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("布甸仔");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [miniGame, setMiniGame] = useState<MiniGameState>({
    open: false,
    time: MINI_GAME_DURATION,
    score: 0,
    finished: false,
    playerX: 50,
    combo: 0,
    bestCombo: 0,
    lives: 3,
    feedback: "",
    feedbackId: 0,
    items: [],
  });

  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importInput = useRef<HTMLInputElement | null>(null);
  const actionLock = useRef(false);
  const miniGameItemId = useRef(1);

  const now = clock || game.lastUpdated || 0;
  const condition = useMemo(
    () => conditionForStats(game.stats),
    [game.stats],
  );
  const averageCare = useMemo(() => averageStats(game.stats), [game.stats]);
  const activeEvent = useMemo(
    () =>
      RANDOM_EVENTS.find(
        (event) => event.id === (game.pendingEventId ?? eventDisplayId),
      ) ?? null,
    [eventDisplayId, game.pendingEventId],
  );
  const giftClaimed = currentDay !== "" && game.lastGiftDate === currentDay;
  const levelProgress = Math.min(
    100,
    Math.round((game.xp / xpRequired(game.level)) * 100),
  );
  const togetherDays = daysTogether(game, now || game.createdAt);
  const currentGrowth = useMemo(
    () =>
      growthStageFor(
        game.level,
        game.createdAt,
        now || game.createdAt,
      ),
    [game.createdAt, game.level, now],
  );
  const upcomingGrowth = useMemo(
    () => nextGrowthStage(currentGrowth.id),
    [currentGrowth.id],
  );
  const growthStageIndex = GROWTH_STAGES.findIndex(
    (item) => item.id === currentGrowth.id,
  );
  const growthProgress = upcomingGrowth
    ? Math.round(
        Math.min(
          1,
          Math.max(
            0,
            (game.level - currentGrowth.minLevel) /
              (upcomingGrowth.minLevel - currentGrowth.minLevel),
          ),
          Math.max(
            0,
            (togetherDays - currentGrowth.minDays) /
              (upcomingGrowth.minDays - currentGrowth.minDays),
          ),
        ) * 100,
      )
    : 100;
  const familyCost = 600 + game.children.length * 250;
  const familyBondTarget = 260 + game.children.length * 120;
  const birthGapRemaining =
    game.children.length === 0
      ? 0
      : Math.max(
          0,
          game.familyLastBirthAt + FAMILY_BIRTH_GAP_MS - now,
        );
  const familyRequirements = [
    {
      label: "進入壯年期並達 Lv.18",
      done:
        game.level >= 18 &&
        ["adult", "middle", "senior"].includes(currentGrowth.id),
    },
    { label: `一齊生活滿 14 日（${togetherDays}/14）`, done: togetherDays >= 14 },
    {
      label: `羈絆達 ${familyBondTarget}（${game.bond}/${familyBondTarget}）`,
      done: game.bond >= familyBondTarget,
    },
    {
      label: `照顧度保持 75%（目前 ${averageCare}%）`,
      done: averageCare >= 75,
    },
    {
      label: `準備 ${familyCost} 枚金幣`,
      done: game.coins >= familyCost,
    },
    {
      label:
        birthGapRemaining > 0
          ? `家庭休息期仲有 ${formatCountdown(birthGapRemaining)}`
          : "家庭已準備好迎接新成員",
      done: birthGapRemaining <= 0,
    },
  ];
  const canStartFamily =
    game.children.length < 3 &&
    !game.expectingUntil &&
    familyRequirements.every((requirement) => requirement.done);
  const babyReady =
    Boolean(game.expectingUntil) && now >= game.expectingUntil;
  const gameCooldown = Math.max(0, game.cooldowns.game - now);
  const dateLabel = useMemo(() => {
    if (!currentDay) return "今日";
    const [year, month, day] = currentDay.split("-").map(Number);
    return new Intl.DateTimeFormat("zh-HK", {
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(new Date(year, month - 1, day));
  }, [currentDay]);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      const now = Date.now();
      setClock(now);
      setCurrentDay(localDateKey(new Date(now)));
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const restored = applyTimeDecay(
            normalizeState(JSON.parse(saved), now),
            now,
          );
          setGame(restored);
          setNameDraft(restored.petName);
          setSpeech(defaultPetMessage(restored));
          setEventOpen(Boolean(restored.pendingEventId));
          setEventDisplayId(restored.pendingEventId);
        } else {
          const initial = makeInitialState(now);
          setGame(initial);
          setWelcomeOpen(true);
        }
      } catch {
        const initial = makeInitialState(now);
        setGame(initial);
        setWelcomeOpen(true);
      }
      setHydrated(true);
    }, 0);

    const installHandler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", installHandler);

    if (
      "serviceWorker" in navigator &&
      window.location.hostname !== "terminal.local"
    ) {
      const workerUrl = new URL("./sw.js", window.location.href);
      navigator.serviceWorker.register(workerUrl.pathname).catch(() => {
        // The game still works online if a private browser blocks service workers.
      });
    }

    return () => {
      window.clearTimeout(hydrateTimer);
      window.removeEventListener("beforeinstallprompt", installHandler);
      if (actionTimer.current) clearTimeout(actionTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const clockTimer = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);
    const decayTimer = window.setInterval(() => {
      setCurrentDay(localDateKey());
      setGame((current) => {
        const decayed = applyTimeDecay(current);
        if (
          current.reminders &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          Math.min(...Object.values(decayed.stats)) < 18
        ) {
          new Notification(`${current.petName}掛住你喇`, {
            body: defaultPetMessage(decayed),
            icon: "./icon-192.png",
          });
        }
        return decayed;
      });
    }, 60_000);
    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(decayTimer);
    };
  }, [hydrated]);

  useEffect(() => {
    if (!miniGame.open || miniGame.time <= 0 || miniGame.finished) return;
    const timer = window.setTimeout(() => {
      setMiniGame((current) => ({
        ...current,
        time: Math.max(0, current.time - 1),
      }));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [miniGame.open, miniGame.time, miniGame.finished]);

  useEffect(() => {
    if (!miniGame.open || miniGame.time <= 0 || miniGame.finished) return;
    const gameLoop = window.setInterval(() => {
      setMiniGame((current) => {
        if (!current.open || current.finished || current.time <= 0) {
          return current;
        }

        let score = current.score;
        let combo = current.combo;
        let bestCombo = current.bestCombo;
        let lives = current.lives;
        let feedback = "";
        let feedbackId = current.feedbackId;
        const items: MiniGameItem[] = [];

        for (const item of current.items) {
          const moved = { ...item, y: item.y + item.speed };
          const inBasket =
            moved.y >= 80 &&
            moved.y <= 99 &&
            Math.abs(moved.x - current.playerX) <= 12.5;

          if (inBasket) {
            feedbackId += 1;
            if (moved.kind === "soap") {
              lives = Math.max(0, lives - 1);
              combo = 0;
              score = Math.max(0, score + MINI_GAME_ITEM_SCORE.soap);
              feedback = "撞到泡泡！-1 ♥";
            } else {
              combo += 1;
              bestCombo = Math.max(bestCombo, combo);
              const multiplier = combo >= 5 ? 2 : 1;
              const points = MINI_GAME_ITEM_SCORE[moved.kind] * multiplier;
              score += points;
              feedback =
                combo >= 5 ? `FEVER ×2　+${points}` : `接到！+${points}`;
            }
            continue;
          }

          if (moved.y > 108) {
            if (moved.kind !== "soap") combo = 0;
            continue;
          }
          items.push(moved);
        }

        if (items.length < 6 && Math.random() < 0.075) {
          items.push(makeMiniGameItem(miniGameItemId.current++));
        }

        return {
          ...current,
          time: lives <= 0 ? 0 : current.time,
          score,
          combo,
          bestCombo,
          lives,
          feedback,
          feedbackId,
          items,
        };
      });
    }, 50);
    return () => window.clearInterval(gameLoop);
  }, [miniGame.finished, miniGame.open, miniGame.time]);

  useEffect(() => {
    if (
      !miniGame.open ||
      miniGame.time !== 0 ||
      miniGame.finished
    )
      return;

    const finishTimer = window.setTimeout(() => {
      const countedScore = Math.max(0, miniGame.score);
      const reward = miniGameReward(countedScore);
      setMiniGame((current) => ({ ...current, finished: true }));
      setGame((current) => {
        const rewarded = addRewards(
          {
            ...current,
            stats: {
              ...current.stats,
              happiness: clamp(current.stats.happiness + 15),
              energy: clamp(current.stats.energy - 8),
            },
            totalActions: current.totalActions + 1,
            lastUpdated: Date.now(),
          },
          10 + Math.min(Math.floor(countedScore / 3), 18),
          reward,
          5 + Math.min(miniGame.bestCombo, 8),
        );
        return {
          ...rewarded.state,
          log: [
            {
              id: `${Date.now()}-game-${current.totalActions}`,
              text: `甜品接接樂得到 ${countedScore} 分，最高 ${miniGame.bestCombo} Combo`,
              time: Date.now(),
            },
            ...rewarded.state.log,
          ].slice(0, 16),
        };
      });
    }, 0);
    return () => window.clearTimeout(finishTimer);
  }, [
    miniGame.bestCombo,
    miniGame.finished,
    miniGame.open,
    miniGame.score,
    miniGame.time,
  ]);

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    if (!hydrated || game.growthStageSeen === currentGrowth.id) return;
    const seenIndex = GROWTH_STAGES.findIndex(
      (item) => item.id === game.growthStageSeen,
    );
    if (growthStageIndex <= seenIndex) return;

    const growthTime = now || Date.now();
    const growthTimer = window.setTimeout(() => {
      setGame((current) => {
        if (current.growthStageSeen === currentGrowth.id) return current;
        return {
          ...current,
          growthStageSeen: currentGrowth.id,
          log: [
            {
              id: `${growthTime}-growth-${currentGrowth.id}`,
              text: `${current.petName} 成長到${currentGrowth.label}`,
              time: growthTime,
            },
            ...current.log,
          ].slice(0, 16),
        };
      });
      setSpeech(`我成長到${currentGrowth.label}喇，多謝你一直陪住我 ♡`);
      setToast(`新成長階段：${currentGrowth.label}`);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 2600);
    }, 0);
    return () => window.clearTimeout(growthTimer);
  }, [
    currentGrowth.id,
    currentGrowth.label,
    game.growthStageSeen,
    growthStageIndex,
    hydrated,
    now,
  ]);

  const playTone = (kind: "tap" | "reward" | "soft" = "tap") => {
    if (!game.sound) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === "soft" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(
        kind === "reward" ? 660 : kind === "soft" ? 310 : 480,
        context.currentTime,
      );
      if (kind === "reward") {
        oscillator.frequency.exponentialRampToValueAtTime(
          880,
          context.currentTime + 0.12,
        );
      }
      gain.gain.setValueAtTime(0.06, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.18,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
      oscillator.addEventListener("ended", () => context.close());
    } catch {
      // Sound is a progressive enhancement.
    }
  };

  const animatePet = (
    nextAction: PetAction,
    nextSpeech: string,
    duration = ACTION_DURATION[nextAction] ?? 4200,
  ) => {
    actionLock.current = true;
    setAction(null);
    window.requestAnimationFrame(() => setAction(nextAction));
    setSpeech(nextSpeech);
    if (actionTimer.current) clearTimeout(actionTimer.current);
    actionTimer.current = setTimeout(() => {
      setAction(null);
      setSpeech(defaultPetMessage(game));
      actionLock.current = false;
    }, duration);
    return duration;
  };

  const performAction = (careAction: CareAction) => {
    if (actionLock.current) {
      showToast("等佢完成而家嘅動作先～");
      return;
    }
    const actionTime = clock || game.lastUpdated;
    const availability = actionAvailability(game, careAction, actionTime);
    if (!availability.ready) {
      showToast(
        availability.remaining > 0
          ? `${ACTION_META.find((item) => item.key === careAction)?.shortCooldown}，仲有 ${formatCountdown(availability.remaining)}`
          : availability.reason,
      );
      setSpeech(availability.reason);
      return;
    }

    actionLock.current = true;
    const effect = ACTION_EFFECTS[careAction];
    const nextMessage =
      effect.message[game.totalActions % effect.message.length];
    const need = Math.max(0, 100 - game.stats[effect.target]) / 100;
    const rewardFactor = Math.max(0.55, Math.min(1.15, 0.45 + need));
    const xpGain = Math.max(3, Math.round(effect.xp * rewardFactor));
    const coinGain = Math.max(1, Math.round(effect.coins * rewardFactor));
    const bondGain = Math.max(2, Math.round(effect.bond * rewardFactor));
    const willLevel = game.xp + xpGain >= xpRequired(game.level);
    const eventId = chooseEvent(
      { ...game, totalActions: game.totalActions + 1 },
      actionTime,
    );

    setGame((current) => {
      const checked = actionAvailability(current, careAction, actionTime);
      if (!checked.ready) return current;
      const nextStats = { ...current.stats };
      for (const [key, amount] of Object.entries(effect.stats) as Array<
        [StatKey, number]
      >) {
        nextStats[key] = clamp(nextStats[key] + amount);
      }

      const rewarded = addRewards(
        {
          ...current,
          stats: nextStats,
          cooldowns: {
            ...current.cooldowns,
            [careAction]: actionTime + effect.cooldown,
          },
          totalActions: current.totalActions + 1,
          lastUpdated: actionTime,
          pendingEventId: eventId ?? current.pendingEventId,
        },
        xpGain,
        coinGain,
        bondGain,
      );
      return {
        ...rewarded.state,
        log: [
          {
            id: `${actionTime}-${careAction}-${current.totalActions}`,
            text: effect.log,
            time: actionTime,
          },
          ...rewarded.state.log,
        ].slice(0, 16),
      };
    });

    playTone(careAction === "sleep" ? "soft" : "tap");
    const careDuration = animatePet(careAction, nextMessage);
    showToast(`+${xpGain} XP・+${bondGain} 羈絆`);
    if (willLevel) {
      window.setTimeout(() => {
        playTone("reward");
        animatePet("level", "升級喇！有你照顧真係好幸福～");
        showToast("升級獎勵：20 枚金幣");
      }, careDuration + 180);
    }
    if (eventId) {
      window.setTimeout(() => {
        setEventResult("");
        setEventDisplayId(eventId);
        setEventOpen(true);
        setSpeech("咦？好似有啲事情發生緊！");
      }, careDuration + (willLevel ? ACTION_DURATION.level + 450 : 450));
    }
  };

  const claimGift = () => {
    if (!currentDay) return;
    if (giftClaimed) {
      showToast("今日已經拆過禮物喇，聽日再嚟！");
      return;
    }
    if (actionLock.current) {
      showToast("等佢完成而家嘅動作先～");
      return;
    }
    actionLock.current = true;

    const today = currentDay;
    const [year, month, day] = today.split("-").map(Number);
    const yesterday = localDateKey(new Date(year, month - 1, day - 1));
    setGame((current) => {
      if (current.lastGiftDate === today) return current;
      const nextStreak =
        current.lastGiftDate === yesterday ? current.streak + 1 : 1;
      const rewarded = addRewards(
        {
          ...current,
          streak: nextStreak,
          lastGiftDate: today,
          totalActions: current.totalActions + 1,
          lastUpdated: Date.now(),
        },
        12,
        30,
        8,
      );
      return {
        ...rewarded.state,
        log: [
          {
            id: `${Date.now()}-gift-${current.totalActions}`,
            text: "拆咗每日禮物，收到 30 枚金幣",
            time: Date.now(),
          },
          ...rewarded.state.log,
        ].slice(0, 16),
      };
    });
    playTone("reward");
    animatePet("gift", "係每日禮物呀！多謝你日日返嚟～");
    showToast("收到 30 枚金幣＋12 XP＋8 羈絆");
  };

  const startMiniGame = () => {
    const gameTime = clock || game.lastUpdated;
    const remaining = Math.max(0, game.cooldowns.game - gameTime);
    if (remaining > 0) {
      showToast(`小遊戲要休息，仲有 ${formatCountdown(remaining)}`);
      return;
    }
    if (game.stats.energy < 20 || game.stats.fullness < 15) {
      showToast("要先食飽同休息好，先有力玩小遊戲");
      setSpeech("我而家冇乜力，照顧我先吖…");
      return;
    }
    setGame((current) => ({
      ...current,
      cooldowns: {
        ...current.cooldowns,
        game: gameTime + 5 * 60_000,
      },
    }));
    miniGameItemId.current = 4;
    setMiniGame({
      open: true,
      time: MINI_GAME_DURATION,
      score: 0,
      finished: false,
      playerX: 50,
      combo: 0,
      bestCombo: 0,
      lives: 3,
      feedback: "",
      feedbackId: 0,
      items: [
        makeMiniGameItem(1, true),
        makeMiniGameItem(2, true),
        makeMiniGameItem(3, true),
      ],
    });
    playTone("tap");
  };

  const moveMiniGameBasket = (clientX: number, field: HTMLElement) => {
    if (miniGame.finished || miniGame.time <= 0) return;
    const bounds = field.getBoundingClientRect();
    const playerX = clamp(((clientX - bounds.left) / bounds.width) * 100, 8, 92);
    setMiniGame((current) => ({
      ...current,
      playerX,
    }));
  };

  const finishWelcome = () => {
    const cleaned = nameDraft.trim().slice(0, 8) || "布甸仔";
    setGame((current) => ({ ...current, petName: cleaned }));
    setWelcomeOpen(false);
    setSpeech(`我叫${cleaned}！以後請多多照顧 ♡`);
    showToast("你哋嘅第一日開始喇");
    playTone("reward");
  };

  const saveSettingsName = () => {
    const cleaned = nameDraft.trim().slice(0, 8) || "布甸仔";
    setGame((current) => ({ ...current, petName: cleaned }));
    showToast("名仔已經改好");
  };

  const toggleReminders = async () => {
    if (!("Notification" in window)) {
      showToast("呢個瀏覽器暫時唔支援通知");
      return;
    }
    if (!game.reminders && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("未有通知權限，之後可喺瀏覽器設定開返");
        return;
      }
    }
    setGame((current) => ({ ...current, reminders: !current.reminders }));
  };

  const installApp = async () => {
    if (!installPrompt) {
      showToast("iPhone：撳 Safari 分享，再揀「加入主畫面」");
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  const exportSave = () => {
    const file = new Blob([JSON.stringify(game, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purin-pet-${localDateKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("進度檔已匯出");
  };

  const importSave = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const restored = applyTimeDecay(
          normalizeState(JSON.parse(String(reader.result)), Date.now()),
        );
        setGame(restored);
        setNameDraft(restored.petName);
        setSpeech("進度返晒嚟喇！");
        setEventOpen(Boolean(restored.pendingEventId));
        setEventResult("");
        setClock(Date.now());
        showToast("進度匯入成功");
      } catch {
        showToast("呢個進度檔讀唔到");
      }
    };
    reader.readAsText(file);
  };

  const resetGame = () => {
    if (!window.confirm("真係要重新開始？現有進度會被清除。")) return;
    const fresh = makeInitialState();
    window.localStorage.removeItem(STORAGE_KEY);
    setGame(fresh);
    setNameDraft(fresh.petName);
    setPanel(null);
    setEventOpen(false);
    setEventResult("");
    setEventDisplayId(null);
    setWelcomeOpen(true);
    showToast("已經重新開始");
  };

  const chooseOutfit = (outfit: (typeof OUTFITS)[number]) => {
    if (game.level < outfit.level) {
      showToast(`成長到 Lv.${outfit.level} 先會出現`);
      return;
    }
    if (game.ownedOutfits.includes(outfit.id)) {
      setGame((current) => ({ ...current, selectedOutfit: outfit.id }));
      setSpeech(`今日着${outfit.label}，好睇嗎？`);
      playTone("tap");
      return;
    }
    if (game.coins < outfit.price) {
      showToast(`仲差 ${outfit.price - game.coins} 枚金幣`);
      return;
    }
    setGame((current) => ({
      ...(current.ownedOutfits.includes(outfit.id) ||
      current.level < outfit.level ||
      current.coins < outfit.price
        ? { ...current, selectedOutfit: current.ownedOutfits.includes(outfit.id) ? outfit.id : current.selectedOutfit }
        : {
            ...current,
            coins: current.coins - outfit.price,
            selectedOutfit: outfit.id,
            ownedOutfits: [...current.ownedOutfits, outfit.id],
            log: [
              {
                id: `${clock || current.lastUpdated}-outfit-${outfit.id}`,
                text: `解鎖咗「${outfit.label}」`,
                time: clock || current.lastUpdated,
              },
              ...current.log,
            ].slice(0, 16),
          }),
    }));
    setSpeech(`新衫好啱身！呢套叫${outfit.label}～`);
    showToast(`已解鎖 ${outfit.label}`);
    playTone("reward");
  };

  const chooseScene = (scene: (typeof SCENES)[number]) => {
    if (game.level < scene.level) {
      showToast(`成長到 Lv.${scene.level} 先會發現呢個地方`);
      return;
    }
    if (game.ownedScenes.includes(scene.id)) {
      setGame((current) => ({ ...current, selectedScene: scene.id }));
      setSpeech(`${scene.label}真係好舒服～`);
      playTone("tap");
      return;
    }
    if (game.coins < scene.price) {
      showToast(`仲差 ${scene.price - game.coins} 枚金幣`);
      return;
    }
    setGame((current) => ({
      ...(current.ownedScenes.includes(scene.id) ||
      current.level < scene.level ||
      current.coins < scene.price
        ? { ...current, selectedScene: current.ownedScenes.includes(scene.id) ? scene.id : current.selectedScene }
        : {
            ...current,
            coins: current.coins - scene.price,
            selectedScene: scene.id,
            ownedScenes: [...current.ownedScenes, scene.id],
            log: [
              {
                id: `${clock || current.lastUpdated}-scene-${scene.id}`,
                text: `解鎖咗新場景「${scene.label}」`,
                time: clock || current.lastUpdated,
              },
              ...current.log,
            ].slice(0, 16),
          }),
    }));
    setSpeech(`我哋有新地方去喇：${scene.label}！`);
    showToast(`已解鎖 ${scene.label}`);
    playTone("reward");
  };

  const resolveEvent = (choiceIndex: 0 | 1) => {
    if (!activeEvent) return;
    const choice = activeEvent.choices[choiceIndex];
    const eventTime = clock || game.lastUpdated;
    setGame((current) => {
      if (current.pendingEventId !== activeEvent.id) return current;
      const nextStats = { ...current.stats };
      for (const [key, amount] of Object.entries(
        choice.effects.stats ?? {},
      ) as Array<[StatKey, number]>) {
        nextStats[key] = clamp(nextStats[key] + amount);
      }
      const rewarded = addRewards(
        {
          ...current,
          stats: nextStats,
          pendingEventId: null,
          eventCount: current.eventCount + 1,
          lastEventAt: eventTime,
          lastUpdated: eventTime,
        },
        choice.effects.xp,
        choice.effects.coins,
        choice.effects.bond,
      );
      return {
        ...rewarded.state,
        log: [
          {
            id: `${eventTime}-event-${activeEvent.id}`,
            text: `${activeEvent.title}：${choice.label}`,
            time: eventTime,
          },
          ...rewarded.state.log,
        ].slice(0, 16),
      };
    });
    setEventResult(choice.result);
    animatePet("event", choice.result);
    playTone("reward");
  };

  const startFamily = () => {
    if (!canStartFamily) {
      showToast("仲有家庭條件未完成");
      return;
    }
    const familyTime = clock || game.lastUpdated;
    const readyAt = familyTime + FAMILY_WAIT_MS;
    setGame((current) => {
      if (current.expectingUntil || current.coins < familyCost) return current;
      return {
        ...current,
        coins: current.coins - familyCost,
        expectingUntil: readyAt,
        log: [
          {
            id: `${familyTime}-family-plan`,
            text: "準備好小搖籃，開始期待新家庭成員",
            time: familyTime,
          },
          ...current.log,
        ].slice(0, 16),
      };
    });
    setSpeech("我哋屋企聽日會多一位小成員喇 ♡");
    showToast("小寶寶將會喺 24 小時後出生");
    playTone("reward");
  };

  const welcomeBaby = () => {
    const birthTime = clock || game.lastUpdated;
    if (!game.expectingUntil || birthTime < game.expectingUntil) {
      showToast("小寶寶仲準備緊，耐心等多陣～");
      return;
    }
    const babyNames = ["奶糖", "麻糬", "曲奇", "蜜桃", "忌廉", "焦糖"];
    const traits = ["愛笑", "好奇", "黏人", "為食", "活潑", "貪睡"];
    const colors: ChildPet["color"][] = [
      "custard",
      "caramel",
      "cream",
      "berry",
    ];
    const index = game.children.length;
    const baby: ChildPet = {
      id: `${birthTime}-baby-${index}`,
      name: babyNames[(birthTime + index) % babyNames.length],
      bornAt: birthTime,
      color: colors[(game.eventCount + index) % colors.length],
      trait: traits[(game.totalActions + index) % traits.length],
    };
    setGame((current) => {
      if (!current.expectingUntil || birthTime < current.expectingUntil) {
        return current;
      }
      return {
        ...current,
        expectingUntil: 0,
        familyLastBirthAt: birthTime,
        children: [...current.children, baby].slice(0, 3),
        bond: current.bond + 30,
        stats: {
          ...current.stats,
          happiness: clamp(current.stats.happiness + 20),
        },
        log: [
          {
            id: `${birthTime}-baby-born`,
            text: `小寶寶「${baby.name}」出生喇`,
            time: birthTime,
          },
          ...current.log,
        ].slice(0, 16),
      };
    });
    animatePet("baby", `歡迎${baby.name}！我哋成為一家人喇 ♡`);
    showToast(`${baby.name} 出生喇！家庭羈絆 +30`);
    playTone("reward");
  };

  const renameChild = (id: string, name: string) => {
    const cleaned = name.slice(0, 8);
    setGame((current) => ({
      ...current,
      children: current.children.map((child) =>
        child.id === id ? { ...child, name: cleaned } : child,
      ),
    }));
  };

  const openCloset = (tab: ClosetTab) => {
    setClosetTab(tab);
    setPanel("closet");
  };

  const dismissEvent = () => {
    setEventOpen(false);
    setEventResult("");
    if (!game.pendingEventId) setEventDisplayId(null);
    playTone("tap");
  };

  return (
    <main
      className={`pet-app condition-${condition} ${
        hydrated ? "is-ready" : ""
      }`}
    >
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{dateLabel}</p>
            <h1>
              Purin Pet <span aria-hidden="true">♡</span>
            </h1>
          </div>
          <div className="topbar-actions">
            <button
              className="bond-pill"
              onClick={() => setPanel("family")}
              aria-label={`${game.bond} 點羈絆，打開家庭小屋`}
            >
              <span aria-hidden="true">♥</span>
              <strong>{game.bond}</strong>
            </button>
            <button
              className="currency-pill"
              onClick={claimGift}
              aria-label={`${game.coins} 枚金幣，查看每日禮物`}
            >
              <span className="coin-symbol">P</span>
              <strong>{game.coins}</strong>
            </button>
            <button
              className="icon-button"
              onClick={() => setPanel("settings")}
              aria-label="開啟設定"
            >
              <span aria-hidden="true">••</span>
            </button>
          </div>
        </header>

        <section className="level-row" aria-label="成長進度">
          <button
            className="level-badge growth-open-button"
            onClick={() => setPanel("growth")}
            aria-label={`Lv.${game.level}，目前${currentGrowth.label}，打開成長足跡`}
          >
            Lv.{game.level} · {currentGrowth.shortLabel}
          </button>
          <div
            className="level-track"
            role="progressbar"
            aria-label="經驗值"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={levelProgress}
          >
            <span style={{ width: `${levelProgress}%` }} />
          </div>
          <span className="xp-copy">
            {game.xp}/{xpRequired(game.level)}
          </span>
        </section>

        <section className="stats-grid" aria-label="寵物狀態">
          {STAT_META.map((stat) => {
            const value = game.stats[stat.key];
            return (
            <article
              className={`stat-card ${
                value < 20 ? "is-critical" : value < 40 ? "is-low" : "is-good"
              }`}
              key={stat.key}
            >
              <div className="stat-heading">
                <span
                  className="stat-icon"
                  style={{ color: stat.color }}
                  aria-hidden="true"
                >
                  {stat.icon}
                </span>
                <span className="stat-copy">
                  <span>{stat.label}</span>
                  <small>{statStateLabel(value)}</small>
                </span>
                <strong>{Math.round(value)}</strong>
              </div>
              <div
                className="stat-track"
                role="progressbar"
                aria-label={stat.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(value)}
              >
                <span
                  style={{
                    width: `${value}%`,
                    backgroundColor: stat.color,
                  }}
                />
              </div>
            </article>
          )})}
        </section>

        <section
          className={`pet-room illustrated-room scene-${game.selectedScene} action-${
            action ?? "idle"
          } condition-${condition}`}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x =
              ((event.clientX - bounds.left) / bounds.width - 0.5) * -12;
            const y =
              ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
            event.currentTarget.style.setProperty("--room-x", `${x}px`);
            event.currentTarget.style.setProperty("--room-y", `${y}px`);
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.setProperty("--room-x", "0px");
            event.currentTarget.style.setProperty("--room-y", "0px");
          }}
        >
          <PurinScene scene={game.selectedScene} />
          <div className="room-topline">
            <button
              className={`daily-gift ${giftClaimed ? "is-claimed" : ""}`}
              onClick={claimGift}
              aria-label={giftClaimed ? "今日禮物已領取" : "領取每日禮物"}
            >
              <span className="gift-box" aria-hidden="true">
                {giftClaimed ? "✓" : "♡"}
              </span>
              <span>
                <strong>{giftClaimed ? "已拆禮物" : "每日禮物"}</strong>
                <small>{game.streak || 0} 日相見</small>
              </span>
            </button>
            {activeEvent && (
              <button
                className="event-alert"
                onClick={() => {
                  setEventResult("");
                  setEventOpen(true);
                }}
              >
                <span aria-hidden="true">!</span>
                突發事件
              </button>
            )}
            <button
              className="journal-button"
              onClick={() => setPanel("journal")}
              aria-label="打開成長日記"
            >
              <span aria-hidden="true">↗</span>
              日記
            </button>
          </div>

          <div className="window-scene" aria-hidden="true">
            <span className="cloud cloud-one" />
            <span className="cloud cloud-two" />
            <span className="sun" />
          </div>

          <div className="speech-bubble" role="status">
            {speech}
          </div>

          <div className="pet-stage">
            <div className="mascot-wrap">
              <PurinMascot
                outfit={game.selectedOutfit}
                condition={condition}
                action={action}
                name={game.petName}
                growthStage={currentGrowth.id}
                interactive
              />
            </div>

            {game.children.slice(0, 3).map((child, index) => (
              <div
                className={`baby-mascot baby-${index + 1} baby-${child.color}`}
                key={child.id}
              >
                <PurinMascot
                  outfit="soft"
                  condition="content"
                  action={action === "baby" ? "baby" : null}
                  name={child.name}
                  baby
                />
              </div>
            ))}

            <div className="action-particles" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="nameplate">
            <span className="online-dot" />
            <strong>{game.petName}</strong>
            <span>
              {conditionLabel(condition)} · {currentGrowth.label}
            </span>
          </div>

          <div className="room-rug" aria-hidden="true" />
          <div className="toy-ball" aria-hidden="true" />
          <div className="pudding-stool" aria-hidden="true">
            <span />
          </div>
        </section>

        <button
          className="love-note"
          onClick={() =>
            setSpeech(
              speech === game.loveNote
                ? defaultPetMessage(game)
                : game.loveNote,
            )
          }
        >
          <span className="note-heart" aria-hidden="true">
            ♥
          </span>
          <span>
            <small>今日小紙條</small>
            <strong>{game.loveNote}</strong>
          </span>
          <span className="note-arrow" aria-hidden="true">
            ›
          </span>
        </button>

        <nav className="care-dock" aria-label="照顧選單">
          {ACTION_META.map((item) => {
            const availability = actionAvailability(game, item.key, now);
            const disabled = !availability.ready || Boolean(action);
            return (
            <button
              key={item.key}
              onClick={() => performAction(item.key)}
              className={`${action === item.key ? "is-active" : ""} ${
                disabled ? "is-unavailable" : ""
              }`}
              aria-label={`${item.label}，${
                availability.remaining > 0
                  ? `仲有 ${formatCountdown(availability.remaining)}`
                  : availability.reason
              }`}
              disabled={disabled}
            >
              <span className={`care-icon icon-${item.key}`} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
              <small>
                {availability.remaining > 0
                  ? formatCountdown(availability.remaining)
                  : availability.ready
                    ? "可以做"
                    : availability.reason}
              </small>
            </button>
          )})}
          <button
            onClick={startMiniGame}
            aria-label="打開接布甸小遊戲"
            disabled={
              gameCooldown > 0 ||
              game.stats.energy < 20 ||
              game.stats.fullness < 15
            }
            className={
              gameCooldown > 0 ||
              game.stats.energy < 20 ||
              game.stats.fullness < 15
                ? "is-unavailable"
                : ""
            }
          >
            <span className="care-icon icon-game" aria-hidden="true">
              P
            </span>
            <span>小遊戲</span>
            <small>
              {gameCooldown > 0
                ? formatCountdown(gameCooldown)
                : game.stats.energy < 20 || game.stats.fullness < 15
                  ? "未夠力"
                  : "可以玩"}
            </small>
          </button>
        </nav>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {welcomeOpen && hydrated && (
        <div className="modal-backdrop welcome-backdrop">
          <section
            className="modal-card welcome-card"
            role="dialog"
            aria-modal
            aria-labelledby="welcome-title"
          >
            <div className="welcome-pet">
              <PurinMascot
                outfit="classic"
                condition="radiant"
                name="你嘅小狗"
                growthStage="child"
              />
            </div>
            <p className="eyebrow">你哋嘅第一日</p>
            <h2 id="welcome-title">幫小狗改個名吖</h2>
            <p>佢會記住你每次返嚟、陪佢玩，同埋你哋一齊生活嘅日子。</p>
            <label className="field-label">
              小狗名
              <input
                value={nameDraft}
                maxLength={8}
                onChange={(event) => setNameDraft(event.target.value)}
                autoFocus
              />
            </label>
            <button className="primary-button" onClick={finishWelcome}>
              開始一齊生活
            </button>
          </section>
        </div>
      )}

      {panel && (
        <div className="modal-backdrop" onMouseDown={() => setPanel(null)}>
          <section
            className="bottom-sheet"
            role="dialog"
            aria-modal
            aria-label={
              panel === "journal"
                ? "成長日記"
                : panel === "growth"
                  ? "成長足跡"
                  : panel === "closet"
                    ? "衣櫃"
                    : panel === "family"
                      ? "家庭小屋"
                      : "設定"
            }
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <header className="sheet-header">
              <div>
                <p className="eyebrow">
                  {panel === "journal"
                    ? "OUR DAYS"
                    : panel === "growth"
                      ? "LIFE STAGES"
                      : panel === "closet"
                        ? "DRESS UP"
                        : panel === "family"
                          ? "OUR FAMILY"
                          : "MY PET"}
                </p>
                <h2>
                  {panel === "journal"
                    ? "成長日記"
                    : panel === "growth"
                      ? "成長足跡"
                      : panel === "closet"
                        ? "小小衣櫃"
                        : panel === "family"
                          ? "家庭小屋"
                          : "設定"}
                </h2>
              </div>
              <button
                className="close-button"
                onClick={() => setPanel(null)}
                aria-label="關閉"
              >
                ×
              </button>
            </header>

            {panel === "journal" && (
              <div className="sheet-content">
                <div className="summary-cards">
                  <article>
                    <strong>{game.totalActions}</strong>
                    <span>次照顧</span>
                  </article>
                  <article>
                    <strong>{game.streak}</strong>
                    <span>日相見</span>
                  </article>
                  <article>
                    <strong>{game.level}</strong>
                    <span>成長等級</span>
                  </article>
                </div>
                <div className="timeline">
                  {game.log.length === 0 ? (
                    <div className="empty-state">
                      <span>♡</span>
                      <p>第一篇日記，等你哋一齊寫。</p>
                    </div>
                  ) : (
                    game.log.map((entry) => (
                      <article key={entry.id}>
                        <span className="timeline-dot" />
                        <div>
                          <strong>{entry.text}</strong>
                          <small>{formatLogTime(entry.time)}</small>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}

            {panel === "growth" && (
              <div className="sheet-content growth-content">
                <section className="growth-hero">
                  <div className="growth-hero-pet">
                    <PurinMascot
                      outfit={game.selectedOutfit}
                      condition={condition}
                      name={game.petName}
                      growthStage={currentGrowth.id}
                    />
                  </div>
                  <div className="growth-hero-copy">
                    <span className="growth-stage-badge">
                      第 {growthStageIndex + 1} / {GROWTH_STAGES.length} 階段
                    </span>
                    <p className="eyebrow">{currentGrowth.personality}</p>
                    <h3>{currentGrowth.label}</h3>
                    <p>{currentGrowth.description}</p>
                  </div>
                  <div
                    className="growth-ring"
                    style={{
                      background: `conic-gradient(#d77855 ${growthProgress}%, rgba(121, 72, 47, 0.12) 0)`,
                    }}
                    role="progressbar"
                    aria-label={
                      upcomingGrowth
                        ? `前往${upcomingGrowth.label}嘅進度`
                        : "已完成所有成長階段"
                    }
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={growthProgress}
                  >
                    <span>
                      <strong>{growthProgress}%</strong>
                      <small>{upcomingGrowth ? "下一階段" : "圓滿"}</small>
                    </span>
                  </div>
                </section>

                <section className="growth-next-card">
                  {upcomingGrowth ? (
                    <>
                      <span className="growth-next-icon" aria-hidden="true">
                        {upcomingGrowth.icon}
                      </span>
                      <div>
                        <p className="eyebrow">下一階段 · {upcomingGrowth.label}</p>
                        <h3>
                          仲需要
                          {Math.max(0, upcomingGrowth.minLevel - game.level) > 0
                            ? ` ${Math.max(0, upcomingGrowth.minLevel - game.level)} 級`
                            : ""}
                          {Math.max(0, upcomingGrowth.minLevel - game.level) > 0 &&
                          Math.max(0, upcomingGrowth.minDays - togetherDays) > 0
                            ? " 同"
                            : ""}
                          {Math.max(0, upcomingGrowth.minDays - togetherDays) > 0
                            ? ` ${Math.max(0, upcomingGrowth.minDays - togetherDays)} 日`
                            : ""}
                          {Math.max(0, upcomingGrowth.minLevel - game.level) === 0 &&
                          Math.max(0, upcomingGrowth.minDays - togetherDays) === 0
                            ? " 等成長記錄更新"
                            : ""}
                        </h3>
                        <p>
                          必須同時達到 Lv.{upcomingGrowth.minLevel}，並一齊生活滿{" "}
                          {upcomingGrowth.minDays} 日；短時間重複撳按鈕唔會跳過時間。
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="growth-next-icon is-heart" aria-hidden="true">
                        ♡
                      </span>
                      <div>
                        <p className="eyebrow">一生相伴</p>
                        <h3>所有成長階段都完成喇</h3>
                        <p>
                          老年期唔代表完結。佢唔會離開或者死亡，仍然可以換衫、
                          去旅行，同你慢慢累積新回憶。
                        </p>
                      </div>
                    </>
                  )}
                </section>

                <section
                  className="growth-shape-gallery"
                  aria-label="五個年齡嘅可愛身形變化"
                >
                  <header>
                    <div>
                      <p className="eyebrow">BODY EVOLUTION</p>
                      <h3>由幼小到白髮都係佢</h3>
                    </div>
                    <span>5 種身形</span>
                  </header>
                  <div>
                    {GROWTH_STAGES.map((stage, index) => (
                      <article
                        className={
                          stage.id === currentGrowth.id ? "is-current" : ""
                        }
                        key={stage.id}
                      >
                        <span className="growth-shape-pet" aria-hidden="true">
                          <PurinMascot
                            outfit="soft"
                            condition="content"
                            name={stage.label}
                            growthStage={stage.id}
                          />
                        </span>
                        <strong>{stage.label}</strong>
                        <small>
                          {index <= growthStageIndex
                            ? stage.id === currentGrowth.id
                              ? "現在"
                              : "回憶"
                            : `Lv.${stage.minLevel}`}
                        </small>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="growth-timeline" aria-label="五個成長階段">
                  {GROWTH_STAGES.map((stage, index) => {
                    const unlocked = index <= growthStageIndex;
                    const selected = stage.id === currentGrowth.id;
                    return (
                      <article
                        className={`${unlocked ? "is-unlocked" : "is-locked"} ${
                          selected ? "is-current" : ""
                        }`}
                        key={stage.id}
                      >
                        <div className="growth-node" aria-hidden="true">
                          <span>{unlocked ? stage.icon : "○"}</span>
                        </div>
                        <div>
                          <header>
                            <strong>{stage.label}</strong>
                            <small>
                              {selected
                                ? "而家"
                                : unlocked
                                  ? "已經歷"
                                  : `Lv.${stage.minLevel} · 第 ${stage.minDays} 日`}
                            </small>
                          </header>
                          <p>{stage.description}</p>
                        </div>
                      </article>
                    );
                  })}
                </section>
              </div>
            )}

            {panel === "closet" && (
              <div className="sheet-content">
                <div className="closet-switch" role="tablist">
                  <button
                    className={closetTab === "outfits" ? "is-active" : ""}
                    onClick={() => setClosetTab("outfits")}
                    role="tab"
                    aria-selected={closetTab === "outfits"}
                  >
                    服裝 <span>{OUTFITS.length}</span>
                  </button>
                  <button
                    className={closetTab === "scenes" ? "is-active" : ""}
                    onClick={() => setClosetTab("scenes")}
                    role="tab"
                    aria-selected={closetTab === "scenes"}
                  >
                    場景 <span>{SCENES.length}</span>
                  </button>
                </div>
                <p className="sheet-copy">
                  先陪佢成長到指定等級，再用照顧賺到嘅金幣永久解鎖。
                  已經擁有嘅服裝同場景可以隨時免費更換。
                </p>
                {closetTab === "outfits" ? (
                  <div className="closet-grid outfit-grid">
                    {[...OUTFITS]
                      .sort((a, b) => a.level - b.level)
                      .map((item) => {
                      const levelLocked = game.level < item.level;
                      const owned = game.ownedOutfits.includes(item.id);
                      const selected = game.selectedOutfit === item.id;
                      return (
                        <button
                          key={item.id}
                          className={`${selected ? "is-selected" : ""} ${
                            levelLocked ? "is-locked" : ""
                          }`}
                          onClick={() => chooseOutfit(item)}
                        >
                          {(["banana", "pudding", "sushi", "ufo"] as OutfitId[]).includes(
                            item.id,
                          ) && (
                            <span className="item-badge is-funny">搞怪</span>
                          )}
                          <span className="closet-preview mascot-preview">
                            <PurinMascot
                              outfit={item.id}
                              condition="content"
                              name={item.label}
                            />
                          </span>
                          <strong>{item.label}</strong>
                          <span className="item-description">
                            {item.description}
                          </span>
                          <small>
                            {levelLocked
                              ? `Lv.${item.level} 先解鎖`
                              : selected
                                ? "穿戴中"
                                : owned
                                  ? "已擁有・撳一下換上"
                                  : `${item.price} P 解鎖`}
                          </small>
                        </button>
                      );
                      })}
                  </div>
                ) : (
                  <div className="closet-grid scene-grid">
                    {[...SCENES]
                      .sort((a, b) => a.level - b.level)
                      .map((item) => {
                      const levelLocked = game.level < item.level;
                      const owned = game.ownedScenes.includes(item.id);
                      const selected = game.selectedScene === item.id;
                      return (
                        <button
                          key={item.id}
                          className={`${selected ? "is-selected" : ""} ${
                            levelLocked ? "is-locked" : ""
                          }`}
                          onClick={() => chooseScene(item)}
                        >
                          <span
                            className={`closet-preview scene-preview preview-${item.id}`}
                            aria-hidden="true"
                            style={{
                              backgroundImage: `url("${sceneImagePath(item.id)}")`,
                            }}
                          >
                            {item.symbol}
                          </span>
                          <strong>{item.label}</strong>
                          <span className="item-description">
                            {item.description}
                          </span>
                          <small>
                            {levelLocked
                              ? `Lv.${item.level} 先解鎖`
                              : selected
                                ? "使用中"
                                : owned
                                  ? "已擁有・撳一下更換"
                                  : `${item.price} P 解鎖`}
                          </small>
                        </button>
                      );
                      })}
                  </div>
                )}
              </div>
            )}

            {panel === "family" && (
              <div className="sheet-content family-content">
                <section className="family-hero">
                  <div className="family-hero-pet">
                    <PurinMascot
                      outfit={game.selectedOutfit}
                      condition={condition}
                      name={game.petName}
                      growthStage={currentGrowth.id}
                    />
                  </div>
                  <div>
                    <p className="eyebrow">羈絆 {game.bond}</p>
                    <h3>
                      {game.children.length
                        ? `${game.children.length + 1} 位家庭成員`
                        : "未來嘅家庭"}
                    </h3>
                    <p>
                      呢個係非常後期嘅成長目標。要真正陪伴足夠日子、進入壯年期，
                      先可以準備迎接小寶寶。
                    </p>
                  </div>
                </section>

                {game.expectingUntil ? (
                  <section className={`nursery-card ${babyReady ? "is-ready" : ""}`}>
                    <span className="nursery-egg" aria-hidden="true">
                      ♡
                    </span>
                    <div>
                      <p className="eyebrow">小搖籃準備中</p>
                      <h3>{babyReady ? "小寶寶準備出生喇！" : "聽日就會見面"}</h3>
                      <p>
                        {babyReady
                          ? "一家人都已經準備好，撳下面按鈕迎接新成員。"
                          : `仲有 ${formatCountdown(game.expectingUntil - now)}。等候期間都要保持好好照顧自己。`}
                      </p>
                    </div>
                    <button
                      className="primary-button"
                      onClick={welcomeBaby}
                      disabled={!babyReady}
                    >
                      {babyReady ? "迎接小寶寶" : "耐心等待中"}
                    </button>
                  </section>
                ) : game.children.length < 3 ? (
                  <section className="family-plan-card">
                    <header>
                      <div>
                        <p className="eyebrow">後期家庭任務</p>
                        <h3>
                          {game.children.length
                            ? "準備下一位小寶寶"
                            : "解鎖生孩子功能"}
                        </h3>
                      </div>
                      <span>{familyRequirements.filter((item) => item.done).length}/6</span>
                    </header>
                    <ul className="requirement-list">
                      {familyRequirements.map((requirement) => (
                        <li
                          className={requirement.done ? "is-done" : ""}
                          key={requirement.label}
                        >
                          <span aria-hidden="true">
                            {requirement.done ? "✓" : "○"}
                          </span>
                          {requirement.label}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="primary-button"
                      onClick={startFamily}
                      disabled={!canStartFamily}
                    >
                      {canStartFamily
                        ? `用 ${familyCost} P 準備小搖籃`
                        : "完成以上條件後開放"}
                    </button>
                    <p className="family-note">
                      開始後需要等待 24 小時；每次迎接新成員後，家庭會休息 7 日。
                    </p>
                  </section>
                ) : (
                  <section className="family-complete-card">
                    <span aria-hidden="true">♥</span>
                    <h3>你哋嘅小家庭圓滿喇</h3>
                    <p>三位小寶寶都會喺主畫面陪住你哋生活。</p>
                  </section>
                )}

                {game.children.length > 0 && (
                  <section className="children-list">
                    <header>
                      <p className="eyebrow">小寶寶名冊</p>
                      <h3>屋企嘅新成員</h3>
                    </header>
                    {game.children.map((child) => (
                      <article key={child.id}>
                        <div className={`child-avatar child-${child.color}`}>
                          <PurinMascot
                            outfit="soft"
                            condition="content"
                            name={child.name}
                            baby
                          />
                        </div>
                        <label>
                          <input
                            value={child.name}
                            maxLength={8}
                            aria-label="小寶寶名字"
                            onChange={(event) =>
                              renameChild(child.id, event.target.value)
                            }
                          />
                          <small>
                            個性：{child.trait} ·{" "}
                            {new Intl.DateTimeFormat("zh-HK", {
                              month: "numeric",
                              day: "numeric",
                            }).format(child.bornAt)}
                            出生
                          </small>
                        </label>
                      </article>
                    ))}
                  </section>
                )}
              </div>
            )}

            {panel === "settings" && (
              <div className="sheet-content settings-content">
                <div className="settings-section">
                  <label className="field-label">
                    小狗名
                    <span className="inline-field">
                      <input
                        value={nameDraft}
                        maxLength={8}
                        onChange={(event) => setNameDraft(event.target.value)}
                      />
                      <button onClick={saveSettingsName}>儲存</button>
                    </span>
                  </label>
                  <label className="field-label">
                    今日小紙條
                    <textarea
                      value={game.loveNote}
                      maxLength={42}
                      rows={2}
                      onChange={(event) =>
                        setGame((current) => ({
                          ...current,
                          loveNote: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="settings-list">
                  <button
                    onClick={() =>
                      setGame((current) => ({
                        ...current,
                        sound: !current.sound,
                      }))
                    }
                  >
                    <span>
                      <strong>遊戲聲效</strong>
                      <small>餵食、升級同小遊戲提示聲</small>
                    </span>
                    <span
                      className={`toggle ${game.sound ? "is-on" : ""}`}
                      aria-label={game.sound ? "已開啟" : "已關閉"}
                    />
                  </button>
                  <button onClick={toggleReminders}>
                    <span>
                      <strong>需要你時提醒</strong>
                      <small>瀏覽器允許時發出低狀態通知</small>
                    </span>
                    <span
                      className={`toggle ${game.reminders ? "is-on" : ""}`}
                      aria-label={game.reminders ? "已開啟" : "已關閉"}
                    />
                  </button>
                  <button onClick={installApp}>
                    <span>
                      <strong>加入手機主畫面</strong>
                      <small>好似普通 App 咁一撳就開</small>
                    </span>
                    <span className="row-arrow">›</span>
                  </button>
                  <button onClick={() => openCloset("outfits")}>
                    <span>
                      <strong>打開小小衣櫃</strong>
                      <small>
                        目前穿緊：
                        {OUTFITS.find((item) => item.id === game.selectedOutfit)
                          ?.label ?? "原裝造型"}
                      </small>
                    </span>
                    <span className="row-arrow">›</span>
                  </button>
                  <button onClick={() => openCloset("scenes")}>
                    <span>
                      <strong>更換生活場景</strong>
                      <small>
                        目前位置：
                        {SCENES.find((item) => item.id === game.selectedScene)
                          ?.label ?? "焦糖小屋"}
                      </small>
                    </span>
                    <span className="row-arrow">›</span>
                  </button>
                  <button onClick={() => setPanel("family")}>
                    <span>
                      <strong>家庭小屋</strong>
                      <small>
                        {game.level < 18
                          ? `Lv.18 壯年家庭任務・目前羈絆 ${game.bond}`
                          : `${game.children.length} 位小寶寶・羈絆 ${game.bond}`}
                      </small>
                    </span>
                    <span className="row-arrow">›</span>
                  </button>
                </div>

                <div className="data-actions">
                  <button onClick={exportSave}>匯出進度</button>
                  <button onClick={() => importInput.current?.click()}>
                    匯入進度
                  </button>
                  <input
                    ref={importInput}
                    type="file"
                    accept="application/json"
                    onChange={importSave}
                    hidden
                  />
                </div>
                <button className="danger-button" onClick={resetGame}>
                  清除進度，重新開始
                </button>
                <p className="privacy-note">
                  進度只儲存在呢部裝置，唔會上傳你嘅資料。
                </p>
              </div>
            )}

            <nav className="sheet-tabs">
              <button
                className={panel === "journal" ? "is-active" : ""}
                onClick={() => setPanel("journal")}
              >
                日記
              </button>
              <button
                className={panel === "growth" ? "is-active" : ""}
                onClick={() => setPanel("growth")}
              >
                成長
              </button>
              <button
                className={panel === "closet" ? "is-active" : ""}
                onClick={() => setPanel("closet")}
              >
                衣櫃
              </button>
              <button
                className={panel === "family" ? "is-active" : ""}
                onClick={() => setPanel("family")}
              >
                家庭
              </button>
              <button
                className={panel === "settings" ? "is-active" : ""}
                onClick={() => setPanel("settings")}
              >
                設定
              </button>
            </nav>
          </section>
        </div>
      )}

      {eventOpen && activeEvent && (
        <div className="modal-backdrop event-backdrop">
          <section
            className="event-card"
            role="dialog"
            aria-modal
            aria-labelledby="event-title"
          >
            <header>
              <div className="event-icon" aria-hidden="true">
                {activeEvent.icon}
              </div>
              <button
                className="close-button"
                onClick={dismissEvent}
                aria-label={eventResult ? "完成事件" : "稍後再決定"}
              >
                ×
              </button>
            </header>

            {eventResult ? (
              <div className="event-result">
                <p className="eyebrow">你哋作出咗選擇</p>
                <h2 id="event-title">{activeEvent.title}</h2>
                <p>{eventResult}</p>
                <button className="primary-button" onClick={dismissEvent}>
                  記低今日嘅故事
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow">RANDOM STORY · 突發事件</p>
                <h2 id="event-title">{activeEvent.title}</h2>
                <p className="event-story">{activeEvent.story}</p>
                <div className="event-choices">
                  {activeEvent.choices.map((choice, index) => (
                    <button
                      key={choice.label}
                      onClick={() => resolveEvent(index as 0 | 1)}
                    >
                      <strong>{choice.label}</strong>
                      <small>
                        選擇後會影響狀態、羈絆同成長
                      </small>
                    </button>
                  ))}
                </div>
                <button className="event-later" onClick={dismissEvent}>
                  遲啲先決定
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {miniGame.open && (
        <div className="modal-backdrop game-backdrop">
          <section
            className="mini-game-card"
            role="dialog"
            aria-modal
            aria-labelledby="mini-game-title"
            style={
              {
                "--game-scene": `url("${sceneImagePath("garden")}")`,
                "--game-items": `url("${miniGameItemImagePath()}")`,
              } as CSSProperties
            }
          >
            <header>
              <div>
                <p className="eyebrow">24 秒 · DRAG & CATCH</p>
                <h2 id="mini-game-title">甜品接接樂</h2>
              </div>
              <button
                className="close-button"
                onClick={() =>
                  setMiniGame((current) => ({ ...current, open: false }))
                }
                aria-label="關閉小遊戲"
              >
                ×
              </button>
            </header>
            <div className="game-scorebar">
              <span>
                時間 <strong>{miniGame.time}s</strong>
              </span>
              <span>
                分數 <strong>{miniGame.score}</strong>
              </span>
              <span className={miniGame.combo >= 5 ? "is-fever" : ""}>
                Combo <strong>{miniGame.combo}</strong>
              </span>
              <span>
                機會{" "}
                <strong aria-label={`剩餘 ${miniGame.lives} 次機會`}>
                  {"♥".repeat(miniGame.lives)}
                  <i>{"♡".repeat(3 - miniGame.lives)}</i>
                </strong>
              </span>
            </div>
            <div
              className={`game-field dessert-catch-field ${
                miniGame.combo >= 5 ? "is-fever" : ""
              }`}
              role="application"
              tabIndex={0}
              aria-label="拖動籃子接住甜品；亦可以用左右方向鍵控制"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                moveMiniGameBasket(event.clientX, event.currentTarget);
              }}
              onPointerMove={(event) => {
                if (
                  event.pointerType === "mouse" ||
                  event.currentTarget.hasPointerCapture(event.pointerId)
                ) {
                  moveMiniGameBasket(event.clientX, event.currentTarget);
                }
              }}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                  return;
                }
                event.preventDefault();
                const movement = event.key === "ArrowLeft" ? -8 : 8;
                setMiniGame((current) => ({
                  ...current,
                  playerX: clamp(current.playerX + movement, 8, 92),
                }));
              }}
            >
              {!miniGame.finished ? (
                <>
                  <div className="game-depth-layer game-clouds" aria-hidden="true" />
                  <div className="game-depth-layer game-lights" aria-hidden="true" />
                  {miniGame.items.map((item) => (
                    <span
                      className={`game-falling-item item-${item.kind}`}
                      key={item.id}
                      aria-hidden="true"
                      style={
                        {
                          "--item-x": `${item.x}%`,
                          "--item-y": `${item.y}%`,
                          "--item-spin": `${item.spin}deg`,
                        } as CSSProperties
                      }
                    >
                      <i />
                    </span>
                  ))}
                  <span
                    className="dessert-basket"
                    aria-hidden="true"
                    style={
                      {
                        "--basket-x": `${miniGame.playerX}%`,
                      } as CSSProperties
                    }
                  >
                    <i className="basket-handle" />
                    <i className="basket-lining" />
                    <i className="basket-face" />
                  </span>
                  {miniGame.feedback && (
                    <span
                      className={`game-feedback ${
                        miniGame.feedback.includes("泡泡") ? "is-miss" : ""
                      }`}
                      key={miniGame.feedbackId}
                      aria-live="polite"
                    >
                      {miniGame.feedback}
                    </span>
                  )}
                  {miniGame.combo >= 5 && (
                    <span className="fever-banner" aria-hidden="true">
                      FEVER ×2
                    </span>
                  )}
                  <div className="game-grass" />
                </>
              ) : (
                <div className="game-result game-result-v5">
                  <span className="result-pudding" aria-hidden="true">
                    {miniGame.score >= 50 ? "★" : "P"}
                  </span>
                  <p className="eyebrow">最高 {miniGame.bestCombo} COMBO</p>
                  <h3>
                    {miniGame.score >= 50
                      ? "甜品接接大師！"
                      : miniGame.score >= 25
                        ? "好身手！"
                        : "下次一定接得更多！"}
                  </h3>
                  <div className="result-score">
                    <strong>{miniGame.score}</strong>
                    <span>分</span>
                  </div>
                  <p>
                    賺咗{" "}
                    <strong>{miniGameReward(miniGame.score)}</strong> 枚金幣
                    <br />
                    星星同連續接中可以令分數升得更快。
                  </p>
                  <button
                    className="primary-button"
                    onClick={() =>
                      setMiniGame((current) => ({ ...current, open: false }))
                    }
                  >
                    收低獎勵
                  </button>
                </div>
              )}
            </div>
            {!miniGame.finished && (
              <div className="game-instructions">
                <div className="game-legend" aria-label="遊戲物件說明">
                  <span>
                    <i className="legend-item item-pudding" /> +2
                  </span>
                  <span>
                    <i className="legend-item item-berry" /> +3
                  </span>
                  <span>
                    <i className="legend-item item-star" /> +5
                  </span>
                  <span>
                    <i className="legend-item item-soap" /> 避開
                  </span>
                </div>
                <p className="game-hint">
                  手指左右拖動籃子；連續接中 5 個會進入 FEVER，得分 ×2。
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

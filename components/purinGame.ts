import type {
  GrowthStageId,
  OutfitId,
  PetCondition,
} from "./PurinMascot";

export type StatKey = "fullness" | "happiness" | "cleanliness" | "energy";
export type CareAction = "feed" | "bath" | "play" | "sleep";
export type CooldownKey = CareAction | "game";
export type PetAction = CareAction | "gift" | "level" | "event" | "baby";
export type Panel =
  | "journal"
  | "growth"
  | "closet"
  | "family"
  | "settings"
  | null;
export type ClosetTab = "outfits" | "scenes" | "dlc";
export type SceneId =
  | "cozy"
  | "cafe"
  | "garden"
  | "camp"
  | "rainy"
  | "beach"
  | "moon"
  | "bakery"
  | "arcade"
  | "snow"
  | "puddingland"
  | "upside"
  | "dlc-yorozuya"
  | "dlc-spider-hideout"
  | "dlc-namimori-home"
  | "dlc-given-studio"
  | "dlc-kagurabachi-shop";

export type DlcPackId =
  | "gintoki"
  | "feitan"
  | "tsuna"
  | "mafuyu"
  | "ritsuka"
  | "haruki"
  | "akihiko"
  | "chihiro";

export type DlcPack = {
  id: DlcPackId;
  series: string;
  character: string;
  outfitId: OutfitId;
  sceneId: SceneId;
  sceneLabel: string;
  unlockCode: string;
  symbol: string;
  accent: string;
  description: string;
};

export type GameLog = {
  id: string;
  text: string;
  time: number;
};

export type ChildPet = {
  id: string;
  name: string;
  bornAt: number;
  color: "custard" | "caramel" | "cream" | "berry";
  trait: string;
};

export type GameState = {
  version: 4;
  petName: string;
  level: number;
  xp: number;
  coins: number;
  bond: number;
  streak: number;
  lastGiftDate: string;
  createdAt: number;
  lastUpdated: number;
  totalActions: number;
  growthStageSeen: GrowthStageId;
  sound: boolean;
  reminders: boolean;
  loveNote: string;
  selectedOutfit: OutfitId;
  ownedOutfits: OutfitId[];
  selectedScene: SceneId;
  ownedScenes: SceneId[];
  redeemedDlcPacks: DlcPackId[];
  cooldowns: Record<CooldownKey, number>;
  stats: Record<StatKey, number>;
  lastEventAt: number;
  pendingEventId: string | null;
  eventCount: number;
  expectingUntil: number;
  familyLastBirthAt: number;
  children: ChildPet[];
  log: GameLog[];
};

export type ItemMeta<T extends string> = {
  id: T;
  label: string;
  description: string;
  level: number;
  price: number;
  symbol: string;
  dlc?: boolean;
};

export type EventEffects = {
  stats?: Partial<Record<StatKey, number>>;
  xp: number;
  coins: number;
  bond: number;
};

export type RandomEventChoice = {
  label: string;
  result: string;
  effects: EventEffects;
};

export type RandomEvent = {
  id: string;
  icon: string;
  title: string;
  story: string;
  minLevel: number;
  choices: [RandomEventChoice, RandomEventChoice];
};

export type GrowthStageMeta = {
  id: GrowthStageId;
  label: string;
  shortLabel: string;
  icon: string;
  minLevel: number;
  minDays: number;
  description: string;
  personality: string;
  appearance: string;
};

export type GrowthStageRules = {
  decay: Record<StatKey, number>;
  careGain: Record<CareAction, number>;
  careCost: number;
  cooldown: number;
  xp: number;
  bond: number;
  eventPositive: number;
  eventNegative: number;
  playEnergyMinimum: number;
  playFullnessMinimum: number;
  sleepFullnessMinimum: number;
  headline: string;
  notes: [string, string, string];
};

export const DEFAULT_NOTE = "今日都要記住，有人好鍾意你 ♡";
export const STORAGE_KEY = "purin-pet-save-v1";
export const DAY_MS = 86_400_000;
export const EVENT_COOLDOWN_MS = 20 * 60_000;
export const FAMILY_WAIT_MS = DAY_MS;
export const FAMILY_BIRTH_GAP_MS = 7 * DAY_MS;
export const DLC_MASTER_CODE = "PURIN-ANIME-ALL";

export function normalizeDlcCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export const DLC_PACKS: DlcPack[] = [
  {
    id: "gintoki",
    series: "銀魂",
    character: "坂田銀時",
    outfitId: "dlc-gintoki",
    sceneId: "dlc-yorozuya",
    sceneLabel: "萬事屋",
    unlockCode: "YOROZUYA-SILVER",
    symbol: "銀",
    accent: "#76aeca",
    description: "白底藍紋和服、紅黑內搭與洞爺湖風木刀套。",
  },
  {
    id: "feitan",
    series: "HUNTER×HUNTER",
    character: "飛坦",
    outfitId: "dlc-feitan",
    sceneId: "dlc-spider-hideout",
    sceneLabel: "旅團舊倉庫",
    unlockCode: "SPIDER-13",
    symbol: "蜘",
    accent: "#7d7189",
    description: "黑色高領長褸、暗紋面巾與收好嘅傘劍套。",
  },
  {
    id: "tsuna",
    series: "家庭教師HITMAN REBORN!",
    character: "澤田綱吉",
    outfitId: "dlc-tsuna",
    sceneId: "dlc-namimori-home",
    sceneLabel: "並盛町家中",
    unlockCode: "VONGOLA-ZERO",
    symbol: "炎",
    accent: "#e98b48",
    description: "並盛校服、柔和死氣之炎與全年齡專屬手套。",
  },
  {
    id: "mafuyu",
    series: "Given 被贈與的未來",
    character: "佐藤真冬",
    outfitId: "dlc-mafuyu",
    sceneId: "dlc-given-studio",
    sceneLabel: "Given 排練室",
    unlockCode: "GIVEN-MAFUYU",
    symbol: "真",
    accent: "#bc6f78",
    description: "酒紅層次便服與貼身紅色結他背帶。",
  },
  {
    id: "ritsuka",
    series: "Given 被贈與的未來",
    character: "上之山立夏",
    outfitId: "dlc-ritsuka",
    sceneId: "dlc-given-studio",
    sceneLabel: "Given 排練室",
    unlockCode: "GIVEN-RITSUKA",
    symbol: "立",
    accent: "#51657e",
    description: "深藍黑夾克、舞台層次穿搭與深色結他。",
  },
  {
    id: "haruki",
    series: "Given 被贈與的未來",
    character: "中山春樹",
    outfitId: "dlc-haruki",
    sceneId: "dlc-given-studio",
    sceneLabel: "Given 排練室",
    unlockCode: "GIVEN-HARUKI",
    symbol: "春",
    accent: "#768a67",
    description: "大地色針織外套、放鬆長褲與低音結他。",
  },
  {
    id: "akihiko",
    series: "Given 被贈與的未來",
    character: "梶秋彥",
    outfitId: "dlc-akihiko",
    sceneId: "dlc-given-studio",
    sceneLabel: "Given 排練室",
    unlockCode: "GIVEN-AKIHIKO",
    symbol: "秋",
    accent: "#8d776c",
    description: "俐落深色樂手裝、腕帶與全年齡鼓棍配件。",
  },
  {
    id: "chihiro",
    series: "神樂鉢",
    character: "六平千鑛",
    outfitId: "dlc-chihiro",
    sceneId: "dlc-kagurabachi-shop",
    sceneLabel: "雨夜刀具店",
    unlockCode: "KURO-BLADE",
    symbol: "鉢",
    accent: "#5c6370",
    description: "深炭長褸、紅色細節與安全收納嘅刀鞘。",
  },
];

export const DLC_OUTFIT_IDS = new Set<OutfitId>(
  DLC_PACKS.map((pack) => pack.outfitId),
);
export const DLC_SCENE_IDS = new Set<SceneId>(
  DLC_PACKS.map((pack) => pack.sceneId),
);

export const GROWTH_STAGES: GrowthStageMeta[] = [
  {
    id: "child",
    label: "幼年期",
    shortLabel: "幼年",
    icon: "●",
    minLevel: 1,
    minDays: 1,
    description: "全階段最細粒，寶寶比例、圓頭短手腳，嘴上仲有奶嘴。",
    personality: "需要密啲照顧，但每次陪伴都會建立更多安全感。",
    appearance: "奶嘴、口水肩、圓圓寶寶臉",
  },
  {
    id: "teen",
    label: "青年期",
    shortLabel: "青年",
    icon: "✦",
    minLevel: 5,
    minDays: 3,
    description: "比幼年高大少少，身形輕巧，眼神同耳仔都充滿活力。",
    personality: "新陳代謝最快、特別貪玩，玩耍回復亦係五階段最高。",
    appearance: "修長少少、精神大眼、準備起跑",
  },
  {
    id: "adult",
    label: "壯年期",
    shortLabel: "壯年",
    icon: "◆",
    minLevel: 12,
    minDays: 10,
    description: "最經典、最平衡嘅布甸小狗身形，毛色、精神同體力都在巔峰。",
    personality: "四項狀態最穩定，任何照顧行動都有最好整體效率。",
    appearance: "經典比例、飽滿健康、最佳狀態",
  },
  {
    id: "middle",
    label: "中年期",
    shortLabel: "中年",
    icon: "◇",
    minLevel: 22,
    minDays: 30,
    description: "身形稍為厚實，眼皮放鬆、戴上幼框眼鏡，步伐開始慢落嚟。",
    personality: "體力回復慢咗，玩耍更容易攰，但比以前更重視陪伴。",
    appearance: "幼框眼鏡、柔和眼神、沉穩站姿",
  },
  {
    id: "senior",
    label: "老年期",
    shortLabel: "老年",
    icon: "♡",
    minLevel: 35,
    minDays: 60,
    description: "老人家模式：柔和毛色、圓眼鏡、白眉毛同小手杖，行動最慢。",
    personality: "精神下降較快、照顧要更溫柔；唔會離開，陪伴羈絆亦係最高。",
    appearance: "圓眼鏡、白眉毛、小手杖",
  },
];

export const GROWTH_STAGE_RULES: Record<
  GrowthStageId,
  GrowthStageRules
> = {
  child: {
    decay: {
      fullness: 1.25,
      happiness: 1.1,
      cleanliness: 1.2,
      energy: 1.05,
    },
    careGain: { feed: 0.85, bath: 1.05, play: 1.1, sleep: 1.05 },
    careCost: 1.1,
    cooldown: 0.9,
    xp: 1.1,
    bond: 1.15,
    eventPositive: 1.05,
    eventNegative: 1.1,
    playEnergyMinimum: 26,
    playFullnessMinimum: 20,
    sleepFullnessMinimum: 16,
    headline: "細食多餐，需要密啲照顧",
    notes: ["飽肚下降 ×1.25", "清潔下降 ×1.20", "羈絆獲得 ×1.15"],
  },
  teen: {
    decay: {
      fullness: 1.18,
      happiness: 1.15,
      cleanliness: 1.12,
      energy: 1.2,
    },
    careGain: { feed: 1.05, bath: 1, play: 1.25, sleep: 1.12 },
    careCost: 1.15,
    cooldown: 0.85,
    xp: 1.15,
    bond: 1,
    eventPositive: 1.08,
    eventNegative: 1.08,
    playEnergyMinimum: 24,
    playFullnessMinimum: 20,
    sleepFullnessMinimum: 15,
    headline: "最有活力，玩得多亦攰得快",
    notes: ["精神下降 ×1.20", "玩耍回復 ×1.25", "經驗獲得 ×1.15"],
  },
  adult: {
    decay: {
      fullness: 0.95,
      happiness: 0.95,
      cleanliness: 0.95,
      energy: 0.95,
    },
    careGain: { feed: 1.1, bath: 1.1, play: 1.1, sleep: 1.1 },
    careCost: 0.95,
    cooldown: 1,
    xp: 1,
    bond: 1,
    eventPositive: 1,
    eventNegative: 0.95,
    playEnergyMinimum: 22,
    playFullnessMinimum: 18,
    sleepFullnessMinimum: 15,
    headline: "最穩定、最全面嘅巔峰狀態",
    notes: ["四項下降 ×0.95", "照顧回復 ×1.10", "活動消耗 ×0.95"],
  },
  middle: {
    decay: {
      fullness: 0.9,
      happiness: 0.95,
      cleanliness: 1,
      energy: 1.15,
    },
    careGain: { feed: 1, bath: 1, play: 0.9, sleep: 0.92 },
    careCost: 1.18,
    cooldown: 1.1,
    xp: 0.95,
    bond: 1.15,
    eventPositive: 0.95,
    eventNegative: 1.12,
    playEnergyMinimum: 28,
    playFullnessMinimum: 18,
    sleepFullnessMinimum: 15,
    headline: "體力慢慢下降，更重視陪伴",
    notes: ["精神下降 ×1.15", "活動消耗 ×1.18", "羈絆獲得 ×1.15"],
  },
  senior: {
    decay: {
      fullness: 0.82,
      happiness: 1,
      cleanliness: 0.92,
      energy: 1.25,
    },
    careGain: { feed: 0.85, bath: 0.9, play: 0.75, sleep: 0.8 },
    careCost: 1.35,
    cooldown: 1.25,
    xp: 0.8,
    bond: 1.3,
    eventPositive: 0.88,
    eventNegative: 1.2,
    playEnergyMinimum: 36,
    playFullnessMinimum: 22,
    sleepFullnessMinimum: 18,
    headline: "要慢慢照顧，陪伴價值最高",
    notes: ["精神下降 ×1.25", "活動消耗 ×1.35", "羈絆獲得 ×1.30"],
  },
};

export const STAT_META: Array<{
  key: StatKey;
  label: string;
  icon: string;
  color: string;
}> = [
  { key: "fullness", label: "飽肚", icon: "●", color: "#ef9a62" },
  { key: "happiness", label: "開心", icon: "♥", color: "#e88490" },
  { key: "cleanliness", label: "乾淨", icon: "✦", color: "#70bfc1" },
  { key: "energy", label: "精神", icon: "☾", color: "#8d80b8" },
];

export const ACTION_META: Array<{
  key: CareAction;
  label: string;
  icon: string;
  shortCooldown: string;
}> = [
  { key: "feed", label: "餵食", icon: "♨", shortCooldown: "消化中" },
  { key: "bath", label: "沖涼", icon: "◌", shortCooldown: "抹乾中" },
  { key: "play", label: "玩耍", icon: "●", shortCooldown: "抖抖先" },
  { key: "sleep", label: "瞓覺", icon: "☾", shortCooldown: "賴床中" },
];

export const ACTION_EFFECTS: Record<
  CareAction,
  {
    target: StatKey;
    stats: Partial<Record<StatKey, number>>;
    xp: number;
    coins: number;
    bond: number;
    cooldown: number;
    message: string[];
    log: string;
  }
> = {
  feed: {
    target: "fullness",
    stats: { fullness: 24, happiness: 3, cleanliness: -3 },
    xp: 7,
    coins: 2,
    bond: 3,
    cooldown: 90_000,
    message: ["好味！慢慢食先～", "肚仔暖笠笠喇", "留返少少聽日再食～"],
    log: "細心準備咗一餐焦糖布甸",
  },
  bath: {
    target: "cleanliness",
    stats: { cleanliness: 30, happiness: 2, energy: -3 },
    xp: 7,
    coins: 2,
    bond: 3,
    cooldown: 180_000,
    message: ["香噴噴喇！", "啲泡泡好似雲呀～", "耳仔都抹乾淨喇"],
    log: "一齊沖咗個泡泡浴",
  },
  play: {
    target: "happiness",
    stats: { happiness: 25, fullness: -5, energy: -9, cleanliness: -3 },
    xp: 9,
    coins: 3,
    bond: 5,
    cooldown: 120_000,
    message: ["同你玩最開心！", "跑到氣咳，但好值得～", "接到個波喇！"],
    log: "認真陪佢玩咗一陣",
  },
  sleep: {
    target: "energy",
    stats: { energy: 32, fullness: -5, happiness: 2 },
    xp: 6,
    coins: 1,
    bond: 3,
    cooldown: 240_000,
    message: ["唔好走住…陪我瞓吖", "發緊布甸夢…", "叉足電喇！"],
    log: "陪住佢好好休息",
  },
};

export const OUTFITS: Array<ItemMeta<OutfitId>> = [
  {
    id: "classic",
    label: "朱古力貝雷帽",
    description: "最標誌性嘅軟綿綿造型",
    level: 1,
    price: 0,
    symbol: "●",
  },
  {
    id: "soft",
    label: "原裝軟綿綿",
    description: "乜都唔着都一樣可愛",
    level: 1,
    price: 0,
    symbol: "○",
  },
  {
    id: "scarf",
    label: "焦糖頸巾",
    description: "凍冰冰日子最啱",
    level: 3,
    price: 60,
    symbol: "⌁",
  },
  {
    id: "berry",
    label: "莓果派對服",
    description: "粉紅蝴蝶結同小禮服",
    level: 5,
    price: 90,
    symbol: "∞",
  },
  {
    id: "raincoat",
    label: "蜜糖雨褸",
    description: "落雨都可以出門散步",
    level: 7,
    price: 140,
    symbol: "☂",
  },
  {
    id: "sailor",
    label: "海風水手服",
    description: "準備去海邊探險",
    level: 9,
    price: 190,
    symbol: "⚓",
  },
  {
    id: "bee",
    label: "布甸蜜蜂裝",
    description: "有透明小翅膀嘅勤力裝",
    level: 11,
    price: 240,
    symbol: "✿",
  },
  {
    id: "wizard",
    label: "星糖魔法師",
    description: "識得將煩惱變成甜品",
    level: 14,
    price: 310,
    symbol: "★",
  },
  {
    id: "royal",
    label: "焦糖小王子",
    description: "成熟期先穿得起嘅禮服",
    level: 17,
    price: 420,
    symbol: "♛",
  },
  {
    id: "pajamas",
    label: "星夜睡衣",
    description: "陪你一齊發甜甜嘅夢",
    level: 20,
    price: 520,
    symbol: "☾",
  },
  {
    id: "chef",
    label: "布甸烘焙師",
    description: "戴住高帽仔焗焦糖曲奇",
    level: 10,
    price: 225,
    symbol: "♨",
  },
  {
    id: "detective",
    label: "焦糖小偵探",
    description: "專門調查消失咗嘅布甸",
    level: 13,
    price: 285,
    symbol: "⌕",
  },
  {
    id: "banana",
    label: "跣腳香蕉裝",
    description: "行兩步就自己笑到碌地",
    level: 15,
    price: 340,
    symbol: "⌁",
  },
  {
    id: "pudding",
    label: "行走布甸杯",
    description: "究竟係小狗定係甜品？",
    level: 18,
    price: 470,
    symbol: "♨",
  },
  {
    id: "sushi",
    label: "超肥蝦壽司",
    description: "趴低就會被誤認做晚餐",
    level: 22,
    price: 620,
    symbol: "≈",
  },
  {
    id: "ufo",
    label: "紙皮外星飛船",
    description: "來自布甸星嘅低科技裝備",
    level: 25,
    price: 760,
    symbol: "⌾",
  },
  ...DLC_PACKS.map((pack) => ({
    id: pack.outfitId,
    label: `${pack.character}造型`,
    description: pack.description,
    level: 1,
    price: 0,
    symbol: pack.symbol,
    dlc: true,
  })),
];

export const SCENES: Array<ItemMeta<SceneId>> = [
  {
    id: "cozy",
    label: "焦糖小屋",
    description: "你哋最初相遇嘅房間",
    level: 1,
    price: 0,
    symbol: "⌂",
  },
  {
    id: "cafe",
    label: "布甸咖啡店",
    description: "有甜品香味嘅午後",
    level: 4,
    price: 100,
    symbol: "♨",
  },
  {
    id: "garden",
    label: "雛菊花園",
    description: "有陽光、草地同小花",
    level: 7,
    price: 160,
    symbol: "✿",
  },
  {
    id: "camp",
    label: "星空露營地",
    description: "營火旁邊數星星",
    level: 10,
    price: 230,
    symbol: "▲",
  },
  {
    id: "rainy",
    label: "雨天窗邊",
    description: "聽住雨聲慢慢休息",
    level: 13,
    price: 300,
    symbol: "☂",
  },
  {
    id: "beach",
    label: "焦糖海岸",
    description: "踩住幼沙追浪花",
    level: 16,
    price: 390,
    symbol: "≈",
  },
  {
    id: "moon",
    label: "月光甜夢島",
    description: "最高等級嘅秘密天空島",
    level: 20,
    price: 520,
    symbol: "☾",
  },
  {
    id: "bakery",
    label: "甜甜烘焙工房",
    description: "焗爐入面永遠有新鮮曲奇",
    level: 6,
    price: 145,
    symbol: "♨",
  },
  {
    id: "arcade",
    label: "復古扭蛋機舖",
    description: "霓虹燈、夾公仔同無限代幣",
    level: 12,
    price: 275,
    symbol: "✦",
  },
  {
    id: "snow",
    label: "棉花糖雪國",
    description: "雪人個鼻原來係焦糖條",
    level: 18,
    price: 455,
    symbol: "❄",
  },
  {
    id: "puddingland",
    label: "巨型布甸星球",
    description: "每行一步，地面都會啫喱震",
    level: 23,
    price: 690,
    symbol: "◉",
  },
  {
    id: "upside",
    label: "反轉傢俬房",
    description: "梳化上天花，地毯飛咗上天",
    level: 27,
    price: 880,
    symbol: "↯",
  },
  {
    id: "dlc-yorozuya",
    label: "萬事屋",
    description: "木地板、矮桌、梳化同熟悉嘅城市露台",
    level: 1,
    price: 0,
    symbol: "銀",
    dlc: true,
  },
  {
    id: "dlc-spider-hideout",
    label: "旅團舊倉庫",
    description: "月光穿過廢棄倉庫，暗處藏住蜘蛛紋理",
    level: 1,
    price: 0,
    symbol: "蜘",
    dlc: true,
  },
  {
    id: "dlc-namimori-home",
    label: "並盛町家中",
    description: "充滿生活感嘅日式家庭客飯廳",
    level: 1,
    price: 0,
    symbol: "炎",
    dlc: true,
  },
  {
    id: "dlc-given-studio",
    label: "Given 排練室",
    description: "結他、低音結他與鼓組都準備好嘅排練室",
    level: 1,
    price: 0,
    symbol: "音",
    dlc: true,
  },
  {
    id: "dlc-kagurabachi-shop",
    label: "雨夜刀具店",
    description: "木架、紙門與雨夜霓虹交織嘅安靜店舖",
    level: 1,
    price: 0,
    symbol: "鉢",
    dlc: true,
  },
];

export const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: "rainy-box",
    icon: "☂",
    title: "雨中嘅小紙盒",
    story: "散步途中忽然落大雨，路邊紙盒傳出細細聲嘅「喵」。",
    minLevel: 2,
    choices: [
      {
        label: "一齊撐遮去幫手",
        result: "你哋將小貓送到安全地方。雖然全身濕晒，但個心暖笠笠。",
        effects: {
          stats: { happiness: 12, cleanliness: -10, energy: -5 },
          xp: 12,
          coins: 4,
          bond: 10,
        },
      },
      {
        label: "先返屋企拎毛巾",
        result: "準備好毛巾再返去，小貓同你哋一齊躲雨，大家都冇冷親。",
        effects: {
          stats: { happiness: 7, cleanliness: -3, energy: -2 },
          xp: 8,
          coins: 7,
          bond: 6,
        },
      },
    ],
  },
  {
    id: "last-pudding",
    icon: "♡",
    title: "最後一杯布甸",
    story: "甜品店淨返最後一杯布甸，隔籬有隻細小狗望到雙眼發光。",
    minLevel: 3,
    choices: [
      {
        label: "分一半俾佢",
        result: "兩隻小狗食得好開心，店員仲送咗一張小貼紙。",
        effects: {
          stats: { fullness: 10, happiness: 14 },
          xp: 11,
          coins: 3,
          bond: 9,
        },
      },
      {
        label: "買其他甜品交換",
        result: "你哋用小蛋糕換到布甸，兩邊都食到鍾意嘅甜品。",
        effects: {
          stats: { fullness: 16, happiness: 9 },
          xp: 8,
          coins: -6,
          bond: 6,
        },
      },
    ],
  },
  {
    id: "mystery-seed",
    icon: "✿",
    title: "會發光嘅種子",
    story: "門口出現一粒金色種子，夜晚仲會一閃一閃。",
    minLevel: 4,
    choices: [
      {
        label: "種喺窗邊",
        result: "種子長出一朵布甸色小花，屋企變得更有生氣。",
        effects: {
          stats: { happiness: 13, cleanliness: -4 },
          xp: 12,
          coins: 0,
          bond: 8,
        },
      },
      {
        label: "帶去花店問問",
        result: "花店姐姐話係幸運花種，仲送咗你哋一個小花盆。",
        effects: {
          stats: { happiness: 8 },
          xp: 8,
          coins: 12,
          bond: 5,
        },
      },
    ],
  },
  {
    id: "friend-picnic",
    icon: "☀",
    title: "突然嘅野餐邀請",
    story: "朋友喺門外揮手，想即刻去草地開一場小野餐。",
    minLevel: 5,
    choices: [
      {
        label: "帶埋波波出發",
        result: "大家由朝玩到黃昏，攰得嚟非常滿足。",
        effects: {
          stats: {
            happiness: 18,
            energy: -15,
            fullness: -7,
            cleanliness: -8,
          },
          xp: 14,
          coins: 5,
          bond: 10,
        },
      },
      {
        label: "整布甸請大家食",
        result: "屋企變成一間迷你咖啡店，每個朋友都食到笑瞇瞇。",
        effects: {
          stats: { happiness: 12, fullness: 12, energy: -5 },
          xp: 11,
          coins: -8,
          bond: 8,
        },
      },
    ],
  },
  {
    id: "lost-scarf",
    icon: "⌁",
    title: "風中嘅紅頸巾",
    story: "一條紅頸巾被風吹到樹頂，遠處有人好焦急咁搵緊。",
    minLevel: 7,
    choices: [
      {
        label: "合作爬高拎返",
        result: "你扶實梯，佢勇敢拎返頸巾。失主送咗一袋小餅乾答謝。",
        effects: {
          stats: { happiness: 11, energy: -8, fullness: 5 },
          xp: 13,
          coins: 15,
          bond: 11,
        },
      },
      {
        label: "搵管理員幫忙",
        result: "大家安全拎返頸巾，佢亦學識咗遇事可以向人求助。",
        effects: {
          stats: { happiness: 8, energy: -2 },
          xp: 9,
          coins: 7,
          bond: 7,
        },
      },
    ],
  },
  {
    id: "shooting-star",
    icon: "★",
    title: "屋頂上嘅流星",
    story: "今晚天空特別清，一粒流星慢慢劃過你哋頭頂。",
    minLevel: 9,
    choices: [
      {
        label: "許一個家庭願望",
        result: "佢合埋眼，偷偷希望將來屋企可以更加熱鬧。",
        effects: {
          stats: { happiness: 15, energy: 5 },
          xp: 15,
          coins: 0,
          bond: 14,
        },
      },
      {
        label: "多謝今日嘅陪伴",
        result: "你哋冇要求更多，只係靜靜記住呢一晚。",
        effects: {
          stats: { happiness: 10, energy: 10 },
          xp: 11,
          coins: 10,
          bond: 12,
        },
      },
    ],
  },
  {
    id: "pudding-fair",
    icon: "♬",
    title: "甜品祭典迷路記",
    story: "祭典入面人山人海，轉個頭就見到一個迷路嘅小朋友。",
    minLevel: 12,
    choices: [
      {
        label: "陪佢等屋企人",
        result: "小朋友終於搵返家人，仲送咗一個親手整嘅小徽章。",
        effects: {
          stats: { happiness: 16, energy: -8 },
          xp: 17,
          coins: 10,
          bond: 16,
        },
      },
      {
        label: "去服務台廣播",
        result: "好快就搵到家人，工作人員請你哋食限定布甸。",
        effects: {
          stats: { happiness: 10, fullness: 15, energy: -4 },
          xp: 13,
          coins: 14,
          bond: 12,
        },
      },
    ],
  },
  {
    id: "memory-book",
    icon: "✦",
    title: "一本空白家庭相簿",
    story: "舊物店入面有本好靚嘅相簿，封面寫住「留俾未來嘅我哋」。",
    minLevel: 16,
    choices: [
      {
        label: "買返屋企慢慢填滿",
        result: "第一頁貼上咗你哋今日嘅合照，仲預留咗幾頁俾未來家人。",
        effects: {
          stats: { happiness: 18 },
          xp: 18,
          coins: -20,
          bond: 18,
        },
      },
      {
        label: "先影低封面留念",
        result: "你哋決定等一個更特別嘅日子，再親手整一本新相簿。",
        effects: {
          stats: { happiness: 12 },
          xp: 12,
          coins: 5,
          bond: 12,
        },
      },
    ],
  },
];

export const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function averageStats(stats: GameState["stats"]) {
  return Math.round(
    Object.values(stats).reduce((sum, value) => sum + value, 0) / 4,
  );
}

export function conditionForStats(stats: GameState["stats"]): PetCondition {
  const entries = Object.entries(stats) as Array<[StatKey, number]>;
  const low = entries.filter(([, value]) => value < 20);
  if (low.length >= 2 || Math.min(...entries.map(([, value]) => value)) < 8) {
    return "critical";
  }
  const average = averageStats(stats);
  const minimum = Math.min(...entries.map(([, value]) => value));
  if (average >= 86 && minimum >= 75) return "radiant";
  if (low.length === 1) {
    return {
      fullness: "hungry",
      happiness: "lonely",
      cleanliness: "dirty",
      energy: "sleepy",
    }[low[0][0]] as PetCondition;
  }
  const [lowestKey, lowestValue] = [...entries].sort((a, b) => a[1] - b[1])[0];
  if (lowestValue < 34) {
    return {
      fullness: "hungry",
      happiness: "lonely",
      cleanliness: "dirty",
      energy: "sleepy",
    }[lowestKey] as PetCondition;
  }
  if (average >= 68) return "content";
  return "calm";
}

export function conditionLabel(condition: PetCondition) {
  return {
    radiant: "元氣滿滿",
    content: "心滿意足",
    calm: "靜靜陪你",
    hungry: "肚仔餓餓",
    lonely: "有啲掛住你",
    dirty: "需要沖涼",
    sleepy: "眼瞓中",
    critical: "非常需要你",
  }[condition];
}

export function statStateLabel(value: number) {
  if (value < 20) return "急需照顧";
  if (value < 40) return "有啲低";
  if (value < 70) return "普通";
  if (value < 90) return "良好";
  return "滿足";
}

export function actionAvailability(
  state: GameState,
  action: CareAction,
  now: number,
) {
  const stage = growthStageFor(state.level, state.createdAt, now).id;
  const rules = GROWTH_STAGE_RULES[stage];
  const remaining = Math.max(0, state.cooldowns[action] - now);
  if (remaining > 0) {
    return { ready: false, remaining, reason: "冷卻中" };
  }

  if (action === "feed" && state.stats.fullness >= 90) {
    return { ready: false, remaining: 0, reason: "已經飽飽" };
  }
  if (action === "bath" && state.stats.cleanliness >= 92) {
    return { ready: false, remaining: 0, reason: "已經乾淨" };
  }
  if (
    action === "play" &&
    state.stats.energy < rules.playEnergyMinimum
  ) {
    return { ready: false, remaining: 0, reason: "太攰玩唔到" };
  }
  if (
    action === "play" &&
    state.stats.fullness < rules.playFullnessMinimum
  ) {
    return { ready: false, remaining: 0, reason: "先食啲嘢" };
  }
  if (action === "play" && state.stats.happiness >= 92) {
    return { ready: false, remaining: 0, reason: "玩得好滿足" };
  }
  if (action === "sleep" && state.stats.energy >= 90) {
    return { ready: false, remaining: 0, reason: "精神滿滿" };
  }
  if (
    action === "sleep" &&
    state.stats.fullness < rules.sleepFullnessMinimum
  ) {
    return { ready: false, remaining: 0, reason: "餓到瞓唔着" };
  }
  return { ready: true, remaining: 0, reason: "可以照顧" };
}

export function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}:${`${seconds}`.padStart(2, "0")}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}小時${minutes % 60}分`;
}

export function xpRequired(level: number) {
  return 100 + (level - 1) * 38;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysTogether(state: GameState, now = Date.now()) {
  return Math.max(1, Math.floor((now - state.createdAt) / DAY_MS) + 1);
}

export function growthStageFor(
  level: number,
  createdAt: number,
  now = Date.now(),
) {
  const livedDays = Math.max(
    1,
    Math.floor((now - createdAt) / DAY_MS) + 1,
  );
  return (
    [...GROWTH_STAGES]
      .reverse()
      .find(
        (stage) =>
          level >= stage.minLevel && livedDays >= stage.minDays,
      ) ?? GROWTH_STAGES[0]
  );
}

export function growthStageRulesFor(
  level: number,
  createdAt: number,
  now = Date.now(),
) {
  return GROWTH_STAGE_RULES[growthStageFor(level, createdAt, now).id];
}

export function stageAdjustedStatDelta(
  stage: GrowthStageId,
  amount: number,
  action?: CareAction,
) {
  const rules = GROWTH_STAGE_RULES[stage];
  if (amount >= 0) {
    return amount * (action ? rules.careGain[action] : rules.eventPositive);
  }
  return amount * (action ? rules.careCost : rules.eventNegative);
}

export function nextGrowthStage(stage: GrowthStageId) {
  const index = GROWTH_STAGES.findIndex((item) => item.id === stage);
  return index >= 0 ? GROWTH_STAGES[index + 1] ?? null : GROWTH_STAGES[0];
}

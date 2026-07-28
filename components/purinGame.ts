import type { OutfitId, PetCondition } from "./PurinMascot";

export type StatKey = "fullness" | "happiness" | "cleanliness" | "energy";
export type CareAction = "feed" | "bath" | "play" | "sleep";
export type CooldownKey = CareAction | "game";
export type PetAction = CareAction | "gift" | "level" | "event" | "baby";
export type Panel = "journal" | "closet" | "family" | "settings" | null;
export type ClosetTab = "outfits" | "scenes";
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
  | "upside";

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
  version: 2;
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
  sound: boolean;
  reminders: boolean;
  loveNote: string;
  selectedOutfit: OutfitId;
  ownedOutfits: OutfitId[];
  selectedScene: SceneId;
  ownedScenes: SceneId[];
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

export const DEFAULT_NOTE = "今日都要記住，有人好鍾意你 ♡";
export const STORAGE_KEY = "purin-pet-save-v1";
export const DAY_MS = 86_400_000;
export const EVENT_COOLDOWN_MS = 20 * 60_000;
export const FAMILY_WAIT_MS = DAY_MS;
export const FAMILY_BIRTH_GAP_MS = 7 * DAY_MS;

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
  if (action === "play" && state.stats.energy < 22) {
    return { ready: false, remaining: 0, reason: "太攰玩唔到" };
  }
  if (action === "play" && state.stats.fullness < 18) {
    return { ready: false, remaining: 0, reason: "先食啲嘢" };
  }
  if (action === "play" && state.stats.happiness >= 92) {
    return { ready: false, remaining: 0, reason: "玩得好滿足" };
  }
  if (action === "sleep" && state.stats.energy >= 90) {
    return { ready: false, remaining: 0, reason: "精神滿滿" };
  }
  if (action === "sleep" && state.stats.fullness < 15) {
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

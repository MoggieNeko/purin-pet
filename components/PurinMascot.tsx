"use client";

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
  | "pajamas";

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

function BackOutfit({ outfit }: { outfit: OutfitId }) {
  if (outfit === "bee") {
    return (
      <g className="mascot-outfit-back bee-wings">
        <ellipse cx="82" cy="141" rx="29" ry="39" fill="#eef7ff" stroke="#99c3d2" strokeWidth="4" transform="rotate(-28 82 141)" />
        <ellipse cx="178" cy="141" rx="29" ry="39" fill="#eef7ff" stroke="#99c3d2" strokeWidth="4" transform="rotate(28 178 141)" />
        <path d="M69 124c11 3 20 12 25 28M191 124c-11 3-20 12-25 28" fill="none" stroke="#c3dfea" strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }

  if (outfit === "wizard") {
    return (
      <path
        className="mascot-outfit-back"
        d="M69 135C55 164 57 203 77 219H183C203 202 204 163 191 135C170 148 90 148 69 135Z"
        fill="#67549b"
        stroke="#49396f"
        strokeWidth="4"
      />
    );
  }

  if (outfit === "royal") {
    return (
      <path
        className="mascot-outfit-back"
        d="M71 133C54 159 56 201 72 220H188C204 198 203 157 188 132C164 145 94 145 71 133Z"
        fill="#bb5366"
        stroke="#873747"
        strokeWidth="4"
      />
    );
  }

  return null;
}

function BodyOutfit({ outfit }: { outfit: OutfitId }) {
  switch (outfit) {
    case "scarf":
      return (
        <g className="mascot-outfit-body">
          <path d="M83 123Q130 142 177 123L174 143Q130 158 86 143Z" fill="#bf6848" stroke="#844732" strokeWidth="4" />
          <path d="M156 137L177 139L169 193L148 187Z" fill="#d27b55" stroke="#844732" strokeWidth="4" />
          <path d="M157 156L171 161M154 173L168 178" stroke="#f3b26f" strokeWidth="4" />
        </g>
      );
    case "berry":
      return (
        <g className="mascot-outfit-body">
          <path d="M82 142Q130 125 178 142L174 199Q130 216 86 199Z" fill="#f7d9e0" stroke="#bd6b7b" strokeWidth="4" />
          <path d="M88 151Q130 166 172 151" fill="none" stroke="#fff7f9" strokeWidth="8" />
          <circle cx="130" cy="170" r="6" fill="#d95e79" />
        </g>
      );
    case "raincoat":
      return (
        <g className="mascot-outfit-body">
          <path d="M79 134Q130 119 181 134L176 205Q130 220 84 205Z" fill="#efb84b" stroke="#a66c28" strokeWidth="4" />
          <path d="M130 132V208" stroke="#fff2b5" strokeWidth="4" />
          <circle cx="119" cy="157" r="4" fill="#8c5a2f" />
          <circle cx="119" cy="181" r="4" fill="#8c5a2f" />
          <path d="M92 194Q130 207 168 194" fill="none" stroke="#d38d32" strokeWidth="4" />
        </g>
      );
    case "sailor":
      return (
        <g className="mascot-outfit-body">
          <path d="M82 137Q130 122 178 137L174 204Q130 217 86 204Z" fill="#f8fbf4" stroke="#536b8f" strokeWidth="4" />
          <path d="M90 137L114 166L130 150L146 166L170 137" fill="#6484ac" stroke="#405d82" strokeWidth="4" strokeLinejoin="round" />
          <path d="M130 153V194" stroke="#e27e78" strokeWidth="6" />
          <path d="M105 191H155" stroke="#6484ac" strokeWidth="6" />
        </g>
      );
    case "bee":
      return (
        <g className="mascot-outfit-body">
          <path d="M81 137Q130 121 179 137L175 205Q130 219 85 205Z" fill="#f2bf45" stroke="#6d4c34" strokeWidth="4" />
          <path d="M86 154Q130 166 174 154M85 178Q130 190 175 178" fill="none" stroke="#6d4c34" strokeWidth="12" />
        </g>
      );
    case "wizard":
      return (
        <g className="mascot-outfit-body">
          <path d="M81 139Q130 121 179 139L174 205Q130 217 86 205Z" fill="#8770ba" stroke="#49396f" strokeWidth="4" />
          <path d="M130 142L139 160L159 163L144 177L148 197L130 187L112 197L116 177L101 163L121 160Z" fill="#f2cf61" stroke="#aa7d2d" strokeWidth="3" />
        </g>
      );
    case "royal":
      return (
        <g className="mascot-outfit-body">
          <path d="M80 139Q130 121 180 139L175 207Q130 220 85 207Z" fill="#f7f0df" stroke="#9b6b44" strokeWidth="4" />
          <path d="M87 145Q130 164 173 145" fill="none" stroke="#d8b86a" strokeWidth="8" />
          <path d="M130 159L140 174L130 189L120 174Z" fill="#76a6be" stroke="#4c7489" strokeWidth="3" />
          <path d="M88 200Q130 213 172 200" fill="none" stroke="#d8b86a" strokeWidth="5" />
        </g>
      );
    case "pajamas":
      return (
        <g className="mascot-outfit-body">
          <path d="M80 138Q130 120 180 138L175 207Q130 220 85 207Z" fill="#8497c9" stroke="#50618e" strokeWidth="4" />
          <path d="M98 157l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1ZM153 179l3 6 7 1-5 5 1 7-6-4-7 4 2-7-6-5 7-1Z" fill="#f5d66d" />
          <path d="M101 140Q130 157 159 140" fill="none" stroke="#e6eefc" strokeWidth="5" />
        </g>
      );
    default:
      return null;
  }
}

function HeadOutfit({ outfit }: { outfit: OutfitId }) {
  switch (outfit) {
    case "classic":
      return (
        <g className="mascot-outfit-head mascot-beret">
          <path d="M90 43C95 23 113 14 134 15C158 16 174 26 174 45C150 53 112 53 90 43Z" fill="#66402f" stroke="#3f291f" strokeWidth="4" />
          <path d="M133 17C132 8 139 4 144 9" fill="none" stroke="#3f291f" strokeWidth="5" strokeLinecap="round" />
          <path d="M101 38C119 28 147 27 164 37" fill="none" stroke="#835743" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "berry":
      return (
        <g className="mascot-outfit-head mascot-bow">
          <path d="M165 46C177 31 194 30 197 43C200 55 185 63 166 58Z" fill="#ec8da0" stroke="#a94f63" strokeWidth="4" />
          <path d="M166 46C157 29 142 30 140 43C139 55 151 61 168 58Z" fill="#f2a3b1" stroke="#a94f63" strokeWidth="4" />
          <circle cx="168" cy="52" r="9" fill="#d9657d" stroke="#a94f63" strokeWidth="3" />
        </g>
      );
    case "raincoat":
      return (
        <path
          className="mascot-outfit-head"
          d="M73 74C78 33 100 19 130 19C162 19 183 37 187 75C172 59 154 52 130 52C106 52 89 59 73 74Z"
          fill="#efb84b"
          stroke="#a66c28"
          strokeWidth="4"
        />
      );
    case "sailor":
      return (
        <g className="mascot-outfit-head">
          <path d="M91 38Q130 19 169 38L165 54Q130 43 95 54Z" fill="#f8fbf4" stroke="#536b8f" strokeWidth="4" />
          <path d="M96 38Q130 28 164 38" fill="none" stroke="#6484ac" strokeWidth="7" />
          <path d="M161 36L181 29L174 49Z" fill="#e27e78" stroke="#9e5553" strokeWidth="3" />
        </g>
      );
    case "bee":
      return (
        <g className="mascot-outfit-head">
          <path d="M105 38Q130 27 155 38" fill="none" stroke="#6d4c34" strokeWidth="6" strokeLinecap="round" />
          <path d="M112 35C108 21 101 19 97 15M148 35C152 21 159 19 163 15" fill="none" stroke="#6d4c34" strokeWidth="4" strokeLinecap="round" />
          <circle cx="96" cy="14" r="6" fill="#f2bf45" stroke="#6d4c34" strokeWidth="3" />
          <circle cx="164" cy="14" r="6" fill="#f2bf45" stroke="#6d4c34" strokeWidth="3" />
        </g>
      );
    case "wizard":
      return (
        <g className="mascot-outfit-head">
          <path d="M91 47L124 4C128-1 135 1 137 8L154 48Z" fill="#67549b" stroke="#49396f" strokeWidth="4" strokeLinejoin="round" />
          <path d="M79 48Q130 35 181 48L174 61Q130 51 86 61Z" fill="#8770ba" stroke="#49396f" strokeWidth="4" />
          <path d="M123 22l4 7 8 1-6 5 2 8-8-4-7 4 2-8-6-5 8-1Z" fill="#f2cf61" />
        </g>
      );
    case "royal":
      return (
        <g className="mascot-outfit-head">
          <path d="M98 45L95 20L112 34L130 13L148 34L165 20L162 47Z" fill="#e6c35b" stroke="#9a7428" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="130" cy="30" r="5" fill="#7da9c0" />
          <circle cx="105" cy="38" r="4" fill="#d96d78" />
          <circle cx="155" cy="38" r="4" fill="#d96d78" />
        </g>
      );
    case "pajamas":
      return (
        <g className="mascot-outfit-head">
          <path d="M91 47C102 16 128 10 161 23C151 23 143 30 139 46Z" fill="#8497c9" stroke="#50618e" strokeWidth="4" />
          <path d="M89 47Q116 39 143 46" fill="none" stroke="#e6eefc" strokeWidth="8" strokeLinecap="round" />
          <circle cx="162" cy="23" r="10" fill="#f5d66d" stroke="#b69a3c" strokeWidth="3" />
        </g>
      );
    default:
      return null;
  }
}

function Face({ condition }: { condition: PetCondition }) {
  const tired = condition === "sleepy" || condition === "critical";
  const unhappy =
    condition === "hungry" ||
    condition === "lonely" ||
    condition === "dirty" ||
    condition === "critical";

  return (
    <g className="mascot-face">
      {tired ? (
        <>
          <path className="mascot-eye eye-left" d="M99 87Q108 94 117 87" fill="none" stroke="#4c3027" strokeWidth="5" strokeLinecap="round" />
          <path className="mascot-eye eye-right" d="M143 87Q152 94 161 87" fill="none" stroke="#4c3027" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : condition === "radiant" ? (
        <>
          <path className="mascot-eye eye-left" d="M98 88Q108 78 118 88" fill="none" stroke="#4c3027" strokeWidth="5" strokeLinecap="round" />
          <path className="mascot-eye eye-right" d="M142 88Q152 78 162 88" fill="none" stroke="#4c3027" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse className="mascot-eye eye-left" cx="108" cy="86" rx="5.5" ry="8" fill="#4c3027" />
          <ellipse className="mascot-eye eye-right" cx="152" cy="86" rx="5.5" ry="8" fill="#4c3027" />
        </>
      )}

      <ellipse cx="130" cy="102" rx="6" ry="4.5" fill="#4c3027" />
      <path d="M130 105V111" fill="none" stroke="#604034" strokeWidth="3" strokeLinecap="round" />
      {unhappy ? (
        <path className="mascot-mouth" d="M119 119Q130 109 141 119" fill="none" stroke="#604034" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path className="mascot-mouth" d="M117 112Q123 124 130 114Q137 124 143 112" fill={condition === "radiant" ? "#dd7880" : "none"} stroke="#604034" strokeWidth="3.5" strokeLinejoin="round" />
      )}

      <ellipse cx="88" cy="106" rx="14" ry="6" fill="#ef9a91" opacity={unhappy ? 0.22 : 0.38} />
      <ellipse cx="172" cy="106" rx="14" ry="6" fill="#ef9a91" opacity={unhappy ? 0.22 : 0.38} />

      {condition === "lonely" && (
        <>
          <path d="M101 96C95 107 97 113 102 115C108 111 107 104 101 96Z" fill="#79b9d8" opacity="0.85" />
          <path d="M159 96C153 107 155 113 160 115C166 111 165 104 159 96Z" fill="#79b9d8" opacity="0.85" />
        </>
      )}
    </g>
  );
}

export function PurinMascot({
  outfit,
  condition,
  action = null,
  name,
  baby = false,
}: PurinMascotProps) {
  return (
    <svg
      className={`purin-mascot condition-${condition} ${baby ? "is-baby" : ""}`}
      viewBox="0 0 260 240"
      role="img"
      aria-label={`${name}，目前狀態：${condition}`}
    >
      <g className={`mascot-rig mascot-action-${action ?? "idle"}`}>
        <ellipse className="mascot-shadow-shape" cx="130" cy="218" rx="72" ry="13" fill="#6e4a31" opacity="0.17" />

        <path className="mascot-tail" d="M183 166C214 153 217 181 202 187C214 184 222 193 216 202C206 217 181 200 177 184Z" fill="#f5cf69" stroke="#9a703d" strokeWidth="4" strokeLinejoin="round" />
        <BackOutfit outfit={outfit} />

        <path className="mascot-ear mascot-ear-left" d="M77 63C49 54 32 70 39 99C43 118 59 133 77 126C91 121 91 103 88 87C85 73 83 67 77 63Z" fill="#d8a545" stroke="#805a31" strokeWidth="4" />
        <path className="mascot-ear mascot-ear-right" d="M183 63C211 54 228 70 221 99C217 118 201 133 183 126C169 121 169 103 172 87C175 73 177 67 183 63Z" fill="#d8a545" stroke="#805a31" strokeWidth="4" />

        <ellipse className="mascot-body" cx="130" cy="167" rx="62" ry="57" fill="#f6d472" stroke="#9a703d" strokeWidth="4" />
        <BodyOutfit outfit={outfit} />

        <ellipse className="mascot-foot mascot-foot-left" cx="100" cy="204" rx="25" ry="16" fill="#f7d779" stroke="#9a703d" strokeWidth="4" transform="rotate(-7 100 204)" />
        <ellipse className="mascot-foot mascot-foot-right" cx="160" cy="204" rx="25" ry="16" fill="#f7d779" stroke="#9a703d" strokeWidth="4" transform="rotate(7 160 204)" />

        <path className="mascot-head" d="M67 84C67 49 91 31 130 31C169 31 193 49 193 84C193 118 172 137 130 137C88 137 67 118 67 84Z" fill="#f9da7c" stroke="#805a31" strokeWidth="4" />
        <path d="M86 59C98 43 116 39 130 39" fill="none" stroke="#fff4bb" strokeWidth="6" strokeLinecap="round" opacity="0.55" />

        <ellipse className="mascot-arm mascot-arm-left" cx="83" cy="164" rx="20" ry="34" fill="#f6d472" stroke="#9a703d" strokeWidth="4" transform="rotate(15 83 164)" />
        <ellipse className="mascot-arm mascot-arm-right" cx="177" cy="164" rx="20" ry="34" fill="#f6d472" stroke="#9a703d" strokeWidth="4" transform="rotate(-15 177 164)" />

        <Face condition={condition} />
        <HeadOutfit outfit={outfit} />

        {condition === "hungry" && (
          <g className="condition-detail hunger-lines" fill="none" stroke="#aa6b3a" strokeWidth="4" strokeLinecap="round">
            <path d="M111 174q8-9 16 0t16 0" />
            <path d="M115 185q6-7 12 0t12 0" />
          </g>
        )}

        {condition === "dirty" && (
          <g className="condition-detail dirt-marks" fill="#a6764f" opacity="0.72">
            <ellipse cx="82" cy="121" rx="13" ry="8" transform="rotate(24 82 121)" />
            <ellipse cx="151" cy="184" rx="15" ry="9" transform="rotate(-14 151 184)" />
            <circle cx="176" cy="102" r="6" />
            <path d="M203 113q10-10 0-20q-9-9 0-18M218 126q10-10 0-20" fill="none" stroke="#8f725f" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {condition === "sleepy" && (
          <g className="condition-detail sleepy-marks" fill="#776b9e" fontFamily="system-ui" fontWeight="800">
            <text x="196" y="77" fontSize="24">z</text>
            <text x="215" y="54" fontSize="17">z</text>
          </g>
        )}

        {condition === "critical" && (
          <g className="condition-detail critical-marks">
            <path d="M199 70C193 82 195 90 201 93C208 88 207 79 199 70Z" fill="#79b9d8" />
            <path d="M55 139q9-10 18 0M48 151q8-8 16 0" fill="none" stroke="#8c7a6f" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {condition === "radiant" && (
          <g className="condition-detail radiant-sparkles" fill="#f5c94f">
            <path d="M49 61l4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" />
            <path d="M211 115l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" />
            <circle cx="204" cy="57" r="5" />
          </g>
        )}
      </g>
    </svg>
  );
}

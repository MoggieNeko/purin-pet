# Purin Pet v15 — Animation & DLC Persona Update

## Animation

- Deterministic action storyboards for feeding, bathing, playing, sleeping, gifting, events, levelling and family moments.
- Timed facial animation: blinking, chewing, closed-eye sleep, squinting, surprise and condition-aware expressions.
- Stage- and persona-aware idle behaviours with smoother transitions and walking posture.
- Touch hit zones for head pats, cheek pokes, belly tickles and paw taps.
- Mobile touch no longer drives pointer tilt, preventing rapid jitter while petting.

## DLC

- Refined age atlases for Gintoki, Feitan, Tsuna, Mafuyu, Ritsuka, Haruki, Akihiko and Chihiro.
- Re-centred all five age cells against the same rig origin.
- Persona-specific face, posture, response text and idle characterisation.
- Corrected overlay landmarks to keep clothing and props aligned during motion.

## Cache and tests

- Service Worker cache version: `purin-pet-v15-animation`.
- Updated rendered artifact test for the new cache version.
- Verified lint, production build, artifact structure, GitHub Pages build and 390×844 mobile animation flows.

# Russia Guide — Higher Studies in Russia

A responsive, cinematic guidance site for Indian students exploring higher studies in Russia. Built with React, Vite, React Three Fiber, Three.js, GSAP ScrollTrigger, HTML5 video, and CSS. The interface retains wine red `#7f011f` and light sand `#f5ebd0`, with pearl-white typography and champagne `#e8c98b` emphasis, while background footage retains its natural colors. All runtime media, fonts, and textures are hosted locally.

The content presents the service as independent guidance—not an education agent or recruitment agency. It does not guarantee admission or scholarships and identifies the respective university or scholarship authority as the decision-maker. The ₹6–7 lakh and ₹2–3 lakh figures are shown as illustrative, case-dependent estimates rather than fixed fees or guaranteed budgets. Applicants are directed to verify current requirements and complete expenses through official sources, including the [official application portal](https://education-in-russia.com/).

## Run locally

**Requirements:** Node.js 18+ (Node.js 20 recommended) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The dev server binds to `0.0.0.0` so it also works in container and preview environments.

## Production

```bash
npm run build
npm run preview
```

The optimized site is written to `dist/`. Deploy that directory to any static host.

## Included

- Russia-specific content covering cost routes, independent scholarship applications, eligibility, documentation, and expense planning
- Three locally hosted 720p Russia video scenes: an opening multi-location journey through Moscow and Saint Petersburg, a Moscow State University aerial, and a Saint Petersburg fortress aerial
- Local WebP posters and a Russia fallback image; no runtime media CDN dependency
- Persistent real 3D sphere with a local outdoor sunrise-landscape HDR environment and lightweight environment-mapped reflections
- Native 4K realistic world globe throughout the hero and content scenes instead of photo textures, with a smooth shader transition to the Russia-highlighted Earth texture for the destination map
- Scroll-driven close-up Earth globe for the destination section, filling the screen with western Russia, continuous slow rotation, Russia-facing entry alignment, and reduced reflection for natural terrain colors
- Continuous rotation and damped pointer response in content scenes; the close-up destination map has no cursor-follow tilt or drift
- GSAP intro, masked typography reveals, small-to-fullscreen expansion, and ScrollTrigger camera/position/scale compositions
- Centered hero sphere with responsive title sizing contained within its silhouette
- Natural-color videos without brightness filters, global shading, or vignette overlays; transform-only sea-wave masks, stationary counter-transformed footage, compositor-friendly opacity blending, and a neutral midpoint transition veil
- Local Manrope and Instrument Serif pairing with pearl-white typography, champagne emphasis, enlarged key phrases and ₹ estimates, and text-only readability shadows
- Dark glassmorphism cards/panels with champagne button sheen, lift, and press feedback
- Responsive editorial layouts for desktop, tablet, and mobile, with compact mobile section spacing that reduces excess scrolling while preserving the globe compositions and page-end checklist visibility
- A dimmed 70%-width centered navigation ribbon that hides during the destination map and returns when scrolling back
- Card-free destination selection with nine floating markers—Moscow, Saint Petersburg, Kazan, Rostov-on-Don, Dagestan, Chechnya, Kabardino-Balkaria, Arkhangelsk, and Murmansk—attached to real globe coordinates, with back-side occlusion, readable leader-line offsets, hover/focus rotation pause, toggle/clear support, and local persistence
- A coordinate-attached floating RUSSIA label with globe-synchronized movement, rotation pauses, and back-side occlusion
- A responsive side checklist with four shared verification steps, nine compact destination choices, selected-destination details, official-portal access, and a working checklist-builder CTA
- Destination selection carried into the checklist dialog, saved profile, and downloaded checklist
- Accessible mobile navigation and checklist dialog with validation, keyboard focus trapping, Escape dismissal, and a personalized completion state
- Optional synthesized interface sounds: subtle control ticks, destination chimes, and checklist completion. Sound is off by default, has no autoplay, background music, hover sounds, or scroll sounds, persists under `russia-study-sound`, and suspends in hidden tabs
- Working plain-text checklist download and official-portal links
- `prefers-reduced-motion` support: no autoplay or scroll scrub, immediate content, and deterministic static hero/destination globe states
- WebGL capability detection plus a world-textured CSS orb and a static Russia Earth fallback with usable destination controls
- Antialiased WebGL with a native 4K Earth texture, up to 8× anisotropic filtering, a capped 1.25 close-up pixel ratio, reduced resolution only during full-screen transitions, a 1K HDR map, and 720p videos
- Only the incoming/active video decodes during scene changes; inactive videos and hidden-tab animation/rendering pause

## Destination map and checklist builder

The footer destination stage uses a scroll-driven, full-screen close-up of the realistic Earth globe instead of a map card. Nine locations appear as floating selectable markers: Moscow, Saint Petersburg, Kazan, Rostov-on-Don, Dagestan, Chechnya, Kabardino-Balkaria, Arkhangelsk, and Murmansk. The Dagestan, Chechnya, and Kabardino-Balkaria markers use the administrative-centre coordinates of Makhachkala, Grozny, and Nalchik respectively while retaining the regional names in the checklist. Responsive leader-line offsets keep the geographically close southern labels readable without moving their coordinate anchors. Markers rotate with the globe, are hidden on its far side, and pause rotation during hover/focus. The map does not follow the cursor. A responsive side panel shows the selected destination and four checklist steps, with nine compact destination choices for mobile or covered-marker states. A preference is stored locally under `russia-study-destination`; select the same marker or destination choice again to clear it. The globe retains subtle rotation without cursor-follow movement, and excess trailing height is removed so the checklist remains fully visible when the page reaches its end. This is a planning aid, not a recommendation or confirmation that a particular programme is available.

The dialog creates a personalized starter checklist from a name, intended course, and optional destination. The profile is saved to `localStorage` under `russia-study-checklist`; no data leaves the device and no application is submitted. The selected destination appears in the dialog and downloaded text file. The checklist is preparation guidance, not confirmation of eligibility, admission, or a scholarship.

## Project structure

```text
src/
  App.jsx                         Russia guidance narrative and GSAP timelines
  styles.css                      Visual system and responsive layouts
  components/
    SceneBackground.jsx            Russia video loading, wave transitions, and playback lifecycle
    SphereExperience.jsx           R3F globe, coordinate markers, HDR, and fallbacks
    DestinationMap.jsx             Destination stage and responsive side checklist
    Navigation.jsx                 Editorial scroll ribbon and mobile navigation
    SoundToggle.jsx                Desktop and mobile opt-in sound controls
    AccessModal.jsx                Accessible checklist builder and download flow
    Brand.jsx / Arrow.jsx          Reusable identity and icon components
  data/
    destinations.js               Shared destination metadata
    checklist.js                  Shared panel, modal, and download guidance
    russiaOutline.js              Simplified Natural Earth map outline
  hooks/useMedia.js               Media-query and page-visibility hooks
  hooks/useInterfaceSounds.js     Lazy Web Audio recipes, delegation, and preference
public/
  videos/                          Local 720p Russia MP4 scenes
  textures/sunrise-landscape.hdr   Local 1K outdoor HDR reflection environment
  images/                          Local Russia video posters and fallback artwork
  fonts/                           Self-hosted typefaces
```

## Optional browser smoke check

With the dev server running:

```bash
npx playwright install chromium
npm run test:smoke
```

The smoke check covers natural video filters, photo-free world textures throughout the hero/content sphere, native 4K world and Russia Earth dimensions, the destination Russia texture and floating RUSSIA label, all nine destination markers and checklist choices, every added location, regional administrative-centre notes, modal options and persistence, desktop/mobile opt-in sound controls and sound-preference persistence, full checklist visibility at page end, centered navigation, world/no-WebGL fallbacks, rendering, overflow, reduced-motion behavior, mobile navigation, the checklist-panel CTA, and checklist-download content.

## Main dependencies

- React / React DOM
- Vite / `@vitejs/plugin-react`
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- GSAP (ScrollTrigger)
- Playwright (development-only smoke checks)

Exact versions and lockfile entries are included in `package.json` and `package-lock.json`.

## Asset credits

### Video — Pexels License

The local edits are cropped, trimmed, and encoded without thematic color overlays. The opening montage combines the first three sources.

- [Walk in Moscow](https://www.pexels.com/video/walk-in-moscow-16310166/) — Aghyad Najjar; St. Basil’s Cathedral / Red Square.
- [The Cathedral of Our Lady of Kazan in Saint Petersburg, Russia](https://www.pexels.com/video/the-cathedral-of-our-lady-of-kazan-in-saint-petersburg-russia-4787511/) — Maman Nurbek.
- [The Buildings of Moscow University in Russia](https://www.pexels.com/video/the-buildings-of-moscow-university-in-russia-5956456/) — Evgenia Kirpichnikova.
- [Drone Video of Saint Petersburg in Russia](https://www.pexels.com/video/drone-video-of-saint-petersburg-in-russia-3753625/) — Andrey Kirievskiy; Peter and Paul Fortress area.
- License: [Pexels License](https://www.pexels.com/license/).

### Reflection environment

- [Spruit Sunrise](https://polyhaven.com/a/spruit_sunrise) — Greg Zaal / Poly Haven, CC0. Used as an outdoor landscape reflection map; no geographic claim is made about this environment.
- License: [Poly Haven CC0](https://polyhaven.com/license).

### Map, fonts, and fallback artwork

- **World and Earth globe:** the native 4096×2048 [NASA Blue Marble-derived texture distributed with the three-globe examples](https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg) is used for both the natural `earth-world.webp` hero/content globe and the highlighted `earth-russia.webp` destination globe. The Russia version adds a local warm tint and 1 px pearl-white boundary generated from Natural Earth coordinates. The RUSSIA label is a separate coordinate-attached floating overlay, not baked into the texture. NASA Blue Marble source collection: [NASA Visible Earth](https://visibleearth.nasa.gov/collection/1484/blue-marble). The optional regeneration script for both textures is `scripts/generate_earth_texture.py` (Python/Pillow only; not a runtime dependency).
- **Map outline:** high-resolution [Natural Earth 10m](https://www.naturalearthdata.com/) public-domain geography via [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector), projected for the highlighted globe texture.
- **Fonts:** Manrope, Instrument Serif, and DM Mono, distributed through Google Fonts under the SIL Open Font License.
- **Fallback artwork and posters:** generated locally from the licensed Russia footage above.

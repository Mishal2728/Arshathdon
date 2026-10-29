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
- Five section-specific local sphere images—Red Square, Moscow University, Saint Petersburg, Kazan Cathedral, and destination-map artwork—with smooth two-texture shader blending and queued rapid changes
- Continuous rotation and damped pointer response
- GSAP intro, masked typography reveals, small-to-fullscreen expansion, and ScrollTrigger camera/position/scale compositions
- Natural-color videos without brightness filters, global shading, or vignette overlays; transform-only sea-wave masks, stationary counter-transformed footage, compositor-friendly opacity blending, and a neutral midpoint transition veil
- Local Manrope and Instrument Serif pairing with pearl-white typography, champagne emphasis, enlarged key phrases and ₹ estimates, and text-only readability shadows
- Dark glassmorphism cards/panels with champagne button sheen, lift, and press feedback
- Responsive editorial layouts for desktop, tablet, and mobile
- Interactive schematic Russia destination atlas with accessible markers, accurate local destination previews, a moving focus ring, animated research route, desktop/mobile controls, clear-selection support, and local persistence
- Destination selection carried into the checklist dialog, saved profile, and downloaded checklist
- Accessible mobile navigation and checklist dialog with validation, keyboard focus trapping, Escape dismissal, and a personalized completion state
- Working plain-text checklist download and official-portal links
- `prefers-reduced-motion` support: no autoplay or scroll scrub, immediate content, and a static hero-only sphere
- WebGL capability detection plus a styled CSS orb fallback
- Native-resolution WebGL with antialiasing, adaptive resolution only during full-screen sphere expansion, a 1K HDR map, and 720p videos
- Only the incoming/active video decodes during scene changes; inactive videos and hidden-tab animation/rendering pause

## Destination map and checklist builder

The footer map offers Moscow, Saint Petersburg, and Kazan as planning preferences, with accurate local preview images for each destination. It is a schematic research aid, not a recommendation or confirmation that a particular programme is available. The selection is stored locally under `russia-study-destination` and can be cleared.

The dialog creates a personalized starter checklist from a name, intended course, and optional destination. The profile is saved to `localStorage` under `russia-study-checklist`; no data leaves the device and no application is submitted. The selected destination appears in the dialog and downloaded text file. The checklist is preparation guidance, not confirmation of eligibility, admission, or a scholarship.

## Project structure

```text
src/
  App.jsx                         Russia guidance narrative and GSAP timelines
  styles.css                      Visual system and responsive layouts
  components/
    SceneBackground.jsx            Russia video loading, wave transitions, and playback lifecycle
    SphereExperience.jsx           R3F canvas, reflective sphere, HDR, and fallbacks
    DestinationMap.jsx             Accessible destination selector and checklist connection
    Navigation.jsx                 Desktop and mobile navigation
    AccessModal.jsx                Accessible checklist builder and download flow
    Brand.jsx / Arrow.jsx          Reusable identity and icon components
  data/
    destinations.js               Shared destination metadata
    russiaOutline.js              Simplified Natural Earth map outline
  hooks/useMedia.js               Media-query and page-visibility hooks
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

The smoke check covers natural video filters, section-specific sphere images, rendering, overflow, reduced-motion behavior, mobile navigation, destination previews and persistence, checklist creation, and checklist-download content.

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

### Additional destination photography

- [Kazan Kremlin exterior view](https://commons.wikimedia.org/wiki/File:Kazan_Kremlin_exterior_view_08-2016_img3.jpg) — **A.Savin, Wikipedia**, used for the Kazan destination preview under the [Free Art License](https://en.wikipedia.org/wiki/Free_Art_License). The local WebP is a format-converted derivative of the 1280px Wikimedia thumbnail.

### Reflection environment

- [Spruit Sunrise](https://polyhaven.com/a/spruit_sunrise) — Greg Zaal / Poly Haven, CC0. Used as an outdoor landscape reflection map; no geographic claim is made about this environment.
- License: [Poly Haven CC0](https://polyhaven.com/license).

### Map, fonts, and fallback artwork

- **Map outline:** derived from [Natural Earth](https://www.naturalearthdata.com/) public-domain geography via [johan/world.geo.json](https://github.com/johan/world.geo.json), simplified and projected for this schematic interface.
- **Fonts:** Manrope, Instrument Serif, and DM Mono, distributed through Google Fonts under the SIL Open Font License.
- **Fallback artwork and posters:** generated locally from the licensed Russia footage above. The final sphere’s map artwork is generated locally from the Natural Earth outline and destination route.

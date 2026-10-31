import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useEnvironment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePageVisibility } from '../hooks/useMedia.js';
import { DESTINATIONS } from '../data/destinations.js';

const SPHERE_IMAGES = [
  '/images/earth-world.webp',
  '/images/earth-russia.webp',
];

const SPHERE_PALETTES = {
  0: { body: new THREE.Color('#fffdf8'), rim: new THREE.Color('#7f011f') },
  1: { body: new THREE.Color('#fff9ee'), rim: new THREE.Color('#8d0a28') },
  2: { body: new THREE.Color('#ffffff'), rim: new THREE.Color('#650016') },
  3: { body: new THREE.Color('#fffaf0'), rim: new THREE.Color('#7f011f') },
  4: { body: new THREE.Color('#ffffff'), rim: new THREE.Color('#e8c98b') },
};
SPHERE_PALETTES[-1] = SPHERE_PALETTES[4];

const IMAGE_TRANSITION_DURATION = 1.2;
const RUSSIA_FRONT_ANGLE = THREE.MathUtils.degToRad(225);
const RUSSIA_TILT_ANGLE = THREE.MathUtils.degToRad(57);
const DEFAULT_SPIN_RATE = 0.075;
const GLOBE_SPIN_RATE = 0.008;
const GLOBE_CLOSEUP_SCALE = 1.9;

function imageIndexForScene(scene) {
  return scene === 4 || scene === -1 ? 1 : 0;
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

class WebGLBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <SphereFallback {...this.props} /> : this.props.children;
  }
}

function globePoint(latitude, longitude, radius = 1.545) {
  const phi = THREE.MathUtils.degToRad(longitude + 180);
  const theta = THREE.MathUtils.degToRad(90 - latitude);
  return [
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function DestinationButton({ destination, value, onChange, onInteractionChange, fallback = false, style }) {
  const selected = value === destination.id;
  return (
    <button
      type="button"
      className={`globe-marker${selected ? ' is-selected' : ''}${fallback ? ' globe-marker--fallback' : ''}`}
      style={style}
      data-destination={destination.id}
      aria-label={`${selected ? 'Clear' : 'Select'} ${destination.name} as your preferred study destination`}
      aria-pressed={selected}
      onClick={() => onChange?.(selected ? '' : destination.id)}
      onMouseEnter={() => onInteractionChange?.(true)}
      onMouseLeave={() => onInteractionChange?.(false)}
      onFocus={() => onInteractionChange?.(true)}
      onBlur={() => onInteractionChange?.(false)}
    >
      <span className="globe-marker__dot" aria-hidden="true"><i /></span>
      <span className="globe-marker__text"><small>{destination.number}</small>{destination.name}</span>
    </button>
  );
}

function CoordinateMarker({ destination, mobile, value, onChange, onInteractionChange }) {
  const offset = (mobile ? destination.mobileLabelOffset : destination.labelOffset) || [0, 0];
  const [x, y] = offset;
  const distance = Math.hypot(x, y);
  const angle = Math.atan2(y, x) * 180 / Math.PI;
  const style = {
    '--marker-x': `${x}px`,
    '--marker-y': `${y}px`,
    '--leader-length': `${distance}px`,
    '--leader-angle': `${angle}deg`,
  };

  return (
    <div className="globe-marker-anchor" style={style}>
      {distance > 0 && (
        <>
          <span className="globe-marker-anchor__leader" aria-hidden="true" />
          <span className="globe-marker-anchor__point" aria-hidden="true" />
        </>
      )}
      <DestinationButton
        destination={destination}
        value={value}
        onChange={onChange}
        onInteractionChange={onInteractionChange}
      />
    </div>
  );
}

const FALLBACK_POSITIONS = {
  moscow: { left: '45%', top: '48%' },
  'saint-petersburg': { left: '36%', top: '39%' },
  kazan: { left: '58%', top: '51%' },
  'rostov-on-don': { left: '38%', top: '60%' },
  dagestan: { left: '64%', top: '70%' },
  chechnya: { left: '53%', top: '62%' },
  'kabardino-balkaria': { left: '39%', top: '73%' },
  arkhangelsk: { left: '58%', top: '26%' },
  murmansk: { left: '34%', top: '20%' },
};

function SphereFallback({ activeScene = 0, markersVisible = false, destinationValue = '', onDestinationChange }) {
  const interactive = activeScene === 4 && markersVisible;
  if (activeScene === 4) {
    return (
      <div className="sphere-fallback sphere-fallback--earth" aria-hidden={interactive ? undefined : true}>
        <div className="sphere-fallback__earth">
          {interactive && <span className="globe-country-label globe-country-label--fallback" aria-hidden="true"><i />RUSSIA</span>}
          {interactive && DESTINATIONS.map((destination) => (
            <DestinationButton
              key={destination.id}
              destination={destination}
              value={destinationValue}
              onChange={onDestinationChange}
              fallback
              style={FALLBACK_POSITIONS[destination.id]}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="sphere-fallback" aria-hidden="true">
      <div className="sphere-fallback__orb" />
    </div>
  );
}

function Sphere({ motion, pointer, reducedMotion, activeScene, markersVisible, destinationValue, onDestinationChange }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const material = useRef(null);
  const globeMesh = useRef(null);
  const rimMaterial = useRef(null);
  const spin = useRef(0);
  const spinRate = useRef(DEFAULT_SPIN_RATE);
  const russiaAlignment = useRef(null);
  const previousScene = useRef(null);
  const smoothPointer = useRef({ x: 0, y: 0 });
  const resolutionMode = useRef('full');
  const markerInteracting = useRef(false);
  const environment = useEnvironment({ files: '/textures/sunrise-landscape.hdr' });
  const textures = useTexture(SPHERE_IMAGES);
  const imageUniforms = useRef({
    nextMap: { value: textures[0] },
    mapBlend: { value: 0 },
  });
  const imageState = useRef({ current: 0, desired: 0, target: 0, progress: 1 });
  const { camera, size, gl, invalidate } = useThree();

  useMemo(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
    });
  }, [textures, gl]);

  const onBeforeCompile = useCallback((shader) => {
    shader.uniforms.nextMap = imageUniforms.current.nextMap;
    shader.uniforms.mapBlend = imageUniforms.current.mapBlend;
    shader.fragmentShader = `
      uniform sampler2D nextMap;
      uniform float mapBlend;
      ${shader.fragmentShader}
    `;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D(map, vMapUv);
        vec4 nextDiffuseColor = texture2D(nextMap, vMapUv);
        sampledDiffuseColor = mix(sampledDiffuseColor, nextDiffuseColor, smoothstep(0.0, 1.0, mapBlend));
        diffuseColor *= sampledDiffuseColor;
      #endif
    `);
  }, []);

  const customProgramCacheKey = useCallback(() => 'sphere-image-blend-v1', []);

  useEffect(() => {
    const next = imageIndexForScene(activeScene);
    const state = imageState.current;
    const currentMaterial = material.current;
    state.desired = next;
    if (!currentMaterial) return;

    if (reducedMotion) {
      state.current = next;
      state.target = next;
      state.progress = 1;
      currentMaterial.map = textures[next];
      imageUniforms.current.nextMap.value = textures[next];
      imageUniforms.current.mapBlend.value = 0;
      invalidate();
      return;
    }

    if (state.progress >= 1 && state.current !== next) {
      state.target = next;
      state.progress = 0;
      imageUniforms.current.nextMap.value = textures[next];
      imageUniforms.current.mapBlend.value = 0;
    }
  }, [activeScene, reducedMotion, textures, invalidate]);

  useEffect(() => {
    const currentMaterial = material.current;
    if (!currentMaterial) return;
    const toneMapped = activeScene !== 4;
    if (currentMaterial.toneMapped !== toneMapped) {
      currentMaterial.toneMapped = toneMapped;
      currentMaterial.needsUpdate = true;
    }
  }, [activeScene]);

  useLayoutEffect(() => {
    if (activeScene === 4 && (previousScene.current !== 4 || reducedMotion)) {
      const target = RUSSIA_FRONT_ANGLE + Math.round((spin.current - RUSSIA_FRONT_ANGLE) / (Math.PI * 2)) * Math.PI * 2;
      russiaAlignment.current = reducedMotion ? null : target;
      if (reducedMotion) {
        spin.current = target;
        if (inner.current) {
          inner.current.rotation.y = target;
          inner.current.rotation.x = RUSSIA_TILT_ANGLE;
          inner.current.rotation.z = 0;
          invalidate();
        }
      }
    } else if (activeScene !== 4) {
      russiaAlignment.current = null;
    }
    previousScene.current = activeScene;
  }, [activeScene, reducedMotion, invalidate]);

  useLayoutEffect(() => {
    if (!reducedMotion || !outer.current) return;
    const values = motion.current;
    const mobile = size.width < 768;
    const tablet = size.width >= 768 && size.width < 1100;
    const responsiveScale = mobile ? Math.min(0.62, size.width / 650) : tablet ? 0.88 : 1;
    const isGlobe = activeScene === 4;
    const mobileLift = mobile ? Math.min(1, Math.abs(values.x) / 1.5) * 1.05 : 0;
    const shortScreenLift = !mobile && size.height < 740 ? 0.2 : 0;
    const targetX = isGlobe ? (mobile ? -0.05 : -0.45) : values.x * (mobile ? 0.12 : 1);
    const targetY = isGlobe ? 0 : values.y + mobileLift + shortScreenLift;
    const baseScale = isGlobe ? GLOBE_CLOSEUP_SCALE : values.scale;

    outer.current.position.set(targetX, targetY, 0);
    outer.current.scale.setScalar(baseScale * responsiveScale);
    outer.current.visible = values.opacity > 0.008 && (activeScene === 0 || isGlobe);
    outer.current.updateMatrixWorld(true);
    camera.position.z = isGlobe ? 6.4 : values.cameraZ;
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [activeScene, reducedMotion, size.width, size.height, motion, camera, invalidate]);

  useEffect(() => {
    if (!markersVisible) markerInteracting.current = false;
  }, [markersVisible]);

  useFrame((state, delta) => {
    if (!outer.current || !inner.current) return;
    const values = motion.current;

    const desiredResolution = activeScene === 4 ? 'globe' : values.scale > 1.5 ? 'expanded' : 'full';
    if (!reducedMotion && desiredResolution !== resolutionMode.current) {
      const globePixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      gl.setPixelRatio(desiredResolution === 'globe' ? globePixelRatio : desiredResolution === 'expanded' ? 0.6 : 1);
      resolutionMode.current = desiredResolution;
    }

    const mobile = size.width < 768;
    const tablet = size.width >= 768 && size.width < 1100;
    const responsiveScale = mobile ? Math.min(0.62, size.width / 650) : tablet ? 0.88 : 1;
    const mobileLift = mobile ? Math.min(1, Math.abs(values.x) / 1.5) * 1.05 : 0;
    const shortScreenLift = !mobile && size.height < 740 ? 0.2 : 0;
    const drift = reducedMotion || activeScene === 4 || markerInteracting.current ? 0 : Math.sin(state.clock.elapsedTime * 0.48) * 0.055;
    const damping = 1 - Math.exp(-delta * 5.5);

    const targetX = reducedMotion && activeScene === 4 ? (mobile ? -0.05 : -0.45) : values.x * (mobile ? 0.12 : 1);
    const targetY = reducedMotion && activeScene === 4 ? 0 : values.y + mobileLift + shortScreenLift + drift;
    const baseScale = reducedMotion && activeScene === 4 ? GLOBE_CLOSEUP_SCALE : values.scale;
    const targetScale = baseScale * responsiveScale;
    if (reducedMotion) {
      outer.current.position.set(targetX, targetY, 0);
      outer.current.scale.setScalar(targetScale);
    } else {
      outer.current.position.x = THREE.MathUtils.damp(outer.current.position.x, targetX, 5, delta);
      outer.current.position.y = THREE.MathUtils.damp(outer.current.position.y, targetY, 5, delta);
      const nextScale = THREE.MathUtils.damp(outer.current.scale.x, targetScale, 5, delta);
      outer.current.scale.setScalar(nextScale);
    }
    outer.current.visible = values.opacity > 0.008 && (!reducedMotion || activeScene === 0 || activeScene === 4);

    const palette = SPHERE_PALETTES[activeScene] || SPHERE_PALETTES[0];
    const colorDamping = reducedMotion ? 1 : 1 - Math.exp(-delta * 1.8);
    if (material.current) {
      const image = imageState.current;
      if (!reducedMotion && image.progress < 1) {
        image.progress = Math.min(1, image.progress + delta / IMAGE_TRANSITION_DURATION);
        imageUniforms.current.mapBlend.value = image.progress;

        if (image.progress >= 1) {
          image.current = image.target;
          material.current.map = textures[image.current];
          imageUniforms.current.mapBlend.value = 0;

          if (image.desired !== image.current) {
            image.target = image.desired;
            image.progress = 0;
            imageUniforms.current.nextMap.value = textures[image.target];
          } else {
            imageUniforms.current.nextMap.value = textures[image.current];
          }
        }
      }

      const targetOpacity = reducedMotion && activeScene === 4 ? 0.96 : values.opacity;
      material.current.opacity = reducedMotion
        ? targetOpacity
        : THREE.MathUtils.lerp(material.current.opacity, targetOpacity, damping);
      material.current.color.lerp(palette.body, colorDamping);
      const targetReflectivity = activeScene === 4 ? 0.02 : 0.34;
      material.current.reflectivity = reducedMotion
        ? targetReflectivity
        : THREE.MathUtils.damp(material.current.reflectivity, targetReflectivity, 2.5, delta);
      material.current.depthWrite = material.current.opacity > 0.96;
    }
    if (rimMaterial.current) {
      rimMaterial.current.color.lerp(palette.rim, colorDamping);
      rimMaterial.current.opacity = values.opacity * (activeScene === 4 ? 0.12 : 0.07);
    }

    if (!reducedMotion) {
      if (activeScene !== 4 || !markerInteracting.current) {
        spinRate.current = THREE.MathUtils.damp(spinRate.current, activeScene === 4 ? GLOBE_SPIN_RATE : DEFAULT_SPIN_RATE, 3, delta);
        spin.current += delta * spinRate.current;
        if (russiaAlignment.current !== null) {
          spin.current = THREE.MathUtils.damp(spin.current, russiaAlignment.current, 3.2, delta);
          if (Math.abs(spin.current - russiaAlignment.current) < 0.01) russiaAlignment.current = null;
        }
      }
      if (activeScene === 4) {
        // Keep the close-up map cartographically stable: no cursor-follow tilt or drift.
        smoothPointer.current.x = 0;
        smoothPointer.current.y = 0;
        inner.current.rotation.y = spin.current;
        inner.current.rotation.x = THREE.MathUtils.damp(inner.current.rotation.x, RUSSIA_TILT_ANGLE, 4, delta);
        inner.current.rotation.z = THREE.MathUtils.damp(inner.current.rotation.z, 0, 4, delta);
      } else {
        smoothPointer.current.x = THREE.MathUtils.damp(smoothPointer.current.x, pointer.current.x, 3.2, delta);
        smoothPointer.current.y = THREE.MathUtils.damp(smoothPointer.current.y, pointer.current.y, 3.2, delta);
        inner.current.rotation.y = spin.current + smoothPointer.current.x * 0.24;
        inner.current.rotation.x = THREE.MathUtils.damp(inner.current.rotation.x, smoothPointer.current.y * 0.16, 4, delta);
        inner.current.rotation.z = THREE.MathUtils.damp(inner.current.rotation.z, -smoothPointer.current.x * 0.07, 4, delta);
      }
    }

    camera.position.z = reducedMotion
      ? (activeScene === 4 ? 6.4 : values.cameraZ)
      : THREE.MathUtils.damp(camera.position.z, values.cameraZ, 4.5, delta);
    camera.lookAt(0, 0, 0);
    // Keep the occlusion mesh and coordinate-attached HTML on the same frame.
    outer.current.updateMatrixWorld(true);
  });

  return (
    <group ref={outer}>
      <group ref={inner} rotation={[0.08, -0.4, -0.08]}>
        <mesh ref={globeMesh} castShadow>
          <sphereGeometry args={[1.5, 48, 48]} />
          <meshBasicMaterial
            ref={material}
            map={textures[0]}
            color="#fffdf8"
            envMap={environment}
            envMapRotation={[0, Math.PI * 0.35, 0]}
            envMapIntensity={1.05}
            combine={THREE.MixOperation}
            reflectivity={0.34}
            transparent
            opacity={0}
            onBeforeCompile={onBeforeCompile}
            customProgramCacheKey={customProgramCacheKey}
          />
        </mesh>
        <mesh scale={1.008}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshBasicMaterial
            ref={rimMaterial}
            color="#7f011f"
            side={THREE.BackSide}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {activeScene === 4 && markersVisible && (
          <Html
            position={globePoint(60.5, 62, 1.59)}
            center
            occlude={[globeMesh]}
            zIndexRange={[35, 0]}
            pointerEvents="none"
          >
            <div className="globe-country-label" aria-hidden="true"><i />RUSSIA</div>
          </Html>
        )}
        {activeScene === 4 && markersVisible && DESTINATIONS.map((destination) => (
          <Html
            key={destination.id}
            position={globePoint(destination.lat, destination.lon)}
            center
            occlude={[globeMesh]}
            zIndexRange={[40, 0]}
            pointerEvents="auto"
          >
            <CoordinateMarker
              destination={destination}
              mobile={size.width < 768}
              value={destinationValue}
              onChange={onDestinationChange}
              onInteractionChange={(paused) => { markerInteracting.current = paused; }}
            />
          </Html>
        ))}
      </group>
    </group>
  );
}

export default function SphereExperience({ motion, reducedMotion, activeScene, destinationMarkersVisible, destinationValue, onDestinationChange }) {
  const pointer = useRef({ x: 0, y: 0 });
  const interactiveGlobe = activeScene === 4 && destinationMarkersVisible;
  const pageVisible = usePageVisibility();
  const supported = useMemo(canUseWebGL, []);

  useEffect(() => {
    if (reducedMotion || activeScene === 4) {
      pointer.current = { x: 0, y: 0 };
      return undefined;
    }
    const onPointerMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onPointerLeave = () => { pointer.current = { x: 0, y: 0 }; };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('mouseleave', onPointerLeave);
    };
  }, [reducedMotion, activeScene]);

  if (!supported) {
    return <SphereFallback activeScene={activeScene} markersVisible={destinationMarkersVisible} destinationValue={destinationValue} onDestinationChange={onDestinationChange} />;
  }

  return (
    <WebGLBoundary activeScene={activeScene} markersVisible={destinationMarkersVisible} destinationValue={destinationValue} onDestinationChange={onDestinationChange}>
      <div
        className={`sphere-canvas${activeScene === 4 ? ' is-globe-active' : ''}`}
        aria-hidden={interactiveGlobe ? undefined : true}
        data-sphere-scene={activeScene}
        data-sphere-image={SPHERE_IMAGES[imageIndexForScene(activeScene)]}
      >
        <Canvas
          camera={{ position: [0, 0, 6.8], fov: 38, near: 0.1, far: 100 }}
          dpr={1}
          frameloop={pageVisible && !reducedMotion ? 'always' : 'demand'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.12;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Suspense fallback={null}>
            <Sphere
              motion={motion}
              pointer={pointer}
              reducedMotion={reducedMotion}
              activeScene={activeScene}
              markersVisible={destinationMarkersVisible}
              destinationValue={destinationValue}
              onDestinationChange={onDestinationChange}
            />
          </Suspense>
        </Canvas>
      </div>
    </WebGLBoundary>
  );
}

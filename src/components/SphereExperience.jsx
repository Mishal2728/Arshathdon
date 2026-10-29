import { Component, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEnvironment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePageVisibility } from '../hooks/useMedia.js';

const SPHERE_IMAGES = [
  '/images/russia-highlights.webp',
  '/images/moscow-university.webp',
  '/images/saint-petersburg.webp',
  '/images/kazan-cathedral.webp',
  '/images/russia-map.webp',
];

const SPHERE_PALETTES = {
  0: { body: new THREE.Color('#fffdf8'), rim: new THREE.Color('#7f011f') },
  1: { body: new THREE.Color('#fff9ee'), rim: new THREE.Color('#8d0a28') },
  2: { body: new THREE.Color('#ffffff'), rim: new THREE.Color('#650016') },
  3: { body: new THREE.Color('#fffaf0'), rim: new THREE.Color('#7f011f') },
  4: { body: new THREE.Color('#f5ebd0'), rim: new THREE.Color('#8d0a28') },
};
SPHERE_PALETTES[-1] = SPHERE_PALETTES[4];

const IMAGE_TRANSITION_DURATION = 1.2;

function imageIndexForScene(scene) {
  return SPHERE_IMAGES[scene] ? scene : 0;
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
    return this.state.failed ? <SphereFallback /> : this.props.children;
  }
}

function SphereFallback() {
  return (
    <div className="sphere-fallback" aria-hidden="true">
      <div className="sphere-fallback__orb" />
    </div>
  );
}

function Sphere({ motion, pointer, reducedMotion, activeScene }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const material = useRef(null);
  const rimMaterial = useRef(null);
  const spin = useRef(0);
  const smoothPointer = useRef({ x: 0, y: 0 });
  const resolutionMode = useRef('full');
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
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
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

  useFrame((state, delta) => {
    if (!outer.current || !inner.current) return;
    const values = motion.current;

    if (!reducedMotion && values.scale > 1.5 && resolutionMode.current === 'full') {
      gl.setPixelRatio(0.6);
      resolutionMode.current = 'expanded';
    } else if (!reducedMotion && values.scale < 1.15 && resolutionMode.current === 'expanded') {
      gl.setPixelRatio(1);
      resolutionMode.current = 'full';
    }

    const mobile = size.width < 768;
    const tablet = size.width >= 768 && size.width < 1100;
    const responsiveScale = mobile ? Math.min(0.62, size.width / 650) : tablet ? 0.88 : 1;
    const mobileLift = mobile ? Math.min(1, Math.abs(values.x) / 1.5) * 1.05 : 0;
    const shortScreenLift = !mobile && size.height < 740 ? 0.2 : 0;
    const drift = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.48) * 0.055;
    const damping = 1 - Math.exp(-delta * 5.5);

    const targetX = values.x * (mobile ? 0.12 : 1);
    const targetY = values.y + mobileLift + shortScreenLift + drift;
    const targetScale = values.scale * responsiveScale;
    if (reducedMotion) {
      outer.current.position.set(targetX, targetY, 0);
      outer.current.scale.setScalar(targetScale);
    } else {
      outer.current.position.x = THREE.MathUtils.damp(outer.current.position.x, targetX, 5, delta);
      outer.current.position.y = THREE.MathUtils.damp(outer.current.position.y, targetY, 5, delta);
      const nextScale = THREE.MathUtils.damp(outer.current.scale.x, targetScale, 5, delta);
      outer.current.scale.setScalar(nextScale);
    }
    outer.current.visible = values.opacity > 0.008;

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

      material.current.opacity = reducedMotion
        ? values.opacity
        : THREE.MathUtils.lerp(material.current.opacity, values.opacity, damping);
      material.current.color.lerp(palette.body, colorDamping);
      material.current.depthWrite = material.current.opacity > 0.96;
    }
    if (rimMaterial.current) {
      rimMaterial.current.color.lerp(palette.rim, colorDamping);
      rimMaterial.current.opacity = values.opacity * 0.07;
    }

    if (!reducedMotion) {
      spin.current += delta * 0.075;
      smoothPointer.current.x = THREE.MathUtils.damp(smoothPointer.current.x, pointer.current.x, 3.2, delta);
      smoothPointer.current.y = THREE.MathUtils.damp(smoothPointer.current.y, pointer.current.y, 3.2, delta);
      inner.current.rotation.y = spin.current + smoothPointer.current.x * 0.24;
      inner.current.rotation.x = THREE.MathUtils.damp(inner.current.rotation.x, smoothPointer.current.y * 0.16, 4, delta);
      inner.current.rotation.z = THREE.MathUtils.damp(inner.current.rotation.z, -smoothPointer.current.x * 0.07, 4, delta);
    }

    camera.position.z = reducedMotion
      ? values.cameraZ
      : THREE.MathUtils.damp(camera.position.z, values.cameraZ, 4.5, delta);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={outer}>
      <group ref={inner} rotation={[0.08, -0.4, -0.08]}>
        <mesh castShadow>
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
      </group>
    </group>
  );
}

export default function SphereExperience({ motion, reducedMotion, activeScene }) {
  const pointer = useRef({ x: 0, y: 0 });
  const pageVisible = usePageVisibility();
  const supported = useMemo(canUseWebGL, []);

  useEffect(() => {
    if (reducedMotion) return undefined;
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
  }, [reducedMotion]);

  if (!supported) return <SphereFallback />;

  return (
    <WebGLBoundary>
      <div
        className="sphere-canvas"
        aria-hidden="true"
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
            <Sphere motion={motion} pointer={pointer} reducedMotion={reducedMotion} activeScene={activeScene} />
          </Suspense>
        </Canvas>
      </div>
    </WebGLBoundary>
  );
}

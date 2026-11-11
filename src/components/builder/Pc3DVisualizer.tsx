'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStore } from '@/store/useStore';
import { getTranslation } from '@/lib/i18n';
import {
  RotateCw,
  Layers,
  Shield,
  Sliders,
  Sparkles,
  Maximize2,
  Minimize2,
  Box,
  Eye,
} from 'lucide-react';

const RGB_PRESETS = [
  { name: 'Cyan Neon', hex: '#00f0ff' },
  { name: 'Cyberpunk Violet', hex: '#a855f7' },
  { name: 'Emerald Matrix', hex: '#10b981' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Sunset Amber', hex: '#f59e0b' },
  { name: 'Pure Ice White', hex: '#ffffff' },
  { name: 'Stealth Black', hex: '#18181b' },
];

export const Pc3DVisualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    language,
    builder,
    visualizerRgb,
    setVisualizerRgb,
    visualizerGlassOpen,
    toggleVisualizerGlass,
    isExplodedView,
    toggleExplodedView,
    isAutoRotate,
    toggleAutoRotate,
    setVisualizerMode,
  } = useStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // References to 3D objects for dynamic animations and exploded view
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rgbLightRef = useRef<THREE.PointLight | null>(null);
  const rgbMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Rotating fan meshes
  const rotatingFansRef = useRef<THREE.Group[]>([]);

  // Component groups for exploded view
  const compGroupsRef = useRef<{
    case?: THREE.Group;
    glass?: THREE.Mesh;
    motherboard?: THREE.Group;
    cpu?: THREE.Group;
    cooler?: THREE.Group;
    ram?: THREE.Group;
    gpu?: THREE.Group;
    storage?: THREE.Group;
    psu?: THREE.Group;
  }>({});

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const width = containerRef.current.clientWidth || 500;
    const height = containerRef.current.clientHeight || 560;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);

    // Subtle cyberpunk grid floor
    const grid = new THREE.GridHelper(14, 28, 0x00f0ff, 0x1e293b);
    grid.position.y = -2.6;
    scene.add(grid);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5.5, 3.2, 6.5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't flip under floor
    controls.target.set(0, 0, 0);

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(6, 10, 8);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight2.position.set(-6, -2, -6);
    scene.add(dirLight2);

    // Dynamic ARGB Interior Point Light
    const rgbLight = new THREE.PointLight(new THREE.Color(visualizerRgb), 3.5, 7);
    rgbLight.position.set(0, 0.8, 0.2);
    scene.add(rgbLight);
    rgbLightRef.current = rgbLight;

    // 6. Assemble 3D PC Components Geometry
    const compGroups: typeof compGroupsRef.current = {};
    const rgbMats: THREE.MeshStandardMaterial[] = [];
    const rotatingFans: THREE.Group[] = [];

    // Helper: Shared ARGB Material
    const getRgbMaterial = (opacity = 1.0) => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(visualizerRgb),
        emissive: new THREE.Color(visualizerRgb),
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.1,
        transparent: opacity < 1.0,
        opacity,
      });
      rgbMats.push(mat);
      return mat;
    };

    // Helper: create a fan rotor with 3D blades
    const create3DFan = (radius = 0.55, depth = 0.12) => {
      const fanGroup = new THREE.Group();
      // Hub
      const hubGeo = new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, depth, 16);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
      const hubMesh = new THREE.Mesh(hubGeo, hubMat);
      hubMesh.rotation.x = Math.PI / 2;
      fanGroup.add(hubMesh);

      // ARGB Ring
      const ringGeo = new THREE.TorusGeometry(radius * 0.92, 0.04, 8, 24);
      const ringMat = getRgbMaterial();
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      fanGroup.add(ringMesh);

      // 7 Blades
      for (let b = 0; b < 7; b++) {
        const bladeGeo = new THREE.BoxGeometry(radius * 0.55, 0.02, radius * 0.22);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.x = radius * 0.45;
        blade.rotation.x = 0.45; // blade pitch
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (b * Math.PI * 2) / 7;
        bladePivot.add(blade);
        fanGroup.add(bladePivot);
      }

      rotatingFans.push(fanGroup);
      return fanGroup;
    };

    // --- A. CHASSIS (CASE) ---
    const caseGroup = new THREE.Group();
    compGroups.case = caseGroup;

    // Metallic frame pillars
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Top & Bottom Plates
    const topPlateGeo = new THREE.BoxGeometry(4.2, 0.15, 2.3);
    const topPlate = new THREE.Mesh(topPlateGeo, frameMat);
    topPlate.position.y = 2.45;
    caseGroup.add(topPlate);

    const botPlate = new THREE.Mesh(topPlateGeo, frameMat);
    botPlate.position.y = -2.45;
    caseGroup.add(botPlate);

    // PSU Basement / Shroud
    const psuShroudGeo = new THREE.BoxGeometry(4.18, 1.1, 2.26);
    const psuShroudMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      metalness: 0.9,
      roughness: 0.3,
    });
    const psuShroud = new THREE.Mesh(psuShroudGeo, psuShroudMat);
    psuShroud.position.set(0, -1.85, 0);
    caseGroup.add(psuShroud);

    // Front Mesh Panel
    const frontMeshGeo = new THREE.BoxGeometry(0.12, 4.8, 2.28);
    const frontMesh = new THREE.Mesh(frontMeshGeo, frameMat);
    frontMesh.position.x = 2.05;
    caseGroup.add(frontMesh);

    // Back Panel
    const backPanelGeo = new THREE.BoxGeometry(0.12, 4.8, 2.28);
    const backPanel = new THREE.Mesh(backPanelGeo, frameMat);
    backPanel.position.x = -2.05;
    caseGroup.add(backPanel);

    // Front Intake Fans (3x 3D RGB Fans)
    [-0.5, 0.8, 2.1].forEach((fy) => {
      const fan = create3DFan(0.52);
      fan.position.set(1.9, fy - 0.7, 0);
      fan.rotation.y = -Math.PI / 2;
      caseGroup.add(fan);
    });

    // Rear Exhaust Fan
    const rearFan = create3DFan(0.48);
    rearFan.position.set(-1.85, 1.1, 0);
    rearFan.rotation.y = Math.PI / 2;
    caseGroup.add(rearFan);

    // Tempered Glass Side Panel
    const glassGeo = new THREE.BoxGeometry(4.1, 4.8, 0.05);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.4,
      transparent: true,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.5,
    });
    const glassPanel = new THREE.Mesh(glassGeo, glassMat);
    glassPanel.position.set(0, 0, 1.15);
    caseGroup.add(glassPanel);
    compGroups.glass = glassPanel;

    scene.add(caseGroup);

    // --- B. MOTHERBOARD (ATX PCB + VRM) ---
    const mbGroup = new THREE.Group();
    compGroups.motherboard = mbGroup;

    // ATX PCB Board
    const pcbGeo = new THREE.BoxGeometry(2.9, 2.9, 0.06);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      metalness: 0.4,
      roughness: 0.5,
    });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.position.set(-0.1, 0.45, -0.85);
    mbGroup.add(pcb);

    // VRM Heatsinks (Aluminum block)
    const vrmMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.9,
      roughness: 0.2,
    });
    const vrmTopGeo = new THREE.BoxGeometry(1.6, 0.4, 0.35);
    const vrmTop = new THREE.Mesh(vrmTopGeo, vrmMat);
    vrmTop.position.set(-0.55, 1.6, -0.68);
    mbGroup.add(vrmTop);

    const vrmLeftGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    const vrmLeft = new THREE.Mesh(vrmLeftGeo, vrmMat);
    vrmLeft.position.set(-1.25, 0.9, -0.68);
    mbGroup.add(vrmLeft);

    // PCIe x16 Steel Reinforced Slot
    const pcieGeo = new THREE.BoxGeometry(2.2, 0.12, 0.18);
    const pcieMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const pcie = new THREE.Mesh(pcieGeo, pcieMat);
    pcie.position.set(0.1, -0.3, -0.73);
    mbGroup.add(pcie);

    scene.add(mbGroup);

    // --- C. CPU CHIP (IHS) ---
    const cpuGroup = new THREE.Group();
    compGroups.cpu = cpuGroup;

    const cpuSubstrateGeo = new THREE.BoxGeometry(0.85, 0.85, 0.04);
    const cpuSubMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.7 });
    const cpuSub = new THREE.Mesh(cpuSubstrateGeo, cpuSubMat);
    cpuSub.position.set(-0.25, 0.95, -0.8);
    cpuGroup.add(cpuSub);

    const cpuIhsGeo = new THREE.BoxGeometry(0.72, 0.72, 0.05);
    const cpuIhsMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.95,
      roughness: 0.15,
    });
    const cpuIhs = new THREE.Mesh(cpuIhsGeo, cpuIhsMat);
    cpuIhs.position.set(-0.25, 0.95, -0.76);
    cpuGroup.add(cpuIhs);

    scene.add(cpuGroup);

    // --- D. RAM (Dual Sticks with ARGB Diffuser) ---
    const ramGroup = new THREE.Group();
    compGroups.ram = ramGroup;

    [0.55, 0.72].forEach((rx) => {
      // Heatsink Body
      const ramBodyGeo = new THREE.BoxGeometry(0.06, 0.95, 0.35);
      const ramBodyMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.85,
        roughness: 0.3,
      });
      const ramBody = new THREE.Mesh(ramBodyGeo, ramBodyMat);
      ramBody.position.set(rx, 0.95, -0.65);
      ramGroup.add(ramBody);

      // Glowing ARGB Diffuser Top
      const ramLedGeo = new THREE.BoxGeometry(0.065, 0.12, 0.35);
      const ramLedMat = getRgbMaterial();
      const ramLed = new THREE.Mesh(ramLedGeo, ramLedMat);
      ramLed.position.set(rx, 1.48, -0.65);
      ramGroup.add(ramLed);
    });

    scene.add(ramGroup);

    // --- E. CPU COOLER (Liquid 360mm AIO / Air Tower) ---
    const coolerGroup = new THREE.Group();
    compGroups.cooler = coolerGroup;

    if (builder.cooler?.specs.coolerType?.startsWith('Liquid')) {
      // Top 360 Radiator
      const radGeo = new THREE.BoxGeometry(3.6, 0.28, 1.4);
      const radMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 });
      const rad = new THREE.Mesh(radGeo, radMat);
      rad.position.set(0, 2.2, 0);
      coolerGroup.add(rad);

      // Pump Block over CPU
      const pumpGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
      const pumpMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
      const pump = new THREE.Mesh(pumpGeo, pumpMat);
      pump.rotation.x = Math.PI / 2;
      pump.position.set(-0.25, 0.95, -0.58);
      coolerGroup.add(pump);

      // Glowing Pump Infinity Mirror Face
      const pumpFaceGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 24);
      const pumpFaceMat = getRgbMaterial();
      const pumpFace = new THREE.Mesh(pumpFaceGeo, pumpFaceMat);
      pumpFace.rotation.x = Math.PI / 2;
      pumpFace.position.set(-0.25, 0.95, -0.41);
      coolerGroup.add(pumpFace);
    } else {
      // Massive Dual Tower Air Cooler
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.9,
        roughness: 0.2,
      });

      // Fin Stacks
      const fin1Geo = new THREE.BoxGeometry(1.2, 1.3, 0.5);
      const fin1 = new THREE.Mesh(fin1Geo, towerMat);
      fin1.position.set(-0.25, 1.0, -0.45);
      coolerGroup.add(fin1);

      // Center ARGB Fan
      const coolerFan = create3DFan(0.55);
      coolerFan.position.set(-0.25, 1.0, -0.15);
      coolerGroup.add(coolerFan);
    }

    scene.add(coolerGroup);

    // --- F. GRAPHICS CARD (GPU - Gaming RTX 40-Series) ---
    const gpuGroup = new THREE.Group();
    compGroups.gpu = gpuGroup;

    // Main Shroud Body
    const gpuShroudGeo = new THREE.BoxGeometry(3.1, 0.9, 1.4);
    const gpuShroudMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.3,
    });
    const gpuShroud = new THREE.Mesh(gpuShroudGeo, gpuShroudMat);
    gpuShroud.position.set(0.35, -0.3, 0.05);
    gpuGroup.add(gpuShroud);

    // Metal Backplate
    const backplateGeo = new THREE.BoxGeometry(3.12, 0.05, 1.4);
    const backplateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.95,
      roughness: 0.15,
    });
    const backplate = new THREE.Mesh(backplateGeo, backplateMat);
    backplate.position.set(0.35, 0.18, 0.05);
    gpuGroup.add(backplate);

    // Side ARGB Logo Bar
    const gpuLedGeo = new THREE.BoxGeometry(1.4, 0.15, 0.04);
    const gpuLedMat = getRgbMaterial();
    const gpuLed = new THREE.Mesh(gpuLedGeo, gpuLedMat);
    gpuLed.position.set(0.35, -0.2, 0.76);
    gpuGroup.add(gpuLed);

    // Triple Cooling Fans on underside/face
    [-0.75, 0.35, 1.45].forEach((gx) => {
      const gFan = create3DFan(0.42);
      gFan.position.set(gx, -0.76, 0.05);
      gFan.rotation.x = Math.PI / 2;
      gpuGroup.add(gFan);
    });

    scene.add(gpuGroup);

    // --- G. M.2 STORAGE SSD ---
    const storageGroup = new THREE.Group();
    compGroups.storage = storageGroup;

    const ssdGeo = new THREE.BoxGeometry(0.85, 0.26, 0.06);
    const ssdMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ssd = new THREE.Mesh(ssdGeo, ssdMat);
    ssd.position.set(0.2, 0.15, -0.78);
    storageGroup.add(ssd);

    scene.add(storageGroup);

    // --- H. POWER SUPPLY (PSU) ---
    const psuGroup = new THREE.Group();
    compGroups.psu = psuGroup;

    const psuBoxGeo = new THREE.BoxGeometry(1.8, 0.95, 1.6);
    const psuBoxMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      metalness: 0.8,
      roughness: 0.4,
    });
    const psuBox = new THREE.Mesh(psuBoxGeo, psuBoxMat);
    psuBox.position.set(-0.9, -1.85, 0);
    psuGroup.add(psuBox);

    scene.add(psuGroup);

    compGroupsRef.current = compGroups;
    rgbMaterialsRef.current = rgbMats;
    rotatingFansRef.current = rotatingFans;

    // 7. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate fan blades
      rotatingFans.forEach((fan) => {
        fan.rotation.z += 0.08;
      });

      // Auto showroom rotation
      if (useStore.getState().isAutoRotate) {
        scene.rotation.y += 0.005;
      } else {
        scene.rotation.y = 0;
      }

      // Smooth Exploded View interpolation
      const exploded = useStore.getState().isExplodedView;
      const tRate = 0.08; // Lerp speed

      // Cooler lifts up
      if (compGroups.cooler) {
        const targetY = exploded ? 1.4 : 0;
        compGroups.cooler.position.y += (targetY - compGroups.cooler.position.y) * tRate;
      }

      // CPU lifts
      if (compGroups.cpu) {
        const targetY = exploded ? 0.6 : 0;
        compGroups.cpu.position.y += (targetY - compGroups.cpu.position.y) * tRate;
      }

      // GPU pulls out towards user
      if (compGroups.gpu) {
        const targetZ = exploded ? 1.6 : 0;
        compGroups.gpu.position.z += (targetZ - compGroups.gpu.position.z) * tRate;
      }

      // RAM lifts up
      if (compGroups.ram) {
        const targetY = exploded ? 1.1 : 0;
        compGroups.ram.position.y += (targetY - compGroups.ram.position.y) * tRate;
      }

      // Glass side panel glides away or hides
      if (compGroups.glass) {
        const isGlassOpen = useStore.getState().visualizerGlassOpen;
        const targetZ = isGlassOpen || exploded ? 2.8 : 1.15;
        compGroups.glass.position.z += (targetZ - compGroups.glass.position.z) * tRate;
        compGroups.glass.visible = !isGlassOpen;
      }

      // Dynamic visibility of components based on builder selection
      const currentBuilder = useStore.getState().builder;
      if (compGroups.motherboard) compGroups.motherboard.visible = !!currentBuilder.motherboard;
      if (compGroups.cpu) compGroups.cpu.visible = !!currentBuilder.cpu;
      if (compGroups.cooler) compGroups.cooler.visible = !!currentBuilder.cooler;
      if (compGroups.ram) compGroups.ram.visible = !!currentBuilder.ram;
      if (compGroups.gpu) compGroups.gpu.visible = !!currentBuilder.gpu;
      if (compGroups.storage) compGroups.storage.visible = !!currentBuilder.storage;
      if (compGroups.psu) compGroups.psu.visible = !!currentBuilder.psu;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update ARGB lights and materials dynamically
  useEffect(() => {
    if (rgbLightRef.current) {
      rgbLightRef.current.color = new THREE.Color(visualizerRgb);
    }
    rgbMaterialsRef.current.forEach((mat) => {
      mat.color = new THREE.Color(visualizerRgb);
      mat.emissive = new THREE.Color(visualizerRgb);
    });
  }, [visualizerRgb]);

  const activePartsCount = Object.values(builder).filter(Boolean).length;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-3xl' : 'aspect-[4/5] min-h-[520px]'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

      {/* TOP FLOATING OVERLAY: Controls & 2D/3D Mode Switch */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none z-10">
        {/* Mode Switcher Pill */}
        <div className="inline-flex rounded-xl bg-slate-900/90 border border-slate-700/80 p-1 pointer-events-auto backdrop-blur-md shadow-lg text-xs font-bold">
          <button
            onClick={() => setVisualizerMode('3d')}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 shadow flex items-center gap-1.5 transition"
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Сборка ПК</span>
          </button>
          <button
            onClick={() => setVisualizerMode('2d')}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2D Вид</span>
          </button>
        </div>

        {/* 3D Tools (Explode, Rotate, Glass, Fullscreen) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Exploded View Toggle */}
          <button
            onClick={toggleExplodedView}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow transition ${
              isExplodedView
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
            title="Разнести компоненты в 3D для осмотра каждого узла"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isExplodedView ? 'В сборе' : 'Разобрать 3D'}
            </span>
          </button>

          {/* Auto Rotate Toggle */}
          <button
            onClick={toggleAutoRotate}
            className={`p-2 rounded-xl border text-xs backdrop-blur-md transition ${
              isAutoRotate
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="360° Вращение"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Glass Toggle */}
          <button
            onClick={toggleVisualizerGlass}
            className={`p-2 rounded-xl border text-xs backdrop-blur-md transition ${
              visualizerGlassOpen
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Снять боковое стекло"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white backdrop-blur-md transition"
            title="Развернуть"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* BOTTOM FLOATING OVERLAY: Installed Status & ARGB Palette */}
      <div className="absolute bottom-4 left-4 right-4 space-y-3 pointer-events-none z-10">
        <div className="flex items-center justify-between text-xs pointer-events-auto">
          <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-slate-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Установлено в 3D: <b>{activePartsCount} / 8</b>
            </span>
          </div>

          <span className="text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            Вращайте мышкой 360° • Колесико — зум
          </span>
        </div>

        {/* ARGB Palette Buttons */}
        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex items-center justify-between gap-1.5 overflow-x-auto pointer-events-auto">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 px-1">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            ARGB:
          </span>
          {RGB_PRESETS.map((preset) => {
            const isSelected = preset.hex.toLowerCase() === visualizerRgb.toLowerCase();
            return (
              <button
                key={preset.hex}
                onClick={() => setVisualizerRgb(preset.hex)}
                className={`relative flex-1 min-w-[28px] h-6 rounded-lg transition-all duration-200 border ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 scale-105 border-white'
                    : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: preset.hex }}
                title={preset.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

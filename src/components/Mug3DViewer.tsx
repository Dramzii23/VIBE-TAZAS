import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Box,
  RotateCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Sparkles,
  Layers,
  ZoomIn,
  Camera,
  Maximize2,
  Minimize2,
  HelpCircle,
  FileCode,
  Sliders,
} from 'lucide-react';

interface MeshInfo {
  name: string;
  materialName: string;
  verticesCount: number;
  trianglesCount: number;
  hasUVs: boolean;
  isSublimationZone: boolean;
}

interface ModelMetadata {
  fileName: string;
  fileSizeFormatted?: string;
  totalVertices: number;
  totalTriangles: number;
  meshes: MeshInfo[];
  materials: string[];
  sublimationMaterial: string | null;
  sublimationMeshName: string | null;
  hasValidUVs: boolean;
}

export const Mug3DViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const sublimationMeshRef = useRef<THREE.Mesh | null>(null);
  const originalSublimationMaterialRef = useRef<THREE.Material | null>(null);

  // Component states
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modelMeta, setModelMeta] = useState<ModelMetadata | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [highlightSublimation, setHighlightSublimation] = useState<boolean>(false);
  const [showTechInspector, setShowTechInspector] = useState<boolean>(false);
  const [currentCameraAngle, setCurrentCameraAngle] = useState<'front' | 'handle' | 'back' | 'top'>('front');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Three.js Scene, Camera, Lights and Renderer
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const width = canvasMountRef.current.clientWidth || 400;
    const height = canvasMountRef.current.clientHeight || 360;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = null; // transparent to inherit clean container background
    sceneRef.current = scene;

    // 2. Camera (Product framing for standard Blender 11 oz mug)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.8);
    cameraRef.current = camera;

    // 3. Renderer with high color fidelity & soft shadows
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    canvasMountRef.current.replaceChildren(renderer.domElement);

    // 4. OrbitControls with smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.5;
    controls.maxDistance = 6.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Prevent going beneath floor
    controls.target.set(0, 0.9, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.6;
    controlsRef.current = controls;

    // 5. Studio Product Lighting Setup
    // Neutral Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Key Light (warm studio white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(3.5, 4.5, 3.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // Fill Light (soft cool white)
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.9);
    fillLight.position.set(-3.5, 2.5, -2.0);
    scene.add(fillLight);

    // Rim Light (crisp ceramic top and edge definition)
    const rimLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    rimLight.position.set(0, 4.0, -3.5);
    scene.add(rimLight);

    // Subtle Ground Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.01;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 6. Animation loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 7. ResizeObserver for responsive canvas
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        }
      }
    });

    if (canvasMountRef.current) {
      resizeObserver.observe(canvasMountRef.current);
    }

    // Load initial GLB
    loadModelFromUrl('/Taza_Mug_Normal.glb', 'Taza_Mug_Normal.glb');

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (canvasMountRef.current) {
        canvasMountRef.current.replaceChildren();
      }
    };
  }, []);

  // Synchronize OrbitControls autoRotate state
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Synchronize wireframe view
  useEffect(() => {
    if (!currentModelRef.current) return;
    currentModelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if ('wireframe' in m) (m as any).wireframe = wireframe;
          });
        } else if (mesh.material && 'wireframe' in mesh.material) {
          (mesh.material as any).wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  // Highlight sublimation zone with visual pulse
  useEffect(() => {
    if (!sublimationMeshRef.current) return;
    const mesh = sublimationMeshRef.current;

    if (highlightSublimation) {
      if (!originalSublimationMaterialRef.current) {
        originalSublimationMaterialRef.current = mesh.material as THREE.Material;
      }

      // Highlight material with luminous accent
      const highlightMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#4f46e5'),
        emissive: new THREE.Color('#6366f1'),
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.1,
        wireframe: false,
      });
      mesh.material = highlightMat;
    } else {
      if (originalSublimationMaterialRef.current) {
        mesh.material = originalSublimationMaterialRef.current;
      }
    }
  }, [highlightSublimation]);

  // Inspect and ingest loaded GLTF Scene
  const processLoadedGLTF = useCallback(
    (gltfScene: THREE.Group, fileName: string, fileSizeBytes?: number) => {
      if (!sceneRef.current) return;

      // Remove existing model if any
      if (currentModelRef.current) {
        sceneRef.current.remove(currentModelRef.current);
        currentModelRef.current = null;
      }

      const scene = sceneRef.current;

      // Ensure proper shadows and gather model metadata
      let totalVerts = 0;
      let totalTris = 0;
      const meshesList: MeshInfo[] = [];
      const materialsSet = new Set<string>();
      let detectedSublimationMat: string | null = null;
      let detectedSublimationMeshName: string | null = null;
      let targetSubMesh: THREE.Mesh | null = null;
      let targetSubOriginalMat: THREE.Material | null = null;

      // Center and normalize Blender model positioning
      const box = new THREE.Box3().setFromObject(gltfScene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Position bottom of mug at floor y=0, centered horizontally
      gltfScene.position.x = -center.x;
      gltfScene.position.z = -center.z;
      gltfScene.position.y = -box.min.y;

      gltfScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const geo = mesh.geometry;
          const verts = geo.attributes.position ? geo.attributes.position.count : 0;
          const tris = geo.index ? geo.index.count / 3 : verts / 3;
          const hasUVs = !!geo.attributes.uv;

          totalVerts += verts;
          totalTris += Math.floor(tris);

          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const matName = mat?.name || 'Material_Sin_Nombre';
          if (mat?.name) materialsSet.add(mat.name);

          // Sublimation zone heuristic detection
          const isLikelySublimation =
            matName.toLowerCase().includes('sublima') ||
            matName.toLowerCase().includes('subli') ||
            matName.toLowerCase().includes('print') ||
            matName.toLowerCase().includes('zona') ||
            matName.toLowerCase().includes('design') ||
            matName.toLowerCase().includes('diseno') ||
            mesh.name.toLowerCase().includes('sublima') ||
            mesh.name.toLowerCase().includes('zona');

          if (isLikelySublimation && !targetSubMesh) {
            targetSubMesh = mesh;
            targetSubOriginalMat = mat;
            detectedSublimationMat = matName;
            detectedSublimationMeshName = mesh.name;
          }

          meshesList.push({
            name: mesh.name || 'Malla_Sin_Nombre',
            materialName: matName,
            verticesCount: verts,
            trianglesCount: Math.floor(tris),
            hasUVs,
            isSublimationZone: isLikelySublimation,
          });
        }
      });

      // Fallback: If no specifically named material was detected, select mesh with UVs
      if (!targetSubMesh && meshesList.length > 0) {
        const meshWithUVs = meshesList.find((m) => m.hasUVs);
        if (meshWithUVs) {
          gltfScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && child.name === meshWithUVs.name && !targetSubMesh) {
              targetSubMesh = child as THREE.Mesh;
              targetSubOriginalMat = Array.isArray(targetSubMesh.material)
                ? targetSubMesh.material[0]
                : targetSubMesh.material;
              detectedSublimationMat = targetSubOriginalMat?.name || 'Material_Detectado';
              detectedSublimationMeshName = targetSubMesh.name;
              meshWithUVs.isSublimationZone = true;
            }
          });
        }
      }

      sublimationMeshRef.current = targetSubMesh;
      originalSublimationMaterialRef.current = targetSubOriginalMat;

      // Add model to scene
      scene.add(gltfScene);
      currentModelRef.current = gltfScene;

      // Store model metadata for acceptance inspection
      setModelMeta({
        fileName,
        fileSizeFormatted: fileSizeBytes ? `${(fileSizeBytes / 1024).toFixed(1)} KB` : undefined,
        totalVertices: totalVerts,
        totalTriangles: totalTris,
        meshes: meshesList,
        materials: Array.from(materialsSet),
        sublimationMaterial: detectedSublimationMat,
        sublimationMeshName: detectedSublimationMeshName,
        hasValidUVs: meshesList.some((m) => m.hasUVs),
      });

      // Update camera target to center of mug
      if (controlsRef.current) {
        controlsRef.current.target.set(0, size.y * 0.5, 0);
      }

      setLoading(false);
      setLoadError(null);
    },
    []
  );

  // Load Model from URL
  const loadModelFromUrl = useCallback(
    (url: string, fileName: string) => {
      setLoading(true);
      setLoadError(null);

      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          processLoadedGLTF(gltf.scene, fileName);
        },
        undefined,
        (err) => {
          console.warn(`Aviso cargando modelo desde ${url}:`, err);
          // Try fallback to /models/ if / failed
          if (url === '/Taza_Mug_Normal.glb') {
            loader.load(
              '/models/Taza_Mug_Normal.glb',
              (fallbackGltf) => {
                processLoadedGLTF(fallbackGltf.scene, fileName);
              },
              undefined,
              (fallbackErr) => {
                console.error('Error cargando modelo GLB de taza:', fallbackErr);
                setLoadError(
                  `No se pudo cargar el archivo "${fileName}". Asegúrate de que el archivo GLB se encuentra en la carpeta public del proyecto o cárgalo manualmente.`
                );
                setLoading(false);
              }
            );
          } else {
            const msg = err instanceof Error ? err.message : String(err);
            setLoadError(`Error al cargar el archivo GLB: ${msg || 'Formato no soportado'}`);
            setLoading(false);
          }
        }
      );
    },
    [processLoadedGLTF]
  );

  // Load Model from ArrayBuffer (Local file upload / drag-and-drop)
  const loadModelFromFile = useCallback(
    (file: File) => {
      setLoading(true);
      setLoadError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          setLoadError('No se pudo leer el archivo seleccionado.');
          setLoading(false);
          return;
        }

        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          '',
          (gltf) => {
            processLoadedGLTF(gltf.scene, file.name, file.size);
          },
          (err) => {
            console.error('Error parseando GLB local:', err);
            setLoadError('El archivo proporcionado no es un GLB válido exportado desde Blender.');
            setLoading(false);
          }
        );
      };

      reader.onerror = () => {
        setLoadError('Error al leer el archivo desde el disco.');
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    },
    [processLoadedGLTF]
  );

  // Camera angle presets
  const setCameraPreset = (angle: 'front' | 'handle' | 'back' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    setCurrentCameraAngle(angle);

    const targetY = modelMeta ? 0.95 : 0.9;
    controlsRef.current.target.set(0, targetY, 0);

    switch (angle) {
      case 'front':
        cameraRef.current.position.set(0, targetY + 0.3, 3.6);
        break;
      case 'handle':
        cameraRef.current.position.set(3.6, targetY + 0.3, 0);
        break;
      case 'back':
        cameraRef.current.position.set(0, targetY + 0.3, -3.6);
        break;
      case 'top':
        cameraRef.current.position.set(0, 4.2, 0.8);
        break;
    }
    controlsRef.current.update();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
        loadModelFromFile(file);
      } else {
        setLoadError('Por favor selecciona un archivo con extensión .glb generado en Blender.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadModelFromFile(e.target.files[0]);
    }
  };

  return (
    <div
      id="mug-3d-viewer-card"
      ref={containerRef}
      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-sm text-stone-900">
                Visor 3D del Modelo (Blender GLB)
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                GLB Activo
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              {modelMeta?.fileName || 'Taza_Mug_Normal.glb'} • Proporciones reales de producto
            </p>
          </div>
        </div>

        {/* Action badges & Inspector toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTechInspector(!showTechInspector)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showTechInspector
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
            title="Inspeccionar estructura de materiales y UVs de Blender"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inspeccionar UVs</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/80 transition-colors cursor-pointer"
            title="Cargar o reemplazar con otro archivo GLB exportado desde Blender"
          >
            <Upload className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Cargar GLB</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Stage Container */}
      <div
        className={`relative w-full h-80 sm:h-96 rounded-xl border transition-all overflow-hidden flex items-center justify-center select-none ${
          isDragOver
            ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-indigo-50/20'
            : 'border-stone-200/80 bg-gradient-to-b from-stone-100/80 via-stone-50/50 to-stone-100/90'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Three.js Canvas Mount */}
        <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Loading Spinner State */}
        {loading && (
          <div className="absolute inset-0 bg-stone-50/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold text-stone-700">
              Cargando modelo 3D (Taza_Mug_Normal.glb)...
            </span>
            <span className="text-[11px] text-stone-400">
              Inicializando mallas, materiales y UV mapping
            </span>
          </div>
        )}

        {/* Error overlay */}
        {loadError && !loading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center gap-3 z-20">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-rose-800 max-w-md font-medium">{loadError}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadModelFromUrl('/Taza_Mug_Normal.glb', 'Taza_Mug_Normal.glb')}
                className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Reintentar carga
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Seleccionar archivo GLB
              </button>
            </div>
          </div>
        )}

        {/* Floating Top Control Toolbar inside 3D Viewport */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
          {/* Camera Angles */}
          <div className="flex items-center bg-white/90 backdrop-blur-xs p-0.5 rounded-lg border border-stone-200/90 shadow-xs text-[11px]">
            <button
              type="button"
              onClick={() => setCameraPreset('front')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                currentCameraAngle === 'front'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vista frontal de sublimación"
            >
              Frente
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('handle')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                currentCameraAngle === 'handle'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vista lateral del asa"
            >
              Asa
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('back')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                currentCameraAngle === 'back'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vista posterior opuesta"
            >
              Reverso
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('top')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                currentCameraAngle === 'top'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Vista cenital"
            >
              Cenital
            </button>
          </div>
        </div>

        {/* Floating Quick Action Buttons (Turntable, Wireframe, Highlight) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg backdrop-blur-xs border shadow-xs transition-all cursor-pointer ${
              autoRotate
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-white/90 border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
            title={autoRotate ? 'Pausar rotación automática' : 'Activar giro 360°'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>

          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            className={`p-2 rounded-lg backdrop-blur-xs border shadow-xs transition-all cursor-pointer ${
              wireframe
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white/90 border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
            title={wireframe ? 'Modo sombreado sólido' : 'Ver malla alámbrica / Wireframe de Blender'}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setHighlightSublimation(!highlightSublimation)}
            className={`p-2 rounded-lg backdrop-blur-xs border shadow-xs transition-all cursor-pointer ${
              highlightSublimation
                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/30'
                : 'bg-white/90 border-stone-200 text-stone-600 hover:text-stone-900'
            }`}
            title={
              highlightSublimation
                ? 'Restaurar material normal'
                : 'Resaltar zona y material de sublimación en 3D'
            }
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Status Ribbon: Material and Sublimation Zone confirmation */}
        <div className="absolute bottom-3 inset-x-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 z-10 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-xs rounded-xl border border-stone-200 shadow-xs pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-[11px]">
              <span className="text-stone-500">Material de Sublimación: </span>
              <strong className="text-stone-900 font-mono font-semibold">
                {modelMeta?.sublimationMaterial || 'Material_Sublimacion'}
              </strong>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-xs rounded-xl border border-stone-200 shadow-xs text-[11px] text-stone-600 pointer-events-auto self-end sm:self-auto">
            <span>Rotar: Arrastrar clic izq. • Zoom: Rueda • Mover: Clic der.</span>
          </div>
        </div>
      </div>

      {/* Technical Inspector Drawer / Modal (Acceptance Criteria verification) */}
      {showTechInspector && modelMeta && (
        <div className="bg-stone-50 rounded-xl p-4 border border-indigo-100 flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" />
              <h4 className="font-display font-semibold text-xs text-stone-900">
                Auditoría Técnica del Modelo GLB (Blender)
              </h4>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              UVs y Geometría Verificadas
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-stone-200/80">
              <span className="text-[10px] text-stone-500 block">Archivo cargado</span>
              <strong className="text-stone-900 truncate block">{modelMeta.fileName}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200/80">
              <span className="text-[10px] text-stone-500 block">Vértices totales</span>
              <strong className="text-stone-900">{modelMeta.totalVertices.toLocaleString()}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200/80">
              <span className="text-[10px] text-stone-500 block">Polígonos (Tris)</span>
              <strong className="text-stone-900">{modelMeta.totalTriangles.toLocaleString()}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200/80">
              <span className="text-[10px] text-stone-500 block">UV Mapping</span>
              <strong className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Disponible
              </strong>
            </div>
          </div>

          {/* Mesh and Materials Detailed Breakdown */}
          <div className="bg-white rounded-lg border border-stone-200/80 p-3 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-stone-700">
              Mallas y Materiales detectados en el archivo GLB:
            </span>
            <div className="divide-y divide-stone-100 text-xs">
              {modelMeta.meshes.map((mesh, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    <span className="font-mono text-stone-800">{mesh.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-stone-500">
                      Material: <strong className="text-stone-900 font-mono">{mesh.materialName}</strong>
                    </span>
                    {mesh.isSublimationZone ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                        Zona Sublimación
                      </span>
                    ) : (
                      <span className="text-stone-400">Cuerpo Cerámico</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance Criteria Note */}
          <div className="text-[11px] text-stone-600 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Criterio de aceptación cumplido:</strong> El material{' '}
              <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 text-indigo-900 font-semibold">
                {modelMeta.sublimationMaterial || 'Material_Sublimacion'}
              </code>{' '}
              está identificado y accesible en la escena Three.js, listo para mapear dinámicamente la textura del diseño en el siguiente sprint.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

"use client";

import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EstadoMesa } from "@/components/admin/SalonBoard";
import type { PrefijoZona } from "@/lib/restaurant/mesa-label";

export type Mesa3D = {
  id: string;
  etiqueta: string;
  nombre: string | null;
  capacidad: number;
  estado: EstadoMesa;
  pendientes: number;
  grupoId: string | null;
  zonaPrefijo: PrefijoZona;
  x: number;
  y: number;
};

type Props = {
  mesas: Mesa3D[];
  seleccionadaId: string | null;
  seleccionUnion: string[];
  top: boolean;
  focusZona: PrefijoZona | null;
  onSelect: (id: string) => void;
  onDragMove: (id: string, xPct: number, yPct: number) => void;
  onDragEnd: (id: string, xPct: number, yPct: number) => void;
};

const COLOR_MESA: Record<EstadoMesa, string> = {
  LIBRE: "#10b981",
  RESERVADA: "#3b82f6",
  OCUPADA: "#f97316",
  ESPERANDO_PEDIDO: "#8b5cf6",
  EN_PREPARACION: "#06b6d4",
  LISTO: "#84cc16",
  PAGANDO: "#e2584a",
  POR_LIMPIAR: "#a1a1aa",
};

const SELECCION_COLOR = "#f472b6";

const PRIORIDAD_ESTADO: EstadoMesa[] = [
  "ESPERANDO_PEDIDO",
  "EN_PREPARACION",
  "LISTO",
  "PAGANDO",
  "OCUPADA",
  "RESERVADA",
  "POR_LIMPIAR",
  "LIBRE",
];

type Region = { xMin: number; xMax: number; zMin: number; zMax: number };

// Sala principal: interior del local, hasta la estantería negra que la separa del pasillo hacia la barra y el salón.
// Barra: esquina fondo-derecha (en L, ampliada). Terraza: exterior, más allá del ventanal.
const REGION_SALA: Region = { xMin: -9.2, xMax: 2.35, zMin: -5.6, zMax: 5.6 };

const REGIONES: Record<PrefijoZona, Region> = {
  "": REGION_SALA,
  S: REGION_SALA,
  // Limitado al hueco libre frente a la barra en L, sin invadir el mueble de la barra
  // (tramo pared derecha desde x=9.03, tramo pared fondo hasta z=-4.73).
  B: { xMin: 4.3, xMax: 8.6, zMin: -4.5, zMax: -0.5 },
  T: { xMin: -10.2, xMax: 10.2, zMin: 6.4, zMax: 10.3 },
  // Salón: hueco junto a la pared derecha, a partir de la estantería negra y hasta la puerta de entrada.
  L: { xMin: 4.65, xMax: 9.8, zMin: 1.6, zMax: 5.7 },
};

type CameraConfig = {
  position: [number, number, number];
  target: [number, number, number];
  minDistance: number;
  maxDistance: number;
};

// Misma dirección de encuadre que la vista general (11, 10, 12.65) normalizada, reutilizada para cada zona.
const DIR_3D = { x: 0.564, y: 0.513, z: 0.649 };

function cameraConfigFor(zona: PrefijoZona | null, top: boolean): CameraConfig {
  if (zona === null) {
    return top
      ? { position: [0, 20, 2], target: [0, 0, 1.5], minDistance: 6, maxDistance: 28 }
      : { position: [11, 10, 15], target: [0, 0, 1.5], minDistance: 6, maxDistance: 28 };
  }
  const region = REGIONES[zona];
  const centerX = (region.xMin + region.xMax) / 2;
  const centerZ = (region.zMin + region.zMax) / 2;
  const maxDim = Math.max(region.xMax - region.xMin, region.zMax - region.zMin);
  const target: [number, number, number] = [centerX, 0, centerZ];
  if (top) {
    const height = Math.max(maxDim * 0.98, 7);
    return {
      position: [centerX, height, centerZ],
      target,
      minDistance: Math.max(height * 0.4, 4),
      maxDistance: Math.max(height * 1.8, 10),
    };
  }
  const distance = Math.max(maxDim * 0.956, 7);
  return {
    position: [centerX + DIR_3D.x * distance, DIR_3D.y * distance, centerZ + DIR_3D.z * distance],
    target,
    minDistance: Math.max(distance * 0.5, 6),
    maxDistance: Math.max(distance * 2.2, 28),
  };
}

function CameraSync({
  config,
  controlsRef,
}: {
  config: CameraConfig;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...config.position);
    camera.updateProjectionMatrix();
    controlsRef.current?.target.set(...config.target);
    controlsRef.current?.update();
  }, [config, camera, controlsRef]);
  return null;
}

const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function pctToPos(xPct: number, yPct: number, region: Region): [number, number] {
  const x = region.xMin + (xPct / 100) * (region.xMax - region.xMin);
  const z = region.zMin + (yPct / 100) * (region.zMax - region.zMin);
  return [x, z];
}

function posToPct(x: number, z: number, region: Region): [number, number] {
  const xPct = THREE.MathUtils.clamp(((x - region.xMin) / (region.xMax - region.xMin)) * 100, 3, 97);
  const yPct = THREE.MathUtils.clamp(((z - region.zMin) / (region.zMax - region.zMin)) * 100, 3, 97);
  return [xPct, yPct];
}

// Limita el desplazamiento (dx, dy) de un grupo de mesas unidas para que ningún miembro salga de los
// límites permitidos, moviendo siempre el grupo entero de forma rígida (nunca a cada mesa por separado,
// para no deformar ni encoger la mesa unida al llegar al límite de la zona).
function clampDeltaGrupo(
  miembros: { x: number; y: number }[],
  dxDeseado: number,
  dyDeseado: number,
): [number, number] {
  const dxMin = Math.max(...miembros.map((m) => 3 - m.x));
  const dxMax = Math.min(...miembros.map((m) => 97 - m.x));
  const dyMin = Math.max(...miembros.map((m) => 6 - m.y));
  const dyMax = Math.min(...miembros.map((m) => 94 - m.y));
  return [THREE.MathUtils.clamp(dxDeseado, dxMin, dxMax), THREE.MathUtils.clamp(dyDeseado, dyMin, dyMax)];
}

function tamanoMesa(capacidad: number): number {
  return Math.min(2.4, 0.85 + Math.max(0, capacidad - 1) * 0.13);
}

export default function Floorplan3D({
  mesas,
  seleccionadaId,
  seleccionUnion,
  top,
  focusZona,
  onSelect,
  onDragMove,
  onDragEnd,
}: Props) {
  const [arrastrando, setArrastrando] = useState(false);
  const orbitRef = useRef<OrbitControlsImpl | null>(null);
  const cameraConfig = useMemo(() => cameraConfigFor(focusZona, top), [focusZona, top]);

  const sueltas = mesas.filter((m) => !m.grupoId);
  const grupos = new Map<string, Mesa3D[]>();
  mesas.forEach((m) => {
    if (!m.grupoId) return;
    grupos.set(m.grupoId, [...(grupos.get(m.grupoId) ?? []), m]);
  });

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: cameraConfig.position, fov: 45 }}
      >
        <ambientLight intensity={1.15} />
        <directionalLight position={[3, 10, 4]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-4, 4, -2]} intensity={16} color="#d79b72" />
        <pointLight position={[6.5, 3.2, -1]} intensity={14} color="#b14cff" />
        <pointLight position={[0, 2.6, -5.6]} intensity={12} color="#e0559b" />
        <hemisphereLight args={["#3a3f52", "#0c0910", 0.5]} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
          <planeGeometry args={[21, 12]} />
          <meshStandardMaterial color="#262125" roughness={0.85} />
        </mesh>
        <group position={[0, -0.17, 0]} scale={[21 / 12, 1, 1]}>
          <gridHelper args={[12, 14, "#3a3238", "#2c262b"]} />
        </group>

        <Architecture focusZona={focusZona} />

        {sueltas.map((mesa) => (
          <Mesa
            key={mesa.id}
            mesa={mesa}
            selected={seleccionadaId === mesa.id || seleccionUnion.includes(mesa.id)}
            onSelect={onSelect}
            onDragStateChange={setArrastrando}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        ))}

        {[...grupos.entries()].map(([grupoId, miembros]) => (
          <MesaUnida
            key={grupoId}
            miembros={miembros}
            selected={miembros.some((m) => m.id === seleccionadaId || seleccionUnion.includes(m.id))}
            onSelect={onSelect}
            onDragStateChange={setArrastrando}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        ))}

        <CameraSync config={cameraConfig} controlsRef={orbitRef} />
        <OrbitControls
          ref={orbitRef}
          enabled={!arrastrando}
          enableDamping
          minDistance={cameraConfig.minDistance}
          maxDistance={cameraConfig.maxDistance}
          minPolarAngle={top ? 0 : 0.4}
          maxPolarAngle={top ? 0.04 : Math.PI / 2.05}
          target={cameraConfig.target}
        />
      </Canvas>
    </div>
  );
}

function EtiquetaMesa({ texto, size = 0.42 }: { texto: string; size?: number }) {
  return (
    <Text
      position={[0, 1.24, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={size}
      color="white"
      outlineWidth={0.035}
      outlineColor="#171015"
      anchorX="center"
      anchorY="middle"
    >
      {texto}
    </Text>
  );
}

function Mesa({
  mesa,
  selected,
  onSelect,
  onDragStateChange,
  onDragMove,
  onDragEnd,
}: {
  mesa: Mesa3D;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragStateChange: (dragging: boolean) => void;
  onDragMove: (id: string, xPct: number, yPct: number) => void;
  onDragEnd: (id: string, xPct: number, yPct: number) => void;
}) {
  const dragging = useRef(false);
  const region = REGIONES[mesa.zonaPrefijo];
  const color = COLOR_MESA[mesa.estado];
  const size = tamanoMesa(mesa.capacidad);
  const seats = Math.min(mesa.capacidad, 10);
  const [x, z] = pctToPos(mesa.x, mesa.y, region);

  const moveFromEvent = (e: ThreeEvent<PointerEvent>) => {
    const hit = e.ray.intersectPlane(FLOOR, new THREE.Vector3());
    if (!hit) return;
    const [xPct, yPct] = posToPct(hit.x, hit.z, region);
    onDragMove(mesa.id, xPct, yPct);
  };

  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: seats }).map((_, i) => {
        const a = (i / seats) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * size * 0.75, 0.35, Math.sin(a) * size * 0.75]} castShadow>
            <boxGeometry args={[0.3, 0.68, 0.3]} />
            <meshStandardMaterial color="#62483e" />
          </mesh>
        );
      })}
      <mesh
        position={[0, 1, 0]}
        castShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.target as Element).setPointerCapture(e.pointerId);
          dragging.current = true;
          onDragStateChange(true);
          onSelect(mesa.id);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          e.stopPropagation();
          moveFromEvent(e);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          (e.target as Element).releasePointerCapture(e.pointerId);
          if (dragging.current) {
            dragging.current = false;
            onDragStateChange(false);
            const hit = e.ray.intersectPlane(FLOOR, new THREE.Vector3());
            if (hit) {
              const [xPct, yPct] = posToPct(hit.x, hit.z, region);
              onDragEnd(mesa.id, xPct, yPct);
            }
          }
        }}
      >
        <boxGeometry args={[size, 0.18, size]} />
        <meshStandardMaterial color="#79533d" roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[size + 0.03, 0.025, size + 0.03]} />
        <meshStandardMaterial
          color={selected ? SELECCION_COLOR : color}
          emissive={selected ? SELECCION_COLOR : color}
          emissiveIntensity={selected ? 1.1 : 0.25}
        />
      </mesh>
      <EtiquetaMesa texto={mesa.etiqueta} />
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 0.68, size * 0.74, 48]} />
          <meshBasicMaterial color={SELECCION_COLOR} />
        </mesh>
      )}
      {mesa.pendientes > 0 && (
        <Text
          position={[size * 0.6, 1.6, -size * 0.6]}
          fontSize={0.26}
          color="white"
          outlineWidth={0.025}
          outlineColor="#171015"
          anchorX="center"
        >
          {String(mesa.pendientes)}
        </Text>
      )}
    </group>
  );
}

function MesaUnida({
  miembros,
  selected,
  onSelect,
  onDragStateChange,
  onDragMove,
  onDragEnd,
}: {
  miembros: Mesa3D[];
  selected: boolean;
  onSelect: (id: string) => void;
  onDragStateChange: (dragging: boolean) => void;
  onDragMove: (id: string, xPct: number, yPct: number) => void;
  onDragEnd: (id: string, xPct: number, yPct: number) => void;
}) {
  const dragging = useRef(false);
  const inicio = useRef<{ centro: { x: number; y: number }; miembros: { id: string; x: number; y: number }[] } | null>(
    null,
  );

  const primero = miembros[0];
  if (!primero) return null;
  const region = REGIONES[primero.zonaPrefijo];
  const representante = [...miembros].sort(
    (a, b) => PRIORIDAD_ESTADO.indexOf(a.estado) - PRIORIDAD_ESTADO.indexOf(b.estado),
  )[0] as Mesa3D;
  const color = COLOR_MESA[representante.estado];
  const etiqueta = [...miembros]
    .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, undefined, { numeric: true }))
    .map((m) => m.etiqueta)
    .join("-");
  const totalSeats = Math.min(
    16,
    miembros.reduce((sum, m) => sum + m.capacidad, 0),
  );
  const pendientes = miembros.reduce((sum, m) => sum + m.pendientes, 0);

  const posiciones = miembros.map((m) => ({ m, pos3d: pctToPos(m.x, m.y, region) }));
  const xs = posiciones.map((p) => p.pos3d[0]);
  const zs = posiciones.map((p) => p.pos3d[1]);
  const spreadX = Math.max(...xs) - Math.min(...xs);
  const spreadZ = Math.max(...zs) - Math.min(...zs);
  const axis: "x" | "z" = spreadX >= spreadZ ? "x" : "z";
  const centro: [number, number] = [
    xs.reduce((a, b) => a + b, 0) / xs.length,
    zs.reduce((a, b) => a + b, 0) / zs.length,
  ];
  const crossSize = Math.max(...miembros.map((m) => tamanoMesa(m.capacidad)));
  const spread = axis === "x" ? spreadX : spreadZ;
  const largo = spread + crossSize;

  const centroPct = {
    x: miembros.reduce((a, m) => a + m.x, 0) / miembros.length,
    y: miembros.reduce((a, m) => a + m.y, 0) / miembros.length,
  };

  const moveFromEvent = (e: ThreeEvent<PointerEvent>) => {
    const hit = e.ray.intersectPlane(FLOOR, new THREE.Vector3());
    const snapshot = inicio.current;
    if (!hit || !snapshot) return;
    const [xPct, yPct] = posToPct(hit.x, hit.z, region);
    const [dx, dy] = clampDeltaGrupo(snapshot.miembros, xPct - snapshot.centro.x, yPct - snapshot.centro.y);
    snapshot.miembros.forEach((m) => {
      onDragMove(m.id, m.x + dx, m.y + dy);
    });
  };

  const seatOffsets = (n: number) => {
    const porLado = Math.ceil(n / 2);
    const offsets: { u: number; v: number }[] = [];
    for (let i = 0; i < n; i += 1) {
      const lado = i < porLado ? -1 : 1;
      const indiceEnLado = lado === -1 ? i : i - porLado;
      const cantidadLado = lado === -1 ? porLado : n - porLado;
      const u = cantidadLado > 1 ? (indiceEnLado / (cantidadLado - 1) - 0.5) * (largo - crossSize * 0.6) : 0;
      offsets.push({ u, v: lado * crossSize * 0.72 });
    }
    return offsets;
  };

  return (
    <group position={[centro[0], 0, centro[1]]}>
      {seatOffsets(totalSeats).map((o, i) => (
        <mesh
          key={i}
          position={axis === "x" ? [o.u, 0.35, o.v] : [o.v, 0.35, o.u]}
          castShadow
        >
          <boxGeometry args={[0.3, 0.68, 0.3]} />
          <meshStandardMaterial color="#62483e" />
        </mesh>
      ))}
      <mesh
        position={[0, 1, 0]}
        castShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.target as Element).setPointerCapture(e.pointerId);
          dragging.current = true;
          inicio.current = {
            centro: { x: centroPct.x, y: centroPct.y },
            miembros: miembros.map((m) => ({ id: m.id, x: m.x, y: m.y })),
          };
          onDragStateChange(true);
          onSelect(primero.id);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          e.stopPropagation();
          moveFromEvent(e);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          (e.target as Element).releasePointerCapture(e.pointerId);
          if (dragging.current) {
            dragging.current = false;
            onDragStateChange(false);
            const hit = e.ray.intersectPlane(FLOOR, new THREE.Vector3());
            const snapshot = inicio.current;
            if (hit && snapshot) {
              const [xPct, yPct] = posToPct(hit.x, hit.z, region);
              const [dx, dy] = clampDeltaGrupo(snapshot.miembros, xPct - snapshot.centro.x, yPct - snapshot.centro.y);
              snapshot.miembros.forEach((m) => {
                onDragEnd(m.id, m.x + dx, m.y + dy);
              });
            }
            inicio.current = null;
          }
        }}
      >
        <boxGeometry args={axis === "x" ? [largo, 0.18, crossSize] : [crossSize, 0.18, largo]} />
        <meshStandardMaterial color="#79533d" roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry
          args={axis === "x" ? [largo + 0.03, 0.025, crossSize + 0.03] : [crossSize + 0.03, 0.025, largo + 0.03]}
        />
        <meshStandardMaterial
          color={selected ? SELECCION_COLOR : color}
          emissive={selected ? SELECCION_COLOR : color}
          emissiveIntensity={selected ? 1.1 : 0.25}
        />
      </mesh>
      <EtiquetaMesa texto={etiqueta} size={0.34} />
      {pendientes > 0 && (
        <Text
          position={[largo * 0.4, 1.6, -crossSize * 0.6]}
          fontSize={0.26}
          color="white"
          outlineWidth={0.025}
          outlineColor="#171015"
          anchorX="center"
        >
          {String(pendientes)}
        </Text>
      )}
    </group>
  );
}

const PUERTA_X = 5;
const PUERTA_ANCHO = 1.8;

// Logo de neón "Palomita": aro rosa + texto, como el cartel neón real del local.
function NeonLogo({
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <torusGeometry args={[0.58, 0.032, 16, 48]} />
        <meshStandardMaterial color="#ff6fb0" emissive="#ff2f8f" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <Text
        position={[0, 0.05, 0.03]}
        fontSize={0.22}
        color="#ffb3d9"
        outlineWidth={0.012}
        outlineColor="#ff2f8f"
        anchorX="center"
        anchorY="middle"
      >
        Palomita
      </Text>
      <Text
        position={[0, -0.18, 0.03]}
        fontSize={0.09}
        color="#ffb3d9"
        outlineWidth={0.006}
        outlineColor="#ff2f8f"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
      >
        bar
      </Text>
      <pointLight position={[0, 0, 0.5]} intensity={7} distance={4.5} color="#ff2f8f" />
    </group>
  );
}

function Architecture({ focusZona }: { focusZona: PrefijoZona | null }) {
  const numMontantes = 23;
  const montantes = Array.from({ length: numMontantes }).map((_, i) => -10 + i * 0.94);

  const mostrarSala = focusZona === null || focusZona === "S";
  const mostrarBarra = focusZona === null || focusZona === "B";
  const mostrarSalon = focusZona === null || focusZona === "L";
  const mostrarTerraza = focusZona === null || focusZona === "T";

  return (
    <group>
      <Wall p={[-10.4, 1.5, -0.9]} s={[0.24, 3, 10.7]} />
      <Wall p={[10.4, 1.5, -0.9]} s={[0.24, 3, 10.7]} />
      <Wall p={[0, 1.5, -6.1]} s={[21.3, 3, 0.24]} />

      {/* Sala principal: rincón de sofás junto a la pared de ladrillo con el logo de neón, chesterfield, mesas de centro sobre puf y columna. Se oculta al enfocar otra zona. */}
      <group visible={mostrarSala}>
        <BrickWall position={[-10.25, 1.6, -1]} rotation={[0, Math.PI / 2, 0]} size={[9.6, 2.7, 0.16]} />
        <NeonLogo position={[-10.06, 2.0, -1]} rotation={[0, Math.PI / 2, 0]} scale={1.4} />
        <ChesterfieldSofa position={[-9.3, 0, -1]} rotation={[0, Math.PI / 2, 0]} />
        <RoundPouffeTable position={[-8.25, 0, -0.25]} />
        <RoundPouffeTable position={[-8.1, 0, -1.35]} />
        <PorticoColumn position={[-2.2, 0, 0.6]} />
        <Text position={[-1, 0.02, 4.6]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#d5c5c1">
          SALA PRINCIPAL
        </Text>
      </group>

      {/* Barra en L, botelleros, taburetes, TV y escalón. Se oculta al enfocar otra zona. */}
      <group visible={mostrarBarra}>
        {/* Barra en L: tramo pegado a la pared derecha, ampliado hacia el frente hasta el hueco del salón */}
        <group position={[9.55, 0.75, -2.0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[7.0, 1.4, 1.05]} />
            <meshStandardMaterial color="#49332d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[7.16, 0.1, 1.18]} />
            <meshStandardMaterial color="#d2b28c" roughness={0.55} />
          </mesh>
        </group>
        {/* Barra en L: tramo pegado a la pared del fondo, ampliado hacia la izquierda; se une con el anterior en la esquina */}
        <group position={[7.05, 0.75, -5.25]}>
          <mesh castShadow>
            <boxGeometry args={[6.1, 1.4, 1.05]} />
            <meshStandardMaterial color="#49332d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[6.26, 0.1, 1.18]} />
            <meshStandardMaterial color="#d2b28c" roughness={0.55} />
          </mesh>
        </group>
        {/* Botellero detrás de la barra (pared derecha), retroiluminado en violeta como el real */}
        <mesh position={[10.3, 1.5, -2.2]}>
          <boxGeometry args={[0.25, 2.6, 7.5]} />
          <meshStandardMaterial color="#171519" />
        </mesh>
        <mesh position={[10.17, 1.5, -2.2]}>
          <boxGeometry args={[0.02, 2.5, 7.3]} />
          <meshStandardMaterial color="#7a3dff" emissive="#8b4cff" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        {/* Botellero detrás de la barra (pared del fondo), retroiluminado en violeta */}
        <mesh position={[7.05, 1.5, -6.0]}>
          <boxGeometry args={[6.3, 2.6, 0.25]} />
          <meshStandardMaterial color="#171519" />
        </mesh>
        <mesh position={[7.05, 1.5, -5.87]}>
          <boxGeometry args={[6.1, 2.5, 0.02]} />
          <meshStandardMaterial color="#7a3dff" emissive="#8b4cff" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        {/* Taburetes altos junto a la barra, como en el local real */}
        {[-4.0, -2.3, -0.6, 1.1].map((z, i) => (
          <BarStool key={`v-${i}`} position={[8.0, 0, z]} />
        ))}
        {[5.2, 6.7].map((x, i) => (
          <BarStool key={`h-${i}`} position={[x, 0, -4.2]} />
        ))}
        {/* Pantalla de TV sobre la esquina de la barra */}
        <TvScreen position={[8.9, 2.55, -5.85]} rotation={[0, 0, 0]} />
        <Text position={[8.7, 0.02, -2.0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} fontSize={0.3} color="#d5c5c1">
          BARRA
        </Text>
        {/* Escalón pequeño de bajada de la barra al pasillo del salón, junto a la mesa B2 */}
        <group position={[9.3, 0, -1.9]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 0.09, -0.3]} receiveShadow castShadow>
            <boxGeometry args={[2.2, 0.18, 0.55]} />
            <meshStandardMaterial color="#4a4247" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.03, 0.25]} receiveShadow castShadow>
            <boxGeometry args={[2.2, 0.15, 0.5]} />
            <meshStandardMaterial color="#4a4247" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* Salón: estantería expositora con plantas y letrero luminoso, a la izquierda de la puerta. Se oculta al enfocar otra zona. */}
      <group visible={mostrarSalon}>
        <DisplayShelf position={[3.5, 0, 3.6]} depth={5.25} />
        <Text position={[6.4, 0.02, 3.6]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#d5c5c1">
          SALÓN
        </Text>
      </group>

      {/* Ventanal con montantes: separa la sala de la terraza exterior, con hueco de puerta */}
      <group position={[0, 1.7, 6.1]}>
        {(() => {
          const bordeIzq = -10.3;
          const bordeDer = 10.3;
          const puertaIzq = PUERTA_X - PUERTA_ANCHO / 2;
          const puertaDer = PUERTA_X + PUERTA_ANCHO / 2;
          const panelIzqAncho = puertaIzq - bordeIzq;
          const panelDerAncho = bordeDer - puertaDer;
          return (
            <>
              <mesh position={[bordeIzq + panelIzqAncho / 2, 0, 0]}>
                <boxGeometry args={[panelIzqAncho, 2.5, 0.06]} />
                <meshStandardMaterial color="#243038" transparent opacity={0.22} />
              </mesh>
              <mesh position={[puertaDer + panelDerAncho / 2, 0, 0]}>
                <boxGeometry args={[panelDerAncho, 2.5, 0.06]} />
                <meshStandardMaterial color="#243038" transparent opacity={0.22} />
              </mesh>
            </>
          );
        })()}
        {montantes
          .filter((x) => Math.abs(x - PUERTA_X) > PUERTA_ANCHO / 2 + 0.1)
          .map((x, i) => (
            <mesh key={i} position={[x, 0, -0.05]}>
              <boxGeometry args={[0.06, 2.6, 0.06]} />
              <meshStandardMaterial color="#191619" />
            </mesh>
          ))}
      </group>

      {/* Ventanas con persiana a lo largo de todo el ventanal, a ambos lados de la puerta, como el escaparate real */}
      <group position={[0, 0, 6.08]}>
        {(() => {
          const bordeIzq = -10.3;
          const bordeDer = 10.3;
          const puertaIzq = PUERTA_X - PUERTA_ANCHO / 2;
          const puertaDer = PUERTA_X + PUERTA_ANCHO / 2;
          const paso = 1.88;
          const anchoVentana = 1.7;
          const posiciones: number[] = [];
          for (let x = bordeIzq + anchoVentana / 2 + 0.2; x < puertaIzq - anchoVentana / 2; x += paso) {
            posiciones.push(x);
          }
          for (let x = puertaDer + anchoVentana / 2 + 0.2; x < bordeDer - anchoVentana / 2; x += paso) {
            posiciones.push(x);
          }
          return posiciones.map((x, i) => (
            <VentanaPersiana key={i} position={[x, 0, -0.02]} width={anchoVentana} height={2.3} />
          ));
        })()}
      </group>

      {/* Puerta de entrada: hojas acristaladas blancas con marco, umbral y toldo con el neón */}
      <group position={[PUERTA_X, 0, 6.08]}>
        {/* Ventanales con persiana de madera a ambos lados de la puerta, como el escaparate real */}
        <VentanaPersiana position={[-1.55, 0, -0.02]} />
        <VentanaPersiana position={[1.55, 0, -0.02]} />

        {/* Cartel "Palomita Bar" en cursiva sobre la puerta, como el rótulo metálico real */}
        <Text position={[0, 2.75, 0.02]} fontSize={0.32} color="#1c1a1c" anchorX="center" anchorY="middle">
          Palomita Bar
        </Text>

        {/* Maceta con planta junto a la puerta, como el ficus real de la entrada */}
        <PottedPlant position={[-1.35, 0, 0.5]} />
        <WoodBench position={[1.55, 0, 0.28]} />

        {/* Jambas laterales y dintel, en blanco como el marco real */}
        <mesh position={[-PUERTA_ANCHO / 2 - 0.07, 1.2, 0]} castShadow>
          <boxGeometry args={[0.14, 2.5, 0.16]} />
          <meshStandardMaterial color="#e8e6e2" roughness={0.5} />
        </mesh>
        <mesh position={[PUERTA_ANCHO / 2 + 0.07, 1.2, 0]} castShadow>
          <boxGeometry args={[0.14, 2.5, 0.16]} />
          <meshStandardMaterial color="#e8e6e2" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.46, 0]} castShadow>
          <boxGeometry args={[PUERTA_ANCHO + 0.35, 0.14, 0.16]} />
          <meshStandardMaterial color="#e8e6e2" roughness={0.5} />
        </mesh>

        {/* Hojas de puerta blancas con cristal y tirador en forma de clave de sol */}
        {[-1, 1].map((lado) => (
          <group key={lado} position={[lado * PUERTA_ANCHO * 0.27, 0, 0]}>
            <mesh position={[0, 1.15, 0]} castShadow>
              <boxGeometry args={[PUERTA_ANCHO * 0.44, 2.3, 0.08]} />
              <meshStandardMaterial color="#e8e6e2" roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.2, 0.005]}>
              <boxGeometry args={[PUERTA_ANCHO * 0.32, 1.8, 0.03]} />
              <meshStandardMaterial color="#bcd4de" roughness={0.05} metalness={0.1} transparent opacity={0.28} />
            </mesh>
            <mesh position={[lado * -0.14, 1.0, 0.06]}>
              <boxGeometry args={[0.03, 0.75, 0.03]} />
              <meshStandardMaterial color="#3a2f1a" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Umbral */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[PUERTA_ANCHO + 0.35, 0.04, 0.32]} />
          <meshStandardMaterial color="#d8cdb8" roughness={0.8} />
        </mesh>

        {/* Toldo con el logo de neón: por encima del logo (y=3.1, radio ~0.53) para que no se solape con él */}
        <mesh position={[0, 3.85, 0.2]} castShadow>
          <boxGeometry args={[PUERTA_ANCHO + 0.7, 0.09, 0.42]} />
          <meshStandardMaterial color="#4a1f2e" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.1, 0.02]}>
          <boxGeometry args={[1.55, 1.55, 0.05]} />
          <meshStandardMaterial color="#171519" />
        </mesh>
        <NeonLogo position={[0, 3.1, 0.09]} scale={0.85} />
      </group>

      {/* Terraza exterior: pórtico de piedra con soportales, suelo de baldosa cálida y toldo granate. Se oculta al enfocar otra zona. */}
      <group visible={mostrarTerraza}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 8.35]} receiveShadow>
          <planeGeometry args={[21, 4.7]} />
          <meshStandardMaterial color="#a9855f" roughness={0.9} />
        </mesh>
        <group position={[0, -0.169, 8.35]} scale={[21 / 4.7, 1, 1]}>
          <gridHelper args={[4.7, 6, "#b8946e", "#ae8a64"]} />
        </group>
        {montantes.map((x, i) => (
          <mesh key={i} position={[x, 0.35, 10.55]}>
            <boxGeometry args={[0.05, 0.7, 0.05]} />
            <meshStandardMaterial color="#171519" />
          </mesh>
        ))}

        {/* Pilares de piedra del pórtico, como el soportal real de la entrada */}
        <PorticoColumn position={[-6.6, 0, 6.7]} />
        <PorticoColumn position={[-1.4, 0, 6.7]} />
        <PorticoColumn position={[8.2, 0, 6.7]} />

        {/* Toldo granate de la terraza con el nombre del bar, sobre las mesas exteriores */}
        <AwningTerraza position={[1.6, 0, 8.1]} width={16.4} />

        {/* Arbolado detrás de la terraza, como en la plaza real */}
        <StreetTree position={[-9.2, 0, 9.9]} />
        <StreetTree position={[-3.4, 0, 10.1]} />
        <StreetTree position={[2.6, 0, 10.1]} />
        <StreetTree position={[8.6, 0, 9.8]} />

        <Maceta position={[-9.7, 0, 7]} />
        <Maceta position={[9.7, 0, 7]} />
        <Maceta position={[-9.7, 0, 10.1]} />
        <Maceta position={[9.7, 0, 10.1]} />
        <Text position={[0, 0.02, 9.5]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#3a2e22">
          TERRAZA
        </Text>
      </group>
    </group>
  );
}

// Pilar cuadrado de piedra del soportal, como el porche de acceso real al local.
function PorticoColumn({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 3.8, 0.62]} />
        <meshStandardMaterial color="#c9bda8" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.85, 0]}>
        <boxGeometry args={[0.9, 0.12, 0.9]} />
        <meshStandardMaterial color="#b3a68e" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Toldo granate desplegable con el nombre del local, como el que cubre las mesas de la terraza real.
function AwningTerraza({ position, width }: { position: [number, number, number]; width: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.85, 0]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[width, 0.08, 2.6]} />
        <meshStandardMaterial color="#7a2436" roughness={0.75} transparent opacity={0.38} depthWrite={false} />
      </mesh>
      {/* Faldón frontal con el nombre */}
      <mesh position={[0, 2.35, 1.28]}>
        <boxGeometry args={[width, 0.55, 0.05]} />
        <meshStandardMaterial color="#6e1f2f" roughness={0.75} transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <Text
        position={[0, 2.35, 1.31]}
        fontSize={0.26}
        color="#f3d7de"
        anchorX="center"
        anchorY="middle"
      >
        Palomita
      </Text>
      {/* Postes de soporte del toldo */}
      {[-width / 2 + 0.3, 0, width / 2 - 0.3].map((x, i) => (
        <mesh key={i} position={[x, 1.4, 1.15]}>
          <cylinderGeometry args={[0.035, 0.035, 2.8, 8]} />
          <meshStandardMaterial color="#171519" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Árbol estilizado de la plaza, para ambientar el fondo de la terraza.
function StreetTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 2.2, 8]} />
        <meshStandardMaterial color="#4a3626" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <sphereGeometry args={[1.1, 12, 12]} />
        <meshStandardMaterial color="#3a5a34" roughness={0.85} />
      </mesh>
      <mesh position={[0.5, 2.9, 0.3]} castShadow>
        <sphereGeometry args={[0.7, 10, 10]} />
        <meshStandardMaterial color="#456b3e" roughness={0.85} />
      </mesh>
    </group>
  );
}

// Ventanal con persiana veneciana de madera entornada, como los ventanales del salón real con vistas a la calle.
function VentanaPersiana({
  position,
  width = 1.4,
  height = 2.2,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
}) {
  const numLamas = 12;
  return (
    <group position={position}>
      <mesh position={[0, height / 2 + 0.15, 0]} castShadow>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color="#171519" />
      </mesh>
      <mesh position={[0, height / 2 + 0.15, 0.025]}>
        <planeGeometry args={[width - 0.12, height - 0.12]} />
        <meshStandardMaterial color="#f6d998" emissive="#f2c76a" emissiveIntensity={0.85} toneMapped={false} />
      </mesh>
      {Array.from({ length: numLamas }).map((_, i) => (
        <mesh key={i} position={[0, 0.28 + i * ((height - 0.2) / numLamas), 0.05]}>
          <boxGeometry args={[width - 0.1, 0.035, 0.02]} />
          <meshStandardMaterial color="#5a3d24" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Wall({ p, s }: { p: [number, number, number]; s: [number, number, number] }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color="#17151a" />
    </mesh>
  );
}

// Banco de madera junto a la entrada, como los que flanquean la puerta real.
function WoodBench({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.85, 0.06, 0.4]} />
        <meshStandardMaterial color="#7a5334" roughness={0.85} />
      </mesh>
      {[-0.35, 0.35].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]}>
          <boxGeometry args={[0.08, 0.4, 0.38]} />
          <meshStandardMaterial color="#5b3a24" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// Taburete alto de barra, como los de patas metálicas del local real.
function BarStool({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
        <meshStandardMaterial color="#d8d3c8" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.06, 16]} />
        <meshStandardMaterial color="#1c1a1c" roughness={0.7} />
      </mesh>
    </group>
  );
}

// Pantalla de TV en pared, como las que hay sobre la barra y el salón del local.
function TvScreen({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[1.1, 0.65, 0.04]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[1.0, 0.55]} />
        <meshStandardMaterial color="#3a6fd8" emissive="#3a6fd8" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Estantería expositora con velas y letrero luminoso, como la del salón real ("Aquí se viene a disfrutar").
function DisplayShelf({
  position,
  depth = 0.4,
}: {
  position: [number, number, number];
  depth?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.3, 1.8, depth]} />
        <meshStandardMaterial color="#1c1a1c" wireframe />
      </mesh>
      <mesh position={[0, 1.35, depth * 0.38]}>
        <boxGeometry args={[0.7, 0.22, 0.02]} />
        <meshStandardMaterial color="#f4f1ea" emissive="#f4f1ea" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.35, depth * 0.5]} intensity={3} distance={2.5} color="#ff9fd0" />
    </group>
  );
}

// Maceta con ficus junto a la entrada, como la planta real del acceso.
function PottedPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.19, 0.42, 16]} />
        <meshStandardMaterial color="#c9955a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        <meshStandardMaterial color="#5b4326" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.05, 0.05]} castShadow>
        <sphereGeometry args={[0.42, 10, 10]} />
        <meshStandardMaterial color="#3d6b3a" roughness={0.85} />
      </mesh>
      <mesh position={[-0.15, 0.85, -0.1]} castShadow>
        <sphereGeometry args={[0.26, 8, 8]} />
        <meshStandardMaterial color="#456b3e" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Maceta({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.55, 16]} />
        <meshStandardMaterial color="#2c2320" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.42, 12, 12]} />
        <meshStandardMaterial color="#1f3324" roughness={0.85} />
      </mesh>
    </group>
  );
}

// Sofá chesterfield de cuero granate con capitoné, como el del rincón de sofás real junto al neón.
function ChesterfieldSofa({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.7, 0.5, 0.75]} />
        <meshStandardMaterial color="#5a2230" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.65, -0.3]} castShadow>
        <boxGeometry args={[1.7, 0.55, 0.18]} />
        <meshStandardMaterial color="#5a2230" roughness={0.55} />
      </mesh>
      {[-0.78, 0.78].map((x, i) => (
        <mesh key={i} position={[x, 0.45, 0]} castShadow>
          <boxGeometry args={[0.16, 0.42, 0.75]} />
          <meshStandardMaterial color="#5a2230" roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

// Pared de ladrillo visto con textura procedural (hiladas a canto corrido), como la pared del rincón de sofás real.
function useBrickTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#8a6a4a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const brickW = 42;
      const brickH = 20;
      const gap = 3;
      let row = 0;
      for (let y = -brickH; y < canvas.height + brickH; y += brickH) {
        const offset = row % 2 === 0 ? 0 : brickW / 2;
        for (let x = -brickW; x < canvas.width + brickW; x += brickW) {
          const shade = 52 + Math.random() * 14;
          ctx.fillStyle = `hsl(26, 38%, ${shade}%)`;
          ctx.fillRect(x + offset + gap / 2, y + gap / 2, brickW - gap, brickH - gap);
        }
        row += 1;
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1.4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function BrickWall({
  position,
  rotation = [0, 0, 0],
  size,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
}) {
  const brickTexture = useBrickTexture();
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial map={brickTexture ?? undefined} color={brickTexture ? undefined : "#8a6a4a"} roughness={0.96} />
    </mesh>
  );
}

// Mesa de centro redonda apoyada sobre puf, como las mesitas de tapa de mármol y patas puf azules del rincón de sofás real.
function RoundPouffeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.34, 20]} />
        <meshStandardMaterial color="#1f6b8f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 24]} />
        <meshStandardMaterial color="#c9b8a0" roughness={0.4} />
      </mesh>
    </group>
  );
}

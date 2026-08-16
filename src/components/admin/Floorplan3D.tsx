"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useState } from "react";
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

// Sala principal: interior del local. Barra: franja frente a la barra. Terraza: exterior, más allá del ventanal.
const REGIONES: Record<PrefijoZona, Region> = {
  "": { xMin: -7.2, xMax: 5.2, zMin: -5.6, zMax: 5.6 },
  B: { xMin: 5.7, xMax: 6.6, zMin: -1.6, zMax: 3.9 },
  T: { xMin: -7.6, xMax: 7.6, zMin: 6.4, zMax: 10.3 },
};

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

function tamanoMesa(capacidad: number): number {
  return Math.min(2.4, 0.85 + Math.max(0, capacidad - 1) * 0.13);
}

export default function Floorplan3D({
  mesas,
  seleccionadaId,
  seleccionUnion,
  top,
  onSelect,
  onDragMove,
  onDragEnd,
}: Props) {
  const [arrastrando, setArrastrando] = useState(false);

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
        camera={{ position: top ? [0, 20, 2] : [11, 10, 15], fov: 45 }}
      >
        <ambientLight intensity={1.15} />
        <directionalLight position={[3, 10, 4]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-4, 4, -2]} intensity={16} color="#d79b72" />
        <pointLight position={[6.5, 3.2, -1]} intensity={14} color="#b14cff" />
        <pointLight position={[0, 2.6, -5.6]} intensity={12} color="#e0559b" />
        <hemisphereLight args={["#3a3f52", "#0c0910", 0.5]} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
          <planeGeometry args={[17, 12]} />
          <meshStandardMaterial color="#262125" roughness={0.85} />
        </mesh>
        <gridHelper args={[17, 20, "#3a3238", "#2c262b"]} position={[0, -0.17, 0]} />

        <Architecture />

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

        <OrbitControls
          enabled={!arrastrando}
          enableDamping
          minDistance={6}
          maxDistance={28}
          minPolarAngle={top ? 0 : 0.4}
          maxPolarAngle={top ? 0.04 : Math.PI / 2.05}
          target={[0, 0, 1.5]}
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
    const dx = xPct - snapshot.centro.x;
    const dy = yPct - snapshot.centro.y;
    snapshot.miembros.forEach((m) => {
      onDragMove(m.id, THREE.MathUtils.clamp(m.x + dx, 3, 97), THREE.MathUtils.clamp(m.y + dy, 6, 94));
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
              const dx = xPct - snapshot.centro.x;
              const dy = yPct - snapshot.centro.y;
              snapshot.miembros.forEach((m) => {
                onDragEnd(m.id, THREE.MathUtils.clamp(m.x + dx, 3, 97), THREE.MathUtils.clamp(m.y + dy, 6, 94));
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

function Architecture() {
  return (
    <group>
      <Wall p={[-8.4, 1.5, -0.9]} s={[0.24, 3, 10.7]} />
      <Wall p={[8.4, 1.5, -0.9]} s={[0.24, 3, 10.7]} />
      <Wall p={[0, 1.5, -6.1]} s={[17.3, 3, 0.24]} />

      {/* Pared de ladrillo con el neón de la marca */}
      <mesh position={[-2, 1.6, -5.95]}>
        <boxGeometry args={[9.6, 2.7, 0.16]} />
        <meshStandardMaterial color="#9b725c" roughness={0.96} />
      </mesh>
      <Text position={[-2, 2.05, -5.8]} fontSize={0.4} color="#f2ddd3" anchorX="center">
        PALOMITA
      </Text>

      {/* Barra */}
      <group position={[7.1, 0.75, 1.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[6, 1.4, 1.05]} />
          <meshStandardMaterial color="#49332d" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <boxGeometry args={[6.16, 0.1, 1.18]} />
          <meshStandardMaterial color="#d2b28c" roughness={0.55} />
        </mesh>
      </group>
      {/* Botellero detrás de la barra */}
      <mesh position={[8.15, 1.5, 1.2]}>
        <boxGeometry args={[0.25, 2.6, 5.6]} />
        <meshStandardMaterial color="#171519" />
      </mesh>
      <Text position={[6.15, 0.02, 1.1]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} fontSize={0.3} color="#d5c5c1">
        BARRA
      </Text>

      {/* Sofás / banquetas junto a la pared opuesta */}
      <Banquette position={[-7.7, 0.55, -2.6]} size={[0.7, 0.95, 5.2]} />
      <Banquette position={[-7.7, 0.55, 3.6]} size={[0.7, 0.95, 3.4]} />

      {/* Ventanal con montantes: separa la sala de la terraza exterior */}
      <group position={[0, 1.7, 6.1]}>
        <mesh>
          <boxGeometry args={[16.6, 2.5, 0.06]} />
          <meshStandardMaterial color="#243038" transparent opacity={0.22} />
        </mesh>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[-8 + i * 0.94, 0, -0.05]}>
            <boxGeometry args={[0.06, 2.6, 0.06]} />
            <meshStandardMaterial color="#191619" />
          </mesh>
        ))}
      </group>

      {/* Terraza exterior */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 8.35]} receiveShadow>
        <planeGeometry args={[17, 4.7]} />
        <meshStandardMaterial color="#1c2420" roughness={0.92} />
      </mesh>
      <gridHelper args={[17, 12, "#33403a", "#28322d"]} position={[0, -0.17, 8.35]} />
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh key={i} position={[-8 + i * 0.94, 0.35, 10.55]}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color="#171519" />
        </mesh>
      ))}
      <Maceta position={[-7.6, 0, 7]} />
      <Maceta position={[7.6, 0, 7]} />
      <Maceta position={[-7.6, 0, 10.1]} />
      <Maceta position={[7.6, 0, 10.1]} />
      <Text position={[0, 0.02, 9.5]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#c9d8cf">
        TERRAZA
      </Text>

      <Text position={[-2.5, 0.02, 4.6]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#d5c5c1">
        SALA PRINCIPAL
      </Text>
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

function Banquette({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#30252a" roughness={0.75} />
      </mesh>
      <mesh position={[size[0] * 0.35, 0.47, 0]}>
        <boxGeometry args={[0.28, size[1], size[2]]} />
        <meshStandardMaterial color="#30252a" roughness={0.75} />
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

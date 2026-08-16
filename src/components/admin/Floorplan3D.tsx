"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useState } from "react";
import type { EstadoMesa } from "@/components/admin/SalonBoard";

export type Mesa3D = {
  id: string;
  etiqueta: string;
  nombre: string | null;
  capacidad: number;
  estado: EstadoMesa;
  pendientes: number;
  unida: boolean;
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
const FLOOR_W = 17;
const FLOOR_D = 12;
const FLOOR = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function pctToPos(xPct: number, yPct: number): [number, number] {
  return [((xPct - 50) / 100) * FLOOR_W, ((yPct - 50) / 100) * FLOOR_D];
}

function posToPct(x: number, z: number): [number, number] {
  const xPct = THREE.MathUtils.clamp((x / FLOOR_W) * 100 + 50, 3, 97);
  const yPct = THREE.MathUtils.clamp((z / FLOOR_D) * 100 + 50, 6, 94);
  return [xPct, yPct];
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

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: top ? [0, 16, 0.01] : [11, 9.5, 12], fov: 45 }}
      >
        <ambientLight intensity={1.15} />
        <directionalLight position={[3, 10, 4]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-4, 4, -2]} intensity={16} color="#d79b72" />
        <pointLight position={[6.5, 3.2, -1]} intensity={14} color="#b14cff" />
        <pointLight position={[0, 2.6, -5.6]} intensity={12} color="#e0559b" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
          <planeGeometry args={[FLOOR_W, FLOOR_D]} />
          <meshStandardMaterial color="#262125" roughness={0.85} />
        </mesh>
        <gridHelper args={[Math.max(FLOOR_W, FLOOR_D), 20, "#3a3238", "#2c262b"]} position={[0, -0.17, 0]} />

        <Architecture />

        {mesas.map((mesa) => (
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

        <OrbitControls
          enabled={!arrastrando}
          enableDamping
          minDistance={6}
          maxDistance={24}
          minPolarAngle={top ? 0 : 0.4}
          maxPolarAngle={top ? 0.04 : Math.PI / 2.05}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
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
  const color = COLOR_MESA[mesa.estado];
  const size = Math.min(1.8, 0.9 + Math.max(0, mesa.capacidad - 2) * 0.09);
  const seats = Math.min(mesa.capacidad, 10);
  const [x, z] = pctToPos(mesa.x, mesa.y);

  const moveFromEvent = (e: ThreeEvent<PointerEvent>) => {
    const hit = e.ray.intersectPlane(FLOOR, new THREE.Vector3());
    if (!hit) return;
    const [xPct, yPct] = posToPct(hit.x, hit.z);
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
              const [xPct, yPct] = posToPct(hit.x, hit.z);
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
      <Text
        position={[0, 1.24, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.42}
        color="white"
        outlineWidth={0.035}
        outlineColor="#171015"
        anchorX="center"
        anchorY="middle"
      >
        {mesa.etiqueta}
      </Text>
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
      {mesa.unida && (
        <Text
          position={[0, 1.6, 0]}
          fontSize={0.17}
          color="#f5d4ff"
          outlineWidth={0.02}
          outlineColor="#171015"
          anchorX="center"
        >
          UNIDA
        </Text>
      )}
    </group>
  );
}

function Architecture() {
  return (
    <group>
      <Wall p={[-8.4, 1.5, 0]} s={[0.24, 3, FLOOR_D + 0.3]} />
      <Wall p={[8.4, 1.5, 0]} s={[0.24, 3, FLOOR_D + 0.3]} />
      <Wall p={[0, 1.5, -6.1]} s={[FLOOR_W + 0.3, 3, 0.24]} />
      <Wall p={[0, 1.5, 6.1]} s={[FLOOR_W + 0.3, 3, 0.24]} />

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
        {[-2.2, -0.7, 0.8, 2.2].map((x) => (
          <mesh key={x} position={[x, -0.2, 0.75]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.85, 16]} />
            <meshStandardMaterial color="#3b2c2b" />
          </mesh>
        ))}
      </group>
      {/* Botellero detrás de la barra */}
      <mesh position={[8.15, 1.5, 1.2]}>
        <boxGeometry args={[0.25, 2.6, 5.6]} />
        <meshStandardMaterial color="#171519" />
      </mesh>

      {/* Sofás / banquetas junto a la pared opuesta */}
      <Banquette position={[-7.7, 0.55, -2.6]} size={[0.7, 0.95, 5.2]} />
      <Banquette position={[-7.7, 0.55, 3.6]} size={[0.7, 0.95, 3.4]} />

      {/* Ventanal con montantes en la fachada frontal */}
      <group position={[1, 1.7, 5.98]}>
        <mesh>
          <boxGeometry args={[9.4, 2.5, 0.06]} />
          <meshStandardMaterial color="#243038" transparent opacity={0.3} />
        </mesh>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[-4.5 + i * 1, 0, -0.05]}>
            <boxGeometry args={[0.06, 2.6, 0.06]} />
            <meshStandardMaterial color="#191619" />
          </mesh>
        ))}
      </group>

      <Text position={[-4.5, 0.02, 4.6]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#d5c5c1">
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

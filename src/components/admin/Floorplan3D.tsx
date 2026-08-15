"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";
import type { EstadoMesa } from "@/components/admin/SalonBoard";

export type Mesa3D = {
  id: string;
  numero: number;
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
  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: top ? [0, 16, 0.01] : [11, 9.5, 12], fov: 45 }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 10, 4]} intensity={1.9} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-4, 4, -2]} intensity={16} color="#d79b72" />
        <pointLight position={[4, 4, 4]} intensity={12} color="#9c54ff" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
          <planeGeometry args={[FLOOR_W, FLOOR_D]} />
          <meshStandardMaterial color="#262125" roughness={0.85} />
        </mesh>
        <gridHelper args={[Math.max(FLOOR_W, FLOOR_D), 20, "#3a3238", "#302a2f"]} position={[0, -0.17, 0]} />

        {mesas.map((mesa) => (
          <Mesa
            key={mesa.id}
            mesa={mesa}
            selected={seleccionadaId === mesa.id || seleccionUnion.includes(mesa.id)}
            onSelect={onSelect}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
        ))}

        <OrbitControls
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
  onDragMove,
  onDragEnd,
}: {
  mesa: Mesa3D;
  selected: boolean;
  onSelect: (id: string) => void;
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
          dragging.current = true;
          onSelect(mesa.id);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          e.stopPropagation();
          moveFromEvent(e);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (dragging.current) {
            dragging.current = false;
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
          emissiveIntensity={selected ? 1.1 : 0.2}
        />
      </mesh>
      <Text position={[0, 1.23, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {String(mesa.numero)}
      </Text>
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 0.68, size * 0.74, 48]} />
          <meshBasicMaterial color={SELECCION_COLOR} />
        </mesh>
      )}
      {mesa.pendientes > 0 && (
        <Text position={[size * 0.55, 1.55, -size * 0.55]} fontSize={0.24} color="#f472b6" anchorX="center">
          {String(mesa.pendientes)}
        </Text>
      )}
      {mesa.unida && (
        <Text position={[0, 1.55, 0]} fontSize={0.16} color="#f5d4ff" anchorX="center">
          UNIDA
        </Text>
      )}
    </group>
  );
}

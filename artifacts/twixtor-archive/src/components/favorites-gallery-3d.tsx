"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html, Plane, Sphere } from "@react-three/drei";
import { Heart, X, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "wouter";

export type GalleryCard = {
  id: string;
  dramaId: number;
  imageUrl: string;
  alt: string;
  title: string;
};

type CardContextType = {
  selectedCard: GalleryCard | null;
  setSelectedCard: (card: GalleryCard | null) => void;
  cards: GalleryCard[];
  onUnfavorite: (dramaId: number) => Promise<void>;
};

const CardContext = createContext<CardContextType | undefined>(undefined);

function useCard() {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error("useCard must be used within CardProvider");
  return ctx;
}

function CardProvider({
  cards,
  onUnfavorite,
  children,
}: {
  cards: GalleryCard[];
  onUnfavorite: (dramaId: number) => Promise<void>;
  children: React.ReactNode;
}) {
  const [selectedCard, setSelectedCard] = useState<GalleryCard | null>(null);
  return (
    <CardContext.Provider value={{ selectedCard, setSelectedCard, cards, onUnfavorite }}>
      {children}
    </CardContext.Provider>
  );
}

function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 4000;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    camera.position.z = 10;

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      stars.rotation.y += 0.0001;
      stars.rotation.x += 0.00005;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
      renderer.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 bg-black" />;
}

function FloatingCard({
  card,
  position,
}: {
  card: GalleryCard;
  position: { x: number; y: number; z: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { setSelectedCard } = useCard();

  useFrame(({ camera }) => {
    if (groupRef.current) groupRef.current.lookAt(camera.position);
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Plane
        args={[4.5, 6]}
        onClick={(e: any) => { e.stopPropagation(); setSelectedCard(card); }}
        onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e: any) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <meshBasicMaterial transparent opacity={0} />
      </Plane>

      <Html
        transform
        distanceFactor={10}
        position={[0, 0, 0.01]}
        style={{ transition: "all 0.3s ease", transform: hovered ? "scale(1.15)" : "scale(1)", pointerEvents: "none" }}
      >
        <div
          className="w-36 h-48 rounded-lg overflow-hidden shadow-2xl bg-[#1F2121] p-2.5 select-none"
          style={{
            boxShadow: hovered ? "0 25px 50px rgba(168, 85, 247, 0.5), 0 0 30px rgba(168, 85, 247, 0.3)" : "0 15px 30px rgba(0, 0, 0, 0.6)",
            border: hovered ? "2px solid rgba(168, 85, 247, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <img src={card.imageUrl || "/placeholder.svg"} alt={card.alt} className="w-full h-36 object-cover rounded-md" loading="lazy" draggable={false} />
          <div className="mt-1 text-center">
            <p className="text-white text-xs font-medium truncate">{card.title}</p>
          </div>
        </div>
      </Html>
    </group>
  );
}

function CardModal() {
  const { selectedCard, setSelectedCard, onUnfavorite } = useCard();
  const [removing, setRemoving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!selectedCard) return null;

  const handleClose = () => setSelectedCard(null);
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onUnfavorite(selectedCard.dramaId);
      setSelectedCard(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="relative max-w-xs w-full mx-4">
        <button onClick={handleClose} className="absolute -top-11 right-0 text-white hover:text-gray-300 transition-colors z-10">
          <X className="w-7 h-7" />
        </button>

        <div
          ref={cardRef}
          className="relative rounded-2xl bg-[#1F2121] p-4 w-full"
          style={{ boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
        >
          <div className="relative w-full mb-4" style={{ aspectRatio: "2 / 3" }}>
            <img
              loading="lazy"
              className="absolute inset-0 h-full w-full rounded-xl bg-black object-cover"
              alt={selectedCard.alt}
              src={selectedCard.imageUrl || "/placeholder.svg"}
            />
          </div>

          <h3 className="text-white text-base font-semibold mb-4 text-center line-clamp-2">{selectedCard.title}</h3>

          <div className="flex gap-2">
            <Link
              href={`/dramas/${selectedCard.dramaId}`}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-black bg-primary hover:bg-primary/90 transition"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.8} />
              Lihat Detail
            </Link>
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-black bg-primary hover:bg-primary/90 transition disabled:opacity-50"
              aria-label="Hapus dari favorit"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4 fill-current" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardGalaxy() {
  const { cards } = useCard();

  const cardPositions = useMemo(() => {
    const positions: { x: number; y: number; z: number }[] = [];
    const numCards = cards.length;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < numCards; i++) {
      const y = numCards > 1 ? 1 - (i / (numCards - 1)) * 2 : 0;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = (2 * Math.PI * i) / goldenRatio;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      const layerRadius = 10 + (i % 3) * 3;
      positions.push({ x: x * layerRadius, y: y * layerRadius, z: z * layerRadius });
    }
    return positions;
  }, [cards.length]);

  return (
    <>
      <Sphere args={[10, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#a855f7" transparent opacity={0.05} wireframe />
      </Sphere>
      <Sphere args={[13, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#a855f7" transparent opacity={0.03} wireframe />
      </Sphere>

      {cards.map((card, i) => (
        <FloatingCard key={card.id} card={card} position={cardPositions[i]} />
      ))}
    </>
  );
}

export default function FavoritesGallery3D({
  dramas,
  onUnfavorite,
}: {
  dramas: { id: number; name: string; posterUrl?: string | null }[];
  onUnfavorite: (dramaId: number) => Promise<void>;
}) {
  const cards: GalleryCard[] = dramas.map((d) => ({
    id: String(d.id),
    dramaId: d.id,
    imageUrl: d.posterUrl || "",
    alt: d.name,
    title: d.name,
  }));

  return (
    <CardProvider cards={cards} onUnfavorite={onUnfavorite}>
      <div className="w-full h-[65vh] min-h-[420px] relative overflow-hidden rounded-2xl bg-black">
        <StarfieldBackground />

        <Canvas
          camera={{ position: [0, 0, 14], fov: 60 }}
          className="absolute inset-0 z-10"
          onCreated={({ gl }) => { gl.domElement.style.pointerEvents = "auto"; }}
        >
          <Suspense fallback={null}>
            <Environment preset="night" />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            <CardGalaxy />
            <OrbitControls
              enablePan={false}
              enableZoom
              enableRotate
              minDistance={5}
              maxDistance={30}
              rotateSpeed={0.5}
              zoomSpeed={1.2}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        <CardModal />

        <div className="absolute top-3 left-3 z-20 text-white/60 pointer-events-none text-[10px] md:text-xs">
          Drag untuk lihat sekeliling • Cubit/scroll untuk zoom • Tap kartu buat detail
        </div>
      </div>
    </CardProvider>
  );
}

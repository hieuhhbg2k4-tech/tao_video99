/**
 * tao_video99 — PlateStoryVideo (template chuyên biển số, kể chuyện theo từng con số)
 * Mở đầu Split-Screen "TRÚNG ĐẤU GIÁ" -> mở toàn màn hình -> Biển số 3D Three.js + kim cương xoay.
 * CHỈ CẦN SỬA KHỐI `CONFIG` BÊN DƯỚI cho mỗi video mới.
 */
import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Audio, Video } from '@remotion/media';
import { ThreeCanvas } from '@remotion/three';
import { createTikTokStyleCaptions } from '@remotion/captions';
import type { Caption, TikTokPage } from '@remotion/captions';
import * as THREE from 'three';
import rawCaptions from './captions3.json';

// ===================== CONFIG =====================
type Beat = {
  from: number; // giây bắt đầu
  to: number; // giây kết thúc
  digitIdx: number[]; // vị trí ký tự trong plateBottom cần sáng (VD '512.34' -> 0='5')
  big: string; // chữ số lớn hiển thị
  label: string; // ý nghĩa
  color: string;
};

export const CONFIG = {
  videoSrc: 'source3.mp4',
  plateTop: '99B',
  plateBottom: '512.34',
  introTitle: 'BIỂN SỐ KỂ CHUYỆN',
  introTag: '✦ 99B - 512.34',
  introCta: 'BÌNH LUẬN “QUAN TÂM”',
  introSub: 'MÌNH TƯ VẤN BIỂN ĐẸP CHO NHÉ',
  beats: [
    { from: 5.7, to: 7.2, digitIdx: [0], big: '5', label: 'NĂM XÂY DỰNG TƯƠNG LAI', color: '#FACC15' },
    { from: 7.2, to: 8.3, digitIdx: [1], big: '1', label: 'LÒNG CHUNG THỦY', color: '#F472B6' },
    { from: 8.3, to: 9.4, digitIdx: [2], big: '2', label: 'ĐỨA CON', color: '#38BDF8' },
    { from: 9.4, to: 10.4, digitIdx: [4], big: '3', label: 'TẦNG NHÀ ĐẸP', color: '#4ADE80' },
    { from: 10.4, to: 11.6, digitIdx: [5], big: '4', label: 'BÁNH BON BON', color: '#FB923C' },
  ] as Beat[],
  plateRevealAt: 11.7, // đọc cả biển -> toàn bộ biển rực sáng
  plateRevealTo: 15.5,
  storyPill: { from: 16.0, to: 20.7, text: 'DẤU ẤN CỦA CHẶNG ĐƯỜNG THÀNH CÔNG' },
  askPill: { from: 20.8, to: 24.8, text: '💬 CÓ ĐÁNG XUỐNG TIỀN KHÔNG?' },
  priceAt: 25.0,
  priceText: 'CHỈ VÀI CHỤC CỦ',
  priceSub: '✓ SANG TÊN CHÍNH CHỦ',
  keywords: ['5', '1', '2', '3', '4', 'năm', 'lòng', 'chung', 'thủy', 'đứa', 'con', 'tầng', 'nhà', 'bốn', 'bánh', '99b', '512.34', 'dãy', 'số', 'dấu', 'ấn', 'thành', 'công', 'xuống', 'tiền', 'bình', 'luận', 'chục', 'củ'],
};
// ==================================================

const SWITCH_CAPTIONS_EVERY_MS = 1200;
const KW = new Set(CONFIG.keywords.map((k) => k.toLowerCase()));
const isKeyword = (t: string) => KW.has(t.trim().toLowerCase());

function createPlateTexture(activeIdx: number[], activeColor: string, allGlow: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 580;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 1024, 580);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#F1F5F9');
  grad.addColorStop(1, '#E2E8F0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 580);
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 26;
  ctx.strokeRect(24, 24, 976, 532);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 175px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(CONFIG.plateTop, 512, 185);

  const chars = CONFIG.plateBottom.split('');
  const widths = chars.map((c) => (c === '.' ? 55 : 125));
  const totalW = widths.reduce((a, b) => a + b, 0);
  let x = (1024 - totalW) / 2;
  ctx.font = '900 205px system-ui, -apple-system, Segoe UI, sans-serif';
  chars.forEach((ch, i) => {
    const on = activeIdx.includes(i);
    ctx.fillStyle = allGlow ? '#B45309' : on ? activeColor : '#0F172A';
    if (on || allGlow) {
      ctx.shadowColor = allGlow ? '#FACC15' : activeColor;
      ctx.shadowBlur = 30;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillText(ch, x + widths[i] / 2, 405);
    x += widths[i];
  });
  ctx.shadowBlur = 0;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const Plate3DMesh: React.FC<{ startAt: number }> = ({ startAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const beat = CONFIG.beats.find((b) => t >= b.from && t < b.to);
  const allGlow = t >= CONFIG.plateRevealAt && t < CONFIG.plateRevealTo;
  const key = `${beat ? beat.digitIdx.join(',') + beat.color : 'none'}-${allGlow}`;
  const texture = useMemo(
    () => createPlateTexture(beat ? beat.digitIdx : [], beat ? beat.color : '#0F172A', allGlow),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  if (t < startAt) return null;
  const pFrame = frame - Math.round(startAt * fps);
  const enter = spring({ frame: pFrame, fps, config: { damping: 12, stiffness: 210 } });

  // nhịp "đập" khi mỗi beat bắt đầu hoặc lúc đọc cả biển
  const pulseStarts = [...CONFIG.beats.map((b) => b.from), CONFIG.plateRevealAt];
  let pulse = 0;
  for (const s of pulseStarts) {
    const d = t - s;
    if (d >= 0 && d < 0.35) pulse = Math.max(pulse, Math.sin((d / 0.35) * Math.PI) * 0.12);
  }

  const zPos = interpolate(enter, [0, 1], [-10, 0]);
  const spinY = interpolate(enter, [0, 1], [Math.PI * 2, 0]);
  const idleYaw = Math.sin(pFrame * 0.045) * 0.18;
  const idlePitch = Math.cos(pFrame * 0.035) * 0.07;
  const yPos = 1.95 + Math.sin(pFrame * 0.06) * 0.05;
  const lightX = Math.sin(pFrame * 0.07) * 4;

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 8]} intensity={1.1} />
      <pointLight position={[lightX, 4, 4]} intensity={2.2} color="#FDE047" />
      <group
        position={[0, yPos, zPos]}
        rotation={[idlePitch, spinY + idleYaw, 0]}
        scale={enter * (0.62 + pulse)}
      >
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[3.15, 1.82, 0.14]} />
          <meshStandardMaterial color="#FACC15" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[2.98, 1.66, 0.12]} />
          <meshStandardMaterial map={texture} metalness={0.25} roughness={0.28} />
        </mesh>
        <mesh position={[-1.95, 0, 0.1]} rotation={[pFrame * 0.06, pFrame * 0.08, 0]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#FDE047" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[1.95, 0, 0.1]} rotation={[-pFrame * 0.06, -pFrame * 0.08, 0]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#4ADE80" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    </>
  );
};

const AuctionPlateCard: React.FC = () => (
  <div
    style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '1080 / 960',
      borderRadius: 18,
      overflow: 'hidden',
      border: '3px solid #FACC15',
      boxShadow: '0 14px 36px rgba(0,0,0,0.65)',
    }}
  >
    <Img src={staticFile('trung_dau_gia.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    <div
      style={{
        position: 'absolute',
        left: '21.5%',
        top: '27.8%',
        width: '57%',
        height: '33.8%',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 900,
        color: '#0F172A',
      }}
    >
      <div style={{ fontSize: '2.9em', lineHeight: 0.98, letterSpacing: 2 }}>{CONFIG.plateTop}</div>
      <div style={{ fontSize: '3.2em', lineHeight: 1, letterSpacing: 1.5 }}>{CONFIG.plateBottom}</div>
    </div>
  </div>
);

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const abs = page.startMs + (frame / fps) * 1000;
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 240 } });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 100, paddingLeft: 28, paddingRight: 28 }}>
      <div
        style={{
          transform: `translateY(${(1 - enter) * 16}px) scale(${0.92 + 0.08 * enter})`,
          opacity: enter,
          backgroundColor: 'rgba(10,14,24,0.85)',
          borderRadius: 20,
          padding: '13px 22px',
          border: '2px solid rgba(250,204,21,0.65)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
          textAlign: 'center',
          lineHeight: 1.32,
          maxWidth: 665,
        }}
      >
        {page.tokens.map((token, idx) => {
          const active = token.fromMs <= abs && token.toMs > abs;
          const spoken = abs >= token.fromMs;
          const kw = isKeyword(token.text);
          const tf = Math.max(0, ((token.fromMs - page.startMs) / 1000) * fps);
          const wipe = kw && spoken ? spring({ frame: Math.max(0, frame - tf), fps, config: { damping: 200 }, durationInFrames: 7 }) : 0;
          return (
            <span
              key={`${token.fromMs}-${idx}`}
              style={{ position: 'relative', display: 'inline-block', marginLeft: idx === 0 ? 0 : 7, padding: kw ? '0 6px' : '0 2px', transform: active ? 'scale(1.12)' : 'scale(1)' }}
            >
              {kw && spoken && (
                <span
                  style={{
                    position: 'absolute', left: 0, bottom: 2, height: '88%', width: `${wipe * 100}%`,
                    backgroundColor: active ? 'rgba(250,204,21,0.94)' : 'rgba(34,197,94,0.35)', borderRadius: 8,
                  }}
                />
              )}
              <span
                style={{
                  position: 'relative', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                  fontSize: kw ? 40 : 35, fontWeight: 900, textTransform: kw ? 'uppercase' : 'none',
                  color: kw && active ? '#0F172A' : active ? '#FDE047' : kw ? '#86EFAC' : '#FFFFFF',
                  textShadow: kw && active ? 'none' : '0 3px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000',
                }}
              >
                {token.text.trim()}
              </span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Pill: React.FC<{ at: number; text: string; color: string; bg?: string; fontSize?: number }> = ({ at, text, color, bg, fontSize = 22 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: Math.max(0, frame - Math.round(at * fps)), fps, config: { damping: 11, stiffness: 240 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 22}px) scale(${0.7 + 0.3 * s})`,
        backgroundColor: bg ?? 'rgba(15,23,42,0.92)',
        border: `2.5px solid ${color}`,
        borderRadius: 999,
        padding: '9px 24px',
        fontFamily: 'system-ui, sans-serif',
        fontSize,
        fontWeight: 900,
        color: bg ? '#FFFFFF' : color,
        boxShadow: `0 8px 26px ${color}55`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

export const PlateStoryVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const captions = rawCaptions as Caption[];
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS }),
    [captions]
  );

  // ---- Intro split-screen ----
  const introIn = spring({ frame, fps, config: { damping: 12, stiffness: 260 } });
  const expand = spring({ frame: Math.max(0, frame - Math.round(2.4 * fps)), fps, config: { damping: 15, stiffness: 140 } });
  const vidLeft = interpolate(expand, [0, 1], [274, 0]);
  const vidTop = interpolate(expand, [0, 1], [155, 0]);
  const vidW = interpolate(expand, [0, 1], [422, 720]);
  const vidH = interpolate(expand, [0, 1], [785, 1280]);
  const vidR = interpolate(expand, [0, 1], [22, 0]);
  const vidB = interpolate(expand, [0, 1], [3, 0]);
  const introOp = interpolate(expand, [0, 0.55], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // retention zoom: đập nhẹ mỗi beat
  let punch = 0;
  for (const b of CONFIG.beats) {
    const d = t - b.from;
    if (d >= 0 && d < 0.4) punch = Math.max(punch, Math.sin((d / 0.4) * Math.PI) * 0.035);
  }
  const revealZoom = interpolate(t, [CONFIG.plateRevealAt - 0.1, CONFIG.plateRevealAt + 0.3, CONFIG.plateRevealTo - 0.5, CONFIG.plateRevealTo], [1, 1.06, 1.06, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const priceZoom = interpolate(t, [CONFIG.priceAt - 0.1, CONFIG.priceAt + 0.3], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const camScale = (1 + punch) * revealZoom * priceZoom;

  const beat = CONFIG.beats.find((b) => t >= b.from && t < b.to);

  // price slam
  const pf = Math.max(0, frame - Math.round(CONFIG.priceAt * fps));
  const priceSlam = spring({ frame: pf, fps, config: { damping: 11, stiffness: 240 } });
  const priceScale = interpolate(priceSlam, [0, 1], [1.75, 1]);
  const shimmerX = interpolate(pf, [5, 25], [-120, 460], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const sfx = (at: number, src: string, vol: number) => (
    <Sequence key={`${src}-${at}`} from={Math.round(at * fps)} durationInFrames={18}>
      <Audio src={staticFile(src)} volume={vol} />
    </Sequence>
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0B0E14',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    >
      {/* SFX */}
      {sfx(0, 'sfx_whoosh.wav', 0.8)}
      {sfx(2.4, 'sfx_whoosh.wav', 0.6)}
      {sfx(2.9, 'sfx_slam.wav', 0.7)}
      {CONFIG.beats.map((b) => sfx(b.from, 'sfx_ding.wav', 0.5))}
      {sfx(CONFIG.plateRevealAt, 'sfx_slam.wav', 0.75)}
      {sfx(CONFIG.priceAt, 'sfx_slam.wav', 0.8)}

      {/* INTRO */}
      {introOp > 0.01 && (
        <AbsoluteFill style={{ opacity: introOp }}>
          <div style={{ position: 'absolute', top: 78, left: 274, width: 422, textAlign: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 40, fontWeight: 900, color: '#FBBF24', textShadow: '0 4px 18px rgba(251,191,36,0.45)', transform: `scale(${introIn})` }}>
            {CONFIG.introTitle}
          </div>
          <div style={{ position: 'absolute', top: 300, left: 16, width: 220, textAlign: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 23, fontWeight: 900, color: '#FFFFFF', whiteSpace: 'nowrap', transform: `translateX(${(1 - introIn) * -120}px)` }}>
            TRÚNG ĐẤU GIÁ
          </div>
          <div style={{ position: 'absolute', top: 350, left: 16, width: 220, fontSize: 5.5, transform: `translateX(${(1 - introIn) * -140}px) scale(${introIn})` }}>
            <AuctionPlateCard />
          </div>
          <div style={{ position: 'absolute', top: 505, left: 228, width: 56, height: 56, borderRadius: 999, backgroundColor: '#111827', border: '2.5px solid #FBBF24', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 22, fontWeight: 900, color: '#FBBF24', zIndex: 5, boxShadow: '0 0 20px rgba(251,191,36,0.5)', transform: `scale(${introIn})` }}>
            VIP
          </div>
          <div style={{ position: 'absolute', bottom: 138, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${(1 - introIn) * 40}px)` }}>
            <div style={{ backgroundColor: '#FBBF24', borderRadius: 999, padding: '14px 38px', fontFamily: 'system-ui, sans-serif', fontSize: 32, fontWeight: 900, color: '#111827', boxShadow: '0 10px 30px rgba(251,191,36,0.4)' }}>
              {CONFIG.introCta}
            </div>
            <div style={{ marginTop: 14, fontFamily: 'system-ui, sans-serif', fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>{CONFIG.introSub}</div>
          </div>
        </AbsoluteFill>
      )}

      {/* VIDEO */}
      <div style={{ position: 'absolute', left: vidLeft, top: vidTop, width: vidW, height: vidH, borderRadius: vidR, overflow: 'hidden', border: `${vidB}px solid #FBBF24`, boxShadow: vidB > 0.2 ? '0 0 32px rgba(251,191,36,0.35)' : 'none' }}>
        <div style={{ width: '100%', height: '100%', transform: `scale(${camScale})` }}>
          <Video src={staticFile(CONFIG.videoSrc)} style={{ width: '100%', height: '100%' }} />
        </div>
        {introOp > 0.05 && (
          <div style={{ position: 'absolute', top: 14, left: 14, opacity: introOp, backgroundColor: '#FBBF24', borderRadius: 999, padding: '5px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 18, fontWeight: 900, color: '#111827' }}>
            {CONFIG.introTag}
          </div>
        )}
      </div>

      {/* 3D PLATE */}
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 7], fov: 45 }}>
        <Plate3DMesh startAt={2.9} />
      </ThreeCanvas>

      {/* OVERLAYS dưới biển */}
      {t >= 2.9 && (
        <AbsoluteFill style={{ alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {beat && (
              <Sequence from={Math.round(beat.from * fps)} layout="none" key={beat.from}>
                <BeatCard beat={beat} />
              </Sequence>
            )}
            {t >= CONFIG.plateRevealAt && t < CONFIG.plateRevealTo && (
              <Pill at={CONFIG.plateRevealAt} text={`${CONFIG.plateTop} • ${CONFIG.plateBottom} = CẢ MỘT CÂU CHUYỆN`} color="#FACC15" fontSize={21} />
            )}
            {t >= CONFIG.storyPill.from && t < CONFIG.storyPill.to && <Pill at={CONFIG.storyPill.from} text={CONFIG.storyPill.text} color="#38BDF8" fontSize={20} />}
            {t >= CONFIG.askPill.from && t < CONFIG.askPill.to && <Pill at={CONFIG.askPill.from} text={CONFIG.askPill.text} color="#FFFFFF" bg="#16A34A" fontSize={24} />}
            {t >= CONFIG.priceAt && (
              <div style={{ position: 'relative', overflow: 'hidden', opacity: priceSlam, transform: `scale(${priceScale})`, background: 'linear-gradient(135deg, #DC2626, #EA580C)', border: '3px solid #FEF08A', borderRadius: 20, padding: '10px 32px', boxShadow: '0 14px 36px rgba(220,38,38,0.55)', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: -20, left: shimmerX, width: 60, height: 160, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.48), transparent)', transform: 'rotate(20deg)' }} />
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 38, fontWeight: 900, color: '#FFFFFF', textShadow: '0 3px 8px rgba(0,0,0,0.45)' }}>{CONFIG.priceText}</div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 19, fontWeight: 800, color: '#FEF08A', marginTop: 2 }}>{CONFIG.priceSub}</div>
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* CAPTIONS */}
      {pages.map((page, i) => {
        if (page.startMs < 2600) return null;
        const next = pages[i + 1] ?? null;
        const s = Math.round((page.startMs / 1000) * fps);
        const e = Math.round(Math.min(next ? (next.startMs / 1000) * fps : durationInFrames, s + (SWITCH_CAPTIONS_EVERY_MS / 1000) * fps + 6));
        if (e - s <= 0) return null;
        return (
          <Sequence key={i} from={s} durationInFrames={e - s}>
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const BeatCard: React.FC<{ beat: Beat }> = ({ beat }) => {
  const frame = useCurrentFrame(); // relative to Sequence start
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 9, stiffness: 260 } });
  const numScale = interpolate(s, [0, 1], [2.2, 1]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: Math.min(1, s * 1.5),
        transform: `translateX(${(1 - s) * 80}px)`,
        backgroundColor: 'rgba(15,23,42,0.92)',
        border: `3px solid ${beat.color}`,
        borderRadius: 22,
        padding: '6px 26px 6px 10px',
        boxShadow: `0 10px 30px ${beat.color}66`,
      }}
    >
      <div
        style={{
          width: 64, height: 64, borderRadius: 16, backgroundColor: beat.color,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: 'system-ui, sans-serif', fontSize: 50, fontWeight: 900, color: '#0F172A',
          transform: `scale(${numScale})`,
        }}
      >
        {beat.big}
      </div>
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: 0.5 }}>{beat.label}</div>
    </div>
  );
};


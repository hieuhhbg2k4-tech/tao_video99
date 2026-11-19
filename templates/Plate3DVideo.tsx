import React, { useMemo } from 'react';
import {
  AbsoluteFill,
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
import rawCaptions from './captions2.json';

const SWITCH_CAPTIONS_EVERY_MS = 1200;

const KEYWORDS = new Set([
  'biển',
  'mệnh',
  'kim',
  '30m',
  '622.66',
  '2',
  '6',
  'phong',
  'thủy',
  'cân',
  'bằng',
  'bền',
  'vững',
  'song',
  'hỷ',
  'tài',
  'lộc',
  'may',
  'mắn',
  'hài',
  'hòa',
  'liên',
  'hệ',
  'tư',
  'vấn',
]);

const isKeyword = (text: string) =>
  KEYWORDS.has(text.trim().toLowerCase());

function createPlateTexture(hl2: boolean, hl6: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 580;
  const ctx = canvas.getContext('2d')!;

  // Nền biển trắng ánh kim
  const grad = ctx.createLinearGradient(0, 0, 1024, 580);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#F1F5F9');
  grad.addColorStop(1, '#E2E8F0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 580);

  // Viền đen trong biển số
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 26;
  ctx.strokeRect(24, 24, 976, 532);

  // Hàng trên: 30M
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 175px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('30M', 512, 185);

  // Hàng dưới: 622.66 (tô màu từng số theo nhịp nói)
  const chars = ['6', '2', '2', '.', '6', '6'];
  const widths = [125, 125, 125, 55, 125, 125];
  const totalW = widths.reduce((a, b) => a + b, 0);
  let curX = (1024 - totalW) / 2;
  ctx.font = '900 205px system-ui, -apple-system, Segoe UI, sans-serif';

  chars.forEach((ch, i) => {
    const cx = curX + widths[i] / 2;
    if (ch === '2' && hl2) {
      ctx.fillStyle = '#D97706';
    } else if (ch === '6' && hl6) {
      ctx.fillStyle = '#16A34A';
    } else {
      ctx.fillStyle = '#0F172A';
    }
    ctx.fillText(ch, cx, 405);
    curX += widths[i];
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const Plate3DMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const hl2 = (t >= 10.7 && t < 15.4) || (t >= 22.2 && t < 29.3);
  const hl6 = (t >= 15.5 && t < 22.1) || (t >= 22.2 && t < 29.3);

  const texture = useMemo(() => createPlateTexture(hl2, hl6), [hl2, hl6]);

  // Xuất hiện đột ngột ở 6.0s
  if (t < 6.0) return null;

  const pFrame = Math.max(0, frame - Math.round(6.0 * fps));
  const enter = spring({
    frame: pFrame,
    fps,
    config: { damping: 12, stiffness: 210 },
  });

  // Bay từ sâu vào + xoay 1 vòng rồi lắc lư 3D nhẹ nhàng
  const zPos = interpolate(enter, [0, 1], [-10, 0]);
  const spinY = interpolate(enter, [0, 1], [Math.PI * 2, 0]);
  const idleYaw = Math.sin(pFrame * 0.045) * 0.18;
  const idlePitch = Math.cos(pFrame * 0.035) * 0.07;

  // Đặt biển số ở vùng 1/3 trên (y = +1.95 trong không gian 3D, scale 0.62 để gọn đẹp)
  const yPos = 1.95 + Math.sin(pFrame * 0.06) * 0.05;

  // Vị trí đèn phản chiếu di chuyển tạo ánh kim
  const lightX = Math.sin(pFrame * 0.07) * 4;

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 8]} intensity={1.1} />
      <pointLight position={[lightX, 4, 4]} intensity={2.2} color="#FDE047" />

      <group
        position={[0, yPos, zPos]}
        rotation={[idlePitch, spinY + idleYaw, 0]}
        scale={enter * 0.62}
      >
        {/* Khung viền vàng kim 3D */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[3.15, 1.82, 0.14]} />
          <meshStandardMaterial
            color="#FACC15"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        {/* Mặt biển số 3D */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[2.98, 1.66, 0.12]} />
          <meshStandardMaterial
            map={texture}
            metalness={0.25}
            roughness={0.28}
          />
        </mesh>

        {/* 2 viên kim cương vàng 3D quay 2 bên biển số */}
        <mesh
          position={[-1.95, 0, 0.1]}
          rotation={[pFrame * 0.06, pFrame * 0.08, 0]}
        >
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color="#FDE047"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>
        <mesh
          position={[1.95, 0, 0.1]}
          rotation={[-pFrame * 0.06, -pFrame * 0.08, 0]}
        >
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color="#4ADE80"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>
      </group>
    </>
  );
};

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = page.startMs + currentTimeMs;

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 240 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 105,
        paddingLeft: 28,
        paddingRight: 28,
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - enter) * 16}px) scale(${0.92 + 0.08 * enter})`,
          opacity: enter,
          backgroundColor: 'rgba(10, 14, 24, 0.85)',
          borderRadius: 20,
          padding: '13px 22px',
          border: '2px solid rgba(250, 204, 21, 0.65)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
          textAlign: 'center',
          lineHeight: 1.32,
          maxWidth: 665,
        }}
      >
        {page.tokens.map((token, idx) => {
          const isActive =
            token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          const hasSpoken = absoluteTimeMs >= token.fromMs;
          const kw = isKeyword(token.text);

          const tokenStartFrame = Math.max(
            0,
            ((token.fromMs - page.startMs) / 1000) * fps
          );
          const wipeProgress =
            kw && hasSpoken
              ? spring({
                  frame: Math.max(0, frame - tokenStartFrame),
                  fps,
                  config: { damping: 200 },
                  durationInFrames: 7,
                })
              : 0;

          return (
            <span
              key={`${token.fromMs}-${idx}`}
              style={{
                position: 'relative',
                display: 'inline-block',
                marginLeft: idx === 0 ? 0 : 7,
                padding: kw ? '0 6px' : '0 2px',
                transform: isActive ? 'scale(1.12)' : 'scale(1)',
              }}
            >
              {kw && hasSpoken && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 2,
                    height: '88%',
                    width: `${wipeProgress * 100}%`,
                    backgroundColor: isActive
                      ? 'rgba(250, 204, 21, 0.94)'
                      : 'rgba(34, 197, 94, 0.35)',
                    borderRadius: 8,
                    zIndex: 0,
                  }}
                />
              )}
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontFamily:
                    'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                  fontSize: kw ? 40 : 35,
                  fontWeight: 900,
                  textTransform: kw ? 'uppercase' : 'none',
                  color:
                    kw && isActive
                      ? '#0F172A'
                      : isActive
                      ? '#FDE047'
                      : kw
                      ? '#86EFAC'
                      : '#FFFFFF',
                  textShadow:
                    kw && isActive
                      ? 'none'
                      : '0 3px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000',
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

const Overlay2D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Ninja flash + slash ở 0..12 frames
  const flashOpacity = interpolate(frame, [0, 2, 10], [0.85, 0.4, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const whipIn = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 11, stiffness: 320 },
  });
  const whipOut = interpolate(frame, [46, 58], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Giải mã số 2 / số 6
  let meaningTitle = '';
  let meaningColor = '#FACC15';
  if (t >= 10.7 && t < 15.5) {
    meaningTitle = 'SỐ 2: CÂN BẰNG • BỀN VỮNG • SONG HỶ';
    meaningColor = '#FACC15';
  } else if (t >= 15.5 && t < 22.2) {
    meaningTitle = 'SỐ 6: TÀI LỘC • MAY MẮN • AN LÀNH';
    meaningColor = '#4ADE80';
  } else if (t >= 22.2 && t < 29.5) {
    meaningTitle = '2 + 6: HÀI HÒA • VỮNG CHẮC • ĐÓN LỘC';
    meaningColor = '#38BDF8';
  }

  // Thẻ Giá / Ưu đãi đóng dấu ở 29.9s
  const showOffer = t >= 29.9;
  const offerFrame = Math.max(0, frame - Math.round(29.9 * fps));
  const offerSlam = spring({
    frame: offerFrame,
    fps,
    config: { damping: 11, stiffness: 240 },
  });
  const offerScale = interpolate(offerSlam, [0, 1], [1.75, 1]);
  const shimmerX = interpolate(offerFrame, [5, 25], [-120, 460], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaSpring = spring({
    frame: Math.max(0, frame - Math.round(34.7 * fps)),
    fps,
    config: { damping: 11, stiffness: 220 },
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', alignItems: 'center' }}>
      {t < 1.0 && (
        <AbsoluteFill
          style={{ backgroundColor: '#FFFFFF', opacity: flashOpacity }}
        />
      )}

      {t < 2.2 && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            opacity: whipIn * whipOut,
            transform: `translateX(${interpolate(whipIn, [0, 1], [650, 0])}px) skewX(${interpolate(whipIn, [0, 0.7, 1], [-22, -8, 0])}deg)`,
            background: 'linear-gradient(90deg, #0F172A, #1E293B)',
            border: '3px solid #FACC15',
            borderRadius: 18,
            padding: '12px 28px',
            boxShadow: '0 12px 32px rgba(250, 204, 21, 0.45)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 28,
            fontWeight: 900,
            color: '#FDE047',
          }}
        >
          ⚡ BIỂN ĐẸP HỢP MỆNH KIM ⚡
        </div>
      )}

      {meaningTitle && (
        <div
          style={{
            position: 'absolute',
            top: 292,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            border: `2px solid ${meaningColor}`,
            borderRadius: 999,
            padding: '8px 22px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 20,
            fontWeight: 900,
            color: meaningColor,
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          {meaningTitle}
        </div>
      )}

      {showOffer && (
        <div
          style={{
            position: 'absolute',
            top: 286,
            overflow: 'hidden',
            opacity: offerSlam,
            transform: `scale(${offerScale})`,
            background: 'linear-gradient(135deg, #DC2626, #EA580C)',
            border: '3px solid #FEF08A',
            borderRadius: 20,
            padding: '10px 32px',
            boxShadow: '0 14px 36px rgba(220, 38, 38, 0.55)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: shimmerX,
              width: 60,
              height: 160,
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.48), transparent)',
              transform: 'rotate(20deg)',
            }}
          />
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 32,
              fontWeight: 900,
              color: '#FFFFFF',
              textShadow: '0 3px 8px rgba(0,0,0,0.45)',
            }}
          >
            GIÁ TỐT • SANG TÊN NGAY
          </div>
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 19,
              fontWeight: 800,
              color: '#FEF08A',
              marginTop: 2,
            }}
          >
            ✓ HỢP MỆNH KIM • PHONG THỦY ĐẸP
          </div>
        </div>
      )}

      {t >= 34.7 && (
        <div
          style={{
            position: 'absolute',
            top: 386,
            opacity: ctaSpring,
            transform: `translateY(${(1 - ctaSpring) * 20}px) scale(${ctaSpring})`,
            backgroundColor: '#16A34A',
            border: '2px solid #FFFFFF',
            borderRadius: 999,
            padding: '8px 26px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 22,
            fontWeight: 900,
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.5)',
          }}
        >
          LIÊN HỆ TRỰC TIẾP • TƯ VẤN NGAY
        </div>
      )}
    </AbsoluteFill>
  );
};

export const Plate3DVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const captions = rawCaptions as Caption[];

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
    });
  }, [captions]);

  // Dynamic Retention Camera: Ninja snap-zoom + các nhịp zoom nhẹ giữ mắt
  const ninjaSnap = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 320 },
  });
  const ninjaScale = interpolate(ninjaSnap, [0, 1], [1.24, 1]);

  const retentionZoom = interpolate(
    frame,
    [
      5.9 * fps,
      6.3 * fps,
      10.5 * fps,
      11.0 * fps,
      15.4 * fps,
      16.0 * fps,
      29.8 * fps,
      30.3 * fps,
      36.5 * fps,
    ],
    [1, 1.05, 1.01, 1.06, 1.02, 1.06, 1.02, 1.07, 1.02],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill style={{ transform: `scale(${ninjaScale * retentionZoom})` }}>
        <Video
          src={staticFile('source2.mp4')}
          style={{ width: '100%', height: '100%' }}
        />
      </AbsoluteFill>

      {/* Âm thanh SFX đồng bộ theo từng điểm nhấn */}
      <Sequence from={0} durationInFrames={15}>
        <Audio src={staticFile('sfx_whoosh.wav')} volume={0.75} />
      </Sequence>
      <Sequence from={Math.round(6.0 * fps)} durationInFrames={18}>
        <Audio src={staticFile('sfx_slam.wav')} volume={0.8} />
      </Sequence>
      <Sequence from={Math.round(10.7 * fps)} durationInFrames={18}>
        <Audio src={staticFile('sfx_ding.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={Math.round(15.5 * fps)} durationInFrames={18}>
        <Audio src={staticFile('sfx_ding.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={Math.round(29.9 * fps)} durationInFrames={18}>
        <Audio src={staticFile('sfx_slam.wav')} volume={0.8} />
      </Sequence>

      {/* Layer 3D Three.js */}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 7], fov: 45 }}
      >
        <Plate3DMesh />
      </ThreeCanvas>

      <Overlay2D />

      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const endFrame = Math.round(
          Math.min(
            nextPage ? (nextPage.startMs / 1000) * fps : durationInFrames,
            startFrame + (SWITCH_CAPTIONS_EVERY_MS / 1000) * fps + 6
          )
        );
        const duration = endFrame - startFrame;

        if (duration <= 0) {
          return null;
        }

        return (
          <Sequence key={index} from={startFrame} durationInFrames={duration}>
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

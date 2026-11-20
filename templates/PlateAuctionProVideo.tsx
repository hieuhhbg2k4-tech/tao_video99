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

  const grad = ctx.createLinearGradient(0, 0, 1024, 580);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#F1F5F9');
  grad.addColorStop(1, '#E2E8F0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 580);

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 26;
  ctx.strokeRect(24, 24, 976, 532);

  ctx.fillStyle = '#0F172A';
  ctx.font = '900 175px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('30M', 512, 185);

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

/**
 * Khối biển số 3D Three.js viền vàng kim loại + 2 kim cương 3D quay hai bên
 * (xuất hiện từ 2.9s sau khi video mở toàn màn hình).
 */
const Plate3DMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const hl2 = (t >= 10.7 && t < 15.4) || (t >= 22.2 && t < 29.3);
  const hl6 = (t >= 15.5 && t < 22.1) || (t >= 22.2 && t < 29.3);
  const texture = useMemo(() => createPlateTexture(hl2, hl6), [hl2, hl6]);

  if (t < 2.9) return null;

  const pFrame = Math.max(0, frame - Math.round(2.9 * fps));
  const enter = spring({
    frame: pFrame,
    fps,
    config: { damping: 12, stiffness: 210 },
  });

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
        scale={enter * 0.62}
      >
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[3.15, 1.82, 0.14]} />
          <meshStandardMaterial
            color="#FACC15"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[2.98, 1.66, 0.12]} />
          <meshStandardMaterial
            map={texture}
            metalness={0.25}
            roughness={0.28}
          />
        </mesh>

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

/**
 * Khung ảnh TRÚNG ĐẤU GIÁ có lớp biển số 30M / 622.66 đè khít vào ô trắng giữa ảnh
 * (dùng cho đoạn mở đầu Split-Screen).
 */
const AuctionPlateCard: React.FC<{
  plateTop?: string;
  plateBottom?: string;
}> = ({ plateTop = '30M', plateBottom = '622.66' }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1080 / 960',
        borderRadius: 18,
        overflow: 'hidden',
        border: '3px solid #FACC15',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.65)',
      }}
    >
      <Img
        src={staticFile('trung_dau_gia.jpg')}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
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
        }}
      >
        <div
          style={{
            fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
            fontSize: '2.9em',
            fontWeight: 900,
            color: '#0F172A',
            lineHeight: 0.98,
            letterSpacing: 2,
          }}
        >
          {plateTop}
        </div>
        <div
          style={{
            fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
            fontSize: '3.2em',
            fontWeight: 900,
            color: '#0F172A',
            lineHeight: 1.0,
            letterSpacing: 1.5,
          }}
        >
          {plateBottom}
        </div>
      </div>
    </div>
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
        paddingBottom: 100,
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

export const PlateAuctionProVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  const captions = rawCaptions as Caption[];

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
    });
  }, [captions]);

  const introIn = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 260 },
  });
  const expand = spring({
    frame: Math.max(0, frame - Math.round(2.4 * fps)),
    fps,
    config: { damping: 15, stiffness: 140 },
  });

  const vidLeft = interpolate(expand, [0, 1], [274, 0]);
  const vidTop = interpolate(expand, [0, 1], [155, 0]);
  const vidWidth = interpolate(expand, [0, 1], [422, 720]);
  const vidHeight = interpolate(expand, [0, 1], [785, 1280]);
  const vidRadius = interpolate(expand, [0, 1], [22, 0]);
  const vidBorder = interpolate(expand, [0, 1], [3, 0]);

  const introUiOpacity = interpolate(expand, [0, 0.55], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
    <AbsoluteFill
      style={{
        backgroundColor: '#0B0E14',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    >
      {/* Âm thanh SFX */}
      <Sequence from={0} durationInFrames={16}>
        <Audio src={staticFile('sfx_whoosh.wav')} volume={0.8} />
      </Sequence>
      <Sequence from={Math.round(2.4 * fps)} durationInFrames={16}>
        <Audio src={staticFile('sfx_whoosh.wav')} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(2.9 * fps)} durationInFrames={18}>
        <Audio src={staticFile('sfx_slam.wav')} volume={0.7} />
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

      {/* GIAI ĐOẠN MỞ ĐẦU (0.0s - 2.6s): Split-Screen nền lưới tối + TRÚNG ĐẤU GIÁ */}
      {introUiOpacity > 0.01 && (
        <AbsoluteFill style={{ opacity: introUiOpacity, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: 78,
              left: 274,
              width: 422,
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 42,
              fontWeight: 900,
              color: '#FBBF24',
              textShadow: '0 4px 18px rgba(251, 191, 36, 0.45)',
              transform: `scale(${introIn})`,
            }}
          >
            BIỂN VIP MỆNH KIM
          </div>

          <div
            style={{
              position: 'absolute',
              top: 300,
              left: 16,
              width: 220,
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 28,
              fontWeight: 900,
              color: '#FFFFFF',
              transform: `translateX(${(1 - introIn) * -120}px)`,
            }}
          >
            TRÚNG ĐẤU GIÁ
          </div>

          <div
            style={{
              position: 'absolute',
              top: 350,
              left: 16,
              width: 220,
              fontSize: 5.5,
              transform: `translateX(${(1 - introIn) * -140}px) scale(${introIn})`,
            }}
          >
            <AuctionPlateCard />
          </div>

          <div
            style={{
              position: 'absolute',
              top: 505,
              left: 228,
              width: 56,
              height: 56,
              borderRadius: 999,
              backgroundColor: '#111827',
              border: '2.5px solid #FBBF24',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 22,
              fontWeight: 900,
              color: '#FBBF24',
              zIndex: 5,
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
              transform: `scale(${introIn})`,
            }}
          >
            VIP
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 138,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `translateY(${(1 - introIn) * 40}px)`,
            }}
          >
            <div
              style={{
                backgroundColor: '#FBBF24',
                borderRadius: 999,
                padding: '14px 38px',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 32,
                fontWeight: 900,
                color: '#111827',
                boxShadow: '0 10px 30px rgba(251, 191, 36, 0.4)',
              }}
            >
              NHẮN TIN “QUAN TÂM”
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: 'system-ui, sans-serif',
                fontSize: 26,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: 0.5,
              }}
            >
              MÌNH TƯ VẤN BIỂN ĐẸP CHO NHÉ
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* KHUNG VIDEO CHÍNH */}
      <div
        style={{
          position: 'absolute',
          left: vidLeft,
          top: vidTop,
          width: vidWidth,
          height: vidHeight,
          borderRadius: vidRadius,
          overflow: 'hidden',
          border: `${vidBorder}px solid #FBBF24`,
          boxShadow:
            vidBorder > 0.2 ? '0 0 32px rgba(251, 191, 36, 0.35)' : 'none',
        }}
      >
        <Video
          src={staticFile('source2.mp4')}
          style={{ width: '100%', height: '100%' }}
        />

        {introUiOpacity > 0.05 && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              opacity: introUiOpacity,
              backgroundColor: '#FBBF24',
              borderRadius: 999,
              padding: '5px 14px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 18,
              fontWeight: 900,
              color: '#111827',
            }}
          >
            ✦ 30M - 622.66
          </div>
        )}
      </div>

      {/* SAU KHI MỞ TOÀN MÀN HÌNH (2.9s+): Layer Biển số 3D Three.js + kim cương 3D */}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 7], fov: 45 }}
      >
        <Plate3DMesh />
      </ThreeCanvas>

      {/* Overlay giải mã số, thẻ giá + shimmer và CTA */}
      {t >= 2.9 && (
        <AbsoluteFill style={{ pointerEvents: 'none', alignItems: 'center' }}>
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
      )}

      {/* Phụ đề bút dạ quang tiếng Việt */}
      {pages.map((page, index) => {
        if (page.startMs < 2600) return null;
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

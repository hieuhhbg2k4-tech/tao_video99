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
import { createTikTokStyleCaptions } from '@remotion/captions';
import type { Caption, TikTokPage } from '@remotion/captions';
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

/**
 * Khung biển số chuẩn trắng-đen viền vàng (dùng sau đoạn mở đầu).
 */
const ClassicPlateCard: React.FC<{
  hl2?: boolean;
  hl6?: boolean;
  plateTop?: string;
  plateBottom?: string;
}> = ({
  hl2 = false,
  hl6 = false,
  plateTop = '30M',
  plateBottom = '622.66',
}) => {
  const renderDigit = (ch: string, idx: number) => {
    const is2 = ch === '2' && hl2;
    const is6 = ch === '6' && hl6;
    const active = is2 || is6;
    const color = is2 ? '#D97706' : is6 ? '#16A34A' : '#0F172A';

    return (
      <span
        key={idx}
        style={{
          display: 'inline-block',
          color,
          transform: active ? 'scale(1.16) translateY(-2px)' : 'scale(1)',
          textShadow: active ? '0 0 12px rgba(250,204,21,0.55)' : 'none',
        }}
      >
        {ch}
      </span>
    );
  };

  return (
    <div
      style={{
        backgroundColor: '#F8FAFC',
        border: '5px solid #0F172A',
        borderRadius: 18,
        padding: '10px 36px',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55), 0 0 0 3px #FACC15',
        textAlign: 'center',
        minWidth: 320,
      }}
    >
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: 4,
          color: '#0F172A',
          lineHeight: 1.05,
        }}
      >
        {plateTop}
      </div>
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 54,
          fontWeight: 900,
          letterSpacing: 3,
          lineHeight: 1.08,
          marginTop: 2,
        }}
      >
        {plateBottom.split('').map(renderDigit)}
      </div>
    </div>
  );
};

/**
 * Khung ảnh TRÚNG ĐẤU GIÁ có lớp biển số 30M / 622.66 đè khít vào ô trắng giữa ảnh
 * (dùng cho đoạn mở đầu Split-Screen).
 */
const AuctionPlateCard: React.FC<{
  hl2?: boolean;
  hl6?: boolean;
  plateTop?: string;
  plateBottom?: string;
}> = ({
  hl2 = false,
  hl6 = false,
  plateTop = '30M',
  plateBottom = '622.66',
}) => {
  const renderDigit = (ch: string, idx: number) => {
    const is2 = ch === '2' && hl2;
    const is6 = ch === '6' && hl6;
    const active = is2 || is6;
    const color = is2 ? '#D97706' : is6 ? '#16A34A' : '#0F172A';

    return (
      <span
        key={idx}
        style={{
          display: 'inline-block',
          color,
          transform: active ? 'scale(1.14)' : 'scale(1)',
        }}
      >
        {ch}
      </span>
    );
  };

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
      {/* Ô trắng đè khít lên phần biển số gốc trong ảnh để hiển thị động biển mới */}
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
            lineHeight: 1.0,
            letterSpacing: 1.5,
          }}
        >
          {plateBottom.split('').map(renderDigit)}
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
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  const captions = rawCaptions as Caption[];

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
    });
  }, [captions]);

  // Phase 1 (0.0s -> 2.4s): Mở đầu Split-Screen giống video mẫu (nền lưới tối + thẻ Trúng Đấu Giá bên trái + khung Video viền vàng bên phải + CTA dưới)
  // Phase 2 (2.4s -> 3.0s): Khung video mở rộng mượt ra toàn màn hình 720x1280
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

  // Video box geometry: từ [left: 274, top: 155, width: 422, height: 785, radius: 22] -> [0, 0, 720, 1280, 0]
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

  // Thẻ Trúng Đấu Giá đậu phía trên đầu sau khi video mở toàn màn hình (3.0s+)
  const topCardIn = spring({
    frame: Math.max(0, frame - Math.round(2.9 * fps)),
    fps,
    config: { damping: 12, stiffness: 200 },
  });

  const hl2 = (t >= 10.7 && t < 15.4) || (t >= 22.2 && t < 29.3);
  const hl6 = (t >= 15.5 && t < 22.1) || (t >= 22.2 && t < 29.3);

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

  // Thẻ giá / ưu đãi đóng dấu ở 29.9s
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

  // Lắc nhẹ 3D cho thẻ biển trên đầu
  const tiltY = Math.sin(frame * 0.045) * 8;
  const tiltX = Math.cos(frame * 0.035) * 4;

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
      <Sequence from={Math.round(10.7 * fps)} durationInFrames={18}>
        <Audio src={staticFile('sfx_ding.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={Math.round(15.5 * fps)} durationInFrames={18}>
        <Audio src={staticFile('sfx_ding.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={Math.round(29.9 * fps)} durationInFrames={18}>
        <Audio src={staticFile('sfx_slam.wav')} volume={0.8} />
      </Sequence>

      {/* GIAI ĐOẠN MỞ ĐẦU (0.0s - 2.6s) GIỐNG VIDEO MẪU */}
      {introUiOpacity > 0.01 && (
        <AbsoluteFill style={{ opacity: introUiOpacity, pointerEvents: 'none' }}>
          {/* Tiêu đề cột phải */}
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

          {/* Tiêu đề cột trái */}
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

          {/* Ảnh TRÚNG ĐẤU GIÁ cột trái */}
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

          {/* Nút tròn ở giữa */}
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

          {/* CTA lớn ở dưới giống video mẫu */}
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

      {/* KHUNG VIDEO CHÍNH (ban đầu bên phải, sau 2.4s phóng to toàn màn hình) */}
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

        {/* Tag nhỏ góc trên trái trong đoạn mở đầu */}
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

      {/* SAU KHI MỞ TOÀN MÀN HÌNH (3.0s+): Đặt khung biển số cũ sắc nét ở vùng 1/3 trên đầu */}
      {t >= 2.9 && (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            paddingTop: 44,
            pointerEvents: 'none',
            perspective: 900,
          }}
        >
          <div
            style={{
              opacity: topCardIn,
              transform: `scale(${0.7 + 0.3 * topCardIn}) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
            }}
          >
            <ClassicPlateCard hl2={hl2} hl6={hl6} />
          </div>

          {meaningTitle && (
            <div
              style={{
                marginTop: 10,
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                border: `2px solid ${meaningColor}`,
                borderRadius: 999,
                padding: '7px 20px',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 19,
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
                position: 'relative',
                overflow: 'hidden',
                marginTop: 10,
                opacity: offerSlam,
                transform: `scale(${offerScale})`,
                background: 'linear-gradient(135deg, #DC2626, #EA580C)',
                border: '3px solid #FEF08A',
                borderRadius: 18,
                padding: '8px 28px',
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
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  textShadow: '0 3px 8px rgba(0,0,0,0.45)',
                }}
              >
                GIÁ TỐT • SANG TÊN NGAY
              </div>
            </div>
          )}

          {t >= 34.7 && (
            <div
              style={{
                marginTop: 10,
                opacity: ctaSpring,
                transform: `translateY(${(1 - ctaSpring) * 18}px) scale(${ctaSpring})`,
                backgroundColor: '#16A34A',
                border: '2px solid #FFFFFF',
                borderRadius: 999,
                padding: '7px 24px',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 21,
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

      {/* Phụ đề bút dạ quang tiếng Việt (bật từ 2.8s sau khi video mở toàn màn hình) */}
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

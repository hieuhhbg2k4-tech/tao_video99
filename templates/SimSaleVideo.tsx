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
import { Video } from '@remotion/media';
import { createTikTokStyleCaptions } from '@remotion/captions';
import type { Caption, TikTokPage } from '@remotion/captions';
import rawCaptions from './captions.json';

const SWITCH_CAPTIONS_EVERY_MS = 1100;

const KEYWORDS = new Set([
  'sim',
  'tam',
  'hoa',
  '5',
  '8383',
  '36',
  'củ',
  'chính',
  'chủ',
  'chốt',
  'inbox',
  'nét',
]);

const isKeyword = (text: string) =>
  KEYWORDS.has(text.trim().toLowerCase());

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = page.startMs + currentTimeMs;

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 220 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 120,
        paddingLeft: 32,
        paddingRight: 32,
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - enter) * 18}px) scale(${0.92 + 0.08 * enter})`,
          opacity: enter,
          backgroundColor: 'rgba(10, 14, 24, 0.78)',
          borderRadius: 20,
          padding: '14px 24px',
          border: '2px solid rgba(250, 204, 21, 0.55)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
          textAlign: 'center',
          lineHeight: 1.32,
          maxWidth: 660,
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
                  durationInFrames: 8,
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
                      ? 'rgba(250, 204, 21, 0.92)'
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
                  fontSize: kw ? 43 : 38,
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

const NumberChip: React.FC<{
  digits: string;
  tag: string;
  visible: boolean;
  appearFrame: number;
  active: boolean;
  accentColor: string;
}> = ({ digits, tag, visible, appearFrame, active, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!visible) return null;

  const pop = spring({
    frame: Math.max(0, frame - appearFrame),
    fps,
    config: { damping: 9, stiffness: 190 },
  });

  return (
    <div
      style={{
        transform: `translateY(${(1 - pop) * 24}px) scale(${
          pop * (active ? 1.12 : 1)
        })`,
        opacity: pop,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: active
          ? 'rgba(255, 255, 255, 0.14)'
          : 'rgba(255, 255, 255, 0.05)',
        border: `2px solid ${active ? accentColor : 'rgba(255,255,255,0.2)'}`,
        borderRadius: 14,
        padding: '6px 14px',
        boxShadow: active ? `0 0 18px ${accentColor}66` : 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 1,
          color: accentColor,
          marginBottom: 2,
        }}
      >
        {tag}
      </span>
      <span
        style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 38,
          fontWeight: 900,
          letterSpacing: 2,
          color: '#FFFFFF',
        }}
      >
        {digits}
      </span>
    </div>
  );
};

const TopSimCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const introEnter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 200 },
  });
  const introExit = interpolate(frame, [32, 42], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardEnter = spring({
    frame: Math.max(0, frame - 24),
    fps,
    config: { damping: 14, stiffness: 180 },
  });

  const show8383 = t >= 5.0;
  const show36 = t >= 8.0;
  const show555 = t >= 1.4;

  const active8383 = t >= 5.0 && t < 6.4;
  const active36 = t >= 8.0 && t < 9.3;
  const active555 = t >= 1.4 && t < 2.6;

  const showPrice = t >= 10.5;
  const priceFrame = Math.max(0, frame - Math.round(10.5 * fps));
  const priceSlam = spring({
    frame: priceFrame,
    fps,
    config: { damping: 12, stiffness: 220 },
  });
  const priceScale = interpolate(priceSlam, [0, 1], [1.75, 1]);

  const shimmerX = interpolate(priceFrame, [6, 26], [-120, 420], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fullSubtext = '✓ VÀO TÊN CHÍNH CHỦ';
  const typeProgress = Math.floor(
    interpolate(frame, [11.8 * fps, 13.0 * fps], [0, fullSubtext.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const typedSubtext = fullSubtext.slice(0, typeProgress);

  const ctaSpring = spring({
    frame: Math.max(0, frame - Math.round(13.8 * fps)),
    fps,
    config: { damping: 11, stiffness: 210 },
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        paddingTop: 52,
        pointerEvents: 'none',
      }}
    >
      {t < 1.5 && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            opacity: introEnter * introExit,
            transform: `scale(${0.85 + 0.15 * introEnter})`,
            background: 'linear-gradient(90deg, #FACC15, #F97316)',
            borderRadius: 999,
            padding: '10px 28px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 26,
            fontWeight: 900,
            color: '#0F172A',
            boxShadow: '0 8px 28px rgba(250, 204, 21, 0.5)',
          }}
        >
          🔥 LÊN SÓNG SIM ĐẸP GIÁ TỐT 🔥
        </div>
      )}

      {t >= 0.8 && (
        <div
          style={{
            opacity: cardEnter,
            transform: `translateY(${(1 - cardEnter) * -32}px) scale(${
              0.92 + 0.08 * cardEnter
            })`,
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.94))',
            border: '2.5px solid #FACC15',
            borderRadius: 22,
            padding: '12px 20px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
            textAlign: 'center',
            width: 630,
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: 1.5,
              color: '#FDE047',
              marginBottom: 8,
            }}
          >
            ★ SIM TAM HOA 5 • PHONG THỦY ★
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              minHeight: 74,
            }}
          >
            <NumberChip
              digits="8383"
              tag="PHÁT TÀI"
              visible={show8383}
              appearFrame={Math.round(5.0 * fps)}
              active={active8383}
              accentColor="#FACC15"
            />
            <NumberChip
              digits="36"
              tag="TÀI LỘC"
              visible={show36}
              appearFrame={Math.round(8.0 * fps)}
              active={active36}
              accentColor="#4ADE80"
            />
            <NumberChip
              digits="555"
              tag="TAM HOA 5"
              visible={show555}
              appearFrame={Math.round(1.4 * fps)}
              active={active555}
              accentColor="#38BDF8"
            />
          </div>
        </div>
      )}

      {showPrice && (
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            marginTop: 16,
            opacity: priceSlam,
            transform: `scale(${priceScale})`,
            background: 'linear-gradient(135deg, #DC2626, #EA580C)',
            border: '3px solid #FEF08A',
            borderRadius: 22,
            padding: '12px 36px',
            boxShadow: '0 14px 36px rgba(220, 38, 38, 0.55)',
            textAlign: 'center',
            minWidth: 340,
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
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
              transform: 'rotate(20deg)',
            }}
          />
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 52,
              fontWeight: 900,
              color: '#FFFFFF',
              textShadow: '0 3px 8px rgba(0,0,0,0.45)',
              lineHeight: 1.1,
            }}
          >
            CHỈ 5 CỦ
          </div>
          {typedSubtext.length > 0 && (
            <div
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: 22,
                fontWeight: 800,
                color: '#FEF08A',
                marginTop: 4,
              }}
            >
              {typedSubtext}
            </div>
          )}
        </div>
      )}

      {t >= 13.8 && (
        <div
          style={{
            marginTop: 14,
            transform: `translateY(${(1 - ctaSpring) * 20}px) scale(${ctaSpring})`,
            opacity: ctaSpring,
            backgroundColor: '#16A34A',
            border: '2px solid #FFFFFF',
            borderRadius: 999,
            padding: '8px 28px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 24,
            fontWeight: 900,
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.5)',
          }}
        >
          CHỐT NGAY • INBOX MÌNH
        </div>
      )}
    </AbsoluteFill>
  );
};

export const SimSaleVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const captions = rawCaptions as Caption[];

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
    });
  }, [captions]);

  const introZoom = interpolate(frame, [0, 24], [1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const priceZoom = interpolate(
    frame,
    [10.3 * fps, 10.7 * fps, 13.5 * fps, 14.0 * fps],
    [1, 1.05, 1.05, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill style={{ transform: `scale(${introZoom * priceZoom})` }}>
        <Video
          src={staticFile('source.mp4')}
          style={{ width: '100%', height: '100%' }}
        />
      </AbsoluteFill>

      <TopSimCard />

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

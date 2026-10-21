import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Background} from '../components/Background';
import {Grain, Mask, Roll} from '../components/primitives';
import {useFonts} from '../components/useFonts';
import {
  C,
  chipXs,
  clamp01,
  consoleMid,
  easeIn,
  easeInOut,
  easeOut,
  F,
  FPS,
  G,
  INSTRUMENTS,
  LAYERS,
  lerp,
  prog,
  QUERY,
  READ_1,
  READ_2,
  RESILIENCY,
  slabMid,
  slabTop,
  sp,
  stackBottom,
  TARGET,
  TL,
  TRANSPORT,
  W,
} from './lib';

const {s1, s2, s3, s4} = TL;

const POP = {damping: 10, stiffness: 220, mass: 0.7};
const ELASTIC = {damping: 8, stiffness: 200, mass: 0.8};

const P_TOP = consoleMid;
const P_BOT = slabMid(TRANSPORT);
const P_RES = slabMid(RESILIENCY);

/** Where the query/reply packet sits on the rail at time t. */
const packetY = (t: number) => {
  if (t < s2.up) return lerp(P_TOP, P_BOT, prog(t, s2.down, s2.downArrive));
  if (t < s3.send) return lerp(P_BOT, P_TOP, prog(t, s2.up, s2.upArrive));
  if (t < s3.fault + 0.1) return lerp(P_TOP, P_BOT, prog(t, s3.send, s3.fault));
  if (t < s3.retry) return lerp(P_BOT, P_RES, prog(t, s3.catch - 0.16, s3.catch, easeIn));
  if (t < s3.resume) return lerp(P_RES, P_BOT, prog(t, s3.retry, s3.resume - 0.05));
  return lerp(P_BOT, P_TOP, prog(t, s3.resume, s3.arrive));
};

/** Packet presence 0..1: spawns out of the console, is absorbed back into it. */
const packetOn = (frame: number, t: number) => {
  const run = (start: number, end: number) =>
    clamp01(sp(frame, start - 0.05, POP)) * (1 - prog(t, end, end + 0.15, easeIn));
  return t < s3.send - 0.1 ? run(s2.down, s2.upArrive) : run(s3.send, s3.arrive);
};

const Slab: React.FC<{
  i: number;
  enter: number;
  exit: number;
  pass: number;
  glow: number;
  punch: number;
  detail: React.ReactNode;
}> = ({i, enter, exit, pass, glow, punch, detail}) => {
  const L = LAYERS[i];
  const k = clamp01(enter);
  const border = `rgba(240,238,230,${0.1 + 0.22 * pass})`;
  return (
    <div
      style={{
        position: 'absolute',
        left: G.x0,
        top: slabTop(i),
        width: G.w,
        height: G.slabH,
        borderRadius: 18,
        background: C.panel,
        border: `1.5px solid ${glow > 0.01 ? C.coral : border}`,
        boxShadow:
          glow > 0.01
            ? `0 0 ${60 * glow}px rgba(217,119,87,${0.45 * glow}), inset 0 0 0 999px rgba(217,119,87,${0.1 * glow})`
            : '0 18px 40px rgba(0,0,0,0.35)',
        opacity: k * (1 - exit),
        transform: `translateY(${(1 - enter) * 44 + exit * 34}px) scale(${1 + 0.04 * punch})`,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 82,
        paddingRight: 30,
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: '0.2em',
          color: C.muted,
          width: 54,
        }}
      >
        L{i + 1}
      </span>
      <span style={{fontFamily: F.sans, fontSize: 34, fontWeight: 500, color: C.cream, flex: 1}}>
        {L.name}
      </span>
      <span style={{fontFamily: F.mono, fontSize: 19, color: C.muted, textAlign: 'right'}}>
        {detail}
      </span>
    </div>
  );
};

const Center: React.FC<{y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  y,
  children,
  style,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      width: W,
      top: y,
      textAlign: 'center',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

export const AteVideo: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // ---------- scene 1: hook ----------
  const hookOut = (d: number) => prog(t, s1.exit + d, s1.exit + d + 0.45, easeIn);
  const line1K = prog(t, s1.line1 - 0.45, s1.line1 + 0.6, easeOut);
  const line2K = prog(t, s1.line2, s1.line2 + 0.8, easeOut);
  const showHook = t < s1.exit + 0.7;

  // ---------- scene 2/3: stack ----------
  const exitAll = (d: number) => prog(t, s3.exit + d, s3.exit + d + 0.45, easeIn);
  const py = packetY(t);
  const pyPrev = packetY(t - 1 / FPS);
  const on = packetOn(frame, t);
  const dead =
    prog(t, s3.fault, s3.fault + 0.12) * (1 - prog(t, s3.catch - 0.16, s3.catch, easeIn));

  const resGlow =
    clamp01(sp(frame, s3.catch, POP)) * (1 - 0.55 * prog(t, s3.arrive, s3.arrive + 0.8));
  const elastic = sp(frame, s3.catch, ELASTIC);
  const punch = t >= s3.catch ? 1 - elastic : 0;

  const timeoutK = prog(t, s3.fault + 0.05, s3.fault + 0.35, easeOut);
  const okK = prog(t, s3.resume, s3.resume + 0.3, easeOut);
  const retryK = prog(t, s3.retry - 0.1, s3.retry + 0.25, easeOut);
  const ringK = t >= s3.fault && t < s3.catch ? prog(t, s3.fault, s3.catch, easeOut) : 0;

  const detailFor = (i: number): React.ReactNode => {
    const base = LAYERS[i].detail;
    if (i === TRANSPORT)
      return (
        <Roll
          a={base}
          k={timeoutK}
          b={
            <Roll
              a={<span style={{color: C.cream}}>no reply · timeout</span>}
              b={<span style={{color: C.creamDim}}>reply ok</span>}
              k={okK}
            />
          }
        />
      );
    if (i === RESILIENCY)
      return <Roll a={base} b={<span style={{color: C.coral}}>caught · retry 1/3</span>} k={retryK} />;
    return base;
  };

  const railDraw = prog(t, s2.layers[4], s2.layers[4] + 0.7, easeOut);
  const consoleK = sp(frame, s2.typeStart - 0.45, {damping: 15, stiffness: 140});
  const typed = QUERY.slice(0, Math.floor(prog(t, s2.typeStart, s2.typeEnd, (x) => x) * QUERY.length));
  const typing = t >= s2.typeStart && t < s2.typeEnd;
  const caret = typing || t * 2.4 - Math.floor(t * 2.4) < 0.5;

  const read1K = prog(t, s2.upArrive, s2.upArrive + 0.3, easeOut);
  const pollK = prog(t, s3.send, s3.send + 0.25, easeOut);
  const read2K = prog(t, s3.arrive, s3.arrive + 0.3, easeOut);

  const handshake =
    prog(t, s2.downArrive - 0.05, s2.downArrive + 0.1) * (1 - prog(t, s2.up, s2.up + 0.25)) +
    prog(t, s3.resume - 0.35, s3.resume - 0.2) * (1 - prog(t, s3.resume, s3.resume + 0.25));

  const cap2In = prog(t, s2.caption, s2.caption + 0.8, easeOut);
  const cap2Out = prog(t, s3.send - 0.1, s3.send + 0.3, easeIn);
  const cap3In = prog(t, s3.caption, s3.caption + 0.8, easeOut);
  const cap3Out = exitAll(0);

  const showStack = t >= s2.layers[0] - 0.1 && t < s3.exit + 0.8;

  // ---------- scene 4: close ----------
  const end1 = prog(t, s4.line1, s4.line1 + 0.8, easeOut);
  const end2 = prog(t, s4.line2, s4.line2 + 0.8, easeOut);
  const footK = sp(frame, s4.footer, {damping: 14, stiffness: 140});
  const footDot = clamp01(sp(frame, s4.footer + 0.15, POP));

  const capStyle: React.CSSProperties = {
    fontFamily: F.serif,
    fontSize: 64,
    lineHeight: 1,
    letterSpacing: '-0.015em',
    color: C.cream,
  };
  const hookStyle: React.CSSProperties = {
    fontFamily: F.serif,
    fontSize: 124,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: C.cream,
  };

  const stretch = Math.min(46, Math.abs(py - pyPrev) * 2.2);

  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Background t={t} glow={0.18 + 0.7 * resGlow} glowY={(P_RES / 1350) * 100} />

      {showHook && (
        <>
          <Center y={470} style={{opacity: 1 - hookOut(0)}}>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 20,
                letterSpacing: '0.24em',
                color: C.muted,
              }}
            >
              ATE · INSTRUMENT CONTROL
            </span>
          </Center>
          <Center y={560} style={hookStyle}>
            <Mask k={line1K} out={hookOut(0)}>
              Every instrument.
            </Mask>
          </Center>
          <Center y={700} style={hookStyle}>
            <Mask k={line2K} out={hookOut(0.06)}>
              One <span style={{fontStyle: 'italic', color: C.coral}}>stack.</span>
            </Mask>
          </Center>
        </>
      )}

      {showStack && (
        <>
          {/* captions */}
          {t < s3.send + 0.4 && (
            <Center y={G.capY - 32} style={capStyle}>
              <Mask k={cap2In} out={cap2Out}>
                Five layers. One job <span style={{fontStyle: 'italic', color: C.coral}}>each.</span>
              </Mask>
            </Center>
          )}
          {t >= s3.caption - 0.1 && (
            <Center y={G.capY - 32} style={{...capStyle, fontSize: 60}}>
              <Mask k={cap3In} out={cap3Out}>
                Fault absorbed. Test keeps{' '}
                <span style={{fontStyle: 'italic', color: C.coral}}>running.</span>
              </Mask>
            </Center>
          )}

          {/* console */}
          <div
            style={{
              position: 'absolute',
              left: G.x0,
              top: G.consoleY,
              width: G.w,
              height: G.consoleH,
              borderRadius: 32,
              background: C.panelHi,
              border: `1.5px solid ${C.lineHi}`,
              opacity: clamp01(consoleK) * (1 - exitAll(0)),
              transform: `translateY(${(1 - consoleK) * 24 - exitAll(0) * 24}px)`,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 32,
              paddingRight: 30,
              boxSizing: 'border-box',
              fontFamily: F.mono,
              fontSize: 26,
            }}
          >
            <span style={{color: C.muted, marginRight: 18}}>›</span>
            <span style={{color: C.cream}}>{typed}</span>
            <span
              style={{
                width: 13,
                height: 30,
                marginLeft: 3,
                background: C.creamDim,
                opacity: caret && t < s3.send ? 1 : 0,
              }}
            />
            <span style={{flex: 1}} />
            <Roll
              a={<span> </span>}
              k={read1K}
              b={
                <Roll
                  a={<span style={{color: C.coral, fontWeight: 600}}>{READ_1}</span>}
                  k={pollK}
                  b={
                    <Roll
                      a={<span style={{color: C.muted}}>polling…</span>}
                      b={<span style={{color: C.coral, fontWeight: 600}}>{READ_2}</span>}
                      k={read2K}
                    />
                  }
                />
              }
            />
          </div>

          {/* rail: console → stack bottom */}
          <svg
            width={W}
            height={1350}
            style={{position: 'absolute', inset: 0, opacity: 1 - exitAll(0)}}
          >
            <line
              x1={G.railX}
              x2={G.railX}
              y1={stackBottom - 20}
              y2={lerp(stackBottom - 20, G.consoleY + G.consoleH, railDraw)}
              stroke={C.lineHi}
              strokeWidth={2}
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
            {/* instrument connectors: chip tops → transport */}
            {chipXs.map((c, i) => {
              const k = prog(t, s2.chips[i] + 0.1, s2.chips[i] + 0.55, easeOut);
              const y0 = G.chipY;
              const y1 = stackBottom;
              const hot = i === TARGET ? handshake : 0;
              return (
                <line
                  key={i}
                  x1={c.mid}
                  x2={c.mid}
                  y1={y0}
                  y2={lerp(y0, y1, k)}
                  stroke={hot > 0.01 ? C.coral : C.lineHi}
                  strokeOpacity={hot > 0.01 ? 0.4 + 0.6 * hot : 1}
                  strokeWidth={hot > 0.01 ? 3 : 2}
                />
              );
            })}
          </svg>

          {/* layers */}
          {LAYERS.map((_, i) => {
            const pass = on * clamp01(1 - Math.abs(py - slabMid(i)) / 70);
            return (
              <Slab
                key={i}
                i={i}
                enter={sp(frame, s2.layers[i], {damping: 15, stiffness: 160, mass: 0.8})}
                exit={exitAll((LAYERS.length - 1 - i) * 0.04)}
                pass={pass}
                glow={i === RESILIENCY ? resGlow * (1 - exitAll(0.08)) : 0}
                punch={i === RESILIENCY ? punch : 0}
                detail={detailFor(i)}
              />
            );
          })}

          {/* timeout ring at the transport */}
          {ringK > 0 && (
            <div
              style={{
                position: 'absolute',
                left: G.railX - lerp(12, 66, ringK),
                top: P_BOT - lerp(12, 66, ringK),
                width: lerp(24, 132, ringK),
                height: lerp(24, 132, ringK),
                borderRadius: '50%',
                border: `2px solid ${C.creamDim}`,
                opacity: 1 - ringK,
              }}
            />
          )}

          {/* packet */}
          {on > 0.001 && (
            <div
              style={{
                position: 'absolute',
                left: G.railX - 10,
                top: py - 10 - stretch / 2,
                width: 20,
                height: 20 + stretch,
                borderRadius: 10,
                transform: `scale(${on})`,
                background: C.coral,
                boxShadow: `0 0 ${26 * (1 - dead)}px ${C.coral}`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 10,
                  background: C.faint,
                  opacity: dead,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 10,
                  background: C.panelHi,
                  opacity: dead * 0.85,
                }}
              />
            </div>
          )}

          {/* instruments */}
          {INSTRUMENTS.map((name, i) => {
            const k = sp(frame, s2.chips[i], POP);
            const out = exitAll(0.1 + i * 0.03);
            const hot = i === TARGET ? handshake : 0;
            return (
              <div
                key={name}
                style={{
                  position: 'absolute',
                  left: chipXs[i].left,
                  top: G.chipY,
                  width: chipXs[i].w,
                  height: G.chipH,
                  borderRadius: 26,
                  background: C.panel,
                  border: `1.5px solid ${hot > 0.01 ? C.coral : C.lineHi}`,
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: F.mono,
                  fontSize: 20,
                  letterSpacing: '0.12em',
                  color: hot > 0.01 ? C.cream : C.creamDim,
                  opacity: clamp01(k) * (1 - out),
                  transform: `translateY(${(1 - k) * 30 + out * 30}px) scale(${0.85 + 0.15 * k})`,
                }}
              >
                {name}
              </div>
            );
          })}
          <Center
            y={G.chipY + G.chipH + 26}
            style={{
              fontFamily: F.mono,
              fontSize: 16,
              letterSpacing: '0.24em',
              color: C.muted,
              opacity: prog(t, s2.chips[5] + 0.2, s2.chips[5] + 0.7, easeOut) * (1 - exitAll(0.2)),
            }}
          >
            ONE DRIVER LIBRARY
          </Center>
        </>
      )}

      {t >= s4.line1 - 0.1 && (
        <>
          <Center y={540} style={{...hookStyle, fontSize: 96}}>
            <Mask k={end1}>Built like the hardware</Mask>
          </Center>
          <Center y={652} style={{...hookStyle, fontSize: 96}}>
            <Mask k={end2}>
              <span style={{fontStyle: 'italic', color: C.coral}}>it tests.</span>
            </Mask>
          </Center>
          <Center
            y={830}
            style={{
              opacity: clamp01(footK),
              transform: `translateY(${(1 - footK) * 18}px)`,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 16,
                fontFamily: F.mono,
                fontSize: 28,
                color: C.creamDim,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: C.coral,
                  boxShadow: `0 0 18px ${C.coral}`,
                  transform: `scale(${footDot})`,
                }}
              />
              github.com/darkmics16
            </span>
            <div
              style={{
                marginTop: 22,
                fontFamily: F.mono,
                fontSize: 17,
                letterSpacing: '0.24em',
                color: C.muted,
              }}
            >
              PYTHON · SCPI · TKINTER
            </div>
          </Center>
        </>
      )}

      <Grain frame={frame} />
    </AbsoluteFill>
  );
};

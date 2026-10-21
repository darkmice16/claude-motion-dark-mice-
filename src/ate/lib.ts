import timeline from '../../ate.timeline.json';

// Shared easings, springs and palette come from the toolkit; this video only owns its clock and frame.
export {band, C, clamp01, easeIn, easeInOut, easeOut, F, lerp, prog, rand, sp} from '../lib';

export const TL = timeline;
export const FPS = TL.fps;
export const W = 1080;
export const H = 1350;

/** Layer order is bottom-up: index 0 sits on the instruments, index 4 faces the engineer. */
export const LAYERS = [
  {name: 'Transport', detail: 'GPIB · RS232 · USB · LAN'},
  {name: 'SCPI', detail: 'commands · parsing · units'},
  {name: 'Resiliency', detail: 'timeouts · retries · reconnect'},
  {name: 'Coordinator', detail: 'sequencing · threads · state'},
  {name: 'GUI', detail: 'Tkinter · ttk'},
] as const;

export const RESILIENCY = 2;
export const TRANSPORT = 0;

export const INSTRUMENTS = ['CHROMA', 'KIKUSUI', 'ITECH', 'APM', 'DAQ970A', 'ESPEC'] as const;
/** The instrument the query is addressed to. */
export const TARGET = 4;

export const QUERY = 'MEAS:VOLT?';
export const READ_1 = '12.004 V';
export const READ_2 = '12.003 V';

// Geometry (px). Everything hangs off these so a retime or reflow happens in one place.
export const G = {
  x0: 160,
  w: 760,
  capY: 250,
  consoleY: 352,
  consoleH: 64,
  stackTop: 470,
  slabH: 92,
  gap: 16,
  railX: 204,
  chipY: 1060,
  chipH: 52,
  chipGap: 14,
};

export const slabTop = (i: number) => G.stackTop + (LAYERS.length - 1 - i) * (G.slabH + G.gap);
export const slabMid = (i: number) => slabTop(i) + G.slabH / 2;
export const stackBottom = slabTop(0) + G.slabH;
export const consoleMid = G.consoleY + G.consoleH / 2;

/** Monospace chip width: JetBrains Mono advances 0.6em, plus 0.12em tracking and 20px side padding. */
export const chipW = (label: string) => Math.round(label.length * 20 * 0.72 + 40);
export const chipXs = (() => {
  const ws = INSTRUMENTS.map(chipW);
  const total = ws.reduce((a, b) => a + b, 0) + G.chipGap * (ws.length - 1);
  let x = (W - total) / 2;
  return ws.map((w) => {
    const left = x;
    x += w + G.chipGap;
    return {left, w, mid: left + w / 2};
  });
})();

# 02 · ATE stack

18.5 s, 1080×1350 (4:5 feed), 60 fps. A launch clip for a Python ATE instrument control dashboard.

## Message

The dashboard is layered (Transport → SCPI → Resiliency → Coordinator → GUI) so one stack drives every instrument, and a dead instrument does not kill the test.

## Storyboard

| Scene | Beats | What happens |
|---|---|---|
| Hook | `s1` | "Every instrument. One *stack.*" |
| Stack | `s2` | Five layers rise bottom-up, six instrument chips dock into Transport, `MEAS:VOLT?` rides down to the DAQ970A and the reading rides back up. |
| Fault (hero) | `s3` | A second query gets no reply. The packet greys out at Transport, the exception jumps to Resiliency, which lights and catches it (the only impact in the mix), retries, and the fresh reading lands. |
| Close | `s4` | "Built like the hardware *it tests.*" + GitHub handle. |

Accent rule: coral marks the packet, the answer, and the layer that saved the run. Nothing else.

## Files

- `ate.timeline.json`: every beat
- `src/ate/`: composition (`AteVideo`), geometry and copy in `lib.ts`
- `sfx/cues/ate.py`: 62 sounds in D major, mastered to −14 LUFS

## Build

```bash
python3 -m sfx sfx/cues/ate.py
npx remotion render AteVideo out/ate-silent.mp4
ffmpeg -y -i out/ate-silent.mp4 -i public/ate.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest out/ate.mp4
```

## Review notes

First pass found one collision: the closing line began its reveal while the stack was still exiting (14.55 s). Fixed by moving `s4` after the stack clears and extending to 18.5 s so the final hook holds 2.5 s.

"""Sound design for AteVideo. Every time comes from ate.timeline.json.

    python3 -m sfx sfx/cues/ate.py

Key: D major throughout. Pitch climbs with the stack, the fault drops out of key
into a muted low thud, and the catch resolves on the only impact in the mix.
"""

from sfx.synth import blip, chime, click, envelope, impact, pad, pop, riser, whoosh

TIMELINE = "ate.timeline.json"
OUT = "public/ate.wav"
TARGET_LUFS = -14.0

QUERY = "MEAS:VOLT?"

BED_A = [146.83, 220.0, 293.66, 369.99, 554.37]           # Dmaj7(add9)
BED_B = [146.83, 220.0, 293.66, 440.0, 587.33, 739.99]    # D6/9 after the catch
LAYER_NOTES = [293.66, 369.99, 440.0, 587.33, 739.99]     # D F# A D F#, bottom-up
CHIP_NOTES = [880.0, 987.77, 1108.73, 1174.66, 1318.51, 1479.98]

# Chip x positions mapped to pan (-1 left .. +1 right), matches the centered row.
CHIP_PAN = [-0.62, -0.38, -0.14, 0.04, 0.26, 0.52]


def score(mix, tl):
    s1, s2, s3, s4 = tl["s1"], tl["s2"], tl["s3"], tl["s4"]
    dur = tl["duration"]
    put = mix.put

    catch = s3["catch"]
    volume = envelope([
        (0, 0), (1.2, 1), (s3["fault"], 1), (s3["fault"] + 0.2, 0.3),
        (catch + 0.2, 0.3), (catch + 0.8, 1.1), (dur - 1.2, 1.1), (dur, 0),
    ])
    mix.put_stereo(0, *pad(dur, [(0, BED_A), (catch, BED_B)], volume=volume), gain=0.03)

    # scene 1: hook
    put(s1["line1"], whoosh(0.32, 500, 2400, peak=0.45), 0.10, -0.2)
    put(s1["line1"] + 0.14, blip(146.83, dur=0.35, tau=0.09), 0.2)
    put(s1["line2"], whoosh(0.32, 500, 2400, peak=0.45), 0.10, 0.2)
    put(s1["line2"] + 0.14, blip(220.0, dur=0.35, tau=0.09), 0.2)
    put(s1["line2"] + 0.35, chime([587.33, 880.0, 1174.66], dur=1.4, tau=0.5), 0.1)
    put(s1["exit"], whoosh(0.42, 600, 3200, peak=0.4), 0.15)

    # scene 2: layers stack bottom-up, instruments dock, query and reply
    for i, t in enumerate(s2["layers"]):
        put(t, click(1500 + i * 200), 0.2)
        put(t + 0.01, blip(LAYER_NOTES[i], dur=0.45, tau=0.13), 0.15)
    put(s2["caption"], whoosh(0.3, 500, 2400, peak=0.45), 0.08)
    for i, t in enumerate(s2["chips"]):
        put(t, pop(CHIP_NOTES[i], CHIP_NOTES[i] * 0.5), 0.22, CHIP_PAN[i])
    mix.typing(s2["typeStart"], s2["typeEnd"], len(QUERY), gain=(0.14, 0.22), jitter=0.004)
    put(s2["down"], whoosh(s2["downArrive"] - s2["down"], 3200, 600, peak=0.6), 0.14, -0.5)
    put(s2["downArrive"], click(1200), 0.2, 0.3)
    put(s2["downArrive"] + 0.05, blip(1318.51, dur=0.3, tau=0.08), 0.08, 0.3)
    put(s2["up"], whoosh(s2["upArrive"] - s2["up"], 600, 3200, peak=0.6), 0.14, -0.5)
    put(s2["upArrive"], pop(1760, 880), 0.26, 0.5)
    put(s2["upArrive"] + 0.02, blip(880.0, dur=0.5, tau=0.15), 0.12, 0.5)

    # scene 3: fault, catch (the hero), retry, recovery
    put(s3["send"], whoosh(s3["fault"] - s3["send"], 3200, 600, peak=0.6), 0.14, -0.5)
    put(s3["fault"], blip(73.42, dur=0.6, tau=0.2), 0.3)          # dead thud, low D
    put(s3["fault"], click(700, dur=0.06), 0.12, -0.5)
    put(s3["fault"] + 0.15, riser(catch - s3["fault"] - 0.15, 300, 3600), 0.16)
    put(catch - 0.01, impact(), 0.34)
    put(catch, chime([293.66, 440.0, 587.33, 739.99], dur=1.6, tau=0.6), 0.12, -0.2)
    for k in range(3):
        put(s3["retry"] + k * 0.06, click(2200 - k * 300, dur=0.03), 0.12, -0.3)
    put(s3["retry"], whoosh(s3["resume"] - s3["retry"], 2400, 700, peak=0.5), 0.1, -0.5)
    put(s3["resume"], click(1400), 0.16, 0.3)
    put(s3["resume"], whoosh(s3["arrive"] - s3["resume"], 600, 3200, peak=0.6), 0.14, -0.5)
    put(s3["arrive"], pop(1760, 880), 0.28, 0.5)
    put(s3["arrive"] + 0.05, chime([587.33, 880.0, 1174.66, 1479.98], dur=1.6, tau=0.6), 0.14, 0.3)
    put(s3["caption"], whoosh(0.3, 500, 2400, peak=0.45), 0.08)
    put(s3["exit"], whoosh(0.5, 3000, 500, peak=0.45), 0.18)

    # scene 4: close
    for t, note in ((s4["line1"], 146.83), (s4["line2"], 220.0)):
        put(t, whoosh(0.32, 500, 2400, peak=0.45), 0.1)
        put(t + 0.14, blip(note, dur=0.6, tau=0.2), 0.26)
    put(s4["footer"], pop(1174.66, 587.33), 0.14, -0.3)
    put(s4["footer"] + 0.15, chime([293.66, 440.0, 587.33, 739.99, 880.0], dur=2.2, tau=0.9), 0.16)

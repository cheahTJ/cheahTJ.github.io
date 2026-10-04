"""Render a new instrumental arrangement; never distribute the raw samples.

Usage: python render-trumpet.py /path/to/Brass.zip
Samples: https://philharmonia.co.uk/resources/sound-samples/
The traditional public-domain melody is When the Saints Go Marching In,
also used for the Spurs chant. This is not the club's matchday recording.
Requires numpy and macOS afconvert. Output is a locally playable PCM WAV track.
"""
from pathlib import Path
from zipfile import ZipFile
import subprocess, sys, tempfile, wave, shutil
import numpy as np

RATE = 32000
root = Path(__file__).resolve().parents[1]
samples = {}
with tempfile.TemporaryDirectory() as temp, ZipFile(sys.argv[1]) as archive:
    for note in ['As4', 'C5', 'D5', 'Ds5', 'F5', 'G5']:
        source = f'Brass/trumpet/trumpet_{note}_very-long_fortissimo_normal.mp3'
        mp3 = Path(temp) / f'{note}.mp3'
        wav = Path(temp) / f'{note}.wav'
        mp3.write_bytes(archive.read(source))
        subprocess.run(['afconvert', str(mp3), str(wav), '-f', 'WAVE', '-d', f'LEI16@{RATE}'], check=True)
        with wave.open(str(wav)) as f:
            data = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(float)
            data = data.reshape(-1, f.getnchannels()).mean(axis=1) / 32768
        onset = np.flatnonzero(np.abs(data) > .015)[0]
        data = data[max(0, onset - 200):]
        samples[note] = data / max(.01, np.max(np.abs(data)))

# The familiar melody in B-flat, phrased as a solo stadium call.
phrase = [
    ('As4',1),('D5',1),('Ds5',1),('F5',4),(None,1),
    ('As4',1),('D5',1),('Ds5',1),('F5',4),(None,1),
    ('As4',1),('D5',1),('Ds5',1),('F5',2),('D5',2),('As4',2),('D5',2),('C5',4),(None,1),
    ('D5',1),('D5',1),('C5',1),('As4',3),('As4',1),('D5',2),('F5',2),('F5',1),('Ds5',3),
    ('Ds5',1),('D5',1),('Ds5',1),('F5',2),('D5',2),('As4',4),(None,4),
]
beat = 60 / 108
mono = np.zeros(int((sum(d for _,d in phrase)*beat + 3)*RATE))
position = .15
for index, (note, beats) in enumerate(phrase):
    duration = beats * beat
    if note:
        n = int((duration - .055)*RATE)
        signal = samples[note][:n].copy()
        if len(signal) < n:
            # Crossfade a stable part of the recorded sustain for long notes.
            source = samples[note]
            begin, end = int(.22*RATE), min(int(.65*RATE), len(source)-int(.1*RATE))
            loop = source[begin:end]
            overlap = min(int(.025*RATE), len(loop)//4)
            signal = source[:end].copy()
            while len(signal) < n:
                ramp = np.linspace(0,1,overlap)
                signal[-overlap:] = signal[-overlap:]*(1-ramp)+loop[:overlap]*ramp
                signal = np.concatenate((signal,loop[overlap:]))
            signal = signal[:n]
        attack = min(int(.018*RATE), n//4)
        release = min(int(.095*RATE), n//3)
        signal[:attack] *= np.linspace(0,1,attack)
        signal[-release:] *= np.linspace(1,0,release)
        # Breathing and dynamics, with no backing vocals or crowd track.
        signal *= .72 + .06*np.sin(index*1.7)
        start = int(position*RATE)
        mono[start:start+n] += signal
    position += duration

# A restrained stereo stadium tail. The dry trumpet remains prominent.
stereo = np.column_stack((mono, mono))
for channel in range(2):
    for delay, gain in [(0.083,.14),(.147,.10),(.239,.075),(.361,.05),(.527,.035)]:
        offset = int((delay + channel*.013)*RATE)
        stereo[offset:,channel] += mono[:-offset]*gain
stereo *= .84 / max(.01, np.max(np.abs(stereo)))
out = root / 'public/audio/spurs-trumpet.wav'
with tempfile.TemporaryDirectory() as temp:
    wav = Path(temp)/'arrangement.wav'
    with wave.open(str(wav),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE)
        f.writeframes((stereo*32767).astype('<i2').tobytes())
    shutil.copyfile(wav,out)
print(f'{out}: {len(mono)/RATE:.1f} seconds, {out.stat().st_size} bytes')

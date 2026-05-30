# Noise Reactor

A desktop tool that turns an audio file and a static image into a music-reactive visual.

![Noise Reactor](doc/noise_reactor.png)

---

## How it works

Noise Reactor analyzes the audio offline before playback begins. It runs a 2048-point FFT at 60 fps hops and extracts per-frame features — RMS energy, bass / mid / treble band energy, spectral centroid, spectral flux, beat events, and onset events. Those features are packed into a GPU uniform buffer each frame and drive a Vulkan fragment shader that applies effects in real time to the source image.

The timeline scrubber lets you preview any moment of the audio-visual sync before committing to an export. Export pipes raw RGBA frames to ffmpeg via stdin, muxing the original audio into the final MP4.

---

## Effects

All effects are off by default. Enable any combination with the checkboxes in the right panel.

| Effect | What it reacts to |
|---|---|
| **Warp Scale** | Global frequency multiplier for all warp effects — higher values produce finer, more textural distortion |
| **Wave Warp** | Sinusoidal UV distortion driven by bass |
| **Displacement Warp** | Independent X/Y sinusoidal displacement driven by bass |
| **Perlin Warp** | Smooth noise-field distortion driven by mids |
| **Pixelate** | UV quantization — bass pulses the block size |
| **Zoom Pulse** | Radial zoom driven by RMS and beat events |
| **Hue Shift** | Rotates image hue based on spectral centroid |
| **Saturation** | Pumps colour saturation with RMS |
| **Brightness** | Flashes luminance on beats, scales with RMS |
| **Glow** | Multi-sample bloom driven by RMS |
| **Edge Glow** | Sobel edge detection lit by RMS |
| **Vignette** | Edge darkening that pulses with RMS |
| **Chroma Split** | Radial R/B channel separation driven by treble and onsets |
| **Film Grain** | Temporal noise scaled by spectral flux |
| **Glitch** | Row-shift chromatic aberration on beats and onsets |

> **Note:** Glitch and Chroma Split share the texture sampling stage. When both are enabled, Glitch takes priority since it already includes its own channel split.

### Cinematic Zoom

A separate camera-movement effect that runs independently of the audio-reactive effects and the manual pan/zoom controls. It animates purely over the length of the clip — no audio reactivity.

Enable the **Cinematic Zoom** checkbox to reveal two controls:

- **Frame picker** — a grid showing the export frame aspect ratio. Click or drag anywhere inside it to place a crosshair marking the target center point. At the start of the clip the view is exactly where you set it with the mouse; by the end it has smoothly zoomed in and panned so the selected point is centered.
- **Zoom slider** — controls how much magnification is added by the final frame. 0 = pan only (no zoom), 50 = 1.5× zoom, 100 = 2.0× zoom.

The cinematic transform is applied before the interactive pan/zoom, so the two systems remain fully independent and can be used together.

---

## Export

Set the resolution, frame rate, quality, and audio bitrate in the right panel before exporting. Export is available from **File → Export Video…** and produces an H.264 MP4 with AAC audio via ffmpeg.

| Setting | Options |
|---|---|
| Resolution | 720p · 1080p · 2K · 4K · Square 1080 · Portrait 1080 · Vertical 1080×1920 |
| Frame rate | 24 · 30 · 60 fps |
| Quality | High (CRF 18) · Medium (CRF 23) · Low (CRF 28) |
| Audio bitrate | 192k · 128k · 96k |

Effects fade in and out over the first and last 0.5 seconds of the export to mask spectral features produced by zero-padded FFT windows at the audio boundaries.

---

## Prerequisites

### Arch Linux

```bash
sudo pacman -S meson ninja qt6-base vulkan-headers vulkan-icd-loader \
               shaderc libsndfile fftw ffmpeg
```

For NVIDIA GPUs, also install `nvidia-utils`. If the driver was updated recently, reboot before running — a kernel/userspace version mismatch causes Vulkan to silently find no physical device (`nvidia-smi` will report the mismatch).

### Ubuntu / Debian (24.04+)

```bash
sudo apt install meson ninja-build qt6-base-dev qt6-base-private-dev \
                 libvulkan-dev vulkan-tools libsndfile1-dev libfftw3-dev \
                 ffmpeg
```

### Fedora

```bash
sudo dnf install meson ninja-build qt6-qtbase-devel vulkan-headers \
                 vulkan-loader-devel libsndfile-devel fftw-devel ffmpeg
```

---

## Build

```bash
git clone https://github.com/kwehage/noise-reactor.git
cd noise-reactor
meson setup build
meson compile -C build
```

The build compiles GLSL shaders to Qt shader bundles (`.qsb`) and embeds them into the binary as Qt resources. The resulting binary is self-contained and can be copied or installed anywhere without needing any shader files alongside it.

---

## Run

```bash
./build/noise_reactor
```

Load audio and an image via **File → Open Audio / Open Image**, or drag and drop files directly onto the preview. Use the timeline scrubber to preview the sync, then export when ready.

---

## Supported formats

| Type | Formats |
|---|---|
| Audio | WAV · FLAC · MP3 · OGG · AIFF |
| Image | PNG · JPEG · BMP · TIFF |
| Export | MP4 (H.264 + AAC, via ffmpeg) |

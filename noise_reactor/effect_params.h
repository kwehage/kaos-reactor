#pragma once

#include <cstddef>

namespace noise_reactor {

struct EffectParams {
    float zoom_intensity{0.0f};
    float wave_intensity{0.0f};
    float hue_shift_intensity{0.0f};
    float glitch_intensity{0.0f};
    float glow_intensity{0.0f};
    float displacement_intensity{0.0f};
    float perlin_intensity{0.0f};
};

// Mirror of the GLSL std140 UBO in image.frag — layout must match exactly.
struct EffectUBO {
    float rms{0.f};
    float bass{0.f};
    float mid{0.f};
    float treble{0.f};
    float spectral_centroid{0.f};
    float spectral_flux{0.f};
    float time{0.f};
    float beat{0.f};
    float onset{0.f};
    float zoom_intensity{0.f};
    float wave_intensity{0.f};
    float hue_shift_intensity{0.f};
    float glitch_intensity{0.f};
    float glow_intensity{0.f};
    float displacement_intensity{0.f};
    float perlin_intensity{0.f};
};
static_assert(sizeof(EffectUBO) == 64, "EffectUBO size must match GLSL std140 layout");

} // namespace noise_reactor

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
    float warp_scale{1.0f};
    float brightness_intensity{0.0f};
    float saturation_intensity{0.0f};
    float vignette_intensity{0.0f};
    float chromatic_intensity{0.0f};
    float film_grain_intensity{0.0f};
    float pixelate_intensity{0.0f};
    float edge_glow_intensity{0.0f};
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
    float image_ar{1.f};    // source image width / height
    float viewport_ar{1.f}; // export resolution width / height
    float pan_x{0.f};
    float pan_y{0.f};
    float zoom_scale{1.f};
    float warp_scale{1.f};
    float brightness_intensity{0.f};
    float saturation_intensity{0.f};
    float vignette_intensity{0.f};
    float chromatic_intensity{0.f};
    float film_grain_intensity{0.f};
    float pixelate_intensity{0.f};
    float edge_glow_intensity{0.f};
    float cinematic_zoom{1.f};
    float cinematic_pan_x{0.f};
    float cinematic_pan_y{0.f};
};
static_assert(sizeof(EffectUBO) == 128, "EffectUBO size must match GLSL std140 layout");

} // namespace noise_reactor

#version 450

layout(location = 0) in  vec2 frag_uv;
layout(location = 0) out vec4 out_color;

layout(binding = 0) uniform sampler2D u_image;

layout(std140, binding = 1) uniform UBO {
    float rms;
    float bass;
    float mid;
    float treble;
    float spectral_centroid;
    float spectral_flux;
    float time;
    float beat;
    float onset;
    float zoom_intensity;
    float wave_intensity;
    float hue_shift_intensity;
    float glitch_intensity;
    float glow_intensity;
    float displacement_intensity;
    float perlin_intensity;
    float image_ar;
    float viewport_ar;
    float pan_x;
    float pan_y;
    float zoom_scale;
    float warp_scale;
    float brightness_intensity;
    float saturation_intensity;
    float vignette_intensity;
    float chromatic_intensity;
    float film_grain_intensity;
    float pixelate_intensity;
    float edge_glow_intensity;
    float cinematic_zoom;
    float cinematic_pan_x;
    float cinematic_pan_y;
} u;

// ── Colour helpers ────────────────────────────────────────────────────────────

vec3 rgb_to_hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)),
                d / (q.x + 1e-10), q.x);
}

vec3 hsv_to_rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// ── Noise helpers (for perlin warp) ──────────────────────────────────────────

float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p.yx + 19.19);
    return fract(p.x * p.y);
}

float value_noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash21(i),                    hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)),   hash21(i + vec2(1.0, 1.0)), f.x),
        f.y);
}

// ── UV effects ────────────────────────────────────────────────────────────────

vec2 pixelate_uv(vec2 uv) {
    float drive = u.pixelate_intensity * (0.5 + u.bass * 0.5);
    float cells = mix(300.0, 15.0, drive);
    return (floor(uv * cells) + 0.5) / cells;
}

vec2 zoom_pulse(vec2 uv) {
    vec2  c = uv - 0.5;
    float z = 1.0 + u.rms  * u.zoom_intensity * 0.25
                  + u.beat * u.zoom_intensity * 0.06;
    return c / z + 0.5;
}

vec2 wave_warp(vec2 uv) {
    // base_amp keeps the effect visible at any audio level so the slider is
    // clearly audible; audio multiplies on top for reactivity.
    float amp = u.wave_intensity * (0.025 + u.bass * 0.07);
    uv.x += sin(uv.y * 8.0 * u.warp_scale + u.time * 2.0)  * amp;
    uv.y += sin(uv.x * 8.0 * u.warp_scale + u.time * 1.3)  * amp * (0.5 + u.mid * 0.5);
    return uv;
}

vec2 displacement_warp(vec2 uv) {
    float amp = u.displacement_intensity * (0.3 + u.bass * 0.7);
    float dx = sin(uv.y * 12.0 * u.warp_scale + u.time * 1.5) * amp * 0.04;
    float dy = cos(uv.x * 12.0 * u.warp_scale + u.time * 0.9) * amp * 0.04;
    return uv + vec2(dx, dy);
}

vec2 perlin_warp(vec2 uv) {
    float amp = u.perlin_intensity * (0.3 + u.mid * 0.7);
    vec2  t   = vec2(u.time * 0.15);
    float nx  = value_noise(uv * 3.0 * u.warp_scale + t)                    * 2.0 - 1.0;
    float ny  = value_noise(uv * 3.0 * u.warp_scale + t + vec2(5.2, 1.3))   * 2.0 - 1.0;
    return uv + vec2(nx, ny) * amp * 0.06;
}

vec4 apply_chromatic(vec2 uv) {
    float amount = u.chromatic_intensity * (0.3 + u.treble * 0.5 + u.onset * 0.2);
    vec2  dir    = (uv - 0.5) * amount * 0.03;
    float r = texture(u_image, clamp(uv + dir, 0.0, 1.0)).r;
    float g = texture(u_image, clamp(uv,       0.0, 1.0)).g;
    float b = texture(u_image, clamp(uv - dir, 0.0, 1.0)).b;
    float a = texture(u_image, clamp(uv,       0.0, 1.0)).a;
    return vec4(r, g, b, a);
}

// ── Colour effects ────────────────────────────────────────────────────────────

vec3 apply_saturation(vec3 color) {
    float boost = u.saturation_intensity * (0.5 + u.rms * 0.5);
    vec3  hsv   = rgb_to_hsv(color);
    hsv.y = clamp(hsv.y * (1.0 + boost * 2.0), 0.0, 1.0);
    return hsv_to_rgb(hsv);
}

vec3 apply_brightness(vec3 color) {
    float boost = u.brightness_intensity * (0.4 + u.rms * 0.4 + u.beat * 0.2);
    return clamp(color * (1.0 + boost), 0.0, 1.0);
}

vec3 apply_vignette(vec3 color, vec2 uv) {
    float dist     = length(uv - 0.5) * 1.8;
    float strength = u.vignette_intensity * (0.5 + u.rms * 0.5);
    float v        = 1.0 - smoothstep(0.3, 1.2, dist * strength);
    return color * v;
}

vec3 apply_film_grain(vec3 color, vec2 uv) {
    float strength = u.film_grain_intensity * (0.3 + u.spectral_flux * 0.7);
    float t        = floor(u.time * 60.0);
    float grain    = fract(sin(dot(uv + t * 0.001, vec2(127.1, 311.7))) * 43758.5453);
    grain = (grain * 2.0 - 1.0) * strength * 0.12;
    return clamp(color + grain, 0.0, 1.0);
}

vec3 apply_edge_glow(vec3 color, vec2 uv) {
    // Bass and beat drive the kernel radius so edges physically expand on hits.
    float drive    = u.bass * 0.6 + u.beat * 0.3 + u.onset * 0.1;
    float r        = 0.002 + drive * u.edge_glow_intensity * 0.025;
    float strength = u.edge_glow_intensity * drive;
    vec3 tl  = texture(u_image, clamp(uv + vec2(-r, -r), 0.0, 1.0)).rgb;
    vec3 tr  = texture(u_image, clamp(uv + vec2( r, -r), 0.0, 1.0)).rgb;
    vec3 bl  = texture(u_image, clamp(uv + vec2(-r,  r), 0.0, 1.0)).rgb;
    vec3 br  = texture(u_image, clamp(uv + vec2( r,  r), 0.0, 1.0)).rgb;
    vec3 gx  = (tr + br) - (tl + bl);
    vec3 gy  = (bl + br) - (tl + tr);
    vec3 edge = sqrt(gx * gx + gy * gy);
    return min(color + edge * strength * 6.0, vec3(1.0));
}

vec3 hue_shift(vec3 rgb) {
    vec3 hsv  = rgb_to_hsv(rgb);
    hsv.x     = fract(hsv.x + u.spectral_centroid * u.hue_shift_intensity * 0.5);
    return hsv_to_rgb(hsv);
}

vec3 apply_glow(vec3 color, vec2 uv) {
    float strength = u.glow_intensity * (0.4 + u.rms * 0.6);
    float r        = 0.008 * strength;
    vec3  s = vec3(0.0);
    s += texture(u_image, clamp(uv + vec2( r,  0.0), 0.0, 1.0)).rgb;
    s += texture(u_image, clamp(uv + vec2(-r,  0.0), 0.0, 1.0)).rgb;
    s += texture(u_image, clamp(uv + vec2( 0.0,  r), 0.0, 1.0)).rgb;
    s += texture(u_image, clamp(uv + vec2( 0.0, -r), 0.0, 1.0)).rgb;
    vec3 bloom = max(s / 4.0 - 0.4, vec3(0.0));
    return min(color + bloom * strength * 4.0, vec3(1.0));
}

vec4 apply_glitch(vec2 uv) {
    float intensity = u.glitch_intensity * (0.3 + u.beat * 0.4 + u.onset * 0.3);

    float t        = floor(u.time * 12.0) / 12.0;
    float row      = floor(uv.y * 24.0);
    float rand_row = fract(sin(row * 38.5 + t * 73.1) * 4375.85);
    float shift    = (rand_row > (1.0 - intensity * 0.4))
                     ? (rand_row - 0.5) * intensity * 0.15
                     : 0.0;

    float split = intensity * 0.012;
    float rv = texture(u_image, clamp(uv + vec2(shift + split, 0.0), 0.0, 1.0)).r;
    float gv = texture(u_image, clamp(uv + vec2(shift,          0.0), 0.0, 1.0)).g;
    float bv = texture(u_image, clamp(uv + vec2(shift - split, 0.0), 0.0, 1.0)).b;
    float av = texture(u_image, clamp(uv + vec2(shift,          0.0), 0.0, 1.0)).a;
    return vec4(rv, gv, bv, av);
}

// ── Main ──────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = frag_uv;

    // Cover scaling: uniform scale to fill viewport, cropping the overflow.
    if (u.image_ar > u.viewport_ar) {
        float frac = u.viewport_ar / u.image_ar;
        uv.x = (1.0 - frac) * 0.5 + uv.x * frac;
    } else {
        float frac = u.image_ar / u.viewport_ar;
        uv.y = (1.0 - frac) * 0.5 + uv.y * frac;
    }

    // Cinematic zoom toward selected target point (time-animated, song-length).
    // Applied before user controls so user pan/zoom layers on top.
    uv = (uv - 0.5) / u.cinematic_zoom + 0.5;
    uv -= vec2(u.cinematic_pan_x, u.cinematic_pan_y);

    // User pan and zoom.
    uv = (uv - 0.5) / u.zoom_scale + 0.5;
    uv -= vec2(u.pan_x, u.pan_y);

    if (u.zoom_intensity         > 0.0) uv = zoom_pulse(uv);
    if (u.wave_intensity         > 0.0) uv = wave_warp(uv);
    if (u.displacement_intensity > 0.0) uv = displacement_warp(uv);
    if (u.perlin_intensity       > 0.0) uv = perlin_warp(uv);

    uv = clamp(uv, 0.0, 1.0);

    if (u.pixelate_intensity > 0.0) uv = pixelate_uv(uv);

    // Glitch and chromatic both own the texture sample; glitch takes priority.
    vec4 color;
    if (u.glitch_intensity > 0.0)
        color = apply_glitch(uv);
    else if (u.chromatic_intensity > 0.0)
        color = apply_chromatic(uv);
    else
        color = texture(u_image, uv);

    if (u.hue_shift_intensity  > 0.0) color.rgb = hue_shift(color.rgb);
    if (u.saturation_intensity > 0.0) color.rgb = apply_saturation(color.rgb);
    if (u.brightness_intensity > 0.0) color.rgb = apply_brightness(color.rgb);
    if (u.glow_intensity       > 0.0) color.rgb = apply_glow(color.rgb, uv);
    if (u.edge_glow_intensity  > 0.0) color.rgb = apply_edge_glow(color.rgb, uv);
    if (u.vignette_intensity   > 0.0) color.rgb = apply_vignette(color.rgb, uv);
    if (u.film_grain_intensity > 0.0) color.rgb = apply_film_grain(color.rgb, uv);

    out_color = color;
}

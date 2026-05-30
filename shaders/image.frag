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
    uv.x += sin(uv.y * 8.0 + u.time * 2.0)  * amp;
    uv.y += sin(uv.x * 8.0 + u.time * 1.3)  * amp * (0.5 + u.mid * 0.5);
    return uv;
}

vec2 displacement_warp(vec2 uv) {
    float amp = u.displacement_intensity * (0.3 + u.bass * 0.7);
    float dx = sin(uv.y * 12.0 + u.time * 1.5) * amp * 0.04;
    float dy = cos(uv.x * 12.0 + u.time * 0.9) * amp * 0.04;
    return uv + vec2(dx, dy);
}

vec2 perlin_warp(vec2 uv) {
    float amp = u.perlin_intensity * (0.3 + u.mid * 0.7);
    vec2  t   = vec2(u.time * 0.15);
    float nx  = value_noise(uv * 3.0 + t)                    * 2.0 - 1.0;
    float ny  = value_noise(uv * 3.0 + t + vec2(5.2, 1.3))   * 2.0 - 1.0;
    return uv + vec2(nx, ny) * amp * 0.06;
}

// ── Colour effects ────────────────────────────────────────────────────────────

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

    if (u.zoom_intensity         > 0.0) uv = zoom_pulse(uv);
    if (u.wave_intensity         > 0.0) uv = wave_warp(uv);
    if (u.displacement_intensity > 0.0) uv = displacement_warp(uv);
    if (u.perlin_intensity       > 0.0) uv = perlin_warp(uv);

    uv = clamp(uv, 0.0, 1.0);

    vec4 color = (u.glitch_intensity > 0.0)
        ? apply_glitch(uv)
        : texture(u_image, uv);

    if (u.hue_shift_intensity > 0.0) color.rgb = hue_shift(color.rgb);
    if (u.glow_intensity      > 0.0) color.rgb = apply_glow(color.rgb, uv);

    out_color = color;
}

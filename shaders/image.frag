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
    float pad0;
    float pad1;
} u;

// ── Colour space helpers ─────────────────────────────────────────────────────

vec3 rgb_to_hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)),
                d / (q.x + 1e-10),
                q.x);
}

vec3 hsv_to_rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// ── Effects ──────────────────────────────────────────────────────────────────

vec2 zoom_pulse(vec2 uv) {
    vec2 c    = uv - 0.5;
    float z   = 1.0 + u.rms  * u.zoom_intensity * 0.25
                    + u.beat * u.zoom_intensity * 0.06;
    return c / z + 0.5;
}

vec2 wave_warp(vec2 uv) {
    float ax = u.bass * u.wave_intensity * 0.04;
    float ay = u.mid  * u.wave_intensity * 0.04;
    uv.x += sin(uv.y * 10.0 + u.time * 2.0) * ax;
    uv.y += sin(uv.x * 10.0 + u.time * 2.0) * ay;
    return uv;
}

vec3 hue_shift(vec3 rgb) {
    vec3 hsv  = rgb_to_hsv(rgb);
    hsv.x     = fract(hsv.x + u.spectral_centroid * u.hue_shift_intensity * 0.5);
    return hsv_to_rgb(hsv);
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = frag_uv;

    if (u.zoom_intensity > 0.0)  uv = zoom_pulse(uv);
    if (u.wave_intensity > 0.0)  uv = wave_warp(uv);

    uv = clamp(uv, 0.0, 1.0);
    vec4 color = texture(u_image, uv);

    if (u.hue_shift_intensity > 0.0)
        color.rgb = hue_shift(color.rgb);

    out_color = color;
}

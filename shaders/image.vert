#version 450

layout(location = 0) out vec2 frag_uv;

void main() {
    const vec2 pos[6] = vec2[](
        vec2(-1.0, -1.0), vec2( 1.0, -1.0), vec2(-1.0,  1.0),
        vec2(-1.0,  1.0), vec2( 1.0, -1.0), vec2( 1.0,  1.0)
    );
    const vec2 uvs[6] = vec2[](
        vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(0.0, 1.0),
        vec2(0.0, 1.0), vec2(1.0, 0.0), vec2(1.0, 1.0)
    );
    gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
    frag_uv     = uvs[gl_VertexIndex];
}

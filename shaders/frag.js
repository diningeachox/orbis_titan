shaders.frag = `
void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
`;

shaders.sprite = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D tex;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_ratio;


void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 coord = vec2(uv.x, -1.0f * uv.y + 0.5f);

    gl_FragColor = texture2D(tex, uv) * vec4(1.0, 1.0, 1.0, 1.0);
}
`;

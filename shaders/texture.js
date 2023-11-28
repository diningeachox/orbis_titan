
export const plain_vs = `
precision highp float;
attribute vec3 position;
attribute vec2 texcoord;
attribute vec3 color;
attribute vec3 normal;
uniform mat4 Pmatrix;
uniform mat4 Vmatrix;
uniform mat4 Mmatrix;
uniform mat4 Nmatrix;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 fragPos;
varying vec2 v_texcoord;

void main(void) {
    gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
    vColor = color;
    vNormal = (Nmatrix * vec4(normal, 1.)).xyz;
    fragPos = (Mmatrix * vec4(position, 1.)).xyz;
    v_texcoord = texcoord;
}
`;

export const plain_fs = `
precision highp float;
uniform float intensity;
uniform vec3 light;
uniform vec3 viewPos;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 fragPos;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform int u_pixel;
uniform float has_ambient;

void main(void) {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(light - fragPos);

    float width = 1.0 / 32.0;
    vec2 sample = vec2(floor(v_texcoord.x / width) * width, floor(v_texcoord.y / width) * width);

    vec4 pixel = texture2D(u_texture, v_texcoord);
    vec3 map = vec3(pixel);
    if (u_pixel > 0){
        pixel = texture2D(u_texture, sample);
        map = vec3(1.0, 1.0, 1.0);
    }

    float gate = 1.0;
    if (pixel.a < 0.3){
        gate = 0.0;
    } else {
        gate = 1.0;
    }

    vec3 ambient = vColor * 0.5 * has_ambient + vec3(pixel * (1.0 - has_ambient));

    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vColor * diff * map;


    vec3 viewDir = normalize(viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(1.0, 1.0, 1.0) * spec * map;
    if (has_ambient == 0.0) {
        diffuse *= 0.0;
        specular *= 0.0;
    }
    gl_FragColor = vec4((ambient + diffuse + specular) * min(1.0, intensity), gate);
}
`;

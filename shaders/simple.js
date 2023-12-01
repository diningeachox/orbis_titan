
export const simple_vs = `
precision highp float;
attribute vec3 position;
attribute vec3 color;
attribute vec3 normal;
uniform mat4 Pmatrix;
uniform mat4 Vmatrix;
uniform mat4 Mmatrix;
uniform mat4 Nmatrix;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 fragPos;

void main(void) {
    gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
    vColor = color;
    vNormal = (Nmatrix * vec4(normal, 1.)).xyz;
    fragPos = (Mmatrix * vec4(position, 1.)).xyz;
}
`;



export const simple_fs = `
precision highp float;
uniform vec3 light;
uniform vec3 viewPos;
uniform float alpha;

varying vec3 vColor;
varying vec3 vNormal;
varying vec3 fragPos;


void main(void) {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(light - fragPos);

    vec3 ambient = vColor;

    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = vec3(1.0, 1.0, 1.0) * diff;

    vec3 viewDir = normalize(viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(1.0, 1.0, 1.0) * spec;

    gl_FragColor = vec4(ambient, alpha);
}
`;

export const more_simple_vs = `
precision highp float;
attribute vec2 position;
attribute vec3 color;
uniform mat4 Pmatrix;
uniform mat4 Vmatrix;
uniform mat4 Mmatrix;
varying vec3 vColor;

void main(void) {
    gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 0., 1.);
    vColor = color;
}
`;

export const more_simple_fs = `
precision highp float;
uniform float alpha;
varying vec3 vColor;

void main(void) {
    gl_FragColor = vec4(vColor, alpha);
}
`;

const gl_camera = {
  camera:[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
  px:2,
  py:8,
  pz:2,
  elev:90,
  ang:0,
  roll:90
}

class GL_Renderer {
    constructor(canv){
        this.gl = canv.getContext('webgl2');
        if (!this.gl) {
            console.log("failed to load WebGL");
        }
        this.textures = {};
        this.shaders = {};
        this.camera = gl_camera;
    }

    initShader(name, vs, fs){
        //vertex shader
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vs);
        gl.compileShader(vertShader);

        //fragment shader
        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fs);
        gl.compileShader(fragShader);

        //shader program
        var prog = gl.createProgram();
        gl.attachShader(prog, vertShader);
        gl.attachShader(prog, fragShader);
        gl.linkProgram(prog);
        shaders[name] = prog;
    }

    updateCamera(dt){
        
    }

    render(game){

    }
}

var gl_canvas = document.getElementById('gl');
gl = gl_canvas.getContext('webgl2');

if (!gl) {
    console.log("failed to load WebGL");
}


function degToRad(d) {
    return d * Math.PI / 180;
}

var texcoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(plane_texcoord), gl.STATIC_DRAW);

var vertex_buffer = gl.createBuffer ();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

var color_buffer = gl.createBuffer ();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);

var normal_buffer = gl.createBuffer ();
gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);

var index_buffer = gl.createBuffer ();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);

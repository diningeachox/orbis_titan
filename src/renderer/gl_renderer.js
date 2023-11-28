import {marble_fs, marble_vs} from "../../shaders.texture.js";

//Utility functions
function degToRad(d) {
    return d * Math.PI / 180;
}


/*==================== PROJECTION MATRIX ====================== */
function get_projection(angle, a, zMin, zMax) {
   var ang = Math.tan((angle*.5)*Math.PI/180);
   return [
      0.5/ang, 0 , 0, 0,
      0, 0.5*a/ang, 0, 0,
      0, 0, -(zMax+zMin)/(zMax-zMin), -1,
      0, 0, (-2*zMax*zMin)/(zMax-zMin), 0
    ];
}

// Camera
export const gl_camera = {
  camera:[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
  px:2,
  py:8,
  pz:2,
  elev:90,
  ang:0,
  roll:90
};

//Transformation matrices
var proj_matrix = get_projection(40, gl_canvas.width/gl_canvas.height, 1, 2000);
var mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
var view_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
var n_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
var skybox_view_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];

export class GL_Renderer {
    constructor(canv){
        this.canv = canv;
        this.gl = canv.getContext('webgl2');
        if (!this.gl) {
            console.log("failed to load WebGL");
        }
        this.textures = {};
        this.shaders = {};
        this.camera = gl_camera;

        this.setupObjects(); //Buffers
        this.initShader("plain", plain_vs, plain_fs); //Shaders
        this.setupUniforms();
    }

    initShader(name, vs, fs){
        //vertex shader
        var vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertShader, vs);
        this.gl.compileShader(vertShader);

        //fragment shader
        var fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragShader, fs);
        this.gl.compileShader(fragShader);

        //shader program
        var prog = this.gl.createProgram();
        this.gl.attachShader(prog, vertShader);
        this.gl.attachShader(prog, fragShader);
        this.gl.linkProgram(prog);
        this.shaders[name] = prog;
    }

    setupObjects(){
        this.texcoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texcoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_texcoord), this.gl.STATIC_DRAW);

        this.vertex_buffer = this.gl.createBuffer ();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertex_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.DYNAMIC_DRAW);

        var color_buffer = this.gl.createBuffer ();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);

        var normal_buffer = this.gl.createBuffer ();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normal_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.DYNAMIC_DRAW);

        var index_buffer = this.gl.createBuffer ();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.DYNAMIC_DRAW);


    }

    setupUniforms(){
        //Uniforms
        /*======== Uniforms for fragment shader ======*/
        var _light = gl.getUniformLocation(shaders["plain"], "light");
        var _viewPos = gl.getUniformLocation(shaders["plain"], "viewPos");
        var _intensity = gl.getUniformLocation(shaders["plain"], "intensity");
        var _ambient = gl.getUniformLocation(shaders["plain"], "has_ambient");
    }

    updateCamera(dt){

    }

    render(game){

        // WebGL custom settings
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.enable(gl.DEPTH_TEST);
        this.gl.depthFunc(gl.LEQUAL);
        this.gl.depthRange(0.0, 1.0);

        this.gl.clearColor(0.5, 0.5, 0.5, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.viewport(0.0, 0.0, this.canv.width, this.canv.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        
    }
}

// var gl_canvas = document.getElementById('gl');
// gl = gl_canvas.getContext('webgl2');
//
// if (!gl) {
//     console.log("failed to load WebGL");
// }

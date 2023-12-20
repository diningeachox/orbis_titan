import {plain_vs, plain_fs} from "../../shaders/texture.js";
import {simple_vs, simple_fs, more_simple_fs, more_simple_vs, simple_circle_fs} from "../../shaders/simple.js";
import {plane_vert, plane_ind, plane_col, plane_norm, plane_texcoord} from "./constants.js";
import {loadTexture, genTexture} from "./texture_utils.js";
import {translate, rotateX, rotateY, rotateZ, scale, invert, transpose, multiply, mmv} from "./ops.js";
import {MatrixStack} from "./matrixstack.js";

//Utility functions
function degToRad(d) {
    return d * Math.PI / 180;
}

/*==================== PROJECTION MATRIX ====================== */
function get_projection(angle, a, zMin, zMax) {
   var ang = Math.tan((angle*.5)*Math.PI/180);
   return [
      0.5/(ang * a), 0, 0, 0,
      0, 0.5/ang, 0, 0,
      0, 0, -(zMax+zMin)/(zMax-zMin), -1,
      0, 0, -(2*zMax*zMin)/(zMax-zMin), 0
    ];
}


export class GL_Renderer {
    constructor(canv){
        this.canv = canv;
        this.gl = canv.getContext('webgl2', {alpha: false});
        if (!this.gl) {
            console.log("failed to load WebGL");
        }

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.matrixStack = new MatrixStack();
        //this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true); //Flip y coordinate

        this.textures = {};
        this.shaders = {};

        this.setupObjects(); //Buffers
        this.initShader("plain", plain_vs, plain_fs); //Shaders
        this.initShader("simple", simple_vs, simple_fs); //Shaders
        this.initShader("more_simple", more_simple_vs, more_simple_fs); //Shaders
        this.initShader("simple_circle", more_simple_vs, simple_circle_fs); //Shaders
        this.cur_shader = null;
        //this.setupUniforms();

        this.camera = {
          matrix:[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
          px:3.375,
          py:-5.375,
          pz:0.11,
          elev:0,
          ang:0,
          roll:0,
          near:0.01, //Causes problems if near is too small
          far:100
        };
        //this.skybox_view_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
        this.pan_speed = 0.1;

        //Transformation matrices
        this.proj_matrix = get_projection(40, canv.width/canv.height, this.camera.near, this.camera.far);
        this.mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
        this.view_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
        this.n_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];

        this.selected_coords = {x:0, y:0};

    }

    resize(){
        this.proj_matrix = get_projection(40, this.canv.width/this.canv.height, this.camera.near, this.camera.far);
    }

    loadTextures(images){
        for (var key of Object.keys(images)) {
            var tex = this.gl.createTexture();
            console.log(key, images[key])
            loadTexture(this.gl, tex, images[key].src);
            this.textures[key] = tex;
        }
    }

    initShader(name, vs, fs){
        //vertex shader
        var vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertShader, vs);
        this.gl.compileShader(vertShader);
        var message = this.gl.getShaderInfoLog(vertShader);
        if (message.length > 0){
            console.log(message)
        }

        //fragment shader
        var fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragShader, fs);
        this.gl.compileShader(fragShader);

        message = this.gl.getShaderInfoLog(fragShader);
        if (message.length > 0) {
            console.log(message);
        }

        //shader program
        var prog = this.gl.createProgram();
        this.gl.attachShader(prog, vertShader);
        this.gl.attachShader(prog, fragShader);
        this.gl.linkProgram(prog);
        this.shaders[name] = prog;
    }

    setupObjects(){

        //Create VBOs

        //Same for all objects
        this.texcoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_texcoord), this.gl.STATIC_DRAW);

        this.vertex_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_vert), this.gl.STATIC_DRAW);


        this.normal_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_norm), this.gl.STATIC_DRAW);

        this.index_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(plane_ind), this.gl.STATIC_DRAW);

        //Could be different
        this.color_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_col), this.gl.DYNAMIC_DRAW);




    }

    setupUniforms(){
        //Uniforms
        /*======== Uniforms for fragment shader ======*/
        // this._light = this.gl.getUniformLocation(this.shaders["plain"], "light");
        // this._viewPos = this.gl.getUniformLocation(this.shaders["plain"], "viewPos");
        // this._intensity = this.gl.getUniformLocation(this.shaders["plain"], "intensity");
        // this._ambient = this.gl.getUniformLocation(this.shaders["plain"], "has_ambient");
    }

    cursorToScreen(mouseX, mouseY){
        var t = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
        var final = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
        //multiply(t, this.proj_matrix, this.view_matrix);
        //multiply(t, t, this.mo_matrix);
        invert(t, this.view_matrix);
        invert(final, this.proj_matrix);

        //Regularize mouse coords
        var x = (mouseX / this.canv.width) * 2.0 - 1.0;
        var y = 1.0 - (mouseY / this.canv.height) * 2.0;
        var z = 2.0 * ((this.camera.pz - this.camera.near) / (this.camera.far - this.camera.near)) - 1.0;
        var v = [x, y, z, 1.0];
        var eye = [1.0, 1.0, 1.0, 1.0];
        mmv(eye, final, v);
        eye[2] = -1.0;
        eye[3] = 0.0;

        var e = [1.0, 1.0, 1.0, 1.0];
        mmv(e, t, eye);
        ///mmv(e, final, v);
        this.selected_coords.x = e[0] * this.camera.pz + this.camera.px;
        this.selected_coords.y = e[1] * this.camera.pz + this.camera.py;
        // var result = {x:e[0] * this.camera.pz + this.camera.px, y:e[1] * this.camera.pz + this.camera.py};
        //console.log(this.selected_coords);
    }

    updateCamera(dt){
        // x += flags.h * 0.1;
        // y += flags.v * 0.1;
        //
        for (var i = 0; i < 16; i++){
            this.mo_matrix[i] = i % 5 == 0;
            this.view_matrix[i] = i % 5 == 0;
            this.camera.matrix[i] = i % 5 == 0;
        }
        //this.view_matrix[14] = this.view_matrix[14]-56;
        //translate(this.mo_matrix, [x, y, z]);




        translate(this.camera.matrix, [this.camera.px, this.camera.py, this.camera.pz]);
        // rotateX(this.camera.matrix, degToRad(this.camera.elev));
        // rotateZ(this.camera.matrix, degToRad(this.camera.roll));
        // rotateY(this.camera.matrix, degToRad(this.camera.ang));
        invert(this.view_matrix, this.camera.matrix); //View matrix is the inverse of camera matrix

        if (flags["wheel"] != 0){
            this.camera.pz -= flags["wheel"] * dt * 5;
            if (this.camera.pz < 1) this.camera.pz = 1;
            if (this.camera.pz > 80) this.camera.pz = 80;
            flags["wheel"] = 0;
        }

        //Keys
        //Left/Right
        if (flags["h"] != 0) {
            this.camera.px -= dt * this.pan_speed * (flags["h"] == -1 ? 1 : -1) * Math.sqrt(this.camera.pz) / 2;
            //this.camera.ang -= dt * this.pan_speed * (flags["h"] == -1 ? 1 : -1);
        }

        //Up/down keys
        if (flags["v"] != 0) {
            this.camera.py -= dt * this.pan_speed * (flags["v"] == 1 ? 1 : -1) * Math.sqrt(this.camera.pz) / 2;
        }
    }

    render(game){
        // WebGL custom settings


        //this.gl.enable(this.gl.DEPTH_TEST);
        //this.gl.depthFunc(this.gl.LEQUAL);
        //this.gl.depthRange(0.0, 1.0);

        this.gl.viewport(0.0, 0.0, this.canv.width, this.canv.height);
        this.gl.clearColor(0.3, 0.3, 0.3, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Select correct shader
    }

    drawSprite(img_name, x, y, w, h, angle=0, depth=0.05){
        //this.refreshScene();
        this.gl.useProgram(this.shaders["plain"]); //Use the plain shader (for textures)
        this.cur_shader = this.shaders["plain"];
        //Attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        var _position = this.gl.getAttribLocation(this.shaders["plain"], "position");
        this.gl.vertexAttribPointer(_position, 3, this.gl.FLOAT, false,0,0);
        this.gl.enableVertexAttribArray(_position);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        var _color = this.gl.getAttribLocation(this.shaders["plain"], "color");
        this.gl.vertexAttribPointer(_color, 3, this.gl.FLOAT, false,0,0) ;
        this.gl.enableVertexAttribArray(_color);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        var _normal = this.gl.getAttribLocation(this.shaders["plain"], "normal");
        this.gl.vertexAttribPointer(_normal, 3, this.gl.FLOAT, false,0,0) ;
        this.gl.enableVertexAttribArray(_normal);

        //Uniforms
        var textureLocation = this.gl.getUniformLocation(this.shaders["plain"], "u_texture");
        var _pixel = this.gl.getUniformLocation(this.shaders["plain"], "u_pixel");
        var _light = this.gl.getUniformLocation(this.shaders["plain"], "light");
        var _viewPos = this.gl.getUniformLocation(this.shaders["plain"], "viewPos");
        var _intensity = this.gl.getUniformLocation(this.shaders["plain"], "intensity");
        var _ambient = this.gl.getUniformLocation(this.shaders["plain"], "has_ambient");
        //Attributes


        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        var texcoordLocation = this.gl.getAttribLocation(this.shaders["plain"], "texcoord");
        //this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_texcoord), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(texcoordLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(texcoordLocation);

        this.gl.uniform1i(textureLocation, 0);
        this.gl.uniform1i(_pixel, 0);
        this.gl.uniform1f(_ambient, 0.0);

        //Lighting
        this.gl.uniform3fv(_light, [0, 0, -20]);
        this.gl.uniform3fv(_viewPos, [this.camera.px, this.camera.py, this.camera.pz]);
        this.gl.uniform1f(_intensity, 1.0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[img_name]);
        this.mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];

        scale(this.mo_matrix, [w, h, 1]);
        translate(this.mo_matrix, [x, y, depth]);
        rotateZ(this.mo_matrix, angle);
        multiply(this.mo_matrix, this.matrixStack.getCurrentMatrix(), this.mo_matrix);
        this.draw(plane_vert, plane_ind, plane_norm);
        //this.matrixStack.restore();
    }

    drawRect(x, y, w, h, colour, alpha, angle=0, depth=0){
        //this.refreshScene();
        this.gl.useProgram(this.shaders["simple"]); //Use the simple shader (for simple shapes)
        this.cur_shader = this.shaders["simple"];
        //Attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        var _position = this.gl.getAttribLocation(this.shaders["simple"], "position");
        this.gl.vertexAttribPointer(_position, 3, this.gl.FLOAT, false,0,0);
        this.gl.enableVertexAttribArray(_position);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        var _color = this.gl.getAttribLocation(this.shaders["simple"], "color");
        this.gl.vertexAttribPointer(_color, 3, this.gl.FLOAT, false,0,0) ;
        this.gl.enableVertexAttribArray(_color);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        var _normal = this.gl.getAttribLocation(this.shaders["simple"], "normal");
        this.gl.vertexAttribPointer(_normal, 3, this.gl.FLOAT, false,0,0) ;
        this.gl.enableVertexAttribArray(_normal);

        //Uniforms
        var _light = this.gl.getUniformLocation(this.shaders["simple"], "light");
        var _viewPos = this.gl.getUniformLocation(this.shaders["simple"], "viewPos");
        var _alpha = this.gl.getUniformLocation(this.shaders["simple"], "alpha");
        //Attributes

        //Lighting
        this.gl.uniform3fv(_light, [0, 0, 20]);
        this.gl.uniform3fv(_viewPos, [this.camera.px, this.camera.py, this.camera.pz]);
        this.gl.uniform1f(_alpha, alpha);
        this.mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];

        //Multiply with top of the matrixstack
        //this.matrixStack.save();
        //this.matrixStack.translate(x, y, 0);
        //this.matrixStack.rotateZ(angle);




        scale(this.mo_matrix, [w, h, 1]);
        translate(this.mo_matrix, [x, y, depth]);
        rotateZ(this.mo_matrix, angle);
        multiply(this.mo_matrix, this.matrixStack.getCurrentMatrix(), this.mo_matrix);
        this.draw(plane_vert, plane_ind, plane_norm, colour);

        //this.matrixStack.restore();
    }

    drawCircle(x, y, r, colour, alpha, angle=0, depth=0){
        //this.refreshScene();
        this.gl.useProgram(this.shaders["simple_circle"]); //Use the simple shader (for simple shapes)
        this.cur_shader = this.shaders["simple_circle"];
        //Attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        var _position = this.gl.getAttribLocation(this.shaders["simple_circle"], "position");
        this.gl.vertexAttribPointer(_position, 3, this.gl.FLOAT, false,0,0);
        this.gl.enableVertexAttribArray(_position);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        var _color = this.gl.getAttribLocation(this.shaders["simple_circle"], "color");
        this.gl.vertexAttribPointer(_color, 3, this.gl.FLOAT, false,0,0) ;
        this.gl.enableVertexAttribArray(_color);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        var _normal = this.gl.getAttribLocation(this.shaders["simple_circle"], "normal");
        this.gl.vertexAttribPointer(_normal, 3, this.gl.FLOAT, false,0,0) ;
        this.gl.enableVertexAttribArray(_normal);

        //Uniforms
        var _light = this.gl.getUniformLocation(this.shaders["simple_circle"], "light");
        var _viewPos = this.gl.getUniformLocation(this.shaders["simple_circle"], "viewPos");
        var _alpha = this.gl.getUniformLocation(this.shaders["simple_circle"], "alpha");
        //Attributes

        //Lighting
        this.gl.uniform3fv(_light, [0, 0, 20]);
        this.gl.uniform3fv(_viewPos, [this.camera.px, this.camera.py, this.camera.pz]);
        this.gl.uniform1f(_alpha, alpha);
        this.mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];

        //Multiply with top of the matrixstack
        //this.matrixStack.save();
        //this.matrixStack.translate(x, y, 0);
        //this.matrixStack.rotateZ(angle);




        scale(this.mo_matrix, [r, r, 1]);
        translate(this.mo_matrix, [x, y, depth]);
        rotateZ(this.mo_matrix, angle);
        multiply(this.mo_matrix, this.matrixStack.getCurrentMatrix(), this.mo_matrix);
        this.draw(plane_vert, plane_ind, plane_norm, colour);

        //this.matrixStack.restore();
    }

    drawLineStrips(x, y, points, colour, angle=0, depth=0.0){
        this.gl.useProgram(this.shaders["more_simple"]); //Use the simple shader (for simple shapes)
        this.cur_shader = this.shaders["more_simple"];
        //Attributes
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        // this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(points));
        // var _position = this.gl.getAttribLocation(this.shaders["more_simple"], "position");
        // this.gl.vertexAttribPointer(_position, 2, this.gl.FLOAT, false,0,0);
        // this.gl.enableVertexAttribArray(_position);

        //position


        var line_vertex_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, line_vertex_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(points), this.gl.STATIC_DRAW);
        var _position = this.gl.getAttribLocation(this.shaders["more_simple"], "position");
        this.gl.vertexAttribPointer(_position, 2, this.gl.FLOAT, false,0,0);
        this.gl.enableVertexAttribArray(_position);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        var _color = this.gl.getAttribLocation(this.shaders["more_simple"], "color");
        this.gl.vertexAttribPointer(_color, 3, this.gl.FLOAT, false,0,0) ;
        this.gl.enableVertexAttribArray(_color);

        //Uniforms
        var _alpha = this.gl.getUniformLocation(this.shaders["more_simple"], "alpha");
        this.gl.uniform1f(_alpha, 1.0);

        this.mo_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];

        translate(this.mo_matrix, [x, y, depth]);
        rotateZ(this.mo_matrix, angle);
        multiply(this.mo_matrix, this.matrixStack.getCurrentMatrix(), this.mo_matrix);

        var new_c = new Array(~~(points.length / 3)).fill([colour[0], colour[1], colour[2]]).flat();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(new_c));

        //this.gl.useProgram(this.shaders["plain"]);
        //Set uniforms
        var _Pmatrix = this.gl.getUniformLocation(this.cur_shader, "Pmatrix");
        var _Vmatrix = this.gl.getUniformLocation(this.cur_shader, "Vmatrix");
        var _Mmatrix = this.gl.getUniformLocation(this.cur_shader, "Mmatrix");

        this.gl.drawArrays(this.gl.LINES, 0, 2);
    }
    drawCircle(){

    }
    draw(v, i, n, col=[1.0, 1.0, 1.0]){

        this.n_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
        var new_c = new Array(~~(v.length / 3)).fill([col[0], col[1], col[2]]).flat();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(new_c));

        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        // this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(n));

        //this.gl.useProgram(this.shaders["plain"]);
        //Set uniforms
        var _Pmatrix = this.gl.getUniformLocation(this.cur_shader, "Pmatrix");
        var _Vmatrix = this.gl.getUniformLocation(this.cur_shader, "Vmatrix");
        var _Mmatrix = this.gl.getUniformLocation(this.cur_shader, "Mmatrix");
        var _Nmatrix = this.gl.getUniformLocation(this.cur_shader, "Nmatrix");

        //Normal matrix is (Modelview^{-1})^T
        invert(this.n_matrix, this.mo_matrix);
        transpose(this.n_matrix, this.n_matrix);

        this.gl.uniformMatrix4fv(_Pmatrix, false, this.proj_matrix);
        this.gl.uniformMatrix4fv(_Vmatrix, false, this.view_matrix);
        this.gl.uniformMatrix4fv(_Mmatrix, false, this.mo_matrix);
        this.gl.uniformMatrix4fv(_Nmatrix, false, this.n_matrix);

        this.gl.drawElements(this.gl.TRIANGLES, i.length, this.gl.UNSIGNED_SHORT, 0);
    }
}



// var gl_canvas = document.getElementById('gl');
// gl = gl_canvas.getContext('webgl2');
//
// if (!gl) {
//     console.log("failed to load WebGL");
// }

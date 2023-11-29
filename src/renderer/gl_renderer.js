import {plain_vs, plain_fs} from "../../shaders/texture.js";
import {simple_vs, simple_fs} from "../../shaders/simple.js";
import {plane_vert, plane_ind, plane_col, plane_norm, plane_texcoord} from "./constants.js";
import {loadTexture, genTexture} from "./texture_utils.js";

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


        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true); //Flip y coordinate

        this.textures = {};
        this.shaders = {};

        this.setupObjects(); //Buffers
        this.initShader("plain", plain_vs, plain_fs); //Shaders
        this.initShader("simple", simple_vs, simple_fs); //Shaders
        this.cur_shader = null;
        //this.setupUniforms();



        this.camera = {
          matrix:[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
          px:0,
          py:0,
          pz:5,
          elev:0,
          ang:0,
          roll:0,
          near:0.5,
          far:1000
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

    loadTextures(images){
        for (var key of Object.keys(images)) {
            var tex = this.gl.createTexture();
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
        this.texcoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_texcoord), this.gl.STATIC_DRAW);

        this.vertex_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_vert), this.gl.DYNAMIC_DRAW);

        this.color_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_col), this.gl.DYNAMIC_DRAW);

        this.normal_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(plane_norm), this.gl.DYNAMIC_DRAW);

        this.index_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(plane_ind), this.gl.DYNAMIC_DRAW);


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
        // console.log(result);
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
        rotateX(this.camera.matrix, degToRad(this.camera.elev));
        rotateZ(this.camera.matrix, degToRad(this.camera.roll));
        rotateY(this.camera.matrix, degToRad(this.camera.ang));
        invert(this.view_matrix, this.camera.matrix); //View matrix is the inverse of camera matrix

        if (flags["wheel"] != 0){
            this.camera.pz -= flags["wheel"] * dt * 5;
            if (this.camera.pz < 1) this.camera.pz = 1;
            flags["wheel"] = 0;
        }

        //Keys
        //Left/Right
        if (flags["h"] != 0) {
            this.camera.px -= dt * this.pan_speed * (flags["h"] == -1 ? 1 : -1);
            //this.camera.ang -= dt * this.pan_speed * (flags["h"] == -1 ? 1 : -1);
        }

        //Up/down keys
        if (flags["v"] != 0) {
            this.camera.py -= dt * this.pan_speed * (flags["v"] == 1 ? 1 : -1);
        }
    }

    render(game){
        // WebGL custom settings
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        //this.gl.enable(this.gl.DEPTH_TEST);
        //this.gl.depthFunc(this.gl.LEQUAL);
        //this.gl.depthRange(0.0, 1.0);

        this.gl.clearColor(0.5, 0.5, 0.5, 0.0);
        this.gl.clearDepth(1.0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.viewport(0.0, 0.0, this.canv.width, this.canv.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Select correct shader
        // this.drawSprite("appendage_tile", 0, 0, 1, 1);
        // this.drawSprite("appendage_tile", 1, 1, 2, 2);
        // this.drawRect(1, -1, 2, 2, [0.0, 1.0, 0.3], 0.5);
    }

    drawSprite(img_name, x, y, w, h){
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
        translate(this.mo_matrix, [x, y, 0]);
        this.draw(plane_vert, plane_ind, plane_norm);
    }

    drawRect(x, y, w, h, colour, alpha){
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
        scale(this.mo_matrix, [w, h, 1]);
        translate(this.mo_matrix, [x, y, 0]);
        this.draw(plane_vert, plane_ind, plane_norm, colour);
    }
    drawCircle(){

    }
    draw(v, i, n, col=[1.0, 1.0, 1.0]){

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(v));

        this.n_matrix = [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1 ];
        var new_c = new Array(~~(v.length / 3)).fill([col[0], col[1], col[2]]).flat();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.color_buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(new_c));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal_buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(n));

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

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
        this.gl.bufferSubData(this.gl.ELEMENT_ARRAY_BUFFER, 0, new Uint16Array(i));

        this.gl.drawElements(this.gl.TRIANGLES, i.length, this.gl.UNSIGNED_SHORT, 0);
    }
}


//Matrix operations
function translate(t,n){for(var a=0;a<3;a++)t[a]=t[a]+n[a]*t[3],t[4+a]=t[4+a]+n[a]*t[7],t[8+a]=t[8+a]+n[a]*t[11],t[12+a]=t[12+a]+n[a]*t[15]}

function scale(t,n){t[0]*=n[0],t[5]*=n[1],t[10]*=n[2]}

function rotateX(t,n){var a=Math.cos(n),r=Math.sin(n),o=t[1],e=t[5],i=t[9];t[1]=t[1]*a-t[2]*r,t[5]=t[5]*a-t[6]*r,t[9]=t[9]*a-t[10]*r,t[2]=t[2]*a+o*r,t[6]=t[6]*a+e*r,t[10]=t[10]*a+i*r}

function rotateY(t,n){var a=Math.cos(n),r=Math.sin(n),o=t[0],e=t[4],i=t[8];t[0]=a*t[0]+r*t[2],t[4]=a*t[4]+r*t[6],t[8]=a*t[8]+r*t[10],t[2]=a*t[2]-r*o,t[6]=a*t[6]-r*e,t[10]=a*t[10]-r*i}

function rotateZ(t,n){var a=Math.cos(n),r=Math.sin(n),o=t[0],e=t[4],i=t[8];t[0]=a*t[0]+r*t[1],t[4]=a*t[4]+r*t[5],t[8]=a*t[8]+r*t[9],t[1]=a*t[1]-r*o,t[5]=a*t[5]-r*e,t[9]=a*t[9]-r*i}

function invert(t,n){let a=n[0],r=n[1],o=n[2],e=n[3],i=n[4],u=n[5],c=n[6],s=n[7],f=n[8],l=n[9],h=n[10],M=n[11],v=n[12],p=n[13],m=n[14],y=n[15],X=a*u-r*i,Y=a*c-o*i,Z=a*s-e*i,b=r*c-o*u,d=r*s-e*u,g=o*s-e*c,j=f*p-l*v,k=f*m-h*v,q=f*y-M*v,w=l*m-h*p,x=l*y-M*p,z=h*y-M*m,A=X*z-Y*x+Z*w+b*q-d*k+g*j;return A?(A=1/A,t[0]=(u*z-c*x+s*w)*A,t[1]=(o*x-r*z-e*w)*A,t[2]=(p*g-m*d+y*b)*A,t[3]=(h*d-l*g-M*b)*A,t[4]=(c*q-i*z-s*k)*A,t[5]=(a*z-o*q+e*k)*A,t[6]=(m*Z-v*g-y*Y)*A,t[7]=(f*g-h*Z+M*Y)*A,t[8]=(i*x-u*q+s*j)*A,t[9]=(r*q-a*x-e*j)*A,t[10]=(v*d-p*Z+y*X)*A,t[11]=(l*Z-f*d-M*X)*A,t[12]=(u*k-i*w-c*j)*A,t[13]=(a*w-r*k+o*j)*A,t[14]=(p*Y-v*b-m*X)*A,t[15]=(f*b-l*Y+h*X)*A,t):null}

function transpose(t,n){if(t===n){let a=n[1],r=n[2],o=n[3],e=n[6],i=n[7],u=n[11];t[1]=n[4],t[2]=n[8],t[3]=n[12],t[4]=a,t[6]=n[9],t[7]=n[13],t[8]=r,t[9]=e,t[11]=n[14],t[12]=o,t[13]=i,t[14]=u}else t[0]=n[0],t[1]=n[4],t[2]=n[8],t[3]=n[12],t[4]=n[1],t[5]=n[5],t[6]=n[9],t[7]=n[13],t[8]=n[2],t[9]=n[6],t[10]=n[10],t[11]=n[14],t[12]=n[3],t[13]=n[7],t[14]=n[11],t[15]=n[15];return t}

function multiply(t,n,a){let r=n[0],o=n[1],e=n[2],i=n[3],u=n[4],c=n[5],s=n[6],f=n[7],l=n[8],h=n[9],M=n[10],v=n[11],p=n[12],m=n[13],y=n[14],X=n[15],Y=a[0],Z=a[1],b=a[2],d=a[3];return t[0]=Y*r+Z*u+b*l+d*p,t[1]=Y*o+Z*c+b*h+d*m,t[2]=Y*e+Z*s+b*M+d*y,t[3]=Y*i+Z*f+b*v+d*X,Y=a[4],Z=a[5],b=a[6],d=a[7],t[4]=Y*r+Z*u+b*l+d*p,t[5]=Y*o+Z*c+b*h+d*m,t[6]=Y*e+Z*s+b*M+d*y,t[7]=Y*i+Z*f+b*v+d*X,Y=a[8],Z=a[9],b=a[10],d=a[11],t[8]=Y*r+Z*u+b*l+d*p,t[9]=Y*o+Z*c+b*h+d*m,t[10]=Y*e+Z*s+b*M+d*y,t[11]=Y*i+Z*f+b*v+d*X,Y=a[12],Z=a[13],b=a[14],d=a[15],t[12]=Y*r+Z*u+b*l+d*p,t[13]=Y*o+Z*c+b*h+d*m,t[14]=Y*e+Z*s+b*M+d*y,t[15]=Y*i+Z*f+b*v+d*X,t}

//Matrix multiplied by vector
function mmv(e, M, v){
    e[0] = M[0] * v[0] + M[4] * v[1] + M[8] * v[2] + M[12] * v[3];
    e[1] = M[1] * v[0] + M[5] * v[1] + M[9] * v[2] + M[13] * v[3];
    e[2] = M[2] * v[0] + M[6] * v[1] + M[10] * v[2] + M[14] * v[3];
    e[3] = M[3] * v[0] + M[7] * v[1] + M[11] * v[2] + M[15] * v[3];
}
// var gl_canvas = document.getElementById('gl');
// gl = gl_canvas.getContext('webgl2');
//
// if (!gl) {
//     console.log("failed to load WebGL");
// }

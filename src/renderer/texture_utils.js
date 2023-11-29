function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}
function makeTexture(gl, texture, data, c, repeat=false){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, data);
    if (isPowerOf2(c.width) && isPowerOf2(c.height)) {
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
         if (repeat){
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
         } else {
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         }
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
}

export function loadTexture(gl, texture, path){
    var image = new Image();
    image.src = path;
    image.addEventListener('load', function() {
        makeTexture(gl, texture, image, image);
    });
}

export function genTexture(gl, texture, draw_func, params=null){
    var c = document.createElement('canvas');
    if( c.getContext) {
        c.width = 108;
        c.height = 32;
        ctx = c.getContext("2d");
        draw_func(c, ctx, params);
        d = ctx.getImageData(0, 0, c.width, c.height);
        makeTexture(gl, texture, d, c);
    }
}

function drawtextbox(c, ctx, text){
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "white";
    ctx.fillRect(3, 3, c.width - 6, c.height - 6);
    ctx.font="14px Georgia";
    ctx.fillStyle = "black";
    ctx.fillText(text, 0, c.height / 2);
}

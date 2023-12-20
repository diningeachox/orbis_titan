/**
Useful data strutures
**/

export function Stack(){
    this.data = new Array(0);
    this.len = 0;
}
Stack.prototype.isEmpty = function(){
    return (this.len == 0);
}
Stack.prototype.pop = function(){
    if (this.data.length > 0){
        this.len -= 1;
        return this.data.splice(this.data.length - 1, this.data.length)[0];
    }
    throw "Trying to pop an empty stack!"
}
Stack.prototype.enqueue = function(item){
    this.data.push(item);
    this.len += 1;
}
Stack.prototype.top = function(){
    if (this.len > 0){
        return this.data[0];
    }
    throw "Stack is empty!"
}

Stack.prototype.size = function(){
    return this.len;
}

export function Queue(){
    this.data = new Array(0);
    this.len = 0;
}
Queue.prototype.isEmpty = function(){
    return (this.len == 0);
}
Queue.prototype.pop = function(){
    if (this.data.length > 0){
        this.len -= 1;
        return this.data.splice(0, 1)[0];
    }
    throw "Trying to pop an empty queue!"
}
Queue.prototype.enqueue = function(item){
    this.data.push(item);
    this.len += 1;
}
Queue.prototype.top = function(){
    if (this.len > 0){
        return this.data[0];
    }
    throw "Queue is empty!"
}

Queue.prototype.size = function(){
    return this.len;
}

/**
Useful helper functions and data structures for the game
**/

export function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export function copyObject(obj){
    var new_obj = JSON.parse(JSON.stringify(obj));
    var new_id = uuidv4();
    if (new_obj.hasOwnProperty("id")) {
        new_obj.id = new_id;
        images[new_id] = images[obj.id];
    }
    if (new_obj.hasOwnProperty("name")) {
        new_obj.name = new_id;
        images[new_id] = images[obj.name];
    }

    return new_obj;
}

export function isNum(string) {
    return /^[0-9]*$/.test(string);
}

export function worldtoscreen(pos, camera){
    var x = (window.innerWidth / 2) + (camera.zoom * (pos.x - camera.position.x) / ((camera.right - camera.left)) * window.innerWidth);
    var y = (window.innerHeight / 2) - (camera.zoom * (pos.y - camera.position.y) / ((camera.top - camera.bottom)) * window.innerHeight);
    return [x, y];
}

// Converts a #ffffff hex string into an [r,g,b] array
export var h2r = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};

// Inverse of the above
export var r2h = function(rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

export var rgba2dec = function(rgba){
    var dec = rgba.replace(/[^\d,.]/g, '').split(',');
    for (var i = 0; i < dec.length; i++){
        if (i < dec.length - 1) {
            dec[i] = parseInt(dec[i]) / 255;
        } else {
            dec[i] = parseFloat(dec[i]);
        }
    }
    return dec;
}
//Clip value of x in the interval [a, b] inclusive
export function clip(x, a, b){
    return Math.max(Math.min(x, b), a);
}

export function l1_dist(v, w){
    return Math.abs(v.x-w.x) + Math.abs(v.y-w.y);
}

export function l2_dist(v, w){
    return Math.sqrt((v.x-w.x)*(v.x-w.x) + (v.y-w.y)*(v.y-w.y));
}

export function l2_dist_squared(v, w){
    return (v.x-w.x)*(v.x-w.x) + (v.y-w.y)*(v.y-w.y);
}

/* Set difference A \ B */
export function set_difference(A, B){
    let result = [];
    for (var i = 0; i < A.length; i++){
        if (!B.includes(A[i])) result.push(A[i]);
    }
    return result;
}

/* Shuffle an array
from: https://stackoverflow.com/questions/15585216/how-to-randomly-generate-numbers-without-repetition-in-javascript
*/
export function shuffle(o) {
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

export function saveState(state){
    window.localStorage.setItem("saved_game", state);
}

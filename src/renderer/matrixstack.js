import {translate, rotateX, rotateY, rotateZ, rightRotateZ, scale, invert, transpose, multiply, mmv} from "./ops.js";


//Saves the context's current transformation matrix
//Allows webGL context to be used like a 2D canvas
export function MatrixStack() {
  this.stack = [];
  // since the stack is empty this will put an initial matrix in it
  this.restore();
}

// Pops the top of the stack restoring the previously saved matrix
MatrixStack.prototype.restore = function() {
  this.stack.pop();
  // Never let the stack be totally empty
  if (this.stack.length < 1) {
      this.stack[0] = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  }
};

// Pushes a copy of the current matrix on the stack
MatrixStack.prototype.save = function() {
  this.stack.push(this.getCurrentMatrix());
};

// Gets a copy of the current matrix (top of the stack)
MatrixStack.prototype.getCurrentMatrix = function() {
  return this.stack[this.stack.length - 1].slice();
};

// Let's us set the current matrix
MatrixStack.prototype.setCurrentMatrix = function(m) {
  return this.stack[this.stack.length - 1] = m;
};

MatrixStack.prototype.id = function() {
  this.stack[this.stack.length - 1] = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
};

// Translates the current matrix
MatrixStack.prototype.translate = function(x, y, z) {
  var m = this.getCurrentMatrix();
  translate(m, [x, y, z]);
  this.setCurrentMatrix(m);
};

// Rotates the current matrix around Z
MatrixStack.prototype.rotateZ = function(angleInRadians) {
  var m = this.getCurrentMatrix();
  rotateZ(m, angleInRadians);
  this.setCurrentMatrix(m);
};

// Rotates the current matrix around Z
MatrixStack.prototype.rightRotateZ = function(angleInRadians) {
  var m = this.getCurrentMatrix();
  /***
  Multiplying rotation matrices on the right here is necessarily because we
  want the rotations to always be done before the translations,
  which are multiplied from the left
  ***/
  rightRotateZ(m, angleInRadians);
  this.setCurrentMatrix(m);
};

MatrixStack.prototype.rotateZAroundPoint = function(x, y, z, angleInRadians) {
    this.translate(-x, -y, -z);
    this.rotateZ(angleInRadians);
    this.translate(x, y, z);
};

// Scales the current matrix
MatrixStack.prototype.scale = function(x, y, z) {
  var m = this.getCurrentMatrix();
  var temp = m.slice();
  scale(temp, [x, y, z]);
  this.setCurrentMatrix(temp);
};

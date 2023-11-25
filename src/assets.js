import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.135.0/build/three.module.js';

import { OrbitControls } from 'https://cdn.skypack.dev/three@0.135.0/examples/jsm/controls/OrbitControls.js';
import {Cursor} from "./cursor.js";
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

//DOM Elements
export var canvas = document.getElementById('canvas');
export var overlay = document.getElementById('overlay');
export var gl = document.getElementById('gl');
export var c = canvas.getContext("2d");
export var ol = overlay.getContext("2d");
export var name_field = document.getElementById('chip');
export var module_w = document.getElementById('module_width');
export var module_h = document.getElementById('module_height');

// Video object for cutscene and intros (if needed)
/*
export const media = document.querySelector('video');
media.removeAttribute('controls'); //Remove default controls
media.style.visibility = 'hidden';
*/

//Cursor
export var cursor = new Cursor(ol, 0, 0);

//fonts
var dialogFont = new FontFace('dialogFont', 'url(../fonts/Jost-500-Medium.otf)');
dialogFont.load().then(function(font){
  // with canvas, if this is ommited won't work
  document.fonts.add(font);
  console.log('Dialog Font loaded');
});

var gameFont = new FontFace('gameFont', 'url(../fonts/BACKTO1982.TTF)');
gameFont.load().then(function(font){
  // with canvas, if this is ommited won't work
  document.fonts.add(font);
  console.log('Title Font loaded');
});

var buttonFont = new FontFace('buttonFont', 'url(../fonts/RishgularTry-x30DO.ttf)');
buttonFont.load().then(function(font){
  // with canvas, if this is ommited won't work
  document.fonts.add(font);
  console.log('Title Font loaded');
});

var titleFont = new FontFace('titleFont', 'url(../fonts/WarEliteGrungeDemo-lg2J5.ttf)');
titleFont.load().then(function(font){
  // with canvas, if this is ommited won't work
  document.fonts.add(font);
  console.log('Title Font loaded');
});

/** WebGL renderer **/
export const renderer = new THREE.WebGLRenderer({powerPreference: "high-performance",
        alpha: true,
        antialias: true,
        autoClear: true,
        canvas: gl
      });

// renderer.setPixelRatio( window.devicePixelRatio );
renderer.setClearColor(0xDDDDDD, 0);

//Texture loading
const loader = new THREE.TextureLoader();

export const scene = new THREE.Scene();

export var viewPortWidth = 1;
export var viewPortHeight = gl.height / gl.width * viewPortWidth;
export const ortho_camera = new THREE.OrthographicCamera(viewPortWidth / - 2,
            viewPortWidth / 2, viewPortHeight / 2, viewPortHeight / - 2, 0.1, 100);
// export const ortho_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);

ortho_camera.position.set(0, 0, 1);
//ortho_camera.layers.enableAll(); //camera sees all layers by default
scene.add(ortho_camera);

export const clock = new THREE.Clock();

export const camera = new THREE.PerspectiveCamera(70, WIDTH/HEIGHT);
//camera.position.z = 50;
//scene.add(camera);



const light = new THREE.PointLight( 0xffffff, 10, 100 );
light.position.set( 0, 0, 1);
scene.add( light );
const ambientLight = new THREE.AmbientLight(0xffffff, 10);
//scene.add(ambientLight);

export const uniforms = {
    u_time: { type: "f", value: 0.0 },
    u_resolution: { type: "v2v", value: new THREE.Vector2() },
    u_mouse: { type: "v2v", value: new THREE.Vector2() },
    tex: { value: null },
    u_color: {type: "v3v", value: new THREE.Vector3() }
};

// Special effects that go over the whole screen
// export const plane_material = new THREE.ShaderMaterial( {
//     uniforms: uniforms,
//     vertexShader: shaders.vert,
//     fragmentShader: shaders.sprite
// } );

var plane_geometry = new THREE.PlaneBufferGeometry( 1, 1);
export const plane_material = new THREE.MeshStandardMaterial( { map: null} );
plane_material.needsUpdate = true;
export var plane_mesh = new THREE.Mesh( plane_geometry, plane_material );
plane_mesh.position.set( 0, 0, -1);
//scene.add( plane_mesh );


export const sprite_material = new THREE.SpriteMaterial( { map: null } );
export const sprite = new THREE.Sprite( sprite_material );

scene.add( sprite );


//Orbit controls
export const controls = new OrbitControls(ortho_camera, gl );
controls.enableZoom = true;
controls.minZoom = 0.2;
controls.maxZoom = 1.5;
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
}
controls.enableRotate = false;


scene.background = null;

//Read any jsons we may use to store game data
function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(file, rawFile.responseText);
        }
    }
    rawFile.send(null);
}

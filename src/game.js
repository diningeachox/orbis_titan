import * as Scene from './scenes.js';
import * as Assets from './assets.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.135.0/build/three.module.js';

import {Module, Connector, Weapon, Joint, Sink, createModuleImage} from "./gameObjects/module.js";
import {Cell, Router, Grid} from "./gameObjects/cell.js";
import {Shell, Appendage, Torso} from "./gameObjects/appendage.js";
import {Titan} from "./gameObjects/titan.js";
import {Battery} from "./gameObjects/battery.js";

import {Vector2D} from "./vector2D.js";
import {BuildScene} from "./subscenes/build_scene.js";
import {MarketScene} from "./subscenes/market_scene.js";
import {copyObject} from "./utils.js";

import module_data from '../presets/modules.json' assert { type: 'json' };
import weapon_data from '../presets/weapons.json' assert { type: 'json' };
//Variables from assets.js
var canvas = Assets.canvas;
var overlay = Assets.overlay;
var c = Assets.c;
var ol = Assets.ol;

// Game pause toggle
var pause = 0;

//Game frames
var frame_rate = 60;
var MS_PER_UPDATE = 1000 / frame_rate;
var lag = 0;
var prev = Date.now();
var elapsed;

// Game scenes
export var game;
export var game_scene;
export var ins_scene;
export var menu;

//SUbscenes
export var build_scene;
export var market_scene;

export function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    overlay.width = window.innerWidth;
    overlay.height = window.innerHeight;
    gl.width = window.innerWidth;
    gl.height = window.innerHeight;
};

export function init(){
    //Resize canvas and overlay to window
    resize();

    var load_text = document.getElementsByClassName('load_text')[0];
    load_text.innerHTML = "";

    Assets.canvas.style.left = "0px";
    Assets.canvas.style.top = "0px";
    Assets.overlay.style.left = "0px";
    Assets.overlay.style.top = "0px";
    Assets.gl.style.left = "0px";
    Assets.gl.style.top = "0px";

    Assets.uniforms.u_resolution.value.x = Assets.gl.width;
    Assets.uniforms.u_resolution.value.y = Assets.gl.height;

    //Reconfigure camera
    Assets.ortho_camera.left = Assets.viewPortWidth / - 2;
    Assets.ortho_camera.right = Assets.viewPortWidth / 2;
    var h = gl.height / gl.width * Assets.viewPortWidth;
    Assets.ortho_camera.top = h / 2;
    Assets.ortho_camera.bottom = h / -2;
    Assets.ortho_camera.updateProjectionMatrix();
    Assets.renderer.setSize( gl.width, gl.height );


    Assets.sprite.scale.set(1, gl.height / gl.width, 1); //Don't scale the z-component because we are 2D

    //Resize sprite object
    var vFOV = THREE.MathUtils.degToRad( Assets.ortho_camera.fov ); // convert vertical fov to radians

    var height = 2 * Math.tan( vFOV / 2 ) * 10; // visible height

    var width = height * Assets.ortho_camera.aspect;           // visible width
    //Assets.sprite.scale.set(width, height, 1);

    //Draw/Load images of gameobjects

    //Chips

    //Modules
    for (const mod of Object.keys(module_data)){
        createModuleImage(module_data[mod]);
    }

    //Appendages

    sm = new Scene.SceneManager();
    menu = new Scene.Menu();

    sm.cur_scene = menu;
    game = new Game();
    game_scene = new Scene.GameScene(game);
    ins_scene = new Scene.Ins();

    build_scene = new BuildScene();
    market_scene = new MarketScene();



    //Add Event listeners
    //Mouse down
    canvas.addEventListener('click', function(e){
        var rect = canvas.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        //Current scene's Buttons
        sm.cur_scene.handleMouseClick(mouseX, mouseY);
    }, false);

    //Mouse move
    canvas.addEventListener('mousemove', function(e){
        var rect = canvas.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        flags["mousePos"].x = mouseX;
        flags["mousePos"].y = mouseY;

        Assets.cursor.x = mouseX;
        Assets.cursor.y = mouseY;
        //Current scene's Buttons
        sm.cur_scene.handleMouseHover(mouseX, mouseY);
    }, false);

    canvas.addEventListener('mousedown', function(e){
        var rect = canvas.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        //Current scene's Buttons

        //sm.cur_scene.handleMouseDown(mouseX, mouseY);

        flags["left_down"] = 1;

    }, false);

    canvas.addEventListener('mouseup', function(e){
        var rect = canvas.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;
        //sm.cur_scene.handleMouseUp(mouseX, mouseY);
        flags["left_down"] = 0;
    }, false);

    //Key presses
    document.addEventListener('keydown', function(e) {
        if(e.keyCode == 80) { //P key
            if (sm.cur_scene.name === "game") pause = (pause + 1) % 2;
        }
        //Debug only
        else if(e.keyCode == 38) { //up key (raise water level)
            console.log("Up key pressed");
        }
        else if(e.keyCode == 40) { //down key (lower water level)
            console.log("Down key pressed");
        }
    });

    window.requestAnimationFrame(gameLoop);
}

//The game simulation
class Game {
    constructor(){
        this.score = 0;
        this.frame = 0;
        //Assets.SpriteFactory('../sprites/ship1.png', 0);
        //Assets.SpriteFactory('../sprites/ship1.png', 1);

        /***Game screens/modes
            Control: Main menu
              - Schedule
              - Build
              - Resource shopping
              - Battle
            Build: Building mech mode
              - cell building
              - module building
              - appendage building
              - full mech building
              - battery building
            Battle: Fight other mechs

        ***/
        this.screen = "control";

        var m = Module(3, 3);

        m.interface[0].edges = {north: 1, east: 0, south: -1, west: 0};
        m.interface[1].edges = {north: 1, east: 0, south: -1, west: 0};
        m.interface[2].edges = {north: 1, east: 0, south: -1, west: 0};
        m.interface[3].edges = {north: 1, east: 0, south: -1, west: 0};
        m.interface[4].edges = {north: 1, east: 0, south: -1, west: 0};
        m.interface[5].edges = {north: 1, east: 0, south: -1, west: 0};

        m.interface[0].wires = ["|"];
        m.interface[1].wires = ["|"];
        m.interface[2].wires = ["|"];
        m.interface[3].wires = ["|"];
        m.interface[4].wires = ["|"];
        m.interface[5].wires = ["|"];

        m.interface[6].edges = {north: 1, east: -1, south: -1, west: 0};
        m.interface[7].edges = {north: 1, east: 1, south: -1, west: 1};
        m.interface[8].edges = {north: 1, east: 0, south: -1, west: -1};
        m.interface[7].obj = Router({inputs: {south:"aquam"}, pos: new Vector2D(1, 2), orientation: 0});

        m.interface[6].obj = Cell({inputs: {west: "photum", east: "aquam", south: "photum"}, pos: new Vector2D(0, 2), orientation: 0});
        m.interface[8].obj = Cell({inputs: {west: "photum", east: "photum", south: "photum"}, pos: new Vector2D(2, 2), orientation: 0});

        //Game objects
        //var test_module_1 = ModuleFactory();
        var testm = module_data["testm"];
        var testm2 = module_data["testm2"];
        console.log(testm)
        ECS.entities.modules["testm"] = testm;
        ECS.entities.modules["testm2"] = testm2;

        ECS.entities.weapons["gun"] = weapon_data["gun"];
        ECS.entities.weapons["laser"] = weapon_data["laser"];
        ECS.entities.weapons["missile"] = weapon_data["missile"];
        
        this.batteries = [
                          Battery({type: "aquam", pos: {x: 3, y: 6}, rate: 30, quantity: 6}),
                          Battery({type: "aquam", pos: {x: 4, y: 6}, rate: 30, quantity: 6}),
                          Battery({type: "photum", pos: {x: 5, y: 6}, rate: 30, quantity: 6}),
                          Battery({type: "gravitum", pos: {x: 2, y: 5}, rate: 30, quantity: 6}),
                          Battery({type: "aquam", pos: {x: 6, y: 5}, rate: 30, quantity: 6})
                        ];
        var test_connectors = [Connector(testm, "north", testm2, "south")];
        var test_sinks = [Sink(9, 4), Sink(11, 5)];
        var test_joint = Joint(20, 2);
        var test_weapons = [Weapon({type: "gun", pos: {x: 15, y: 5}, orientation: 0})];


        //Create 4 legs with 2 joints each
        var children = [];
        for (var i = 0; i < 4; i++){
            var test_appendage_config = {"width": 20, "height": 7, "shell": [],
                                        "modules": [testm, testm2], "weapons": test_weapons,
                                        "batteries": this.batteries, "connectors": test_connectors,
                                        "joints": [test_joint], "sinks": test_sinks,
                                        "children": [], "pos": {x:0, y:0}};
            var test_appendage = Appendage(test_appendage_config);
            //var test_appendage_2 = Object.assign({}, test_appendage);
            var test_appendage_2 = copyObject(test_appendage);
            //test_appendage_2.pos = {x:Assets.canvas.width, y:Assets.canvas.height / 2};
            //test_appendage_2.angle = Math.PI;
            test_appendage.children.push(test_appendage_2.id);
            console.log(test_appendage.children)
            ECS.entities.appendages[test_appendage.id] = test_appendage;
            ECS.entities.appendages[test_appendage_2.id] = test_appendage_2;
            children.push(test_appendage.id);

        }


        //Torso
        var test_torso_config = {"width": 20, "height": 20, "shell": [],
                                      "modules": [testm, testm2], "weapons": test_weapons,
                                      "batteries": this.batteries, "connectors": test_connectors,
                                      "joints": [test_joint], "sinks": test_sinks,
                                      "children": children, "pos": {x:-10, y: -10}};

        var test_torso = Torso(test_torso_config);


        ECS.entities.appendages[test_torso.id] = test_torso;
        console.log(test_torso)

        this.chips = {};
        this.mods = {};
        this.appendages = {"test": test_appendage};
        this.titans = {};

        var test_titan_config = {"pos": new Vector2D(50, 60), "appendages": [test_appendage, test_appendage_2], "torso": test_torso};
        var test_titan = new Titan(test_titan_config);

        this.current_titan = test_titan;

        //Energy quanta
        this.quanta = [];
        this.sources = [
                        {type: "photum", pos: new Vector2D(0, 3), rate: 30},
                        {type: "aquam", pos: new Vector2D(1, 3), rate: 30},
                        {type: "photum", pos: new Vector2D(2, 3), rate: 30},
                      ];
        this.grid_width = 10;

    }
    update(delta){
        // sprites[0].position.set(this.score, this.score, 0);
        // sprites[0].material.rotation = this.score / 10.0;
        // sprites[1].position.set(this.score, -this.score, 0);
        //ECS.systems.updateEntities(this, delta);
        if (flags['left_down'] == 1) {
            //Set new destination for titan
            if (this.current_titan != null){
                var dest = new Vector2D(flags["mousePos"].x / this.grid_width, flags["mousePos"].y / this.grid_width);
                var dir = dest.subtract(this.current_titan.pos);

                //debugger;
                this.current_titan.destination = dest;
                this.current_titan.setNewTargets(dir, 5);
            }
        }

        this.current_titan.update(delta);
        ECS.systems.update(this, delta);
        this.frame++;
    }
    render(delta){


        ECS.systems.render(this, delta);


        // var newCanvas = document.createElement('canvas');
        // newCanvas.width = Assets.canvas.width
        // newCanvas.height = Assets.canvas.height;
        // var newContext = newCanvas.getContext('2d');
        //
        // newContext.transform(1, 0, 0, -1, 0, newCanvas.height);
        // newContext.drawImage(Assets.canvas, 0, 0, Assets.canvas.width, Assets.canvas.height);
        //
        //
        // const canvasData = newContext.getImageData(0, 0, newCanvas.width, newCanvas.height);
        // const texture = new THREE.DataTexture( canvasData, newCanvas.width, newCanvas.height);
        // //var texture = new THREE.CanvasTexture(Assets.canvas);
        // texture.needsUpdate = true;
        // //texture.magFilter = THREE.NearestFilter;
        // //texture.minFilter = THREE.NearestFilter;
        // //
        // //Assets.plane_material.map = texture;
        // //
        // // //Assets.uniforms.tex.value = texture;
        // // //
        // Assets.sprite_material.map = texture;
        // Assets.c.clearRect(0, 0, Assets.canvas.width, Assets.canvas.height);
        // Assets.camera.updateMatrixWorld();
        // Assets.controls.update();
        // Assets.renderer.render( Assets.scene, Assets.ortho_camera );
    }
}


//Game loop
function gameLoop(current){
    current = Date.now();
    elapsed = current - prev;
    prev = current;
    lag += elapsed;

    if (pause == 0){
        while (lag >= MS_PER_UPDATE) {
            //Update
            var t1 = Date.now();
            sm.update(1);
            var t2 = Date.now();
            //console.log("Time taken to update:" + (t2 - t1) + "ms.");
            lag -= MS_PER_UPDATE;
        }
        //console.log(lag);

        ol.clearRect(0, 0, overlay.width, overlay.height);
    } else {
        drawPause();
    }
    //Render
    sm.render(lag / MS_PER_UPDATE);

    Assets.cursor.draw();

    //window.cancelAnimationFrame(req);

    window.requestAnimationFrame(gameLoop);

}

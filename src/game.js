import * as Scene from './scenes.js';
import * as Assets from './assets.js';

import {Module, Connector, Weapon, Joint, Sink, Mainframe, createModuleImage} from "./gameObjects/module.js";
import {Cell, Router, Grid, createChipImage} from "./gameObjects/cell.js";
import {Shell, Appendage, Torso, createAppendageImage} from "./gameObjects/appendage.js";
import {Titan, draw_appendage_gl, draw_titan} from "./gameObjects/titan.js";
import {Battery} from "./gameObjects/battery.js";

import {Vector2D} from "./vector2D.js";
import {BuildScene} from "./subscenes/build_scene.js";
import {BattleScene} from "./subscenes/battle_scene.js";
import {MarketScene} from "./subscenes/market_scene.js";
import {copyObject} from "./utils.js";

import {Explosion, P1, P2} from "./projectile.js";

import {GL_Renderer} from "./renderer/gl_renderer.js";

import chip_data from '../presets/chips.json' assert { type: 'json' };
import module_data from '../presets/modules.json' assert { type: 'json' };
import weapon_data from '../presets/weapons.json' assert { type: 'json' };
import appendage_data from '../presets/appendages.json' assert { type: 'json' };
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

//export var renderer;

// Game scenes
export var game;
export var game_scene;
export var ins_scene;
export var menu;
export var end_scene;
//SUbscenes
export var build_scene;
export var battle_scene;
export var market_scene;

export function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    overlay.width = window.innerWidth;
    overlay.height = window.innerHeight;
    gl.width = window.innerWidth / 2;
    gl.height = window.innerHeight / 2;
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
    Assets.gl.style.left = (window.innerWidth / 4) + "px";
    Assets.gl.style.top = (window.innerHeight / 4) + "px";


    //Draw/Load images of gameobjects


    // renderer.loadTextures(images);

    sm = new Scene.SceneManager();
    menu = new Scene.Menu();


    sm.cur_scene = menu;
    game = new Game();
    game_scene = new Scene.GameScene(game);
    ins_scene = new Scene.Ins();
    end_scene = new Scene.End(game);

    build_scene = new BuildScene();
    battle_scene = new BattleScene();
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

    //Mouse scroll event
    canvas.addEventListener('wheel',function(event){
        if (event.deltaY < 0) {
            console.log("Mouse wheel up");
            flags["wheel"] = 1;
        } else if (event.deltaY > 0){
            console.log("Mouse wheel down");
            flags["wheel"] = -1;
        } else {
            flags["wheel"] = 0;
        }
    }, false);

    //Key presses
    document.addEventListener('keydown', function(e) {
        if(e.keyCode == 80) { //P key
            if (sm.cur_scene.name === "game") pause = (pause + 1) % 2;
        }
        else if(e.keyCode == 87 || e.keyCode == 38) { //up key
            console.log("Up key pressed");
            flags["v"] = -1;
        }
        else if(e.keyCode == 83 || e.keyCode == 40) { //down key
            console.log("Down key pressed");
            flags["v"] = 1;
        }
        else if(e.keyCode == 65 || e.keyCode == 37) { //left key
            console.log("Left key pressed");
            flags["h"] = -1;
        }
        else if(e.keyCode == 68 || e.keyCode == 39) { //right key
            console.log("Right key pressed");
            flags["h"] = 1;
        } else if(e.keyCode == 88) { //right key
            console.log("X key pressed");
            flags["rotate"] = 1;
        } else if(e.keyCode == 90) { //right key
            console.log("Z key pressed");
            flags["rotate"] = -1;
        }
    });

    document.addEventListener('keyup', function(e) {
        if(e.keyCode == 87 || e.keyCode == 38) { //up key
            console.log("Up key released");
            flags["v"] = 0;
        }
        else if(e.keyCode == 83 || e.keyCode == 40) { //down key
            console.log("Down key released");
            flags["v"] = 0;
        }
        else if(e.keyCode == 65 || e.keyCode == 37) { //left key
            console.log("Left key released");
            flags["h"] = 0;
        }
        else if(e.keyCode == 68 || e.keyCode == 39) { //right key
            console.log("Right key released");
            flags["h"] = 0;
        } else if(e.keyCode == 88) { //right key
            console.log("X key released");
            flags["rotate"] = 0;
        } else if(e.keyCode == 90) { //right key
            console.log("Z key released");
            flags["rotate"] = 0;
        }
    });

    window.requestAnimationFrame(gameLoop);
}

//The game simulation
class Game {
    constructor(){
        this.score = 0;
        this.frame = 0;

        this.result = -1;
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

        ECS.entities.modules["testm"] = testm;
        ECS.entities.modules["testm2"] = testm2;

        ECS.entities.weapons["gun"] = Weapon(weapon_data["gun"]);
        ECS.entities.weapons["laser"] = Weapon(weapon_data["laser"]);
        ECS.entities.weapons["missile"] = Weapon(weapon_data["missile"]);

        ECS.entities.utilities["Energy Sink"] = Sink(0, 0);
        ECS.entities.utilities["Joint"] = Joint(0, 0);

        //ECS.blueprints.modules["testm"] = testm;
        //ECS.blueprints.modules["testm2"] = testm2;

        ECS.blueprints.weapons["gun"] = Weapon(weapon_data["gun"]);
        ECS.blueprints.weapons["laser"] = Weapon(weapon_data["laser"]);
        ECS.blueprints.weapons["missile"] = Weapon(weapon_data["missile"]);

        ECS.blueprints.utilities["Energy Sink"] = Sink(0, 0);
        ECS.blueprints.utilities["Joint"] = Joint(0, 0);
        ECS.blueprints.utilities["Mainframe"] = Mainframe(0, 0);

        this.batteries = [
                          Battery({type: "aquam", pos: {x: 3, y: 6}, rate: 30, quantity: 6}),
                          Battery({type: "aquam", pos: {x: 4, y: 6}, rate: 30, quantity: 6}),
                          Battery({type: "photum", pos: {x: 5, y: 6}, rate: 30, quantity: 6}),
                          Battery({type: "gravitum", pos: {x: 2, y: 5}, rate: 30, quantity: 6}),
                          Battery({type: "aquam", pos: {x: 6, y: 5}, rate: 30, quantity: 6})
                        ];
        var test_connectors = [Connector(testm, "north", testm2, "south")];
        var test_sinks = [Sink(9, 4), Sink(11, 5), Mainframe(10, 8)];
        var test_joint = Joint(19, 2);
        var test_weapons = [Weapon({type: "gun", pos: {x: 15, y: 5}, orientation: 0})];


        //Create 4 legs with 2 joints each
        var children = [];
        for (var i = 0; i < 4; i++){
            // var test_appendage_config = {"width": 20, "height": 7, "shell": [],
            //                             "modules": [testm, testm2], "weapons": test_weapons,
            //                             "batteries": this.batteries, "connectors": test_connectors,
            //                             "joints": [Joint(19, 2), Joint(0, 2)], "sinks": test_sinks,
            //                             "children": [], "pos": {x:0, y:0}};
            var test_appendage = copyObject(appendage_data["arm"]);
            //var test_appendage = Appendage(test_appendage_config);
            //console.log(JSON.stringify(test_appendage));
            //var test_appendage_2 = Object.assign({}, test_appendage);
            var test_appendage_2 = copyObject(test_appendage);
            //test_appendage_2.pos = {x:Assets.canvas.width, y:Assets.canvas.height / 2};
            test_appendage.angle = -Math.PI / 4 * i;
            test_appendage_2.angle = -Math.PI / 6;
            if (i > 1) test_appendage.angle = Math.PI - Math.PI / 4;
            if (i > 1) test_appendage_2.angle = Math.PI / 6;
            test_appendage.children.push(test_appendage_2.id);
            console.log(test_appendage.children)
            ECS.entities.appendages[test_appendage.id] = test_appendage;
            ECS.entities.appendages[test_appendage_2.id] = test_appendage_2;
            ECS.blueprints.appendages["arm"] = test_appendage;
            //Create appendage images for building
            //createAppendageImage(test_appendage, 80);
            children.push(test_appendage.id);

        }
        ECS.blueprints.appendages["test_ap"] = appendage_data["test_ap"];

        ECS.blueprints.torsos["test_torso"] = appendage_data["test_torso"];

        //Torso
        var test_torso_config = {"width": 20, "height": 20, "shell": [],
                                      "modules": [testm, testm2], "weapons": test_weapons,
                                      "batteries": this.batteries, "connectors": test_connectors,
                                      "joints": [Joint(19, 17), Joint(19, 2), Joint(0, 2), Joint(0, 17)], "sinks": test_sinks,
                                      "children": children, "pos": {x:-0, y: -0}};

        var test_torso = Torso(test_torso_config);
        this.test_torso = test_torso;

        ECS.entities.appendages[test_torso.id] = test_torso;
        //ECS.blueprints.appendages[test_torso.id] = test_torso;
        //createAppendageImage(test_torso, 80);
        console.log(JSON.stringify(test_torso))
        console.log(ECS.entities.appendages)
        //console.log(JSON.stringify(test_appendage));

        //var appendage_copy = JSON.parse(JSON.stringify(test_appendage));



        var test_titan_config = {"pos": new Vector2D(0, 0), "appendages": [test_appendage, test_appendage_2], "torso": copyObject(test_torso), "id": 0, "hp": 500};
        var test_titan = new Titan(test_titan_config);
        test_titan.load();

        //Make a deep copy of original titan
        var copy_children = [];
        for (var i = 0; i < 4; i++){
            var copy_test_appendage = copyObject(appendage_data["arm"]);
            var copy_test_appendage_2 = copyObject(copy_test_appendage);
            copy_test_appendage.angle = -Math.PI / 6 * i;
            copy_test_appendage_2.angle = Math.PI / 6;
            if (i > 1) copy_test_appendage.angle = Math.PI;
            copy_test_appendage.children.push(copy_test_appendage_2.id);
            console.log(test_appendage.children)
            ECS.entities.appendages[copy_test_appendage.id] = copy_test_appendage;
            ECS.entities.appendages[copy_test_appendage_2.id] = copy_test_appendage_2;
            //Create appendage images for building
            //createAppendageImage(copy_test_appendage, 80);
            copy_children.push(copy_test_appendage.id);

        }
        var copy_torso_config = {"width": 20, "height": 20, "shell": [],
                                      "modules": [testm, testm2], "weapons": test_weapons,
                                      "batteries": this.batteries, "connectors": test_connectors,
                                      "joints": [Joint(19, 17), Joint(19, 2), Joint(0, 2), Joint(0, 17)], "sinks": test_sinks,
                                      "children": copy_children, "pos": {x:-0, y: -0}};
        var copy_torso = Torso(copy_torso_config);

        var test_opp_config = {"pos": new Vector2D(90, 35), "appendages": [copy_test_appendage, copy_test_appendage_2], "torso": copyObject(copy_torso), "id": 1, "hp": 500};
        this.test_opp = new Titan(test_opp_config);
        this.test_opp.load();

        //Set initial destination
        var dest = new Vector2D(135, 40);
        var dir = dest.subtract(this.test_opp.pos);
        this.test_opp.destination = dest;
        this.test_opp.setNewTargets(dir, 5);

        this.current_titan = test_titan;
        console.log(test_titan)
        //Energy quanta
        this.quanta = [];
        this.sources = [
                        {type: "photum", pos: new Vector2D(0, 3), rate: 30},
                        {type: "aquam", pos: new Vector2D(1, 3), rate: 30},
                        {type: "photum", pos: new Vector2D(2, 3), rate: 30},
                      ];
        this.grid_width = 10;


        this.battle = false;

        this.chips = {};
        this.mods = {};
        this.appendages = {"test": test_appendage};
        this.titans = {};

        this.projectiles = [];

        this.explosions = [];

        this.temp_titan = null;

    }
    resetTitans(){

        //Create 4 legs with 2 joints each
        var children = [];
        for (var i = 0; i < 4; i++){
            var test_appendage = copyObject(appendage_data["arm"]);
            var test_appendage_2 = copyObject(test_appendage);
            test_appendage.angle = -Math.PI / 4 * i;
            test_appendage_2.angle = -Math.PI / 6;
            if (i > 1) test_appendage.angle = Math.PI - Math.PI / 4;
            if (i > 1) test_appendage_2.angle = Math.PI / 6;
            test_appendage.children.push(test_appendage_2.id);
            ECS.entities.appendages[test_appendage.id] = test_appendage;
            ECS.entities.appendages[test_appendage_2.id] = test_appendage_2;
            //Create appendage images for building
            //createAppendageImage(test_appendage, 80);
            children.push(test_appendage.id);
        }
        var test_connectors = [Connector(ECS.entities.modules["testm"], "north", ECS.entities.modules["testm2"], "south")];
        var test_sinks = [Sink(9, 4), Sink(11, 5)];
        var test_joint = Joint(19, 2);
        var test_weapons = [Weapon({type: "gun", pos: {x: 15, y: 5}, orientation: 0})];

        //Torso
        var test_torso_config = {"width": 20, "height": 20, "shell": [],
                                      "modules": [ECS.entities.modules["testm"], ECS.entities.modules["testm2"]], "weapons": test_weapons,
                                      "batteries": this.batteries, "connectors": test_connectors,
                                      "joints": [Joint(19, 17), Joint(19, 2), Joint(0, 2), Joint(0, 17)], "sinks": test_sinks,
                                      "children": children, "pos": {x:-0, y: -0}};

        var test_torso = Torso(test_torso_config);
        this.test_torso = test_torso;

        ECS.entities.appendages[test_torso.id] = test_torso;
        ECS.blueprints.appendages[test_torso.id] = test_torso;
        ECS.blueprints.torsos[test_torso.id] = test_torso;
        //createAppendageImage(test_torso, 80);

        var test_titan_config = {"pos": new Vector2D(0, 0), "appendages": [test_appendage, test_appendage_2], "torso": test_torso, "id": 0, "hp": 500};
        var test_titan = new Titan(test_titan_config);
        this.current_titan = test_titan;

        //Make a deep copy of original titan
        var copy_children = [];
        for (var i = 0; i < 4; i++){
            var copy_test_appendage = copyObject(appendage_data["arm"]);
            var copy_test_appendage_2 = copyObject(copy_test_appendage);
            copy_test_appendage.angle = -Math.PI / 6 * i;
            copy_test_appendage_2.angle = Math.PI / 6;
            if (i > 1) copy_test_appendage.angle = Math.PI;
            copy_test_appendage.children.push(copy_test_appendage_2.id);
            console.log(test_appendage.children)
            ECS.entities.appendages[copy_test_appendage.id] = copy_test_appendage;
            ECS.entities.appendages[copy_test_appendage_2.id] = copy_test_appendage_2;
            //Create appendage images for building
            //createAppendageImage(copy_test_appendage, 80);
            copy_children.push(copy_test_appendage.id);

        }
        var copy_torso_config = {"width": 20, "height": 20, "shell": [],
                                      "modules": [ECS.entities.modules["testm"], ECS.entities.modules["testm2"]], "weapons": test_weapons,
                                      "batteries": this.batteries, "connectors": test_connectors,
                                      "joints": [Joint(19, 17), Joint(19, 2), Joint(0, 2), Joint(0, 17)], "sinks": test_sinks,
                                      "children": copy_children, "pos": {x:-0, y: -0}};
        var copy_torso = Torso(copy_torso_config);

        var test_opp_config = {"pos": new Vector2D(90, 35), "appendages": [copy_test_appendage, copy_test_appendage_2], "torso": copyObject(copy_torso), "id": 1, "hp": 500};
        this.test_opp = new Titan(test_opp_config);
        //Set initial destination
        var dest = new Vector2D(135, 40);
        var dir = dest.subtract(this.test_opp.pos);
        this.test_opp.destination = dest;
        this.test_opp.setNewTargets(dir, 5);

        dest = new Vector2D(15, 10);
        dir = dest.subtract(this.current_titan.pos);
        this.current_titan.destination = dest;
        this.current_titan.setNewTargets(dir, 5);

        this.projectiles = [];
        this.explosions = [];

    }
    update(delta){
        if (this.battle){
            if (this.result == -1){
                renderer.updateCamera(delta);
                if (renderer.camera.pz < 3) {
                    renderer.camera.pz += 0.0005;
                } else {
                    renderer.camera.pz+=0.005;
                    renderer.camera.px+=0.005;
                    renderer.camera.py-=0.005;
                }


                const bcr = Assets.gl.getBoundingClientRect();
                renderer.cursorToScreen(flags["mousePos"].x - bcr.left, flags["mousePos"].y - bcr.top);
                if (flags['left_down'] == 1) {
                    //Set new destination for titan
                    if (this.current_titan != null){
                        var dest = new Vector2D(renderer.selected_coords.x, -renderer.selected_coords.y);
                        var dir = dest.subtract(this.current_titan.pos);

                        //debugger;
                        this.current_titan.destination = dest;
                        this.current_titan.setNewTargets(dir, 5);
                    }
                }

                //test
                renderer.drawLineStrips(0, 0, [0.0, 0.0, 2.0, 2.0,   2.0, 2.0, 3.0, 10.0], [1.0, 0.0, 1.0]);
                this.current_titan.update(this, delta);
                this.test_opp.update(this, delta);
                ECS.systems.update(this, delta);

                if (this.current_titan.hp <= 0){
                    this.result = 0; //Loss
                } else if (this.test_opp.hp <= 0){
                    this.result = 1; //Win
                }
            } else {
                Scene.changeScene(end_scene);
            }
        }

        //GL renderer updates


        this.frame++;
    }
    render(delta){
        //ECS.systems.render(this, delta);
        if (!this.battle){
            Assets.c.drawImage(images["menu"], (Assets.canvas.width) / 6 + Math.sin(this.frame / 160) * 100, 0, (Assets.canvas.width) * 2 / 3, Assets.canvas.height);
            var r = 1 / 5;
            var gradient = c.createLinearGradient(0, 0, canvas.width, 0);
            // Add three color stops
            gradient.addColorStop(0, "rgba(0, 0, 0, 1.0)");
            gradient.addColorStop(r, "rgba(0, 0, 0, 1.0)");
            gradient.addColorStop(0.5, "rgba(0, 0, 0, "+ (Math.sin(this.frame / 40) * 0.1 + 0.1) +")");
            gradient.addColorStop(1 - r, "rgba(0, 0, 0, 1.0)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 1.0)");
            c.fillStyle = gradient;
            c.fillRect(0, 0, canvas.width, canvas.height);
            //Assets.c.drawImage(images["vital-maker"], (Assets.canvas.width) / 6 + Math.sin(this.frame / 160) * 100, 0, 80, 80);

            if (this.temp_titan != null){
                renderer.render(this);
                draw_titan(renderer, this.temp_titan.torso, this.temp_titan.pos, this.temp_titan.pos, 0, this);
            }
        } else {
            //Battle mode
            renderer.render(this);
            //debugger;
            //Background arena
            renderer.drawSprite("arena", -100, 100, 300, 300, 0, -0.1);
            if (this.current_titan != null){
                //Draw titan
                draw_titan(renderer, this.current_titan.torso, this.current_titan.pos, this.current_titan.pos, 0, this);
                //Draw opponent
                draw_titan(renderer, this.test_opp.torso, this.test_opp.pos, this.test_opp.pos, 0, this);

                //Debug mode
                // var body = game.current_titan;
                // var body = game.test_opp;
                // for (var i = 0; i < body.targets.length; i++){
                //     renderer.drawRect(body.targets[i].x, -body.targets[i].y, 2, 2, [1.0, 1.0, 0.0], 1.0);
                //     //Old positions
                //     renderer.drawRect(body.old_foot_pos[i].x, -body.old_foot_pos[i].y, 2, 2, [0.0, 1.0, 0.0], 1.0);
                // }
                // renderer.drawRect(body.pos.x - 1, -body.pos.y + 1, 2, 2, [1.0, 0.0, 0.0], 1.0);
            }
            if (flags['left_down'] == 1){

                const bcr = Assets.gl.getBoundingClientRect();
                renderer.cursorToScreen(flags["mousePos"].x - bcr.left, flags["mousePos"].y - bcr.top);
                renderer.drawRect(renderer.selected_coords.x, renderer.selected_coords.y, 1, 1, [1.0, 0.0, 0.0], 1.0);
            }

            //Render projectiles (in front of the appendages)
            for (const proj of this.projectiles){
                renderer.drawRect(proj.pos.x, -proj.pos.y, proj.size, proj.size, proj.color, 1.0, 0.0, 2.5);
            }

            //Render explosions
            for (var i = game.explosions.length - 1; i >= 0; i--){
                var expl = game.explosions[i];
                if (expl.frame <= 15) renderer.drawSprite("exp"+expl.frame, expl.x - 0.5, -(expl.y + 0.5), 2, 2, 0.0, 2.0);
            }

            //HP and stats
            //Player HP topleft
            ol.fillStyle = "rgba(0, 0, 0, 0.8)";
            ol.fillRect(0, 0, overlay.width, 100);

            ol.font="25px statFont";
            ol.strokeStyle = "red";
            ol.fillStyle = "red";
            ol.lineWidth = 3;
            ol.fillText("HEALTH", 25, 25, 70, 12);
            ol.fillText(this.current_titan.hp + "\/500", 150, 25, 100, 12);
            ol.strokeRect(25, 35, (overlay.width / 2 - 100) + 12, 52); //Border
            ol.fillRect(31, 41, (overlay.width / 2 - 100) * (this.current_titan.hp / 500), 40);

            ol.strokeStyle = "#89cff0";
            ol.fillStyle = "#89cff0";
            ol.fillText("HEALTH", overlay.width - 75, 25, 70, 12);
            ol.fillText(this.test_opp.hp + "\/500", overlay.width - 200, 25, 100, 12);
            ol.strokeRect(overlay.width - ((overlay.width / 2 - 100) + 12) - 25, 35, (overlay.width / 2 - 100) + 12, 52); //Border
            ol.fillRect(overlay.width - (overlay.width / 2 - 100) - 31, 41, (overlay.width / 2 - 100) * (this.test_opp.hp / 500), 40);
        }
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

import {Scene, SceneManager, changeScene, screen_vars} from "../scenes.js";
import {game, game_scene, build_scene} from "../game.js";
import * as Assets from '../assets.js';
import {Button, DropDown, Region, TabbedPanel, StateMenu, IconMenu} from "../button.js";
import {playSound} from "../sound.js";
import {resource_colours, formulas, keys, char_keys} from "../gameObjects/resource.js";
import {isNum, copyObject} from "../utils.js";
import {rectvrect} from "../collision.js";
import {Chip, ChipFactory} from "../gameObjects/cell.js";
import {Module, ModuleFactory, Connector, calcEdge} from "../gameObjects/module.js";
import {Vector2D} from "../vector2D.js";

import module_data from '../../presets/modules.json' assert { type: 'json' };
import weapon_data from '../../presets/weapons.json' assert { type: 'json' };

//Variables from assets.js
var canvas = Assets.canvas;
var overlay = Assets.overlay;
var c = Assets.c;
var ol = Assets.ol;

var highlight_color = "rgba(0, 255, 0, 0.5)";

//Objects within the scene
var cell_button = new Button({x: 110, y:100, width:200, height:50, label:"Chips",
      onClick: function(){
          screen_vars.page = 0;
          screen_vars.dropdown = null;
          playSound(sfx_sources["button_click"].src, sfx_ctx);
          Assets.name_field.placeholder = "Enter name for chip";
          Assets.name_field.value = '';
      }
     });

var module_button = new Button({x: 110, y:170, width:200, height:50, label:"Modules",
     onClick: function(){
         screen_vars.page = 1;
         screen_vars.dropdown = null;
         playSound(sfx_sources["button_click"].src, sfx_ctx);
         Assets.name_field.placeholder = "Enter name for module";
         Assets.name_field.value = '';
     }
    });

 var appendage_button = new Button({x: 110, y:240, width:200, height:50, label:"Appendages",
      onClick: function(){
          screen_vars.page = 2;
          screen_vars.dropdown = null;
          playSound(sfx_sources["button_click"].src, sfx_ctx);
          Assets.name_field.placeholder = "Enter name for appendage";
          Assets.name_field.value = '';
      }
     });
 var titan_button = new Button({x: 110, y:310, width:200, height:50, label:"Titan",
       onClick: function(){
           screen_vars.page = 3;
           screen_vars.dropdown = null;
           playSound(sfx_sources["button_click"].src, sfx_ctx);
           Assets.name_field.placeholder = "Enter name for titan";
           Assets.name_field.value = '';
       }
      });
 var back_button = new Button({x: 110, y:Assets.canvas.height - 100, width:200, height:50, label:"Back",
        onClick: function(){
            changeScene(game_scene);
            playSound(sfx_sources["button_click"].src, sfx_ctx);
        }
   });

var cell_size = 4;
var temp_cell = "";

resetCell();

function isCorner(i, j = -1){
    if (j == -1){
        var row = ~~(i / cell_size);
        var col = i % cell_size;
        return (row == 0 && col == 0) || (row == 0 && col == cell_size - 1) || (row==cell_size - 1 && col == 0) || (row==cell_size - 1 && col==cell_size - 1);
    }
    return (i == 0 && j == 0) || (i == 0 && j == cell_size - 1) || (i==cell_size - 1 && j == 0) || (i==cell_size - 1 && j==cell_size - 1);
}

function resetCell(){
    temp_cell = "";
    for (var i = 0; i < cell_size; i++){
       for (var j = 0; j < cell_size; j++){
           //block out corners
           if (isCorner(i, j)){
              temp_cell+='x';
           } else {
              temp_cell+='.';
           }

       }
    }
}

var draw_mb = false;
var temp_module_w = 0;
var temp_module_h = 0;
var temp_module = [];

function createChip(name){
    var chip = ChipFactory(temp_cell, name);
    game.chips[chip.name] = chip;
    var tab_panel = build_scene.tabbed_panels[1][0];
    tab_panel.tab_items["Chips"][0].options = Object.keys(game.chips);

    //Create sprite
    var mid_w = Assets.canvas.width / 2;
    var mid_h = Assets.canvas.height / 2;
    var newCanvas = document.createElement('canvas');
    newCanvas.width = 400;
    newCanvas.height = 400;
    var newContext = newCanvas.getContext('2d');
    newContext.drawImage(Assets.canvas, mid_w - 200, mid_h - 200, 400, 400, 0, 0, 400, 400);
    //Add sprite to image array
    var image_data = newCanvas.toDataURL();
    images[chip.name] = document.createElement('img');
    images[chip.name].src = image_data;

    images[chip.str] = document.createElement('img');
    images[chip.str].src = image_data;

    newCanvas.remove();

    console.log("Created new chip!")
    console.log(chip)
}

function createModule(name){
    var mod = ModuleFactory(temp_module_w, temp_module_h, temp_module, name);
    game.mods[mod.name] = mod;
    var tab_panel = build_scene.tabbed_panels[2][0];
    tab_panel.tab_items["Modules"][0].options = Object.keys(game.mods);

    var mid_w = Assets.canvas.width / 2;
    var mid_h = Assets.canvas.height / 2;
    var newCanvas = document.createElement('canvas');
    newCanvas.width = temp_module_w * 80;
    newCanvas.height = temp_module_h * 80;
    var newContext = newCanvas.getContext('2d');

    newContext.drawImage(Assets.canvas, mid_w - 200 + 25, mid_h - 200 + 25, newCanvas.width, newCanvas.height, 0, 0, newCanvas.width, newCanvas.height);

    //Black veil over the whole module
    newContext.fillStyle = 'rgba(0, 0, 0, 0.3)';
    newContext.fillRect(0, 0, newCanvas.width, newCanvas.height);

    //Add sprite to image array
    var image_data = newCanvas.toDataURL();
    images[name] = document.createElement('img');
    images[name].src = image_data;
    console.log("Created new module!")
    //console.log(chip)
}

//Temporary connector
var temp_connector = {mod1: null, edge1: null, mod2: null, edge2: null};

//Temporary Appendage
var block_width = 80;
var temp_appendage = {width: 0, height: 0,
  shell: [],
  modules: [],
  batteries: [],
  weapons: [],
  connectors: [],
  sinks: [],
  joints: [],
  id: null,
  children: [],
  pos: new Vector2D(0, 0),
  angle: 0};


function update_regions(w, h, page){
    build_scene.regions[page] = [];

    if (page == 1){
        temp_module = [];
    } else if (page == 2){
        temp_appendage.width = w;
        temp_appendage.height = h;
    }

    block_width = Math.min(80, Math.min(canvas.width / (2 * temp_module_w), canvas.width / (2 * temp_module_h)));
    for (var i = 0; i < h; i++){
        for (var j = 0; j < w; j++){
            build_scene.regions[page].push(Region(build_scene.mid_w + block_width * (j - temp_module_w / 2 + 0.5), build_scene.mid_h - 200 + 25 + block_width * (i + 0.5) + 40, block_width, block_width));

            if (page == 1) {
                //build_scene.regions[page].push(Region(build_scene.mid_w - 200 + 25 + 80 * j + 40, build_scene.mid_h - 200 + 25 + 80 * i + 40, 80, 80));
                temp_module.push("");
            } else if (page == 2){
                //build_scene.regions[page].push(Region(build_scene.mid_w + block_width * (j - temp_module_w / 2 + 0.5), build_scene.mid_h - 200 + 25 + block_width * (i + 0.5) + 40, block_width, block_width));
            }
        }
    }

}

/***
Subscenes for build mode

Pages:
- cell building
- module building
- appendage building
- full mech building
- battery building
***/

export class BuildScene extends Scene {
   constructor(){
     super();
     this.name = "ins";

     this.titles = ["Chips", "Modules", "Appendages", "Titan", "Batteries"];

     this.buttons = [back_button, cell_button, module_button, appendage_button, titan_button];
     this.mid_w = Assets.canvas.width / 2;
     this.mid_h = Assets.canvas.height / 2;


     //Page items
     this.items = {0:[], 1:[], 2:[], 3:[], 4:[]};

     //Further clickables
     this.clickables = {0:[], 1:[], 2:[], 3:[], 4:[]};
     screen_vars.dropdown = null;
     this.regions = {0:[], 1:[], 2:[], 3:[], 4:[]};
     this.tabbed_panels = {0:[], 1:[], 2:[], 3:[], 4:[]};

    //Cell page buttons
     var new_cell_button = new Button({x: Assets.canvas.width / 2 - 150, y:Assets.canvas.height - 100, width:200, height:50, label:"Create chip",
          onClick: function(){
              playSound(sfx_sources["button_click"].src, sfx_ctx);
              createChip(Assets.name_field.value);
          }
         });
     var clear_button = new Button({x: Assets.canvas.width / 2 + 150, y:Assets.canvas.height - 100, width:200, height:50, label:"Clear",
         onClick: function(){
             playSound(sfx_sources["button_click"].src, sfx_ctx);
             resetCell();
         }
        });
     this.clickables[0].push(new_cell_button);
     this.clickables[0].push(clear_button);

     //Cell page regions
     for (var i = 0; i < 4; i++){
         for (var j = 0; j < 4; j++){
             this.regions[0].push(Region(this.mid_w - 200 + 25 + 90 * j + 40, this.mid_h - 200 + 25 + 90 * i + 40, 80, 80));
         }
     }

     //Cell page tabbed panel
     var cell_tabs = new TabbedPanel({
        x: Assets.canvas.width - 400, y: 150, tabs:["Inputs", "Outputs", "Units", "Mixers"]
     });
     cell_tabs.addToTab("Units", [new StateMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: cell_tabs.width, options: Object.keys(resource_colours)})] );
     cell_tabs.addToTab("Inputs", [new StateMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: cell_tabs.width, options: ["BasicInput"]})] );
     cell_tabs.addToTab("Outputs", [new StateMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: cell_tabs.width, options: ["BasicOutput"]})] );
     cell_tabs.addToTab("Mixers", [new StateMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: cell_tabs.width, options: ["BasicMixer"]})] );

     this.tabbed_panels[0].push(cell_tabs);

     //Module page buttons
     var confirm_button = new Button({x: Assets.canvas.width / 2 + 200, y:Assets.canvas.height/2 - 250, width:100, height:30, label:"Confirm",
          onClick: function(){
              playSound(sfx_sources["button_click"].src, sfx_ctx);
              if (Assets.module_h.value != '' && Assets.module_w.value != '') {
                  temp_module_w = parseInt(Assets.module_w.value);
                  temp_module_h = parseInt(Assets.module_h.value);
                  update_regions(temp_module_w, temp_module_h, screen_vars.page);
              }
          }
         });
     var new_module_button = new Button({x: Assets.canvas.width / 2 - 150, y:Assets.canvas.height - 100, width:200, height:50, label:"Create module",
          onClick: function(){
              playSound(sfx_sources["button_click"].src, sfx_ctx);
              createModule(Assets.name_field.value);
          }
         });
     this.clickables[1].push(new_module_button);
     this.clickables[1].push(confirm_button);
     this.clickables[1].push(clear_button);

     //Module page tabbed panel
     var module_tabs = new TabbedPanel({
        x: Assets.canvas.width - 400, y: 150, tabs:["Chips", "Wires"]
     });
     module_tabs.addToTab("Chips", [new IconMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: module_tabs.width, options: []})] );
     module_tabs.addToTab("Wires", [new IconMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: module_tabs.width, options: ["|", "Γ", "ヿ", "⅃", "L", "⼀", "⅃Γ", "Lヿ", "|⼀"]})] );

     this.tabbed_panels[1].push(module_tabs);

     /***
     Appendage page
     ***/
     var appendage_tabs = new TabbedPanel({
        x: Assets.canvas.width - 400, y: 150, tabs:["Modules", "Weapons", "Utilities", "Batteries"]
     });
     var new_appendage_button = new Button({x: Assets.canvas.width / 2 - 150, y:Assets.canvas.height - 100, width:200, height:50, label:"Create appendage",
          onClick: function(){
              playSound(sfx_sources["button_click"].src, sfx_ctx);
              //createModule(Assets.name_field.value);
          }
         });
     appendage_tabs.addToTab("Modules", [new IconMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: appendage_tabs.width, options: Object.keys(module_data)})] );
     appendage_tabs.addToTab("Weapons", [new IconMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: appendage_tabs.width, options: Object.keys(weapon_data)})] );
     appendage_tabs.addToTab("Utilities", [new IconMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: appendage_tabs.width, options: ["Connector", "Energy Sink", "Joint", "Mainframe"]})] );
     appendage_tabs.addToTab("Batteries", [new StateMenu({x: Assets.canvas.width - 400, y: 150 + 70, width: cell_tabs.width, options: ["aquam", "photum", "gravitum", "aetherium"]})] );

     this.tabbed_panels[2].push(appendage_tabs);
     this.clickables[2].push(new_appendage_button);
     this.clickables[2].push(confirm_button);
     this.clickables[2].push(clear_button);

     /***
     Titan page
     ***/
     var titan_tabs = new TabbedPanel({
        x: Assets.canvas.width - 600, y: 150, tabs:["Appendages", "Torso"]
     });
     var new_titan_button = new Button({x: Assets.canvas.width / 2 - 150, y:Assets.canvas.height - 100, width:200, height:50, label:"Create titan",
          onClick: function(){
              playSound(sfx_sources["button_click"].src, sfx_ctx);
              //createModule(Assets.name_field.value);
          }
         });
     titan_tabs.addToTab("Appendages", [new IconMenu({x: Assets.canvas.width - 600, y: 150 + 70, width: titan_tabs.width, options: Object.keys(ECS.blueprints.appendages) })] );
     titan_tabs.addToTab("Torso", [new IconMenu({x: Assets.canvas.width - 600, y: 150 + 70, width: titan_tabs.width, options: Object.keys(ECS.blueprints.torsos)})] );
     // titan_tabs.addToTab("Modules", [new IconMenu({x: Assets.canvas.width - 600, y: 150 + 70, width: appendage_tabs.width, options: Object.keys(module_data)})] );
     // titan_tabs.addToTab("Weapons", [new IconMenu({x: Assets.canvas.width - 600, y: 150 + 70, width: appendage_tabs.width, options: Object.keys(weapon_data)})] );
     // titan_tabs.addToTab("Utilities", [new IconMenu({x: Assets.canvas.width - 600, y: 150 + 70, width: appendage_tabs.width, options: ["Connector", "Energy Sink", "Joint"]})] );
     // titan_tabs.addToTab("Batteries", [new StateMenu({x: Assets.canvas.width - 600, y: 150 + 70, width: cell_tabs.width, options: ["aquam", "photum", "gravitum", "aetherium"]})] );

     this.tabbed_panels[3].push(titan_tabs);

     this.clickables[3].push(new_titan_button);
     this.clickables[3].push(clear_button);

   }
   update(delta) {
       if (screen_vars.page == 1 || screen_vars.page == 2){
           Assets.module_w.style.visibility = 'visible';
           Assets.module_h.style.visibility = 'visible';
       } else {
           Assets.module_w.style.visibility = 'hidden';
           Assets.module_h.style.visibility = 'hidden';
       }
   }


   render(delta){
       c.clearRect(0, 0, canvas.width, canvas.height);

       c.fillStyle = "beige";
       c.fillRect(0, 0, canvas.width, canvas.height);
       c.font="80px gameFont";
       c.fillStyle = "black";
       c.textAlign = "center";
       c.fillText("BUILD PANEL", canvas.width/2, 90);
       c.font="30px gameFont";
       c.fillText(this.titles[screen_vars.page], canvas.width/2, 150);
       for (var i = 0; i < this.buttons.length; i++){
           this.buttons[i].draw(c);
       }
       for (var i = 0; i < this.clickables[screen_vars.page].length; i++){
           this.clickables[screen_vars.page][i].draw(c);
       }
       for (var i = 0; i < this.tabbed_panels[screen_vars.page].length; i++){
           this.tabbed_panels[screen_vars.page][i].draw(c);
       }
       //Interfaces for the different pages

       if (screen_vars.page == 0){
           //Cell page
           c.strokeStyle = "magenta";
           c.fillStyle = "#32527b";
           c.beginPath();
           c.roundRect(this.mid_w - 200, this.mid_h - 200, 400, 400, 20);
           c.stroke();
           c.fill();


           c.strokeStyle = "gray";
           //Draw temp cell
           var size = ~~Math.sqrt(temp_cell.length);
           for (var i = 0; i < temp_cell.length; i++){
               var row = ~~(i / size);
               var col = i % size;
               var char = temp_cell.charAt(i);
               if (char != 'x'){
                   c.fillStyle = "gray";
                   c.beginPath();
                   c.roundRect(this.mid_w - 200 + 25 + 90 * col, this.mid_h - 200 + 25 + 90 * row, 80, 80, 20);
                   c.stroke();
                   c.fill();
               }

               if (isNum(char)){
                   c.fillStyle = resource_colours[char_keys[char]];
                   c.beginPath();
                   c.roundRect(this.mid_w - 200 + 25 + 90 * col + 10, this.mid_h - 200 + 25 + 90 * row + 10, 60, 60, 20);
                   c.stroke();
                   c.fill();
               } else if (char != 'x' && char != '.'){
                   c.drawImage(images[char_keys[char]], this.mid_w - 200 + 25 + 90 * col, this.mid_h - 200 + 25 + 90 * row, 80, 80);
               }
           }

           /**Draw selections**/

           var tab_panel = this.tabbed_panels[0][0];
           //Units
           var cur_tab = tab_panel.cur_tab;
           if (cur_tab != null){
               var selection = tab_panel.tab_items[cur_tab][0].state;
               if (selection != -1){
                   var selection_type = tab_panel.tab_items[cur_tab][0].options[selection];
                   if (cur_tab == "Units") {
                       //var unit_type = tab_panel.tab_items[cur_tab][0].options[selection];
                       var unit_color = resource_colours[selection_type];
                       c.fillStyle = unit_color;
                       c.beginPath();
                       c.roundRect(flags["mousePos"].x - 30, flags["mousePos"].y - 30, 60, 60, 20);
                       c.stroke();
                       c.fill();
                   } else {
                       var sprite = images[selection_type];
                       c.drawImage(sprite, flags["mousePos"].x - 30, flags["mousePos"].y - 30, 60, 60);
                   }
               }
           }
       } else if (screen_vars.page == 1){
          //Module page

          //Draw motherboard according to module dimensions set in textboxes
          var rows = temp_module_h;
          var cols = temp_module_w;
          c.strokeStyle = "green";
          for (var i = 0; i < rows; i++){
              for (var j = 0; j < cols; j++){
                  c.fillStyle = "#ededed";
                  c.beginPath();
                  c.roundRect(this.mid_w + block_width * (j - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * i + 40, block_width, block_width, 10);
                  c.stroke();
                  c.fill();
              }
          }

          //Draw temp_module
          for (var i = 0; i < temp_module.length; i++){
              var row = ~~(i / temp_module_w);
              var col = i % temp_module_w;
              var str = temp_module[i];
              if (str != ''){
                  if (images.hasOwnProperty(str)){
                      c.drawImage(images[str], this.mid_w + block_width * (col - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * row + 40, block_width, block_width);
                  }
              }
          }


          /**Draw selections**/

          var tab_panel = this.tabbed_panels[1][0];
          //Units
          var cur_tab = tab_panel.cur_tab;
          if (cur_tab != null){
              var selection = tab_panel.tab_items[cur_tab][0].state;
              if (selection != -1){
                  var selection_type = tab_panel.tab_items[cur_tab][0].options[selection];

                  var sprite = images[selection_type];
                  c.drawImage(sprite, flags["mousePos"].x - 30, flags["mousePos"].y - 30, block_width, block_width);


              }
          }
       } else if (screen_vars.page == 2){
           //Draw appendage hull to dimensions set in textboxes
           var rows = temp_module_h;
           var cols = temp_module_w;
           c.strokeStyle = "green";
           for (var i = 0; i < rows; i++){
               for (var j = 0; j < cols; j++){
                   c.drawImage(images["appendage_tile"], this.mid_w + block_width * (j - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * i + 40, block_width, block_width);
                   c.strokeStyle = "black";
                   c.lineWidth = 2;
                   c.strokeRect(this.mid_w + block_width * (j - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * i + 40, block_width, block_width);
               }
           }

           //Draw modules
           //Modules
           for (const mod of temp_appendage.modules){
               var img = images[mod.name];
               c.drawImage(img, this.mid_w + block_width * (mod.pos.x - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * mod.pos.y + 40, block_width * mod.width, block_width * mod.height);
           }

           for (const w of temp_appendage.weapons){
               var img = images[w.type];
               var angle = Math.PI / 2 * w.orientation;
               c.translate(this.mid_w + block_width * (w.pos.x - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * w.pos.y + 40);
               c.rotate(angle);
               c.drawImage(img, 0, 0, block_width * w.width, block_width * w.height);
               c.rotate(-angle);
               c.translate(-this.mid_w - block_width * (w.pos.x - temp_module_w / 2), -this.mid_h + 200 - 25 - block_width * w.pos.y - 40);
           }

           //Sinks (1 x 1)
           for (const s of temp_appendage.sinks){
               c.drawImage(images["reactor"], this.mid_w + block_width * (s.pos.x - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * s.pos.y + 40, s.width * block_width, s.height * block_width);
           }

           for (const j of temp_appendage.joints){
               c.drawImage(images["joint-hinge"], this.mid_w + block_width * (j.pos.x - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * j.pos.y + 40, j.width * block_width, j.height * block_width);
           }

           //Connectors
           for (const con of temp_appendage.connectors){
               //output edge
               c.fillStyle = "rgba(0, 255, 255, 0.6)";
               c.beginPath();
               c.roundRect(this.mid_w + block_width * (con.output_edge[0].x - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * con.output_edge[0].y + 40, (con.output_edge[1].x - con.output_edge[0].x + 1) * block_width, (con.output_edge[1].y - con.output_edge[0].y + 1) * block_width, 5);
               //ctx.stroke();
               c.fill();

               //input edge
               c.fillStyle = "rgba(255, 0, 255, 0.6)";
               c.beginPath();
               c.roundRect(this.mid_w + block_width * (con.input_edge[0].x - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * con.input_edge[0].y + 40, (con.input_edge[1].x - con.input_edge[0].x + 1) * block_width, (con.input_edge[1].y - con.input_edge[0].y + 1) * block_width, 5);
               //ctx.stroke();
               c.fill();

               //Bezier curves as wires
               c.strokeStyle = "rgb(255, 255, 255)";
               c.lineWidth = 5;
               var cp1 = {x: (con.output_edge[0].x + con.output_edge[1].x + 0.5) * block_width / 2.0, y: (con.output_edge[0].y + con.output_edge[1].y + 0.5) * block_width / 2.0};
               var cp2 = {x: (con.input_edge[0].x + con.input_edge[1].x + 0.5) * block_width / 2.0, y: (con.input_edge[0].y + con.input_edge[1].y + 0.5) * block_width / 2.0};
               c.beginPath();
               c.moveTo((con.output_edge[0].x + 0.5) * block_width, (con.output_edge[0].y + 0.5) * block_width);
               c.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (con.input_edge[0].x + 0.5) * block_width, (con.input_edge[0].y + 0.5) * block_width);
               c.stroke();

               c.beginPath();
               c.moveTo((con.output_edge[1].x + 0.5) * block_width, (con.output_edge[1].y + 0.5) * block_width);
               c.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (con.input_edge[1].x + 0.5) * block_width, (con.input_edge[1].y + 0.5) * block_width);
               c.stroke();
           }

           //Temp connector
           //output edge
           if (temp_connector.mod1 != null && temp_connector.edge1 != null){
               var output_edge = [{x:0, y:0}, {x:0, y:0}];
               calcEdge(temp_connector.mod1, output_edge, temp_connector.edge1);
               c.fillStyle = "rgba(0, 255, 255, 0.6)";
               c.beginPath();
               c.roundRect(this.mid_w + block_width * (output_edge[0].x - temp_module_w / 2), this.mid_h - 200 + 25 + block_width * output_edge[0].y + 40, (output_edge[1].x - output_edge[0].x + 1) * block_width, (output_edge[1].y - output_edge[0].y + 1) * block_width, 5);
               //ctx.stroke();
               c.fill();
            }

           /**Draw selections**/

           var tab_panel = this.tabbed_panels[2][0];
           //Units
           var cur_tab = tab_panel.cur_tab;
           if (cur_tab != null){
               var selection = tab_panel.tab_items[cur_tab][0].state;
               if (selection != -1){
                   var selection_type = tab_panel.tab_items[cur_tab][0].options[selection];

                   // var sprite = images[selection_type];
                   // var img_width = sprite.width;
                   // var img_height = sprite.height;
                   // var ratio = img_height / img_width;
                   var obj = null;
                   if (cur_tab == "Modules"){
                       obj = ECS.blueprints.modules[selection_type];

                       var sprite = images[selection_type];
                       c.fillStyle = highlight_color;
                       c.drawImage(sprite, flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, obj.width * block_width, obj.height * block_width);

                       c.fillRect(flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, obj.width * block_width, obj.height * block_width);
                   } else if (cur_tab == "Utilities"){
                       if (selection_type != "Connector"){
                           obj = ECS.blueprints.utilities[selection_type];
                           var sprite = images[selection_type];
                           c.fillStyle = highlight_color;
                           c.drawImage(sprite, flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, obj.width * block_width, obj.height * block_width);
                           c.fillRect(flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, obj.width * block_width, obj.height * block_width);
                       } else {
                           var sprite = images[selection_type];
                           c.fillStyle = highlight_color;
                           c.drawImage(sprite, flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, block_width, block_width);
                           //c.fillRect(flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, block_width, block_width);
                           //Draw highlight on the highlighted side
                           var coords = this.screenXY_inverse(flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2);
                           var sides = checkSides(temp_appendage, coords.x, coords.y);
                           if (sides != null){
                               var output_obj = sides[0];
                               var output_edge = sides[1];
                               //Draw edge
                               if (output_edge == "east"){
                                   var coords_x = output_obj.pos.x + output_obj.width;
                                   var coords_y = output_obj.pos.y;
                                   var draw_coords = this.screenXY(coords_x, coords_y);
                                   c.fillRect(draw_coords.x, draw_coords.y, block_width, output_obj.height * block_width);
                               } else if (output_edge == "west"){
                                   var coords_x = output_obj.pos.x - 1;
                                   var coords_y = output_obj.pos.y;
                                   var draw_coords = this.screenXY(coords_x, coords_y);
                                   c.fillRect(draw_coords.x, draw_coords.y, block_width, output_obj.height * block_width);

                               } else if (output_edge == "north"){
                                   var coords_x = output_obj.pos.x;
                                   var coords_y = output_obj.pos.y - 1;
                                   var draw_coords = this.screenXY(coords_x, coords_y);
                                   c.fillRect(draw_coords.x, draw_coords.y, output_obj.width * block_width, block_width);

                               } else if (output_edge == "south"){
                                   var coords_x = output_obj.pos.x;
                                   var coords_y = output_obj.pos.y + output_obj.height;
                                   var draw_coords = this.screenXY(coords_x, coords_y);
                                   c.fillRect(draw_coords.x, draw_coords.y, output_obj.width * block_width, block_width);
                               }
                           } else {
                               c.fillRect(flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, block_width, block_width);
                           }

                       }
                   } else if (cur_tab == "Weapons"){
                       obj = ECS.blueprints.weapons[selection_type];
                       var sprite = images[selection_type];
                       c.fillStyle = highlight_color;
                       c.drawImage(sprite, flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, obj.width * block_width, obj.height * block_width);

                       c.fillRect(flags["mousePos"].x - block_width / 2, flags["mousePos"].y - block_width / 2, obj.width * block_width, obj.height * block_width);
                   }

               }
           }
       } else if (screen_vars.page == 3){
           /**Draw selections**/

           var tab_panel = this.tabbed_panels[3][0];
           //Units
           var cur_tab = tab_panel.cur_tab;
           if (cur_tab != null){
               var selection = tab_panel.tab_items[cur_tab][0].state;
               if (selection != -1){
                   var selection_type = tab_panel.tab_items[cur_tab][0].options[selection];

                   var sprite = images[selection_type];
                   var img_width = sprite.width;
                   var img_height = sprite.height;
                   var ratio = img_height / img_width;
                   c.drawImage(sprite, flags["mousePos"].x - 30, flags["mousePos"].y - 30, 60, 60);


               }
           }
       }

       if (screen_vars.dropdown != null) screen_vars.dropdown.draw(c);



   }
   handleMouseClick(mouseX, mouseY){
       for (var i = 0; i < this.buttons.length; i++){
           this.buttons[i].handleMouseClick(mouseX, mouseY);
       }
       //Non-button clickables
       for (var i = 0; i < this.clickables[screen_vars.page].length; i++){
           this.clickables[screen_vars.page][i].handleMouseClick(mouseX, mouseY);
       }

       for (var i = 0; i < this.tabbed_panels[screen_vars.page].length; i++){
           this.tabbed_panels[screen_vars.page][i].handleMouseClick(mouseX, mouseY);
       }

       // if (screen_vars.dropdown != null) {
       //     screen_vars.dropdown.handleMouseClick(mouseX, mouseY);
       //
       // } else {
       //
       // }

       for (var i = 0; i < this.regions[screen_vars.page].length; i++){
            var region = this.regions[screen_vars.page][i];
            if (screen_vars.page == 0){
                if (!isCorner(i)) {
                    if (Math.abs(mouseX - region.x) < region.w/2 && Math.abs(mouseY - region.y) < region.h/2){
                        // if (screen_vars.dropdown == null || Math.abs(screen_vars.dropdown.x - region.x) >= region.w || Math.abs(screen_vars.dropdown.y - region.y) >= region.h) {
                        //     screen_vars.dropdown = new DropDown({x:mouseX, y:mouseY, options:["Input", "Output", "Unit"]});
                        // }

                        //Put down selection
                        var tab_panel = this.tabbed_panels[0][0];
                        //Units
                        var cur_tab = tab_panel.cur_tab;
                        //if (cur_tab == "Units") {
                        var selection = tab_panel.tab_items[cur_tab][0].state;
                        if (selection != -1){
                            var unit_type = tab_panel.tab_items[cur_tab][0].options[selection];
                            temp_cell = temp_cell.substring(0, i) + keys[unit_type] + temp_cell.substring(i + 1);
                            console.log(temp_cell);
                            tab_panel.tab_items[cur_tab][0].state = -1; //Reset current selection
                        }
                        //}
                    }
                }
            } else if (screen_vars.page == 1){
                if (Math.abs(mouseX - region.x) < region.w/2 && Math.abs(mouseY - region.y) < region.h/2){
                    // if (screen_vars.dropdown == null || Math.abs(screen_vars.dropdown.x - region.x) >= region.w || Math.abs(screen_vars.dropdown.y - region.y) >= region.h) {
                    //     screen_vars.dropdown = new DropDown({x:mouseX, y:mouseY, options:["Input", "Output", "Unit"]});
                    // }

                    //Put down selection
                    var tab_panel = this.tabbed_panels[1][0];
                    //Units
                    var cur_tab = tab_panel.cur_tab;
                    //
                    var selection = tab_panel.tab_items[cur_tab][0].state;
                    if (selection != -1){
                        var selection_type = tab_panel.tab_items[cur_tab][0].options[selection];

                        if (cur_tab == "Chips") {
                            var chip = game.chips[selection_type];
                            temp_module[i] = chip.str;
                        } else if (cur_tab == "Wires"){
                            temp_module[i] = selection_type;
                        }
                        console.log(temp_module)
                    }
                    //}
                }
            } else if (screen_vars.page == 2){ //Appendage page
                if (Math.abs(mouseX - region.x) < region.w/2 && Math.abs(mouseY - region.y) < region.h/2){
                    // if (screen_vars.dropdown == null || Math.abs(screen_vars.dropdown.x - region.x) >= region.w || Math.abs(screen_vars.dropdown.y - region.y) >= region.h) {
                    //     screen_vars.dropdown = new DropDown({x:mouseX, y:mouseY, options:["Input", "Output", "Unit"]});
                    // }

                    //Put down selection

                    var tab_panel = this.tabbed_panels[2][0];
                    //Units
                    var cur_tab = tab_panel.cur_tab;
                    //
                    var selection = tab_panel.tab_items[cur_tab][0].state;
                    if (selection != -1){
                        var selection_type = tab_panel.tab_items[cur_tab][0].options[selection];

                        if (cur_tab == "Modules") {
                            var mod = copyObject(ECS.blueprints.modules[selection_type]);

                            //Add module to base plate of appendage
                            var row = ~~(i / temp_module_w);
                            var col = i % temp_module_w;

                            if (row + mod.height <= temp_appendage.height && col + mod.width <= temp_appendage.width && highlight_color == "rgba(0, 255, 0, 0.5)"){
                                mod.pos.x = col;
                                mod.pos.y = row;
                                temp_appendage.modules.push(mod);
                            }

                        } else if (cur_tab == "Weapons"){
                            var weapon = copyObject(ECS.blueprints.weapons[selection_type]);

                            //Add module to base plate of appendage
                            var row = ~~(i / temp_module_w);
                            var col = i % temp_module_w;

                            if (row + weapon.height <= temp_appendage.height && col + weapon.width <= temp_appendage.width && highlight_color == "rgba(0, 255, 0, 0.5)"){
                                weapon.pos.x = col;
                                weapon.pos.y = row;
                                temp_appendage.weapons.push(weapon);
                            }
                        } else if (cur_tab == "Utilities"){
                            var row = ~~(i / temp_module_w);
                            var col = i % temp_module_w;
                            if (selection_type == "Energy Sink"){
                                var util = copyObject(ECS.blueprints.utilities[selection_type]);


                                if (row + util.height <= temp_appendage.height && col + util.width <= temp_appendage.width && highlight_color == "rgba(0, 255, 0, 0.5)"){
                                    util.pos.x = col;
                                    util.pos.y = row;
                                    temp_appendage.sinks.push(util);
                                }
                            } else if (selection_type == "Joint"){
                                var util = copyObject(ECS.blueprints.utilities[selection_type]);

                                //Add module to base plate of appendage


                                if (row + util.height <= temp_appendage.height && col + util.width <= temp_appendage.width && highlight_color == "rgba(0, 255, 0, 0.5)"){
                                    util.pos.x = col;
                                    util.pos.y = row;
                                    temp_appendage.joints.push(util);
                                }
                            } else if (selection_type == "Connector"){
                                if (temp_connector.mod1 != null){
                                    //Insert input module and edge and add it to appendage
                                    var sides = checkSides(temp_appendage, col, row);
                                    if (sides != null){
                                        var output_obj = sides[0];
                                        var output_edge = sides[1];
                                        //Make sure the input edge doesn't overlap with output edge
                                        if (output_obj.pos.x != temp_connector.mod1.pos.x || output_obj.pos.y != temp_connector.mod1.pos.y){
                                            temp_connector.mod2 = output_obj;
                                            temp_connector.edge2 = output_edge;
                                            var new_conn = Connector(temp_connector.mod1, temp_connector.edge1, temp_connector.mod2, temp_connector.edge2);
                                            temp_appendage.connectors.push(new_conn);
                                            //Reset temp_connector
                                            temp_connector.mod1 = null;
                                            temp_connector.edge1 = null;
                                            temp_connector.mod2 = null;
                                            temp_connector.edge2 = null;
                                        }

                                    }
                                } else {
                                    //Insert output module and edge and add it to appendage
                                    var sides = checkSides(temp_appendage, col, row);
                                    if (sides != null){
                                        var output_obj = sides[0];
                                        var output_edge = sides[1];
                                        temp_connector.mod1 = output_obj;
                                        temp_connector.edge1 = output_edge;
                                        temp_connector.mod2 = null;
                                        temp_connector.edge2 = null;
                                    }
                                }
                                console.log(temp_connector)
                            }
                        }
                        //tab_panel.tab_items[cur_tab][0].state = -1;
                        console.log(temp_appendage)
                    }
                    //}
                }
            }

       }

       if (screen_vars.dropdown != null && screen_vars.dropdown.output != "") {
            //Add to page items

            screen_vars.dropdown = null;
       }

   }
   handleMouseHover(mouseX, mouseY){
       for (var i = 0; i < this.buttons.length; i++){
           this.buttons[i].handleMouseHover(mouseX, mouseY);
       }
       //Non-button clickables
       for (var i = 0; i < this.clickables[screen_vars.page].length; i++){
           this.clickables[screen_vars.page][i].handleMouseHover(mouseX, mouseY);
       }
       for (var i = 0; i < this.tabbed_panels[screen_vars.page].length; i++){
           this.tabbed_panels[screen_vars.page][i].handleMouseHover(mouseX, mouseY);
       }
       if (screen_vars.dropdown != null) screen_vars.dropdown.handleMouseHover(mouseX, mouseY);

       if (screen_vars.page == 2){
           //Check if current selection overlaps with anything else
           var left = this.mid_w - block_width * temp_module_w / 2;
           var top = this.mid_h - 200 + 25 + 40;
           var x = ~~((mouseX - left) / block_width);
           var y = ~~((mouseY - top) / block_width);
           if (x >= 0 && x < temp_module_w && y >= 0 && y < temp_module_h){
               var tab_panel = this.tabbed_panels[2][0];
               //Units
               var cur_tab = tab_panel.cur_tab;
               //
               var selection = tab_panel.tab_items[cur_tab][0].state;
               if (selection != -1){
                   var selection_type = tab_panel.tab_items[cur_tab][0].options[selection];
                   var obj = null;
                   if (cur_tab == "Modules") {
                       obj = ECS.blueprints.modules[selection_type];
                   } else if (cur_tab == "Weapons"){
                       obj = ECS.blueprints.weapons[selection_type];
                   } else if (cur_tab == "Utilities"){
                       if (selection_type != "Connector"){
                           obj = ECS.blueprints.utilities[selection_type];
                           var overlaps = checkOverlaps(temp_appendage, obj, x, y);
                           if (!overlaps) {
                               highlight_color = "rgba(0, 255, 0, 0.5)";
                           } else {
                               highlight_color = "rgba(255, 0, 0, 0.5)";
                           }
                       } else {
                           //if (temp_appendage.modules.length > 0) debugger;
                           var sides = checkSides(temp_appendage, x, y);
                           if (sides != null){
                               var output_obj = sides[0];
                               var output_edge = sides[1];
                               highlight_color = "rgba(0, 255, 0, 0.5)";
                           } else {
                               highlight_color = "rgba(255, 0, 0, 0.5)";
                           }
                       }
                   }

               }

           }

       }
   }
   load(){
      //style relevant textfields
      Assets.name_field.style.visibility = "visible";
      Assets.name_field.style.left = (Assets.canvas.width / 2 - 100) + "px";
      Assets.name_field.style.top= (this.mid_h - 300) + "px";
      Assets.name_field.style.fontFamily = "gameFont";

      Assets.module_w.style.left = (Assets.canvas.width / 2 - 200) + "px";
      Assets.module_w.style.top= (this.mid_h - 250) + "px";
      Assets.module_w.style.fontFamily = "gameFont";

      Assets.module_h.style.left = (Assets.canvas.width / 2 - 100) + "px";
      Assets.module_h.style.top= (this.mid_h - 250) + "px";
      Assets.module_h.style.fontFamily = "gameFont";

      Assets.gl.style.zIndex = 0;
   }
   unload(){
      Assets.name_field.style.visibility = "hidden";
   }
   screenXY(x, y){
       return {x: this.mid_w + block_width * (x - temp_module_w / 2), y: this.mid_h - 200 + 25 + block_width * y + 40};
   }
   screenXY_inverse(screen_x, screen_y){
       var x = (screen_x - this.mid_w) / block_width + temp_module_w / 2;
       var y = (screen_y - this.mid_h + 200 - 25 - 40) / block_width;
       return {x: ~~x, y: ~~y};
   }
}



function getSide(obj, x, y){
    if (x == obj.pos.x && y >= obj.pos.y + 1 && y < obj.pos.y + obj.height){ //West side
        return [obj, "west"];
    } else if (x == obj.pos.x + obj.width - 1 && y >= obj.pos.y && y < obj.pos.y + obj.height - 1){ //East side
        return [obj, "east"];
    } else if (y == obj.pos.y && x >= obj.pos.x && x < obj.pos.x + obj.width - 1){ //North side
        return [obj, "north"];
    } else if (y == obj.pos.y + obj.width - 1 && x >= obj.pos.x + 1 && x < obj.pos.x + obj.width){ //South side
        return [obj, "south"];
    }
    return null;
}

//Check sides for possible slots for connectors:
//Need to check - modules, weapons, sinks
//Return the recommended side
function checkSides(ap, x, y){
    var side = null;
    for (const mod of ap.modules){
        side = getSide(mod, x, y);
        if (side != null) return side;
    }

    for (const w of ap.weapons){
        side = getSide(w, x, y);
        if (side != null) return side;
    }

    for (const s of ap.sinks){
        side = getSide(s, x, y);
        if (side != null) return side;
    }
    return null;
}

function checkOverlaps(ap, obj, x, y){
    //var overlap = false;
    for (const mod of ap.modules){
        if (rectvrect({x: x, y: y, w: obj.width, h: obj.height}, {x: mod.pos.x, y: mod.pos.y, w: mod.width, h: mod.height})) return true;
    }

    for (const b of ap.batteries){
        if (rectvrect({x: x, y: y, w: obj.w, h: obj.h}, {x: b.pos.x, y: b.pos.y, w: 1, h: 1})) return true;
    }

    //Connectors
    for (const con of ap.connectors){
    }

    for (const w of ap.weapons){
        if (rectvrect({x: x, y: y, w: obj.width, h: obj.height}, {x: w.pos.x, y: w.pos.y, w: w.width, h: w.height})) return true;
    }

    //Sinks (1 x 1)
    for (const s of ap.sinks){

    }

    //joints
    for (const j of ap.joints){

    }
    return false;
}

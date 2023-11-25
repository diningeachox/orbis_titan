import {Scene, SceneManager, changeScene, screen_vars} from "../scenes.js";
import {game, game_scene} from "../game.js";
import * as Assets from '../assets.js';
import {Button, DropDown, Region} from "../button.js";
import {playSound} from "../sound.js";

//Variables from assets.js
var canvas = Assets.canvas;
var overlay = Assets.overlay;
var c = Assets.c;
var ol = Assets.ol;

/***
Subscenes for market mode

Pages:
- resource market
- scrap cells
- scrap modules
***/

export class MarketScene extends Scene {
   constructor(){
     super();
     this.name = "ins";

     this.titles = ["Resources", "Scrap cells", "Scrap modules"];
     //Buttons
     var resource_button = new Button({x: 110, y:100, width:200, height:50, label:"Resources",
           onClick: function(){
               screen_vars.page = 0;
               screen_vars.dropdown = null;
               playSound(sfx_sources["button_click"].src, sfx_ctx);
           }
          });

    var scrap_cells_button = new Button({x: 110, y:170, width:200, height:50, label:"Scrap cells",
          onClick: function(){
              screen_vars.page = 1;
              screen_vars.dropdown = null;
              playSound(sfx_sources["button_click"].src, sfx_ctx);
          }
         });

     var scrap_modules_button = new Button({x: 110, y:240, width:200, height:50, label:"Scrap modules",
           onClick: function(){
               screen_vars.page = 2;
               screen_vars.dropdown = null;
               playSound(sfx_sources["button_click"].src, sfx_ctx);
           }
          });
    var back_button = new Button({x: 110, y:Assets.canvas.height - 100, width:200, height:50, label:"Back",
           onClick: function(){
               changeScene(game_scene);
               playSound(sfx_sources["button_click"].src, sfx_ctx);
           }
      });
     this.buttons = [back_button, resource_button, scrap_cells_button, scrap_modules_button];
     this.mid_w = Assets.canvas.width / 2;
     this.mid_h = Assets.canvas.height / 2;


      //Further clickables
      this.clickables = {0:[], 1:[], 2:[], 3:[], 4:[]};
      screen_vars.dropdown = null;
      this.regions = {0:[], 1:[], 2:[], 3:[], 4:[]};

      //Cell page buttons
      var buy_button = new Button({x: Assets.canvas.width / 2 - 100, y:Assets.canvas.height - 100, width:200, height:50, label:"Buy",
            onClick: function(){
                playSound(sfx_sources["button_click"].src, sfx_ctx);
            }
           });
      this.clickables[0].push(buy_button);
      this.clickables[1].push(buy_button);
      this.clickables[2].push(buy_button);

      //Cell page regions

      //Module page buttons
   }
   update(delta) {

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
       //Interfaces for the different pages

       if (screen_vars.page == 0){

       } else if (screen_vars.page == 1){
          //Module page
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


       if (screen_vars.dropdown != null) {
          screen_vars.dropdown.handleMouseClick(mouseX, mouseY);
       } else {

       }

       for (var i = 0; i < this.regions[screen_vars.page].length; i++){
            var region = this.regions[screen_vars.page][i];
            if (Math.abs(mouseX - region.x) < region.w && Math.abs(mouseY - region.y) < region.h){

                screen_vars.dropdown = new DropDown({x:mouseX, y:mouseY, options:["Input", "Output", "Unit"]});

            }
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
       if (screen_vars.dropdown != null) screen_vars.dropdown.handleMouseHover(mouseX, mouseY);
   }
   unload(){
   }
}

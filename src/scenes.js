import * as Assets from './assets.js';
import * as Game from "./game.js";
import {Button} from "./button.js";
import {playSound} from "./sound.js";

//Variables from assets.js
var canvas = Assets.canvas;
var overlay = Assets.overlay;
var c = Assets.c;
var ol = Assets.ol;


export const screen_vars = {page:0, dropdown:null};

export class SceneManager {
    constructor(){
        this.cur_scene = null;
    }
    update(delta){
        this.cur_scene.update(delta);
    }
    render(delta){
        this.cur_scene.render(delta);
    }
}

//Abstract scene class
export class Scene {
  constructor() {
    if (this.constructor == Scene) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.buttons = [];
  }

  update(delta) {
    throw new Error("Method 'update()' must be implemented.");
  }

  render(delta) {
    throw new Error("Method 'render()' must be implemented.");
  }

  handleMouseClick(mouseX, mouseY){
      for (var i = 0; i < this.buttons.length; i++){
          this.buttons[i].handleMouseClick(mouseX, mouseY);
      }
  }
  handleMouseHover(mouseX, mouseY){
      for (var i = 0; i < this.buttons.length; i++){
          this.buttons[i].handleMouseHover(mouseX, mouseY);
      }
  }

  load() {
    for (var i = 0; i < this.buttons.length; i++){
        this.buttons[i].hover = 0;
    }
  }

  unload() {
    throw new Error("Method 'unload()' must be implemented.");
  }
}

var frame = 0;
/**
 * Menu class, extends Scene class
 */
export class Menu extends Scene {
    constructor(){
      super();
      this.name = "menu";
      //Clicking play will change scene from "menu" to "game"
      var play_button = new Button({x: canvas.width / 2, y:canvas.height - 250, width:150, height:50, label:"Play",
            onClick: function(){
                changeScene(Game.game_scene);
                playSound(sfx_sources["button_click"].src, sfx_ctx);
            }
           });
      var ins_button = new Button({x: canvas.width / 2, y:canvas.height - 150, width:150, height:50, label:"Credits",
            onClick: function(){
                changeScene(Game.ins_scene);
                playSound(sfx_sources["button_click"].src, sfx_ctx);
            }
          });
      this.buttons = [play_button, ins_button];
      this.frame = 0;
    }
    update(delta) {frame++;}
    render(delta){
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = "beige";
        c.fillRect(0, 0, canvas.width, canvas.height);


        var img = images["title"];
        c.drawImage(img, (canvas.width - canvas.height) / 2, 0, canvas.height, canvas.height);
        var r = (canvas.width - canvas.height) / (2 * canvas.width);
        var gradient = c.createLinearGradient(0, 0, canvas.width, 0);
        // Add three color stops
        gradient.addColorStop(0, "rgba(0, 0, 0, 1.0)");
        gradient.addColorStop(r, "rgba(0, 0, 0, 1.0)");
        gradient.addColorStop(0.5, "rgba(0, 0, 0, "+ (Math.sin(frame / 40) * 0.1 + 0.1) +")");
        gradient.addColorStop(1 - r, "rgba(0, 0, 0, 1.0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 1.0)");
        c.fillStyle = gradient;
        c.fillRect(0, 0, canvas.width, canvas.height);

        gradient = c.createLinearGradient(0, 0, (canvas.width - canvas.height) / 2 + 10, 0);
        // Add three color stops
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 1.0)");
        c.fillStyle = gradient;
        c.fillRect(0, 0, (canvas.width - canvas.height) / 2, canvas.height);

        gradient = c.createLinearGradient(canvas.width - (canvas.width - canvas.height) / 2 - 10, 0, canvas.width, 0);
        // Add three color stops
        gradient.addColorStop(0, "rgba(0, 0, 0, 1.0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.0)");
        c.fillStyle = gradient;
        c.fillRect(canvas.width - (canvas.width - canvas.height) / 2, 0, (canvas.width - canvas.height) / 2, canvas.height);


        //c.drawImage(img, 0, 0, canvas.height, canvas.height);
        //title
        c.font="70px titleFont";
        c.fillStyle = "white";
        c.textAlign = "center";
        c.fillText("orbis titan", canvas.width/2, 100);

        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(c);
        }
    }
    unload(){
    }
}

/**
 * Game class, extends Scene class
 */
export class GameScene extends Scene {
    constructor(game){
      super();
      this.name = "game";
      //Current Game
      this.game = game;
      //Buttons
      var menu_button = new Button({x: 100, y:50, width:150, height:50, label:"Menu",
            onClick: function(){
                changeScene(Game.menu);
                playSound(sfx_sources["button_click"].src, sfx_ctx);
            }
           });

      var schedule_button = new Button({x: canvas.width / 2 - 300, y:canvas.height - 100, width:150, height:50, label:"Mining",
             onClick: function(){
                 changeScene(Game.build_scene);
                 playSound(sfx_sources["button_click"].src, sfx_ctx);
             }
            });

      var market_button = new Button({x: canvas.width / 2 - 100, y:canvas.height - 100, width:150, height:50, label:"Market",
            onClick: function(){
                changeScene(Game.market_scene);
                playSound(sfx_sources["button_click"].src, sfx_ctx);
            }
           });

      var build_button = new Button({x: canvas.width / 2 + 100, y:canvas.height - 100, width:150, height:50, label:"Build",
            onClick: function(){
                changeScene(Game.build_scene);
                playSound(sfx_sources["button_click"].src, sfx_ctx);
            }
           });
       var battle_button = new Button({x: canvas.width / 2 + 300, y:canvas.height - 100, width:150, height:50, label:"Battle",
             onClick: function(){
                 changeScene(Game.build_scene);
                 playSound(sfx_sources["button_click"].src, sfx_ctx);
             }
            });
      this.buttons = [menu_button, schedule_button, market_button, build_button, battle_button];
    }
    update(delta) {
        this.game.update(delta);
    }
    render(delta){

        c.clearRect(0, 0, canvas.width, canvas.height);
        this.game.render(delta);
        //Buttons
        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(c);
        }
    }
    load(){
        super.load();
        overlay.style.zIndex = 4;
        gl.style.zIndex = 8;
    }
    unload(){
        //this.game = null;
    }
}

/**
 * Game class, extends Scene class
 */
export class Ins extends Scene {
    constructor(){
      super();
      this.name = "ins";
      //Buttons
      var menu_button = new Button({x: canvas.width / 2, y:canvas.height - 100, width:150, height:50, label:"Back",
            onClick: function(){
                changeScene(Game.menu);
                playSound(sfx_sources["button_click"].src, sfx_ctx);
            }
           });

     var play_button = new Button({x: canvas.width / 2, y:200, width:150, height:50, label:"Play",
           onClick: function(){
               changeScene(Game.game_scene);
               playSound(sfx_sources["button_click"].src, sfx_ctx);
           }
          });
      this.buttons = [menu_button, play_button];
    }
    update(delta) {
      frame++;
    }
    render(delta){
        c.clearRect(0, 0, canvas.width, canvas.height);

        var img = images["title"];
        c.drawImage(img, (canvas.width - canvas.height) / 2, 0, canvas.height, canvas.height);
        var r = (canvas.width - canvas.height) / (2 * canvas.width);
        var gradient = c.createLinearGradient(0, 0, canvas.width, 0);
        // Add three color stops
        gradient.addColorStop(0, "rgba(0, 0, 0, 1.0)");
        gradient.addColorStop(r, "rgba(0, 0, 0, 1.0)");
        gradient.addColorStop(0.5, "rgba(0, 0, 0, "+ (Math.sin(frame / 40) * 0.1 + 0.1) +")");
        gradient.addColorStop(1 - r, "rgba(0, 0, 0, 1.0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 1.0)");
        c.fillStyle = gradient;
        c.fillRect(0, 0, canvas.width, canvas.height);

        gradient = c.createLinearGradient(0, 0, (canvas.width - canvas.height) / 2 + 10, 0);
        // Add three color stops
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 1.0)");
        c.fillStyle = gradient;
        c.fillRect(0, 0, (canvas.width - canvas.height) / 2, canvas.height);

        gradient = c.createLinearGradient(canvas.width - (canvas.width - canvas.height) / 2 - 10, 0, canvas.width, 0);
        // Add three color stops
        gradient.addColorStop(0, "rgba(0, 0, 0, 1.0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.0)");
        c.fillStyle = gradient;
        c.fillRect(canvas.width - (canvas.width - canvas.height) / 2, 0, (canvas.width - canvas.height) / 2, canvas.height);


        //c.drawImage(img, 0, 0, canvas.height, canvas.height);
        //title
        c.font="70px titleFont";
        c.fillStyle = "white";
        c.textAlign = "center";
        c.fillText("credits", canvas.width/2, 100);

        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(c);
        }
    }
    unload(){
    }
}

//Change scenes
export function changeScene(new_scene){

    if (sm.cur_scene != null) sm.cur_scene.unload();
    new_scene.load();
    sm.cur_scene = new_scene;
}


// A pause scene, but more convenient to not put it into a class
export function drawPause(){

    ol.clearRect(0, 0, overlay.width, overlay.height);
    ol.fillStyle = "rgba(0, 0, 0, 0.5)"; //Transparent black
    ol.fillRect(0, 0, overlay.width, overlay.height);
    ol.font = "50px arial";
    ol.fillStyle = "black";
    ol.fillText("PAUSED", overlay.width / 2 - 100, overlay.height / 2);

}

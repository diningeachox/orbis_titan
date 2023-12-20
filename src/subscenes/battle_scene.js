import {Scene, SceneManager, changeScene, screen_vars} from "../scenes.js";
import {game, game_scene, build_scene} from "../game.js";
import * as Assets from '../assets.js';
import {Button, DropDown, Region, TabbedPanel, StateMenu, IconMenu} from "../button.js";
import {playSound} from "../sound.js";
import {resource_colours, formulas, keys, char_keys} from "../gameObjects/resource.js";
import {isNum, copyObject, l2_dist_squared} from "../utils.js";
import {rectvrect} from "../collision.js";
import {Chip, ChipFactory} from "../gameObjects/cell.js";
import {Module, ModuleFactory, Connector, calcEdge} from "../gameObjects/module.js";
import {Battery} from "../gameObjects/battery.js";
import {blurCircle, draw_appendage_gl} from "../gameObjects/titan.js";
import {Vector2D} from "../vector2D.js";
import {updateAppendage} from "../system.js";
import {GL_Renderer} from "../renderer/gl_renderer.js";

//Variables from assets.js
var canvas = Assets.canvas;
var overlay = Assets.overlay;
var c = Assets.c;
var ol = Assets.ol;


export class BattleScene extends Scene {
    constructor(){
      super();
      this.name = "ins";
      this.frame = 0;
      //Buttons
      var back_button = new Button({x: canvas.width / 2 - 50, y:canvas.height - 100, width:300, height:100, label:"Back",
            onClick: function(){
                game.battle = false;
                changeScene(game_scene);
                playSound(sfx_sources["button_click"].src, sfx_ctx);
            }
           });

     var battle_button = new Button({x: canvas.width / 2 + 300, y:canvas.height - 100, width:300, height:100, label:"Start Battle",
           onClick: function(){
               game.battle = true;
               game.result = -1;
               Assets.gl.width = window.innerWidth;
               Assets.gl.height = window.innerHeight;
               Assets.gl.style.left = "0px";
               Assets.gl.style.top = "0px";
               renderer.resize();
               changeScene(game_scene);
               playSound(sfx_sources["button_click"].src, sfx_ctx);
           }
          });
      this.buttons = [back_button, battle_button];
    }
    update(delta) {
        this.frame++;
    }
    render(delta){
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = "black";
        c.fillRect(0, 0, canvas.width, canvas.height);

        c.drawImage(images["p1"], 0, canvas.height / 4, canvas.width / 3, canvas.height / 2);
        c.drawImage(images["p2"], 2 * canvas.width / 3, canvas.height / 4, canvas.width / 3, canvas.height / 2);

        //title
        c.font="70px titleFont";
        c.fillStyle = "white";
        c.textAlign = "center";
        c.fillText("upcoming matchup", canvas.width/2, 100);

        c.drawImage(images["vs"], canvas.width/2 - 200, canvas.height/2 - 200, 400, 400);

        for (var i = 0; i < this.buttons.length; i++){
            this.buttons[i].draw(c);
        }
    }
    unload(){
    }
}

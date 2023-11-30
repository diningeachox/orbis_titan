import {Scene, SceneManager, changeScene, screen_vars} from "../scenes.js";
import {game, game_scene, build_scene, renderer} from "../game.js";
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

export class BattleScene extends Scene {
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

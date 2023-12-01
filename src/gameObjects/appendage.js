import {Cell, Router} from "./cell.js";
import {Module} from "./module.js";
import * as Assets from '../assets.js';
import {Vector2D} from "../vector2D.js";
import {isNum, uuidv4} from "../utils.js";

import {resource_colours, formulas, keys, char_keys} from "./resource.js";

const Shell = (w, h, shape) => {
    return {width: w, height: h, shape: shape};
}
/**
A movable part of the titan, made up of a shell on the outside and
modules on the inside
**/
const Appendage = (config) => {
    var id = uuidv4();
    var shell = [];
    //HP for each grid
    var grid_hp = config.hp || 50;
    for (var i = 0; i < config.width * config.height; i++){
        shell.push(grid_hp);
    }
    return {width: config.width, height: config.height,
      shell: shell,
      modules: config.modules,
      batteries: config.batteries,
      weapons: config.weapons,
      connectors: config.connectors,
      sinks: config.sinks,
      joints: config.joints,
      id: id,
      children: config.children || [],
      pos: config.pos,
      angle: config.angle || 0,
      weight: 0,
      quanta: [],
      torso: false,
      color: [1.0, 0.0, 0.0]
    };
}

export function calcWeight(ap){

}

const Torso = (config) => {
    var obj = Appendage(config);
    obj.torso = true;
    return obj;
}

function createAppendageImage(ap, block_width){

    var newCanvas = document.createElement('canvas');
    newCanvas.width = ap.width * block_width;
    newCanvas.height = ap.height * block_width;
    var ctx = newCanvas.getContext('2d');


    //First draw appendage base tiles
    for (var i = 0; i < ap.height; i++){
        for (var j = 0; j < ap.width; j++){
            ctx.drawImage(images["appendage_tile"], j * block_width, i * block_width, block_width, block_width);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.strokeRect(j * block_width, i * block_width, block_width, block_width);
        }
    }
    //Batteries (under everything)
    for (const b of ap.batteries){
        var color = resource_colours[b.type];

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.roundRect(b.pos.x * block_width, b.pos.y * block_width, block_width, block_width, block_width / 5);
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.roundRect(b.pos.x * block_width, b.pos.y * block_width, block_width, block_width, block_width / 5);
        ctx.stroke();
        ctx.fill();
    }

    //Modules
    for (const mod of ap.modules){
        var img = images[mod.name];
        ctx.drawImage(img, mod.pos.x * block_width, mod.pos.y * block_width, block_width * mod.width, block_width * mod.width * img.height / img.width);
    }

    //Connectors
    for (const c of ap.connectors){
        //output edge
        ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.roundRect(c.output_edge[0].x * block_width, c.output_edge[0].y * block_width, (c.output_edge[1].x - c.output_edge[0].x + 1) * block_width, (c.output_edge[1].y - c.output_edge[0].y + 1) * block_width, 5);
        //ctx.stroke();
        ctx.fill();

        //input edge
        ctx.fillStyle = "rgba(255, 0, 255, 0.6)";
        ctx.beginPath();
        ctx.roundRect(c.input_edge[0].x * block_width, c.input_edge[0].y * block_width, (c.input_edge[1].x - c.input_edge[0].x + 1) * block_width, (c.input_edge[1].y - c.input_edge[0].y + 1) * block_width, 5);
        //ctx.stroke();
        ctx.fill();

        //Bezier curves as wires
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.lineWidth = 5;
        var cp1 = {x: (c.output_edge[0].x + c.output_edge[1].x + 0.5) * block_width / 2.0, y: (c.output_edge[0].y + c.output_edge[1].y + 0.5) * block_width / 2.0};
        var cp2 = {x: (c.input_edge[0].x + c.input_edge[1].x + 0.5) * block_width / 2.0, y: (c.input_edge[0].y + c.input_edge[1].y + 0.5) * block_width / 2.0};
        ctx.beginPath();
        ctx.moveTo((c.output_edge[0].x + 0.5) * block_width, (c.output_edge[0].y + 0.5) * block_width);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (c.input_edge[0].x + 0.5) * block_width, (c.input_edge[0].y + 0.5) * block_width);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((c.output_edge[1].x + 0.5) * block_width, (c.output_edge[1].y + 0.5) * block_width);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (c.input_edge[1].x + 0.5) * block_width, (c.input_edge[1].y + 0.5) * block_width);
        ctx.stroke();
    }

    //Weapons
    for (const w of ap.weapons){
        var img = images[w.type];
        var angle = Math.PI / 2 * w.orientation;
        ctx.translate(w.pos.x * block_width, w.pos.y * block_width);
        ctx.rotate(angle);
        ctx.drawImage(img, 0, 0, block_width * w.width, block_width * w.width * img.height / img.width);
        ctx.rotate(-angle);
        ctx.translate(-w.pos.x * block_width, -w.pos.y * block_width);
    }

    //Sinks (1 x 1)
    for (const s of ap.sinks){
        ctx.drawImage(images["reactor"], s.pos.x * block_width, s.pos.y * block_width, s.width * block_width, s.height * block_width);
    }

    //joints
    for (const j of ap.joints){
        ctx.drawImage(images["joint-hinge"], j.pos.x * block_width, j.pos.y * block_width, j.width * block_width, j.height * block_width);
    }

    //Add sprite to image array
    var image_data = newCanvas.toDataURL();
    images[ap.id] = document.createElement('img');
    images[ap.id].src = image_data;
    newCanvas.remove();

    console.log("Created image for appendage " + ap.id +"!")
}

export {Shell, Appendage, Torso, createAppendageImage};

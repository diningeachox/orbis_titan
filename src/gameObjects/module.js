import {Cell, Router, Grid, ChipFactory, createChipImage} from "./cell.js";
import {Vector2D} from "../vector2D.js";
import {isNum, uuidv4} from "../utils.js";
import * as Assets from '../assets.js';
import {resource_colours, formulas, keys, char_keys} from "./resource.js";
/**
A module must contain an output and at least one input.
An aggregate of smaller cells and routers.
**/
const Module = (w, h, config={}) => {
    var plate = [];
    for (var i = 0; i < h; i++){
        for (var j = 0; j < w; j++){
            plate.push(Grid(0, 0, 0, 0));
        }
    }
    return {name: config.name, width: w, height: h, output_loc: [], input_loc: [], orientation: 0, pos: new Vector2D(0, 0), interface: plate, out_edge: {old:0, current:0} };
}

const conn_edges = {north: {x: 0, y: -1}, south: {x:0, y:1}, west:{x:-1, y:0}, east:{x:1, y:0}};
/**
Each module outputs heterogeneous resources. Connectors sort them out and optimizes
them into the input of the next module.

Must go from output edge --> input edge
**/
const Connector = (mod1, edge1, mod2, edge2) => {
    //Connect the two modules
    var mod1_edge = conn_edges[edge1];
    var mod2_edge = conn_edges[edge2];

    //Format: starting point, ending point
    var output_edge = [{x:0, y:0}, {x:0, y:0}];
    var input_edge = [{x:0, y:0}, {x:0, y:0}];
    calcEdge(mod1, output_edge, edge1);
    calcEdge(mod2, input_edge, edge2);
    return {output_edge: output_edge, input_edge: input_edge, source: {obj: mod1, edge: edge1}, target: {obj: mod2, edge: edge2}};
}

const Weapon = (config) => {
    var storage = {};
    for (const key of Object.keys(resource_colours)){
        if (key.includes("projectile")) storage[key] = 0;
    }
    return {ammo: storage, type: config.type, pos: config.pos, width: config.width, height: config.height, orientation: config.orientation, weight: config.weight};
}

const Joint = (x, y) => {
    return {pos: {x:x, y:y}, width: 1, height: 3, linked: false, partner: null};
}

const Sink = (x, y) => {
    var storage = {};
    for (const key of Object.keys(resource_colours)){
        storage[key] = 0;
    }
    return {storage: storage, pos: {x:x, y:y}, width: 3, height: 3, control: false};
}

const Mainframe = (x, y) => {
    var storage = {};
    for (const key of Object.keys(resource_colours)){
        storage[key] = 0;
    }
    return {storage: storage, pos: {x:x, y:y}, width: 6, height: 6, control: true};
}

const ModuleFactory = (w, h, data = [], name = "") => {
    if (name == "") name = uuidv4();
    var new_module = Module(w, h, {name:name});

    //new_module.interface = data.slice();

    for (var i = 0; i < new_module.interface.length; i++){
        if (data[i].length == 16) {
            //Chip
            new_module.interface[i].obj = ChipFactory(data[i]);
        } else if (data[i].length > 0){
            new_module.interface[i].wires = data[i];
        }
    }

    console.log(JSON.stringify(new_module));

    return new_module;
}

export function drawModule(c, module_dict, mult=25){
    //Draw motherboard according to module dimensions set in textboxes
    var rows = module_dict.height;
    var cols = module_dict.width;
    c.strokeStyle = "green";
    for (var i = 0; i < rows; i++){
        for (var j = 0; j < cols; j++){
            c.fillStyle = "#ededed";
            c.beginPath();
            c.roundRect(80 * mult * j, 80 * mult  * i, 80 * mult, 80 * mult, 10);
            c.stroke();
            c.fill();
            c.drawImage(images["Mesh"], 80 * j * mult, 80 * i * mult, 80 * mult, 80 * mult);
            //Draw objects
            var index = cols * i + j;
            var grid = module_dict.interface[index];

            if (grid.wires != ""){
                if (images.hasOwnProperty(grid.wires)){
                    c.drawImage(images[grid.wires], 80 * j * mult, 80 * i * mult, 80 * mult, 80 * mult);
                }
            } else if (grid.obj != null){
                var chip = grid.obj;
                //debugger;
                if (!images.hasOwnProperty(chip.str)){
                    createChipImage(chip);
                }
                c.drawImage(images[chip.str], 80 * j * mult, 80 * i * mult, 80 * mult, 80 * mult);
            }
        }
    }

}

export function createModuleImage(module_dict){
    var mult = 25;
    var mid_w = Assets.canvas.width / 2;
    var mid_h = Assets.canvas.height / 2;
    var newCanvas = document.createElement('canvas');
    newCanvas.width = module_dict.width * 80 * mult;
    newCanvas.height = module_dict.height * 80 * mult;
    var newContext = newCanvas.getContext('2d');
    drawModule(newContext, module_dict, mult);
    //newContext.drawImage(Assets.canvas, mid_w - 200, mid_h - 200, 400, 400, 0, 0, 400, 400);
    //Add sprite to image array
    var image_data = newCanvas.toDataURL();
    images[module_dict.name] = document.createElement('img');
    images[module_dict.name].src = image_data;

    newCanvas.remove();

    console.log("Created image for module " + module_dict.name +"!")
    console.log(images)
}

function loadModule(dict){

}

function calcEdge(m, edge_pos, edge){
    if (edge == "north"){
        edge_pos[0].x = m.pos.x;
        edge_pos[0].y = m.pos.y - 1;
        edge_pos[1].x = m.pos.x + m.width - 1;
        edge_pos[1].y = m.pos.y - 1;
    } else if (edge == "south"){
        edge_pos[0].x = m.pos.x;
        edge_pos[0].y = m.pos.y + m.height;
        edge_pos[1].x = m.pos.x + m.width - 1;
        edge_pos[1].y = m.pos.y + m.height;
    } else if (edge == "west"){
        edge_pos[0].x = m.pos.x - 1;
        edge_pos[0].y = m.pos.y;
        edge_pos[1].x = m.pos.x - 1;
        edge_pos[1].y = m.pos.y + m.height - 1;
    } else if (edge == "east"){
        edge_pos[0].x = m.pos.x + m.width;
        edge_pos[0].y = m.pos.y;
        edge_pos[1].x = m.pos.x + m.width;
        edge_pos[1].y = m.pos.y + m.height - 1;
    }
}

export {Module, ModuleFactory, Weapon, Connector, Joint, Sink, Mainframe, calcEdge};

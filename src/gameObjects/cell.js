import {Vector2D} from "../vector2D.js";
import {Unit} from "./unit.js";
import {resource_colours, formulas, keys, char_keys} from "./resource.js";
import {isNum, uuidv4} from "../utils.js";
import * as Assets from '../assets.js';

export const Grid = (n, e, s, w) => {
    //1 - outgoing edge, 0 - nothing, -1 incoming edge
    return {
            edges:{north: n, east: e, south: s, west: w},
            wires: "", //9 possible configurations in each grid: L, Γ, ヿ, ⅃, |, ⼀
            obj: null,
            storage: []
          };
}

function chipCheck(str){

}

export const ChipFactory = (str, name = "") => {
    var storage = {};
    var capacity = {};
    var size = ~~Math.sqrt(str.length);
    var input_types = new Set([]);
    var output_type = null;
    var rates = {input: {west:0, north: 0, east:0, south:0}, output: {west:0, north: 0, east:0, south:0}};
    for (var i = 0; i < str.length; i++){
        var row = ~~(i / size);
        var col = i % size;
        var char = str.charAt(i);
        if (char != '.' && chip != 'x'){
            var type = char_keys[char];
            if (isNum(char)){
                //Unit
                if (!storage.hasOwnProperty(type)){
                    storage[type] = 0;
                }
                if (!capacity.hasOwnProperty(type)){
                    capacity[type] = 1;
                } else {
                    capacity[type] += 1;
                }
                input_types.add(type);
            } else {
               //Input/output

               if (row == 0){ //North
                  if (char == "i"){
                      rates.input.north+=1;
                  } else if (char == "o"){
                      rates.output.north+=1;
                  }
               } else if (row == size - 1){
                   if (char == "i"){
                       rates.input.south+=1;
                   } else if (char == "o"){
                       rates.output.south+=1;
                   }
               }
               if (col == 0){
                   if (char == "i"){
                       rates.input.west+=1;
                   } else if (char == "o"){
                       rates.output.west+=1;
                   }

               } else if (col == size - 1){
                   if (char == "i"){
                       rates.input.east+=1;
                   } else if (char == "o"){
                       rates.output.east+=1;
                   }
               }
            }
        }
    }
    //Create random hash as name
    if (name == ""){
        name = uuidv4();
    }
    //Create sprite procedurally
    var sprite = null;
    var config = {str: str, storage:storage, capacity:capacity, inputs:input_types, rates: rates, sprite: sprite, name:name};
    return Chip(config);
}

//Read a config string and make the object
export const Chip = (config) => {
    var output = [];
    if (config.inputs.size == 1){
        //Homogeneous resource
        output.push(Array.from(config.inputs)[0]);
    } else {
        output.push(formulas.get(Array.from(config.inputs).sort().join('-')));
    }
    return {str: config.str, storage: config.storage, capacity: config.capacity, inputs: config.inputs, output: output, rates: config.rates, name:config.name, pos: config.pos || new Vector2D(0, 0), orientation: config.orientation || 0, sprite: config.sprite || null, type: "chip"};
}

export function drawChip(c, chip_str, magnifier=1){
    //Cell page
    c.strokeStyle = "magenta";
    c.fillStyle = "#32527b";
    c.beginPath();
    c.roundRect(0, 0, 400 * magnifier, 400 * magnifier, 20 * magnifier);
    c.stroke();
    c.fill();


    c.strokeStyle = "gray";
    //Draw temp cell
    var size = ~~Math.sqrt(chip_str.length);
    for (var i = 0; i < chip_str.length; i++){
        var row = ~~(i / size);
        var col = i % size;
        var char = chip_str.charAt(i);
        if (char != 'x'){
            c.fillStyle = "gray";
            c.beginPath();
            c.roundRect((25 + 90 * col) * magnifier, (25 + 90 * row) * magnifier, 80 * magnifier, 80 * magnifier, 20 * magnifier);
            c.stroke();
            c.fill();
        }

        if (isNum(char)){
            c.drawImage(images[char_keys[char]],(25 + 90 * col + 10) * magnifier, (25 + 90 * row + 10) * magnifier, 60 * magnifier, 60 * magnifier);
        } else if (char != 'x' && char != '.'){
            c.drawImage(images[char_keys[char]], (25 + 90 * col) * magnifier, (25 + 90 * row) * magnifier, 80 * magnifier, 80 * magnifier);
        }
    }
}

export function createChipImage(chip){
    var mid_w = Assets.canvas.width / 2;
    var mid_h = Assets.canvas.height / 2;
    var newCanvas = document.createElement('canvas');
    newCanvas.width = 400 * 5;
    newCanvas.height = 400 * 5;
    var newContext = newCanvas.getContext('2d');
    drawChip(newContext, chip.str, 5);
    //newContext.drawImage(Assets.canvas, mid_w - 200, mid_h - 200, 400, 400, 0, 0, 400, 400);
    //Add sprite to image array
    var image_data = newCanvas.toDataURL();
    images[chip.name] = document.createElement('img');
    images[chip.name].src = image_data;

    images[chip.str] = document.createElement('img');
    images[chip.str].src = image_data;

    newCanvas.remove();

    console.log("Created image for chip " + chip.name +"!")
}

//Transforms input resources into output resources
const Cell = (config) => {
    //Inputs are always in E, S, W order (prior to rotation), i.e. clockwise starting from the first input edge
    var storage = {};
    var input_set = new Set();
    for (const [key, value] of Object.entries(config.inputs)){
        if (!storage.hasOwnProperty(value)) {
            input_set.add(value);
            storage[value] = 0;
        }
    }
    var output = [];
    if (input_set.size == 1){
        //Homogeneous resource
        output.push(Array.from(input_set)[0]);
    } else {
        output.push(formulas[input_set]);
    }
    return {storage: storage, inputs: config.inputs, output: output, pos: config.pos || new Vector2D(0, 0), orientation: config.orientation || 0, color: "#00ff004a", sprite: "circuit1", type: "cell"};
}


//One input, splits resource going through it in 3 equal parts (in the 3 other cardinal directions)
const Router = (config) => {
    var storage = {};
    var i = 0;
    var outputs = [];
    for (const [key, value] of Object.entries(config.inputs)){
        if (!storage.hasOwnProperty(value)) storage[value] = 0;
        if (i == 0) outputs.push(value);
        i++;
    }
    return {storage: storage, inputs: config.inputs, output: outputs, pos: config.pos || new Vector2D(0, 0), orientation: config.orientation || 0, color: "#ff00004a", sprite: "circuit2", type: "router"};
}

//Electrum and Pyrum as the two inputs on the side, any input from south. Output is an amplified factor of the south input
const Amplifier = (config) => {
    //Inputs are always in E, S, W order (prior to rotation), i.e. clockwise starting from the first input edge
    var storage = {};
    var input_set = new Set();
    for (const [key, value] of Object.entries(config.inputs)){
        if (!storage.hasOwnProperty(value)) {
            input_set.add(value);
            storage[value] = 0;
        }
    }
    var output = [];
    if (input_set.size == 1){
        //Homogeneous resource
        output.push(Array.from(input_set)[0]);
    } else {
        output.push(formulas[input_set]);
    }
    return {storage: storage, inputs: config.inputs, output: output, pos: config.pos || new Vector2D(0, 0), orientation: config.orientation || 0, color: "#ffff004a", sprite: "circuit1", type: "amplifier"};
}

//
const Wire = (config) => {
    return {start: config.start, end: config.end};
}

const WireFactory = (str) => {
    // Wiring: L, Γ, ヿ, ⅃, |, ⼀, ⅃Γ, Lヿ, |⼀
    var start = [];
    var end = [];
    if (str.indexOf("L") != -1){

    }
}

export {Cell, Router};

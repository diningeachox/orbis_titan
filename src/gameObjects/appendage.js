import {Cell, Router} from "./cell.js";
import {Module} from "./module.js";
import * as Assets from '../assets.js';
import {Vector2D} from "../vector2D.js";
import {isNum, uuidv4} from "../utils.js";

const Shell = (w, h, shape) => {
    return {width: w, height: h, shape: shape};
}
/**
A movable part of the titan, made up of a shell on the outside and
modules on the inside
**/
const Appendage = (config) => {
    var id = uuidv4();
    return {width: config.width, height: config.height,
      shell: config.shell,
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
      weight: 0
    };
}

export function calcWeight(ap){
    
}

const Torso = (config) => {
    return Appendage(config);
}

export {Shell, Appendage, Torso};

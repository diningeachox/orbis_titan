import {Vector2D} from "../vector2D.js";

export const Input = (type) => {
    return {type: type };
}

export const Output = (type) => {
    return {type: type };
}

export const Unit = (config) => {
    return {shape:config.shape, type:config.type, orientation: 0, pos: config.pos || new Vector2D(0, 0) };
}

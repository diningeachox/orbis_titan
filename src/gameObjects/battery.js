import {Cell, Router, Grid} from "./cell.js";
import {Vector2D} from "../vector2D.js";

export const Battery = (config) => {
    return {type: config.type, pos: config.pos, rate: config.rate, quantity: config.quantity };
}

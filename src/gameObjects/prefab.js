import {Cell, Router, Grid} from "./cell.js";
import {Vector2D} from "../vector2D.js";

//Cell with all 3 inputs sharing the same type
const HomogCell= (type) => {return Cell({inputs: {west: "electrum", east: "electrum", south: "electrum"}, output: ["electrum"], pos: new Vector2D(0, 2), orientation: 0});}

import {Vector2D} from "../vector2D.js";

/***
Resource types:

1st order (found in nature)
    Photum - From the Sun(s)
    Aquam - From the water
    Gravitum - From the earth
    Aetherium - From the wind

2nd Order
    Electrum - Supplies energy 1
    Pyrum - Supplies energy 2
    Plasmium - Supplies energy 3
    Rapidum - Controls speed
    Fortinium - Affects armor
    Vitalium - Affects HP

3rd Order
    (Projectile and ammo types, 4 2nd-order = 15)
    (Energy types, 3 2nd-order = 4)

***/

export const Quantum = (x, y, vx, vy, type, amount) => {
    return {pos: new Vector2D(x, y), origin: new Vector2D(x, y), vel: new Vector2D(vx, vy), type: type, amount: amount};
}

//Recipes for resource combinations
export const formulas = new Map();

//Formulas to make 2nd order resources
formulas.set("photum-aquam", "electrum");
formulas.set("aquam-photum", "electrum");

formulas.set("gravitum-photum", "fortinium");
formulas.set("photum-gravitum", "fortinium");

formulas.set("gravitum-aquam", "vitalium");
formulas.set("aquam-gravitum", "vitalium");

formulas.set("aetherium-aquam", "rapidum");
formulas.set("aetherium-photum", "pyrum");
formulas.set("aetherium-gravitum", "plasmium");



//Formulas for energy types
formulas.set("aquam-gravitum-photum", "energy1");
formulas.set("aetherium-gravitum-photum", "energy2");
formulas.set("aetherium-aquam-photum", "energy3");
formulas.set("aetherium-aquam-gravitum", "energy4");
// 3rd order resources
var second_order_res = ["electrum", "pyrum", "plasmium", "rapidum", "fortinium", "vitalium"];

var k = 1;
for (var i = 0; i < second_order_res.length; i++){
    for (var j = i + 1; j < second_order_res.length; j++){
        var temp = second_order_res.filter((value, index) => ![i, j].includes(index));
        var key = temp.sort().join('-');
        formulas.set(key, 'projectile'+k);
        k++;
    }
}
console.log(formulas)

export const keys = {
  "photum": "1",
  "aquam": "2",
  "gravitum": "3",

  //Second order
  "electrum": "4",
  "pyrum": "5",
  "rapidum": "6",
  "fortinium": "7",
  "vitalium": "8",

  "BasicInput": 'i',
  "BasicOutput": 'o',
  "BasicMixer": 'm',
};

//Reverse pairing of keys
export const char_keys = {};
for (const k of Object.keys(keys)){
    char_keys[keys[k]] = k;
}

export const resource_colours = {
  "photum": "rgba(245,245,220,1)",
  "aquam": "rgba(137,207,240,1)",
  "gravitum": "rgba(62,49,23,1)",

  //Second order
  "electrum": "rgba(255,255,0,1)",
  "pyrum": "rgba(199,0,0,1)",
  "rapidum": "rgba(255,0,255,1)",
  "fortinium": "rgba(103,10,10,1)",
  "vitalium": "rgba(0,255,255,1)",

  //Third order
  "energy1": "rgba(255,255,0,1)",
  "energy2": "rgba(255,0,255,1)",
  "energy3": "rgba(103,10,10,1)",
  "energy4": "rgba(0,255,255,1)",
};

export const gl_resource_colours = {
  "photum": "rgba(245,245,220,1)",
  "aquam": "rgba(137,207,240,1)",
  "gravitum": "rgba(62,49,23,1)",

  //Second order
  "electrum": "rgba(255,255,0,1)",
  "pyrum": "rgba(199,0,0,1)",
  "rapidum": "rgba(255,0,255,1)",
  "fortinium": "rgba(103,10,10,1)",
  "vitalium": "rgba(0,255,255,1)",

  //Third order
  "energy1": "rgba(255,255,0,1)",
  "energy2": "rgba(255,0,255,1)",
  "energy3": "rgba(103,10,10,1)",
  "energy4": "rgba(0,255,255,1)",
};

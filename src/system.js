import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.135.0/build/three.module.js';
import * as Assets from "./assets.js";
import {Queue, worldtoscreen, l1_dist} from "./utils.js";
import {playSound} from "./sound.js";
import {Quantum} from "./gameObjects/resource.js";
import {Vector2D} from "./vector2D.js";
import {resource_colours, formulas} from "./gameObjects/resource.js";
import {Explosion, P1, P2} from "./projectile.js";
var canvas = Assets.canvas;
var ol = Assets.ol;


ECS.systems.userInput = function systemUserInput (entities, delta) {


}

export function updateAppendage(game, ap, delta){
    for (const b of ap.batteries){
        if (game.frame % b.rate == 0){
            //Spawn a new quantum in each orthogonal direction
            ap.quanta.push(Quantum(b.pos.x + 0.5, b.pos.y + 0.5, 0, -0.01, b.type, b.quantity)); //North
            ap.quanta.push(Quantum(b.pos.x + 0.5, b.pos.y + 0.5, 0, 0.01, b.type, b.quantity)); //South
            ap.quanta.push(Quantum(b.pos.x + 0.5, b.pos.y + 0.5, -0.01, 0, b.type, b.quantity)); //West
            ap.quanta.push(Quantum(b.pos.x + 0.5, b.pos.y + 0.5, 0.01, 0, b.type, b.quantity)); //East
        }
    }
    //console.log(ap.quanta)
    //Update quanta
    // var m = game.modules[0];
    // if (game.frame % 60 == 0){
    //     m.out_edge.old = m.out_edge.current;
    //     m.out_edge.current = 0;
    // }
    //Absorb incoming quanta
    for (var j = ap.quanta.length - 1; j>=0; j--){
        //Travel along wires and cells
        var q = ap.quanta[j];
        var vel = new Vector2D(0, 0);
        var in_module = false;
        var in_util = false;
        var deleted = false;
        for (const m of ap.modules){
            if (q.pos.x >= m.pos.x && q.pos.x <= m.pos.x + m.width && q.pos.y >= m.pos.y && q.pos.y <= m.pos.y + m.height){
                var rel_x = q.pos.x - m.pos.x;
                var rel_y = q.pos.y - m.pos.y;
                if (approx(rel_x - ~~(rel_x), 0.5) && approx(rel_y - ~~(rel_y), 0.5)){
                    //If quantum has reached center of a tile
                    var grid = m.interface[~~(rel_x) + ~~(rel_y) * m.width];
                    if (grid.obj != null){
                        //var absorb = false;
                        var chip = grid.obj;

                        //Check for chip absorbing the quantum
                        quantumInChip(q, chip);
                        ap.quanta.splice(j, 1);
                        deleted = true;

                    } else if (grid.wires != ""){
                        //Follow the wire
                        var wires = grid.wires; //9 possible configurations in each grid: L, Γ, ヿ, ⅃, |, ⼀
                        if (q.vel.x > 0 && q.vel.y == 0) { //Going east
                            if (wires.indexOf("⅃") != -1){
                                //Turn north
                                q.vel.x = 0;
                                q.vel.y = -0.01;
                            } else if (wires.indexOf("ヿ") != -1){
                                //Turn south
                                q.vel.x = 0;
                                q.vel.y = 0.01;
                            }

                        } else if (q.vel.x < 0 && q.vel.y == 0) { //Going west
                            if (wires.indexOf("L") != -1){
                                //Turn north
                                q.vel.x = 0;
                                q.vel.y = -0.01;
                            } else if (wires.indexOf("Γ") != -1){
                                //Turn south
                                q.vel.x = 0;
                                q.vel.y = 0.01;
                            }
                        } else if (q.vel.y < 0) { //Going north
                            if (wires.indexOf("Γ") != -1){
                                //Turn east
                                q.vel.x = 0.01;
                                q.vel.y = 0;
                            } else if (wires.indexOf("ヿ") != -1){
                                //Turn west
                                q.vel.x = -0.01;
                                q.vel.y = 0;
                            }
                        } else if (q.vel.y > 0) { //Going south
                            if (wires.indexOf("L") != -1){
                                //Turn east
                                q.vel.x = 0.01;
                                q.vel.y = 0;
                            } else if (wires.indexOf("⅃") != -1){
                                //Turn west
                                q.vel.x = -0.01;
                                q.vel.y = 0;
                            }
                        }
                    }
                }
                in_module = true;
            //} else if (q.pos.y < 0 || q.pos.y > game.appendages["test"].height || q.pos.x < 0 || q.pos.x > game.appendages["test"].width){
            }
        }

        //Check sinks
        for (const s of ap.sinks){
            if (q.pos.x >= s.pos.x && q.pos.x <= s.pos.x + s.width && q.pos.y >= s.pos.y && q.pos.y <= s.pos.y + s.height){
                //Check for entering center of sink
                var rel_x = q.pos.x - s.pos.x;
                var rel_y = q.pos.y - s.pos.y;
                if (approx(rel_x - ~~(rel_x), 0.5) && approx(rel_y - ~~(rel_y), 0.5)){
                    s.storage[q.type] += q.amount;
                }
                in_util = true;
            }

        }

        //Check weapons
        for (const w of ap.weapons){
            if (q.pos.x >= w.pos.x && q.pos.x <= w.pos.x + w.width && q.pos.y >= w.pos.y && q.pos.y <= w.pos.y + w.height){
                //Check for entering center of sink
                var rel_x = q.pos.x - w.pos.x;
                var rel_y = q.pos.y - w.pos.y;
                if (approx(rel_x - ~~(rel_x), 0.5) && approx(rel_y - ~~(rel_y), 0.5)){
                    if (w.ammo.hasOwnProperty(q.type)) w.ammo[q.type] += q.amount;
                }

                //console.log(w.ammo)
                in_util = true;
            }
        }

        if (deleted) continue;
        if (in_util){
            //Either gets absorbed or disappears
            var rel_x = q.pos.x;
            var rel_y = q.pos.y;
            if (approx(rel_x - ~~(rel_x), 0.5) && approx(rel_y - ~~(rel_y), 0.5)){
                ap.quanta.splice(j, 1);
                continue;
            }

        }
        if (in_module == false && l1_dist(q.pos, q.origin) > 1){
            //Check if inside connector
            for (const c of ap.connectors){
                if (q.pos.x >= c.output_edge[0].x && q.pos.x <= c.output_edge[1].x + 1 && q.pos.y >= c.output_edge[0].y && q.pos.y <= c.output_edge[1].y + 1){
                    //In output edge, teleport to input edge and distribute to the nearest matching cell input
                    if (c.target.edge == "north"){
                        //Search target module's north side
                        if (c.target.obj.hasOwnProperty("interface")){
                            for (var i = 0; i < c.target.obj.width; i++){
                                var grid = c.target.obj.interface[i];
                                if (grid.obj != null){
                                    var chip = grid.obj;
                                    var pos = new Vector2D(c.target.obj.pos.x + i + 0.5, c.target.obj.pos.y);
                                    if (chip.capacity.hasOwnProperty(q.type)){
                                        //Quantum goes south into chip from north side
                                        ap.quanta.push(Quantum(pos.x, pos.y, 0, 0.01, q.type, q.amount));
                                        // q.pos = pos;
                                        // q.vel.x = 0;
                                        // q.vel.y = 0.01;
                                        break;
                                    }
                                }
                            }
                        } else {
                            var pos = new Vector2D(c.target.obj.pos.x + 0.5, c.target.obj.pos.y);
                            ap.quanta.push(Quantum(pos.x, pos.y, 0, 0.01, q.type, q.amount));
                        }
                    } else if (c.target.edge == "south"){
                        //Search target module's south side
                        if (c.target.obj.hasOwnProperty("interface")){
                            for (var i = 0; i < c.target.obj.width; i++){
                                var grid = c.target.obj.interface[(c.target.obj.height - 1) * c.target.obj.width + i];
                                if (grid.obj != null){
                                    var chip = grid.obj;
                                    var pos = new Vector2D(c.target.obj.pos.x + i + 0.5, c.target.obj.pos.y + c.target.obj.height);
                                    if (chip.capacity.hasOwnProperty(q.type)){
                                        ap.quanta.push(Quantum(pos.x, pos.y, 0, -0.01, q.type, q.amount));
                                        //Quantum goes north into chip from south side
                                        // q.pos = pos;
                                        // q.vel.x = 0;
                                        // q.vel.y = -0.01;
                                        break;
                                    }
                                }
                            }
                        } else {
                            var pos = new Vector2D(c.target.obj.pos.x + 0.5, c.target.obj.pos.y + c.target.obj.height);
                            ap.quanta.push(Quantum(pos.x, pos.y, 0, -0.01, q.type, q.amount));
                        }
                    } else if (c.target.edge == "east"){
                        if (c.target.obj.hasOwnProperty("interface")){
                            //Search target module's east side
                            for (var i = 0; i < c.target.obj.height; i++){
                                var grid = c.target.obj.interface[i * c.target.obj.width + (c.target.obj.width - 1)];
                                if (grid.obj != null){
                                    var chip = grid.obj;
                                    var pos = new Vector2D(c.target.obj.pos.x + c.target.obj.width, c.target.obj.pos.y + i + 0.5);
                                    if (chip.capacity.hasOwnProperty(q.type)){
                                        //Quantum goes west into chip from east side
                                        ap.quanta.push(Quantum(pos.x, pos.y, -0.01, 0, q.type, q.amount));
                                        break;
                                    }
                                }
                            }
                        } else {
                            var pos = new Vector2D(c.target.obj.pos.x + c.target.obj.width, c.target.obj.pos.y + 0.5);
                            ap.quanta.push(Quantum(pos.x, pos.y, -0.01, 0, q.type, q.amount));
                        }
                    } else if (c.target.edge == "west"){
                        if (c.target.obj.hasOwnProperty("interface")){
                            //Search target module's west side
                            for (var i = 0; i < c.target.obj.height; i++){
                                var grid = c.target.obj.interface[i * c.target.obj.width];
                                if (grid.obj != null){
                                    var chip = grid.obj;
                                    var pos = new Vector2D(c.target.obj.pos.x, c.target.obj.pos.y + i + 0.5);
                                    if (chip.capacity.hasOwnProperty(q.type)){
                                        //Quantum goes north into chip from south side
                                        ap.quanta.push(Quantum(pos.x, pos.y, 0.01, 0, q.type, q.amount));
                                        break;
                                    }
                                }
                            }
                        } else {
                            var pos = new Vector2D(c.target.obj.pos.x, c.target.obj.pos.y + 0.5);
                            ap.quanta.push(Quantum(pos.x, pos.y, 0.01, 0, q.type, q.amount));
                        }
                    }
                }
            }

            //Record output on edge

            //m.out_edge.current += q.amount;
            ap.quanta.splice(j, 1);
        }
        q.pos = q.pos.add(q.vel);
    }

    for (const m of ap.modules){
        //Generate quanta
        for (var i = 0; i < m.height; i++){
            for (var j = 0; j < m.width; j++){

                var grid = m.interface[j + i * m.width];
                if (grid.obj != null){
                    var chip = grid.obj;

                    //Output once storage is full enough
                    var all_full = true;
                    for (const type of Object.keys(chip.storage)){
                        var quantity = chip.storage[type];
                        if (quantity < chip.capacity[type]){
                            all_full = false;
                            break;
                        }
                    }
                    if (all_full){
                        var output_type = chip.output;
                        for (const type of Object.keys(chip.storage)){
                            chip.storage[type] -= chip.capacity[type]; //Empty the storage
                        }
                        //Generate new quantum on output edges
                        for (const type of Object.keys(chip.rates.output)){
                            var output_quantity = chip.rates.output[type];
                            if (output_quantity > 0) ap.quanta.push(Quantum(j + m.pos.x + 0.5, i + m.pos.y + 0.45, 0, -0.01, chip.output[0], output_quantity));
                        }
                    }
                }
            }
        }
    }
}

//Updated version with new chips and modules
ECS.systems.update = function systemUpdate(game, delta){
    for (const key of Object.keys(ECS.entities.appendages)){
        var ap = ECS.entities.appendages[key];
        updateAppendage(game, ap, delta);
    }
    for (var i = game.projectiles.length - 1; i >= 0; i--){
        var proj = game.projectiles[i];
        proj.update(delta);
        if (proj.lifetime <= 0) {
            game.explosions.push(Explosion(proj.pos.x, proj.pos.y));
            game.projectiles.splice(i, 1);
        } else {
            var collided = false;
            if (proj.owner == 0){
                //Check for hitting opponent
                collided = proj.collide({x:game.test_opp.pos.x, y:game.test_opp.pos.y, w: game.test_opp.torso.width, h: game.test_opp.torso.height});
                if (collided) game.test_opp.hp -= proj.damage;
            } else {
                //Check for hitting player
                collided = proj.collide({x:game.current_titan.pos.x, y:game.current_titan.pos.y, w: game.current_titan.torso.width, h: game.current_titan.torso.height});
                if (collided) game.current_titan.hp -= proj.damage;
            }
            if (collided){
                game.explosions.push(Explosion(proj.pos.x, proj.pos.y));
                game.projectiles.splice(i, 1);
            }
        }
    }
    for (var i = game.explosions.length - 1; i >= 0; i--){
        if (game.frame % 4 == 0) game.explosions[i].frame += 1;
        if (game.explosions[i].frame > 15) game.explosions.splice(i, 1);
    }
}


ECS.systems.render = function systemRender (game, delta) {
    Assets.c.drawImage(images["arena"], 0, -Assets.canvas.height, Assets.canvas.height * 3, Assets.canvas.height * 3);
    if (game.current_titan != null){
        var mid = new Vector2D(0,0);
        game.current_titan.draw(game.current_titan.torso, game.current_titan.pos.scalarMult(game.grid_width), game, Assets.c, 1);

        //Debuge mode
        var body = game.current_titan;
        for (var i = 0; i < body.targets.length; i++){
            Assets.c.fillStyle = "yellow";
            Assets.c.fillRect(body.targets[i].x * game.grid_width, body.targets[i].y * game.grid_width + mid.y, 20, 20);

            //Old positions
            Assets.c.fillStyle = "green";
            Assets.c.fillRect(body.old_foot_pos[i].x * game.grid_width, body.old_foot_pos[i].y * game.grid_width, 20, 20);
        }
    }
    // for (const key of Object.keys(ECS.entities.appendages)){
    //     var ap = ECS.entities.appendages[key];
    //     Assets.c.translate(ap.pos.x, ap.pos.y);
    //     Assets.c.rotate(ap.angle);
    //     //First draw appendage base tiles
    //     for (var i = 0; i < ap.height; i++){
    //         for (var j = 0; j < ap.width; j++){
    //             Assets.c.drawImage(images["appendage_tile"], j * game.grid_width, i * game.grid_width, game.grid_width, game.grid_width);
    //         }
    //     }
    //     //Batteries (under everything)
    //     for (const b of game.batteries){
    //         var color = resource_colours[b.type];
    //
    //         Assets.c.fillStyle = color;
    //         Assets.c.strokeStyle = color;
    //         Assets.c.beginPath();
    //         Assets.c.roundRect(b.pos.x * game.grid_width, b.pos.y * game.grid_width, game.grid_width, game.grid_width, 5);
    //         Assets.c.stroke();
    //         Assets.c.fill();
    //         Assets.c.fillStyle = "rgba(0, 0, 0, 0.3)";
    //         Assets.c.beginPath();
    //         Assets.c.roundRect(b.pos.x * game.grid_width, b.pos.y * game.grid_width, game.grid_width, game.grid_width, 5);
    //         Assets.c.stroke();
    //         Assets.c.fill();
    //     }
    //
    //     //Modules
    //     for (const mod of ap.modules){
    //         var img = images[mod.name];
    //         Assets.c.drawImage(img, mod.pos.x * game.grid_width, mod.pos.y * game.grid_width, game.grid_width * mod.width, game.grid_width * mod.width * img.height / img.width);
    //     }
    //
    //     //Connectors
    //     for (const c of ap.connectors){
    //         //output edge
    //         Assets.c.fillStyle = "rgba(0, 255, 255, 0.6)";
    //         Assets.c.beginPath();
    //         Assets.c.roundRect(c.output_edge[0].x * game.grid_width, c.output_edge[0].y * game.grid_width, (c.output_edge[1].x - c.output_edge[0].x + 1) * game.grid_width, (c.output_edge[1].y - c.output_edge[0].y + 1) * game.grid_width, 5);
    //         //Assets.c.stroke();
    //         Assets.c.fill();
    //
    //         //input edge
    //         Assets.c.fillStyle = "rgba(255, 0, 255, 0.6)";
    //         Assets.c.beginPath();
    //         Assets.c.roundRect(c.input_edge[0].x * game.grid_width, c.input_edge[0].y * game.grid_width, (c.input_edge[1].x - c.input_edge[0].x + 1) * game.grid_width, (c.input_edge[1].y - c.input_edge[0].y + 1) * game.grid_width, 5);
    //         //Assets.c.stroke();
    //         Assets.c.fill();
    //
    //         //Bezier curves as wires
    //         Assets.c.strokeStyle = "rgb(255, 255, 255)";
    //         Assets.c.lineWidth = 5;
    //         var cp1 = {x: (c.output_edge[0].x + c.output_edge[1].x + 0.5) * game.grid_width / 2.0, y: (c.output_edge[0].y + c.output_edge[1].y + 0.5) * game.grid_width / 2.0};
    //         var cp2 = {x: (c.input_edge[0].x + c.input_edge[1].x + 0.5) * game.grid_width / 2.0, y: (c.input_edge[0].y + c.input_edge[1].y + 0.5) * game.grid_width / 2.0};
    //         Assets.c.beginPath();
    //         Assets.c.moveTo((c.output_edge[0].x + 0.5) * game.grid_width, (c.output_edge[0].y + 0.5) * game.grid_width);
    //         Assets.c.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (c.input_edge[0].x + 0.5) * game.grid_width, (c.input_edge[0].y + 0.5) * game.grid_width);
    //         Assets.c.stroke();
    //
    //         Assets.c.beginPath();
    //         Assets.c.moveTo((c.output_edge[1].x + 0.5) * game.grid_width, (c.output_edge[1].y + 0.5) * game.grid_width);
    //         Assets.c.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (c.input_edge[1].x + 0.5) * game.grid_width, (c.input_edge[1].y + 0.5) * game.grid_width);
    //         Assets.c.stroke();
    //     }
    //
    //     //Weapons
    //     for (const w of ap.weapons){
    //         var img = images[w.type];
    //         var angle = Math.PI / 2 * w.orientation;
    //         Assets.c.translate(w.pos.x * game.grid_width, w.pos.y * game.grid_width);
    //         Assets.c.rotate(angle);
    //         Assets.c.drawImage(img, 0, 0, game.grid_width * w.width, game.grid_width * w.width * img.height / img.width);
    //         Assets.c.rotate(-angle);
    //         Assets.c.translate(-w.pos.x * game.grid_width, -w.pos.y * game.grid_width);
    //     }
    //
    //     //Sinks (1 x 1)
    //     for (const s of ap.sinks){
    //         Assets.c.drawImage(images["reactor"], s.pos.x * game.grid_width, s.pos.y * game.grid_width, s.width * game.grid_width, s.height * game.grid_width);
    //     }
    //
    //     //joints
    //     for (const j of ap.joints){
    //         Assets.c.drawImage(images["joint-hinge"], j.pos.x * game.grid_width, j.pos.y * game.grid_width, j.width * game.grid_width, j.height * game.grid_width);
    //     }
    //
    //     //Quanta
    //     for (const q of ap.quanta){
    //         blurCircle(Assets.c, q.pos.x * game.grid_width, q.pos.y * game.grid_width, game.grid_width / 16 * Math.sqrt(q.amount), q.type);
    //     }
    //     Assets.c.rotate(-ap.angle);
    //     Assets.c.translate(-1 * ap.pos.x, -1 * ap.pos.y);
    // }
}

ECS.systems.renderEntities = function systemRenderEntities (game, delta) {

    Assets.c.font="40px Arial";
    Assets.c.fillStyle = "beige";
    Assets.c.textAlign = "center";
    //Assets.c.fillText(game.modules[0].out_edge.old, canvas.width - 200, 90);
}

function approx(x, y, tol=0.01){
    return Math.abs(x-y) <= tol;
}

function quantumInChip(q, chip){
    //var has_type = false;
    if (chip.capacity.hasOwnProperty(q.type)){
        if (q.vel.x > 0 && q.vel.y == 0) { //Going east
            if (chip.rates.input.west > 0) {
                chip.storage[q.type] += chip.rates.input.west;
                return true;
            }
        } else if (q.vel.x < 0 && q.vel.y == 0) { //Going west
            if (chip.rates.input.east > 0) {
                chip.storage[q.type] += chip.rates.input.east;
                return true;
            }
        } else if (q.vel.y < 0) { //Going north
            if (chip.rates.input.south > 0) {
                chip.storage[q.type] += chip.rates.input.south;
                return true;
            }
        } else if (q.vel.y > 0) { //Going south
            if (chip.rates.input.north > 0) {
                chip.storage[q.type] += chip.rates.input.north;
                return true;
            }
        }
    }
    return false;
}

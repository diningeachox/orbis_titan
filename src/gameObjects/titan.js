import {Cell, Router} from "./cell.js";
import {Module} from "./module.js";
import {Shell, Appendage} from "./appendage.js";
import {Vector2D} from "../vector2D.js";
import {Bone, FK, isFootGrounded, groundToggle, chainLength} from "../kinematics/bone.js";
import {resource_colours, formulas, keys, char_keys} from "./resource.js";
import {isNum, uuidv4, set_difference, shuffle, rgba2dec} from "../utils.js";

export function blurCircle(ctx, x, y, radius, type, energy=false){
    var base_color = resource_colours[type];
    if (energy){
        var truncated_base_color = base_color.slice(0, base_color.length - 2);
        var radgrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        radgrad.addColorStop(0, base_color);
        radgrad.addColorStop(0.6, truncated_base_color + '.65)');
        radgrad.addColorStop(1, truncated_base_color + '0)');

        // draw shape
        ctx.fillStyle = radgrad;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    } else {
        ctx.fillStyle = base_color;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
}

export class Titan {
    constructor(config){
        this.pos = config.pos;
        this.destination = this.pos.copy();
        this.temp_dest = this.pos.copy();
        this.radius = config.radius || 10;
        this.speed = 0.1;
        this.chain_speed = 0.15;
        this.min_grounded_feet = 2;
        this.appendages = config.appendages;
        //this.num_legs = config.appendages.length;

        this.bones = [];
        this.chains = [];
        this.energy = [10, 30, 30, 10];
        this.chain_speeds = [0.1, 0.3, 0.3, 0.1];
        this.feet = [];
        this.old_foot_pos = [];
        this.new_foot_pos = [];
        this.targets = [];
        this.hit = false;

        this.torso = config.torso;
        this.num_legs = config.torso.children.length;

        //Legs (specified by torso's children )
        for (var i = 0; i < this.num_legs; i++){
            //Root bone/joint (0, 0, 0) right at center position

            /*
            //starting positin of second joint
            var thirdpos = new Vector2D(75, 0);
            //newpos = newpos.rotate(i * Math.PI / 5);
            let thirdBone = new Bone(thirdpos, Math.PI / 8, 75, null);
            thirdBone.grounded = true; //Initialize as grounded
            */

            //starting positin of second joint
            //newpos = newpos.rotate(i * Math.PI / 5);
            var leg = ECS.entities.appendages[this.torso.children[i]];
            var cur_ap = leg;
            var accum_pos = new Vector2D(leg.width, 0);

            let rootJoint = new Vector2D(this.torso.width / 2 * Math.cos(i * 2 * Math.PI / this.num_legs), this.torso.width / 2 * Math.sin(i * 2 * Math.PI / this.num_legs));
            let rootBone = new Bone(rootJoint, i * 2 * Math.PI / this.num_legs, leg.width, leg.height, null);
            var cur_bone = rootBone;
            while (cur_ap.children.length > 0){
                var calf = ECS.entities.appendages[leg.children[0]];

                //var newpos = new Vector2D(leg.width, 0);
                calf.pos = accum_pos.copy();
                calf.angle = Math.PI / this.num_legs;
                let secondBone = new Bone(accum_pos, Math.PI / this.num_legs, calf.width, calf.height, null);
                secondBone.grounded = true; //Initialize as grounded
                //The last joint
                this.feet.push(secondBone);
                rootBone.child = secondBone;
                cur_ap = calf;
                cur_bone = secondBone;
            }



            leg.pos = rootJoint.copy();
            leg.angle = i * 2 * Math.PI / this.num_legs;
            //The end effector represents a whole chain
            this.chains.push(rootBone);


            //Push tip positions (these are fixed for now)
            this.old_foot_pos.push(FK(rootBone).add(this.pos));
            this.targets.push(FK(rootBone).add(this.pos));
        }



    }
    /*
    Sets new targets for feet in a circle around the destination position
    */
    setNewTargets(dir, mult=5){
        var v = dir.normalize().scalarMult(mult);
        var dest = this.pos.add(v);
        this.temp_dest = dest.copy();
        //this.destination = dest;
        this.targets = [];
        for (var i = 0; i < this.chains.length; i++){
            var chain = this.chains[i];
            var min_length = chainLength(chain) / 4 * 3;
            var dummy = new Vector2D(this.radius + min_length + 1, 0);
            this.targets.push(dummy.rotate(i * 2 * Math.PI / this.chains.length).add(dest));
        }
    }
    /* Returns the feet that are grounded
    */
    groundedFeet(){
        var grounded_feet = [];
        for (var i = 0; i < this.chains.length; i++){
            let chain = this.chains[i];
            let current = chain;
            //Iterate down the chain
            while (current.child != null){
                current = current.child;
            }
            if (current.grounded) grounded_feet.push(i);
        }
        return grounded_feet;
    }

    willBeGroundedFeet(){
        let max_legs = this.maximumStretch();
        let grounded_feet = this.groundedFeet();
        let result = [];
        //Calculate set difference grounded_feet \ max_legs
        //These are the legs that will remain grounded after a position update
        for (var i = 0; i < grounded_feet.length; i++){
            if (!max_legs.includes(grounded_feet[i])){
                result.push(i);
            }
        }
        return result;
    }

    /* Returns whether or not at least one leg has reached its maximum length
    and needs to be moved
    */
    maximumStretch(){
        let max_legs = [];
        for (var i = 0; i < this.chains.length; i++){
            let chain = this.chains[i];
            let endPoint = FK(chain);
            let diff = endPoint.subtract(chain.pos).modulus();
            if (diff >= chainLength(chain) - 0.05){
                let current = chain;
                //Iterate down the chain
                while (current.child != null){
                    current = current.child;
                }
                //Only consider the grounded feet at full stretch
                if (current.grounded) max_legs.push(i);
            }
        }
        return max_legs;
    }

    atFeetTargets(){
        for (var i = 0; i < this.targets.length; i++){
            var diff = this.targets[i].subtract(this.old_foot_pos[i]);
            if (diff.modulus() > 0.01){
                return false;
            }
        }
        return true;
    }

    /* Return any legs that are too close to the main body (less than a threshold distance) */
    legsTooClose(){
        let close_legs = [];
        for (var i = 0; i < this.chains.length; i++){
            let chain = this.chains[i];
            let diff = this.pos.subtract(FK(chain));
            if (diff.modulus() < this.radius * 1.1){
                close_legs.push(i);
            }
        }
    }

    move(dir){

    }

    resolveIK_CCD(target){
        for (var i = 0; i < 1; i++){
            let chain = this.chains[i];
            chain.updateIK_CCD(target);
        }
    }


    update(delta){
        //Sync appendage data with bone data
        for (var i = 0; i < this.num_legs; i++){
            //Root bone/joint (0, 0, 0) right at center position

            /*
            //starting positin of second joint
            var thirdpos = new Vector2D(75, 0);
            //newpos = newpos.rotate(i * Math.PI / 5);
            let thirdBone = new Bone(thirdpos, Math.PI / 8, 75, null);
            thirdBone.grounded = true; //Initialize as grounded
            */

            //starting positin of second joint
            //newpos = newpos.rotate(i * Math.PI / 5);
            var leg = ECS.entities.appendages[this.torso.children[i]];
            var calf = ECS.entities.appendages[leg.children[0]];

            var leg_bone = this.chains[i];

            //debugger;
            leg.pos = leg_bone.pos.copy();
            leg.angle = leg_bone.angle;

            if (leg_bone.child != null){
                var calf_bone = leg_bone.child;

                calf.pos = calf_bone.pos.copy();
                calf.angle = calf_bone.angle;
            }
        }

        //debugger;
        let diff = this.destination.subtract(this.pos);
        let dir = diff.normalize();

        //debugger;
        // if (this.atFeetTargets() && diff.modulus() > this.speed) {
        //     this.setNewTargets(dir, 10);
        // }



        if (diff.modulus() > this.speed){
            //1. Check for any legs at maximum stretch
            //debugger;
            let max_legs = this.maximumStretch();
            let grounded_feet = this.groundedFeet();

            //Feet that are grounded and can move (not at max stretch)
            let will_be_grounded_feet = this.willBeGroundedFeet();

            //If grounded feet are too close to center of body, stop body and retract max stretched legs


            //Need to ground ungrounded feet until we meet threshold
            //if (grounded_feet.length > this.min_grounded_feet && will_be_grounded_feet.length < this.min_grounded_feet){
            //console.log(grounded_feet.length)
            if (grounded_feet.length == this.min_grounded_feet){
                //let to_be_grounded = this.min_grounded_feet - will_be_grounded_feet.length;
                let indices = [];
                for (var i = 0; i < this.chains.length; i++){
                    indices.push(i);
                }
                let ungrounded_feet = set_difference(indices, grounded_feet);
                ungrounded_feet = shuffle(ungrounded_feet);

                for (var j = 0; j < ungrounded_feet.length; j++){
                    //Choose random ungrounded feet and ground it
                    groundToggle(this.chains[ungrounded_feet[j]], true);
                    //Change to old_foot_position
                    this.old_foot_pos[ungrounded_feet[j]] = FK(this.chains[ungrounded_feet[j]]).add(this.pos);
                }

            } else if (grounded_feet.length > this.min_grounded_feet){
                //Move legs with the body and resolve IK in new location
                for (var i = 0; i < this.chains.length; i++){
                    //let rootJoint = new Vector2D(this.radius * Math.cos(i * 2 * Math.PI / 5), this.radius * Math.sin(i * 2 * Math.PI / 5));
                    let chain = this.chains[i];
                    //chain.pos = rootJoint;

                    //Resolve IK if chain's foot is still grounded to old location
                    if (isFootGrounded(chain)){
                        var v = this.old_foot_pos[i].subtract(this.pos);
                        chain.updateIK_CCD(v);
                    } else {
                        //Otherwise move the chain toward the new target
                        let endPoint = FK(chain);
                        let chain_diff = this.targets[i].subtract(this.pos).subtract(endPoint);
                        let dir = chain_diff.normalize().scalarMult(this.chain_speeds[i]);
                        //console.log(i)
                        //console.log(chain_diff)
                        if (chain_diff.modulus() > this.chain_speeds[i]){
                            chain.updateIK_CCD(endPoint.add(dir));
                        } else {
                            //Put foot at new target, ground it, and move target to old_foot_pos
                            chain.updateIK_CCD(this.targets[i].subtract(this.pos));
                            groundToggle(chain, true);
                            this.old_foot_pos[i] = this.targets[i];
                        }
                    }

                }


                //Pick up and unground THE maximally stretched leg that is furthest away from it's target
                let max_legs = this.maximumStretch();

                let grounded_feet = this.groundedFeet();
                let farthest = -1;
                let max_dist = -1;
                for (var j = 0; j < max_legs.length; j++){
                    let leg = max_legs[j];
                    let to_target = this.targets[leg].subtract(FK(this.chains[leg]));
                    let dist = to_target.modulus();
                    if (dist > max_dist) {
                        farthest = leg;
                        max_dist = dist;
                    }
                    //Change to old_foot_position
                    //this.old_foot_pos[leg] = FK(this.chains[leg]).add(this.pos);
                }
                if (farthest != -1){
                    //debugger;
                    groundToggle(this.chains[farthest], false);
                }

                grounded_feet = this.groundedFeet();

                //Move body toward destination only if enough feet are grounded and there are no maximally stretched legs
                if (grounded_feet.length >= this.min_grounded_feet) {

                    var too_close = false;
                    for (var j = 0; j < grounded_feet.length; j++){
                        var chain = this.chains[grounded_feet[j]];
                        var endPoint = FK(chain);
                        var dist = endPoint.subtract(chain.pos).modulus();
                        //console.log(chainLength(chain))
                        if (dist < chainLength(chain) / 4 * 3){
                            too_close = true;
                            break;
                        }
                    }

                    var unreachable = false;
                    for (var j = 0; j < this.chains.length; j++){
                        var chain = this.chains[j];
                        var endPoint = FK(chain);
                        var dist = this.targets[j].subtract(this.pos).modulus();
                        //console.log(chainLength(chain))
                        if (dist >= chainLength(chain)){
                            unreachable = true;
                            break;
                        }
                    }

                    //Move when none of the legs are too close OR all legs are grounded
                    if (!too_close) {
                        this.pos = this.pos.add(dir.scalarMult(this.speed));
                    } else {
                        //debugger;
                        //Stop and set new targets
                        let diff = this.destination.subtract(this.pos);
                        let dir = diff.normalize();

                        //debugger;
                        this.adjust_legs();
                        if (this.atFeetTargets() && diff.modulus() > this.speed) {
                            //debugger;
                            var temp_diff = this.temp_dest.subtract(this.pos);
                            let temp_dir = temp_diff.normalize();
                            if (temp_diff.modulus() > this.speed && this.temp_dest.subtract(this.destination).modulus() < diff.modulus()) {
                                console.log(temp_dir.scalarMult(this.speed))
                                this.pos = this.pos.add(temp_dir.scalarMult(this.speed));
                            } else {
                                //this.pos = this.temp_dest.copy();
                                diff = this.destination.subtract(this.pos);
                                dir = diff.normalize();
                                this.setNewTargets(dir, 5);
                            }
                        }

                    }
                }


                //When main body is at destination, unground all legs which are not yet at their targets
                if (diff.modulus() <= this.speed){
                    for (var j = 0; j < grounded_feet.length; j++){
                        let leg = grounded_feet[j];
                        if (this.old_foot_pos[leg] != this.targets[leg]){
                            groundToggle(this.chains[leg], false);
                        }
                        //Change to old_foot_position
                        //this.old_foot_pos[leg] = FK(this.chains[leg]).add(this.pos);
                    }
                    this.pos = this.destination.copy();
                }

            } else {
                //Ground everything
                // for (var i = 0; i < this.chains.length; i++){
                //
                //     groundToggle(chain, true);
                //     this.old_foot_pos[i] = this.targets[i];
                // }
            }
        } else {
            //Move legs into position
            //Move legs with the body and resolve IK in new location
            this.pos = this.destination.copy();
            this.adjust_legs();
        }
        //Keep moving (test)

        //console.log(this.pos)
        // console.log(this.chains[0].angle)
        //console.log(this.destination)
    }

    targets_too_close(){
        var closest_dist = 100000;
        for (var i = 0; i < this.targets.length; i++){

        }
    }

    adjust_legs(){
        for (var i = 0; i < this.chains.length; i++){
            if (this.old_foot_pos[i] != this.targets[i]){
                let chain = this.chains[i];
                //Otherwise move the chain toward the new target
                let endPoint = FK(chain);
                let chain_diff = this.targets[i].subtract(this.pos).subtract(endPoint);
                let dir = chain_diff.normalize().scalarMult(this.chain_speeds[i]);
                if (!isFootGrounded(chain)){
                    if (chain_diff.modulus() > this.chain_speeds[i]){
                        chain.updateIK_CCD(endPoint.add(dir));
                        groundToggle(chain, false);
                    } else {
                        //Put foot at new target, ground it, and move target to old_foot_pos
                        chain.updateIK_CCD(this.targets[i].subtract(this.pos));
                        groundToggle(chain, true);
                        this.old_foot_pos[i] = this.targets[i];
                    }
                } else {
                    var grounded_feet = this.groundedFeet();
                    if (grounded_feet.length > this.min_grounded_feet){
                        //groundToggle(chain, false);
                        if (chain_diff.modulus() > this.chain_speeds[i]){
                            chain.updateIK_CCD(endPoint.add(dir));
                            groundToggle(chain, false);
                        } else {
                            //Put foot at new target, ground it, and move target to old_foot_pos
                            chain.updateIK_CCD(this.targets[i].subtract(this.pos));
                            groundToggle(chain, true);
                            this.old_foot_pos[i] = this.targets[i];
                        }
                    }
                }
            }

        }
    }

    draw(root, pos, game, ctx, top_level=0){
        ctx.translate(pos.x + (root.pos.x) * game.grid_width, pos.y + (root.pos.y) * game.grid_width);
        ctx.rotate(root.angle);

        draw_appendage(root, game, ctx);

        if (top_level==1) ctx.translate(root.width / 2 * game.grid_width, root.height / 2 * game.grid_height);
        for (const key of root.children){
            var ap = ECS.entities.appendages[key];
            this.draw(ap, new Vector2D(0, 0), game, ctx, 0);
        }
        if (top_level==1) ctx.translate(-root.width / 2 * game.grid_width, -root.height / 2 * game.grid_height);

        ctx.rotate(-root.angle);
        ctx.translate(-pos.x - (root.pos.x) * game.grid_width, -pos.y - (root.pos.y) * game.grid_width);
    }
}

function draw_appendage(ap, game, ctx){

    //First draw appendage base tiles
    for (var i = 0; i < ap.height; i++){
        for (var j = 0; j < ap.width; j++){
            ctx.drawImage(images["appendage_tile"], j * game.grid_width, i * game.grid_width, game.grid_width, game.grid_width);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.strokeRect(j * game.grid_width, i * game.grid_width, game.grid_width, game.grid_width);
        }
    }
    //Batteries (under everything)
    for (const b of ap.batteries){
        var color = resource_colours[b.type];

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.roundRect(b.pos.x * game.grid_width, b.pos.y * game.grid_width, game.grid_width, game.grid_width, game.grid_width / 5);
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.roundRect(b.pos.x * game.grid_width, b.pos.y * game.grid_width, game.grid_width, game.grid_width, game.grid_width / 5);
        ctx.stroke();
        ctx.fill();
    }

    //Modules
    for (const mod of ap.modules){
        var img = images[mod.name];
        ctx.drawImage(img, mod.pos.x * game.grid_width, mod.pos.y * game.grid_width, game.grid_width * mod.width, game.grid_width * mod.width * img.height / img.width);
    }

    //Connectors
    for (const c of ap.connectors){
        //output edge
        ctx.fillStyle = "rgba(0, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.roundRect(c.output_edge[0].x * game.grid_width, c.output_edge[0].y * game.grid_width, (c.output_edge[1].x - c.output_edge[0].x + 1) * game.grid_width, (c.output_edge[1].y - c.output_edge[0].y + 1) * game.grid_width, 5);
        //ctx.stroke();
        ctx.fill();

        //input edge
        ctx.fillStyle = "rgba(255, 0, 255, 0.6)";
        ctx.beginPath();
        ctx.roundRect(c.input_edge[0].x * game.grid_width, c.input_edge[0].y * game.grid_width, (c.input_edge[1].x - c.input_edge[0].x + 1) * game.grid_width, (c.input_edge[1].y - c.input_edge[0].y + 1) * game.grid_width, 5);
        //ctx.stroke();
        ctx.fill();

        //Bezier curves as wires
        ctx.strokeStyle = "rgb(255, 255, 255)";
        ctx.lineWidth = 5;
        var cp1 = {x: (c.output_edge[0].x + c.output_edge[1].x + 0.5) * game.grid_width / 2.0, y: (c.output_edge[0].y + c.output_edge[1].y + 0.5) * game.grid_width / 2.0};
        var cp2 = {x: (c.input_edge[0].x + c.input_edge[1].x + 0.5) * game.grid_width / 2.0, y: (c.input_edge[0].y + c.input_edge[1].y + 0.5) * game.grid_width / 2.0};
        ctx.beginPath();
        ctx.moveTo((c.output_edge[0].x + 0.5) * game.grid_width, (c.output_edge[0].y + 0.5) * game.grid_width);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (c.input_edge[0].x + 0.5) * game.grid_width, (c.input_edge[0].y + 0.5) * game.grid_width);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((c.output_edge[1].x + 0.5) * game.grid_width, (c.output_edge[1].y + 0.5) * game.grid_width);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (c.input_edge[1].x + 0.5) * game.grid_width, (c.input_edge[1].y + 0.5) * game.grid_width);
        ctx.stroke();
    }

    //Weapons
    for (const w of ap.weapons){
        var img = images[w.type];
        var angle = Math.PI / 2 * w.orientation;
        ctx.translate(w.pos.x * game.grid_width, w.pos.y * game.grid_width);
        ctx.rotate(angle);
        ctx.drawImage(img, 0, 0, game.grid_width * w.width, game.grid_width * w.width * img.height / img.width);
        ctx.rotate(-angle);
        ctx.translate(-w.pos.x * game.grid_width, -w.pos.y * game.grid_width);
    }

    //Sinks (1 x 1)
    for (const s of ap.sinks){
        ctx.drawImage(images["reactor"], s.pos.x * game.grid_width, s.pos.y * game.grid_width, s.width * game.grid_width, s.height * game.grid_width);
    }

    //joints
    for (const j of ap.joints){
        ctx.drawImage(images["joint-hinge"], j.pos.x * game.grid_width, j.pos.y * game.grid_width, j.width * game.grid_width, j.height * game.grid_width);
    }

    //Quanta
    for (const q of game.quanta){
        if (!q.type.includes("energy") && !q.type.includes("projectile")){
            blurCircle(ctx, q.pos.x * game.grid_width, q.pos.y * game.grid_width, game.grid_width / 16 * Math.sqrt(q.amount), q.type);
        } else if (q.type.includes("energy")){
            blurCircle(ctx, q.pos.x * game.grid_width, q.pos.y * game.grid_width, game.grid_width / 16 * Math.sqrt(q.amount), q.type, true);
        }
    }
}

export function draw_appendage_gl(renderer, ap, game){


    //Shift matrix stack's top transformation to the position of appendage
    renderer.matrixStack.save();
    renderer.matrixStack.translate(ap.pos.x, -ap.pos.y, 0);

    //First draw appendage base tiles
    for (var i = 0; i < ap.height; i++){
        for (var j = 0; j < ap.width; j++){
            renderer.drawRect(j, -(i), 1, 1, [0.0, 0.0, 0.0], 1.0, ap.angle);
            renderer.drawSprite("appendage_tile", j + 0.05, -(i + 0.05), 0.90, 0.90, ap.angle);
        }
    }
    //Batteries (under everything)
    for (const b of ap.batteries){
        var color = resource_colours[b.type];
        renderer.drawRect(b.pos.x, -b.pos.y, 1, 1, rgba2dec(color), 0.6, ap.angle);
    }

    //Modules
    for (const mod of ap.modules){
        //var img = images[mod.name];
        renderer.drawSprite(mod.name, mod.pos.x, -mod.pos.y, mod.width, mod.height, ap.angle, 0.1);
    }

    //Connectors
    for (const c of ap.connectors){
        //output edge
        renderer.drawRect(c.output_edge[0].x, -c.output_edge[0].y, c.output_edge[1].x - c.output_edge[0].x + 1, c.output_edge[1].y - c.output_edge[0].y + 1, [0.0, 1.0, 1.0], 0.6, ap.angle, 0.1);

        //input edge
        renderer.drawRect(c.input_edge[0].x, -c.input_edge[0].y, c.input_edge[1].x - c.input_edge[0].x + 1, c.input_edge[1].y - c.input_edge[0].y + 1, [1.0, 0.0, 1.0], 0.6, ap.angle, 0.1);

        //Bezier curves as wires
        // ctx.strokeStyle = "rgb(255, 255, 255)";
        // ctx.lineWidth = 5;
        // var cp1 = {x: (c.output_edge[0].x + c.output_edge[1].x + 0.5) * game.grid_width / 2.0, y: (c.output_edge[0].y + c.output_edge[1].y + 0.5) * game.grid_width / 2.0};
        // var cp2 = {x: (c.input_edge[0].x + c.input_edge[1].x + 0.5) * game.grid_width / 2.0, y: (c.input_edge[0].y + c.input_edge[1].y + 0.5) * game.grid_width / 2.0};
        // ctx.beginPath();
        // ctx.moveTo((c.output_edge[0].x + 0.5) * game.grid_width, (c.output_edge[0].y + 0.5) * game.grid_width);
        // ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (c.input_edge[0].x + 0.5) * game.grid_width, (c.input_edge[0].y + 0.5) * game.grid_width);
        // ctx.stroke();
        //
        // ctx.beginPath();
        // ctx.moveTo((c.output_edge[1].x + 0.5) * game.grid_width, (c.output_edge[1].y + 0.5) * game.grid_width);
        // ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (c.input_edge[1].x + 0.5) * game.grid_width, (c.input_edge[1].y + 0.5) * game.grid_width);
        // ctx.stroke();
    }

    //Weapons
    for (const w of ap.weapons){
        renderer.drawSprite(w.type, w.pos.x, -w.pos.y, w.width, w.height, ap.angle, 0.1);
        // var img = images[w.type];
        // var angle = Math.PI / 2 * w.orientation;
        // ctx.translate(w.pos.x * game.grid_width, w.pos.y * game.grid_width);
        // ctx.rotate(angle);
        // ctx.drawImage(img, 0, 0, game.grid_width * w.width, game.grid_width * w.width * img.height / img.width);
        // ctx.rotate(-angle);
        // ctx.translate(-w.pos.x * game.grid_width, -w.pos.y * game.grid_width);
    }

    //Sinks (1 x 1)
    for (const s of ap.sinks){
        renderer.drawSprite("reactor", s.pos.x, -s.pos.y, s.width, s.height, ap.angle, 0.1);
    }

    //joints
    for (const j of ap.joints){
        renderer.drawSprite("joint-hinge", j.pos.x, -j.pos.y, j.width, j.height, ap.angle);
    }

    //Quanta
    for (const q of ap.quanta){
        if (!q.type.includes("energy") && !q.type.includes("projectile")){
            renderer.drawRect(q.pos.x, -q.pos.y, 1 / 16 * Math.sqrt(q.amount), 1 / 16 * Math.sqrt(q.amount), rgba2dec(resource_colours[q.type]), 1.0, ap.angle, 0.15);
            //blurCircle(ctx, q.pos.x * game.grid_width, q.pos.y * game.grid_width, game.grid_width / 16 * Math.sqrt(q.amount), q.type);

        } else if (q.type.includes("energy")){
            renderer.drawRect(q.pos.x, -q.pos.y, 1 / 16 * Math.sqrt(q.amount), 1 / 16 * Math.sqrt(q.amount), rgba2dec(resource_colours[q.type]), 1.0, ap.angle, 0.15);
            //blurCircle(ctx, q.pos.x * game.grid_width, q.pos.y * game.grid_width, game.grid_width / 16 * Math.sqrt(q.amount), q.type, true);
        }
    }

    renderer.matrixStack.restore();
}

export function draw_titan(renderer, root, pos, game){
    //Shift position of matrixstack
    renderer.matrixStack.translate(pos.x + (root.pos.x), -pos.y - (root.pos.y), 0);
    renderer.matrixStack.rotateZ(root.angle);
    // ctx.translate(pos.x + (root.pos.x) * game.grid_width, pos.y + (root.pos.y) * game.grid_width);
    // ctx.rotate(root.angle);

    draw_appendage_gl(renderer, root, game);

    for (const key of root.children){
        var ap = ECS.entities.appendages[key];
        draw_titan(renderer, ap, new Vector2D(0, 0), game);
    }

    // ctx.rotate(-root.angle);
    // ctx.translate(-pos.x - (root.pos.x) * game.grid_width, -pos.y - (root.pos.y) * game.grid_width);
    renderer.matrixStack.rotateZ(-root.angle);
    renderer.matrixStack.translate(-pos.x - (root.pos.x), pos.y + (root.pos.y), 0);

}

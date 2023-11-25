import {Vector2D} from "../vector2D.js";


export class Bone {
    constructor(pos, angle, length, width, child=null, ratio=new Vector2D(1, 1)){
        this.pos = pos;
        this.angle = angle; //Should be in radians
        this.length = length;
        this.width = width;
        this.child = child;
        this.grounded = false;
    }

    //Cyclic gradient descent
    // takes in: a target point in the child coordinate space
    // returns:  the endpoint of the chain, in that same child
    //           coordinate space
    updateIK_CCD(target) {
        // convert from child to local coordinates
        const localTarget = target.subtract(this.pos).rotate(-this.angle);
        //const localTarget = rotatePoint(translatePoint(target, -this.x, -this.y), -this.angle);

        let endPoint;
        //debugger;
        if (this.child != null) {
            endPoint = this.child.updateIK_CCD(localTarget);
        } else {
          // base case:  the end point is the end of the current bone
            endPoint = new Vector2D(this.length, 0);
        }

        // point towards the endpoint
        const shiftAngle = localTarget.angle() - endPoint.angle();
        this.angle += shiftAngle;

        // convert back to child coordinate space
        return endPoint.rotate(this.angle).add(this.pos);
        //return translatePoint(rotatePoint(endPoint, this.angle), this.x, this.y);
    }

    draw(ctx, pos, scale_vec, type="leg", hit=false){
        if (type == "leg"){
            ctx.fillStyle = game_colors[current_color];
            if (hit) ctx.fillStyle = "white";
            //if (!this.grounded) ctx.fillStyle = "blue";

            // console.log(this.pos.x * scale_vec.x)
            // console.log(this.pos.y * scale_vec.y)
            // debugger;

            ctx.translate(pos.x + this.pos.x, pos.y + this.pos.y);
            ctx.rotate(this.angle);

            ctx.fillRect(0, -this.grid_width * 40 / 2, this.grid_length * 40, this.grid_width * 40);

            //endpoint = endpoint.rotate(this.angle);
            if (this.child != null) {
                var endpoint = new Vector2D(0, 0);
                this.child.draw(ctx, endpoint, scale_vec, type, hit);
            }

            ctx.rotate(-this.angle);
            ctx.translate(-(pos.x + this.pos.x), -(pos.y + this.pos.y));
        } else if (type == "tentacle") {

        }

    }

    hittest(start, end, pos, angle, grid_size, root=true){
        var joint_pos = this.pos.add(pos);
        var total_angle = this.angle + angle;
        if (!root) joint_pos = pos;

        var temp = new Vector2D(0, this.grid_width / 2).rotate(total_angle).elemMult(grid_size);
        var topLeft = joint_pos.subtract(temp);
        var bottomLeft = joint_pos.add(temp);
        temp = new Vector2D(this.grid_length, 0).rotate(total_angle).elemMult(grid_size);
        var topRight = topLeft.add(temp);
        temp = new Vector2D(0, this.grid_width).rotate(total_angle).elemMult(grid_size);
        var bottomRight = topRight.add(temp);
        var vertices = [topLeft, topRight, bottomRight, bottomLeft];

        //Debug draw collision area
        var has_hit = lsvpoly(start, end, vertices);
        if (this.child != null) {
            temp = new Vector2D(this.grid_length, 0).rotate(total_angle).elemMult(grid_size);
            has_hit = has_hit || this.child.hittest(start, end, joint_pos.add(temp), total_angle, grid_size, false);
        }
        return has_hit;
    }

    draw_col_areas(ctx, pos, angle, cam_center, draw_center, grid_size, grid_draw_size, root=true){
        var joint_pos = this.pos.add(pos);
        var total_angle = this.angle + angle;
        if (!root) joint_pos = pos;

        var temp = new Vector2D(0, this.grid_width / 2).rotate(total_angle).elemMult(grid_size);
        var topLeft = joint_pos.subtract(temp);
        var bottomLeft = joint_pos.add(temp);
        temp = new Vector2D(this.grid_length, 0).rotate(total_angle).elemMult(grid_size);
        var topRight = topLeft.add(temp);
        temp = new Vector2D(0, this.grid_width).rotate(total_angle).elemMult(grid_size);
        var bottomRight = topRight.add(temp);
        var vertices = [topLeft, topRight, bottomRight, bottomLeft];

        //Debug draw collision area
        drawPolyOnMap(ctx, vertices, cam_center, draw_center, grid_size, grid_draw_size);
        if (this.child != null) {
            temp = new Vector2D(this.grid_length, 0).rotate(total_angle).elemMult(grid_size);
            //var joint = pos.add(temp);
            this.child.draw_col_areas(ctx, joint_pos.add(temp), total_angle, cam_center, draw_center, grid_size, grid_draw_size, false);
        }

    }

}

export function isFootGrounded(chain){
    var current = chain;
    //Iterate down the chain
    while (current.child != null){
        current = current.child;
    }
    return current.grounded;
}

export function groundToggle(chain, state){
    //debugger;
    var current = chain;
    //Iterate down the chain
    while (current.child != null){
        current = current.child;
    }
    current.grounded = state;
}

export function chainLength(chain){
    var total_length = 0;
    var current = chain;
    //Iterate down the chain
    while (current != null){
        total_length += current.length;
        current = current.child;
    }
    return total_length;
}

export function FK(chain){
    var ending_pos = chain.pos.copy();
    var current = chain;
    var cumulative_angle = 0;
    //Iterate down the chain
    while (current != null){
        var vec = new Vector2D(current.length, 0);
        cumulative_angle += current.angle;
        ending_pos = ending_pos.add(vec.rotate(cumulative_angle));
        current = current.child;
    }
    return ending_pos;
}

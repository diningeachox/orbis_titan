import {Vector2D} from "./vector2D.js";

class Projectile {
    constructor(config){
        this.pos = new Vector2D(config.x, config.y);
        this.target = null;
        this.homing = false;
        this.speed = config.speed;
        this.lifetime = config.lifetime;
        this.owner = config.owner;
        this.dir = config.dir.normalize();
        this.size = config.size;
        this.damage = config.damage;
        this.type = config.type;
        this.color = config.color;
    }

    setTarget(dest){
        this.target = dest.copy();
        this.dir = dest.subtract(this.pos);
    }

    collide(rect){
        return this.pos.x >= rect.x && this.pos.x <= rect.x + rect.w
        && this.pos.y >= rect.y && this.pos.y <= rect.y + rect.h;
    }

    update(delta){
        //debugger;
        //Propagate the projectile
        this.pos = this.pos.add(new Vector2D(
                this.speed * delta * this.dir.x,
                this.speed * delta * this.dir.y
            )
        )

        if (this.lifetime > 0) this.lifetime -= 1;
    }
}

class Laser {
    constructor(x, y, dir, range, owner){
        this.pos = new Vector2D(x, y);
        this.target = null;
        this.homing = false;
        this.speed = speed;
        this.lifetime = 300;
        this.owner = owner;
        this.dir = dir;
    }

    setTarget(dest){
        this.target = dest.copy();
        this.dir = dest.subtract(this.pos);
    }

    update(delta){

    }
}

export const Explosion = (x, y) => {return {x:x, y:y, frame: 0}};

export const P1 = (config) => {return new Projectile({x:config.x, y:config.y, dir: config.dir, color: config.color, lifetime: 400, speed:0.2, owner:config.owner, size: 0.4, damage:10, type:"CON"})};
export const P2 = (config) => {return new Projectile({x:config.x, y:config.y, dir: config.dir, color: config.color, lifetime: 600, speed:0.05, owner:config.owner, size: 0.8, damage:25, type:"CON"})};
export const P3 = (config) => {return new Projectile({x:config.x, y:config.y, dir: config.dir, color: config.color, lifetime: 600, speed:0.05, owner:config.owner, size: 0.8, damage:25, type:"CON"})};

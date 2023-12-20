import {Scrollable} from "./scrollable.js";

// Useful helper functions and data structures for the game

export const Region = (x, y, w, h) => {return {x:x, y:y, w:w, h:h};}

/*
Abstract class for any clickable interface
*/
class Clickable {
    constructor(config){
        if (this.constructor == Clickable) {
          throw new Error("Abstract classes can't be instantiated.");
        }
        //this.buttons = [];
    }
    handleMouseClick(mouseX, mouseY){
        if (this.constructor == Clickable) {
          throw new Error("Abstract classes can't be instantiated.");
        }
    }
    handleMouseHover(mouseX, mouseY){
        if (this.constructor == Clickable) {
          throw new Error("Abstract classes can't be instantiated.");
        }
    }

    draw(ctx) {
        if (this.constructor == Clickable) {
          throw new Error("Abstract classes can't be instantiated.");
        }
    }
}

//Button class
export var Button = function(config) {
    //x and y are coordinates of the CENTER of the button
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 150;
    this.height = config.height || 50;
    this.label = config.label || "Click me!";
    this.color = config.color || "#000000";
    this.onClick = config.onClick || function() {};
    this.hover = 0;
    this.fontstyle = config.fontstyle || "buttonFont";
    this.enabled = true;
};

Button.prototype.draw = function(ctx) {
    //Normal button
    ctx.font=this.height / 3 + "px " + this.fontstyle;
    if (this.enabled){
        if (!this.hover){
            ctx.fillStyle = this.color;
            ctx.strokeStyle = "white";
            ctx.strokeRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
            ctx.fillRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(this.label, this.x, this.y);
        } else {
            //Hovered over button
            ctx.fillStyle = "white";
            ctx.fillRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.fillText(this.label, this.x, this.y);
        }
    } else {
        ctx.fillStyle = "gray";
        ctx.strokeStyle = "white";
        ctx.strokeRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
        ctx.fillRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(this.label, this.x, this.y);
    }

};

Button.prototype.isMouseInside = function(mouseX, mouseY) {
    return (mouseX > (this.x - (this.width / 2)) &&
           mouseX < (this.x + (this.width / 2)) &&
           mouseY > (this.y - (this.height / 2)) &&
           mouseY < (this.y + (this.height / 2)));
};

Button.prototype.handleMouseClick = function(mouseX, mouseY) {
    if (this.isMouseInside(mouseX, mouseY)) {
        this.onClick();
    }
};

Button.prototype.handleMouseHover = function(mouseX, mouseY) {
    this.hover = this.isMouseInside(mouseX, mouseY);
};


//Clickable dropdown menu
export class DropDown extends Clickable{
    constructor(config){
        super();
        this.options = [];
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = 150;
        this.height = 20;
        //this.label = config.label || "Click me!";
        this.hover = 0;
        for (var i = 0; i < config.options.length; i++){
            var b = new Button( { x: this.x, y:this.y + 30 * i, width:90, height:30, label:config.options[i], color: "#898989", fontstyle: "Verdana" } );
            this.options.push(b);
        }

        this.drop = true;
        this.output = "";
    }
    handleMouseClick(mouseX, mouseY){
        for (var i = 0; i < this.options.length; i++){
            if (this.options[i].isMouseInside(mouseX, mouseY)){
                this.output = this.options[i].label;
                break;
            }
        }
    }
    handleMouseHover(mouseX, mouseY){
        for (var i = 0; i < this.options.length; i++){
            this.options[i].handleMouseHover(mouseX, mouseY);
        }
    }
    draw(ctx){
        if (this.drop){
            //Draw buttons
            for (var i = 0; i < this.options.length; i++){
                this.options[i].draw(ctx);
            }
        }
    }
}

//Clickable dropdown menu
export class StateMenu extends Clickable{
    constructor(config){
        super();
        this.options = config.options;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width;
        this.option_height = 40;
        //this.label = config.label || "Click me!";
        this.hover = -1;
        this.font = "Verdana"

        this.state = -1;
    }
    handleMouseClick(mouseX, mouseY){
        var grid_y = ~~((mouseY - this.y) / this.option_height);
        //var grid_x
        if (mouseX >= this.x && mouseX <= this.x + this.width && grid_y >= 0 && grid_y < this.options.length){
            this.state = grid_y;
        }
    }
    handleMouseHover(mouseX, mouseY){
        var grid_y = ~~((mouseY - this.y) / this.option_height);
        //var grid_x
        if (mouseX >= this.x && mouseX <= this.x + this.width && grid_y >= 0 && grid_y < this.options.length){
            this.hover = grid_y;
        } else {
            this.hover = -1;
        }
    }
    draw(ctx){
        //Draw buttons
        for (var i = 0; i < this.options.length; i++){
            //Bevel rectangle
            if (this.hover != i && this.state != i){
                ctx.fillStyle = "#c4c4c4";
                ctx.fillRect(this.x, this.y + i * this.option_height, this.width, this.option_height);
                ctx.font = 30 / 2.5 + "px " + this.font;
                ctx.fillStyle = 'black';
                ctx.fillText(this.options[i], this.x, this.y + (i + 0.5) * this.option_height);
            } else {
                ctx.fillStyle = "#a8a8a8";
                ctx.fillRect(this.x, this.y + i * this.option_height, this.width, this.option_height);
                ctx.font = 30 / 2.5 + "px " + this.font;
                ctx.fillStyle = 'white';
                ctx.fillText(this.options[i], this.x, this.y + (i + 0.5) * this.option_height);
            }
        }
    }
}

export class IconMenu extends StateMenu {
    constructor(config){
        super(config);
        this.data = config.data;
        this.option_height = 80;
    }
    draw(ctx){
        //Draw buttons
        for (var i = 0; i < this.options.length; i++){
            //Bevel rectangle
            if (this.hover != i && this.state != i){
                ctx.fillStyle = "#c4c4c4";
                ctx.fillRect(this.x, this.y + i * this.option_height, this.width, this.option_height);
                ctx.font = 30 / 2.5 + "px " + this.font;
                ctx.fillStyle = 'black';
                ctx.fillText(this.options[i], this.x + this.option_height, this.y + (i + 0.5) * this.option_height);
            } else {
                ctx.fillStyle = "#a8a8a8";
                ctx.fillRect(this.x, this.y + i * this.option_height, this.width, this.option_height);
                ctx.font = 30 / 2.5 + "px " + this.font;
                ctx.fillStyle = 'white';
                ctx.fillText(this.options[i], this.x + this.option_height, this.y + (i + 0.5) * this.option_height);
            }
            //Draw icon associated to option string
            //console.log(this.options[i])
            var img = images[this.options[i]];
            if (img.width >= img.height){
                var ratio = (1 - img.height / img.width) / 2;
                ctx.drawImage(img, this.x, this.y + (i + ratio) * this.option_height, this.option_height, this.option_height * img.height / img.width);
            } else {
                var ratio = (1 - img.width / img.height) / 2;
                ctx.drawImage(img, this.x + ratio * this.option_height, this.y + i * this.option_height, this.option_height * img.width / img.height, this.option_height);
            }
        }
    }
}

export class TabbedPanel extends Clickable{
    constructor(config){
        super();
        this.tabs = config.tabs || [];
        this.tab_width = 80;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = (this.tab_width + 10) * this.tabs.length;
        this.height = 600;
        this.tab_items = {};
        this.fontStyle = "buttonFont";
        for (const it of this.tabs){
            this.tab_items[it] = [];
        }
        this.cur_tab = null;
        this.cur_selections = null;
    }
    addToTab(name, items){
        //this.tab_items[name].push(items);
        for (const it of items){
            this.tab_items[name].push(it);
        }
    }
    getCurSelection(ind){
        if (this.cur_tab != null) {
            return this.tab_items[this.cur_tab][ind].state;
        }
        return null;
    }
    handleMouseClick(mouseX, mouseY){
        //Determine which tab is clicked
        var grid_x = ~~((mouseX - this.x) / (this.tab_width + 10));
        //var grid_x
        if (mouseY >= this.y + 40 && mouseY <= this.y + 40 + 30 && grid_x >= 0 && grid_x < this.tabs.length){
            this.cur_tab = this.tabs[grid_x];
        }
        if (this.cur_tab != null){
            for (var i = 0; i < this.tab_items[this.cur_tab].length; i++){
                this.tab_items[this.cur_tab][i].handleMouseClick(mouseX, mouseY);
            }
        }

    }
    handleMouseHover(mouseX, mouseY){
        if (this.cur_tab != null){
            for (var i = 0; i < this.tab_items[this.cur_tab].length; i++){
                this.tab_items[this.cur_tab][i].handleMouseHover(mouseX, mouseY);
            }
        }
    }
    draw(ctx){
        ctx.fillStyle = "beige";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;

        //Outline
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        //Tabs
        for (var i = 0; i < this.tabs.length; i++){
            ctx.strokeStyle = "red";
            ctx.fillStyle = "beige";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(this.x + i * (this.tab_width + 10), this.y + 40, this.tab_width, 30, [20, 10, 0, 0]);
            ctx.stroke();
            ctx.fill();
            ctx.font = 30 / 2.5 + "px " + this.fontStyle;
            ctx.fillStyle = "black";
            ctx.textAlign = "left";
            ctx.fillText(this.tabs[i], this.x + (i + 0.2) * this.tab_width, this.y + 60);

        }

        //Tab items
        if (this.cur_tab != null){
            for (const item of this.tab_items[this.cur_tab]){
                item.draw(ctx);
            }
        }
    }
}

export class Scrollable {
    constructor(x, y, w, h, items=[]){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.scroll = 0;
        this.items = items;
    }

    addItem(item){
        this.items.push(item);
    }

    draw(ctx){
        //Only draw items within visible area (which is determined by the scroll parameter)

    }
}

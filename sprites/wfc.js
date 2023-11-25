// initialize the 2d tool
var tool = new WFCTool2D();

// add an 3x3 "L" shaped tile
tool.addTile(`\
.@.
.@@
...`)
// ^ all rotated versions of the tile will also be added,
// unless you specify otherwise (see below)

// add an 3x3 "I" shaped tile
tool.addTile(`\
.@.
.@.
.@.`,
{transformations:['cw']})
// ^ for this tile, we only need itself and a clockwise 90 deg rotated version
// for 2D tiles, transformations can include 'cw', 'fx' (flip x) and 'fy' (flip y).
// you can also combine them using '+'
// e.g. for anti-clockwise 90 deg rotation you can do 'cw+cw+cw'
// duplicates will be detected and will not be added multiple times.

// add a plain tile
tool.addTile(`\
...
...
...`,
{transformations:[],weight:0.1})
// you can specify the weight of the tile. higher the weight,
// more often it will appear. default is 1.


// rules are automatically generated based on this logic:
// only tiles with an identical edge can go next to each other, like so:
// .@.     ...
// .@@  +  @@@
// ...     ...
// the tiles below can NOT go next to each other:
// .@.     ...
// .@@  +  ...
// ...     ...
// because the right edge of 1st tile does not match left edge of the 2nd
// same for vertical axis.


// define the color of the symbols.
// this is used only to quickly visualize the results
// you won't need this if you're using your own assets
tool.addColor("@", [255,0,0])
tool.addColor(".", [0,255,255])


// print a summary of automatically generated version of the tiles
// you'll need this if you're using your own assets
// each formula is a 3-tuple:
// the first element is the original index (the order you called `addTile`)
// the second element is the transformations applied (e.g. 'fx+cw')
// the third element is the transformed version
console.log(tool.getTileFormulae());

// this generates all the input which you can directly pass to WFC
var wfcInput = tool.generateWFCInput();
var wfc = new WFC(wfcInput);

// define a region of interest inside which you want tiles to be generated
// by passing two corners of the bounding box/cube/hypercube
var size = 5;
wfc.expand([-size,-size],[size,size]);

// the main loop
// subsitute with setTimeout/requestAnimationFrame/WebWorker depending on usage

for (var i = 0; i < 100; i++){
	var done = wfc.step();  // advance 1 step, filling at least 1 new coordinate.
	                        // step() returns true if the region of interest has
	                        // been entirely filled

	if (done){
		size += 5           // all space filled, time to expand more
		wfc.expand([-size,-size],[size,size]);  // newly marked area will begin to
		                                        // be generated in the next step()
	}

	console.log(wfc.readout());
	// ^ get the current result, an object mapping coordinate to tile index
	// something like {'1,2':0, '2,2':2, '3,1':1, ...}

	// use wfc.readout(false) to read the result as probability distribution,
	// something like {'1,2',[1,0,0], '2,2':[0.3,0.2,0.5], ...}

}

// // visualize the output on a HTML canvas
var wfc_canvas = document.createElement("canvas");
wfc_canvas.style.zIndex = 6;
var viewport = {x:0,y:0,w:10,h:10}; // the region you want to visualize
tool.plotWFCOutput(wfc_canvas, viewport, wfc.readout()); // plot it!
//var dataURL = wfc_canvas.toDataURL("image/png");
//window.open(wfc_canvas.toDataURL('image/png'));

var express = require('express');
var app = express();
var path = require('path');

var fs = require("fs");
var host = "127.0.0.1";
var port = 8080;

// var username = "";

// const mongo = require('./mongo');
// async function start() {
//   // other app startup stuff...
//   await mongo.init();
//   // other app startup stuff...
// }
// start().catch(console.dir);


app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname + "/src")));
app.use(express.static(path.join(__dirname + "/ndwfc-master")));
app.use(express.static(path.join(__dirname + "/box2dweb")));
app.use(express.static(path.join(__dirname + "/sprites")));
app.use(express.static(path.join(__dirname + "/audio")));
app.use(express.static(path.join(__dirname + "/presets")));
app.use(express.static(path.join(__dirname + "/shaders")));
app.use(express.static(path.join(__dirname + "/fonts")));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(port);
console.log("app listening on port:" + port);

// export default {mongo};

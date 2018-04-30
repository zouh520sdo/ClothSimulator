"use strict";

var canvas;
var gl;

var numVertices  = 36;

var cubesArray = [];
var pointsArray = [];
var normalsArray = [];
var colorsArray = [];

var cloth;

// For animation
var pointsArrayA = [];
var normalsArrayA = [];
var isAnimating = false;
var rotated = 0;
var delta = 10;
var deltaR;

// For setting
var WireFrame = true;

// For shuffling
var shuffles = [];

// Mapping between keys and direction
var keys2Dir = new Map();
keys2Dir.set("j", vec3(0, 0, 1));
keys2Dir.set("l", vec3(0, 0, -1));
keys2Dir.set("i", vec3(0, 1, 0));
keys2Dir.set("k", vec3(0, -1, 0));
keys2Dir.set("u", vec3(1, 0, 0));
keys2Dir.set("o", vec3(-1, 0, 0));
keys2Dir.set("J", vec3(0, 0, 1));
keys2Dir.set("L", vec3(0, 0, -1));
keys2Dir.set("I", vec3(0, 1, 0));
keys2Dir.set("K", vec3(0, -1, 0));
keys2Dir.set("U", vec3(1, 0, 0));
keys2Dir.set("O", vec3(-1, 0, 0));

keys2Dir.set("a", vec3(0, 0, 1));
keys2Dir.set("d", vec3(0, 0, -1));
keys2Dir.set("w", vec3(0, 1, 0));
keys2Dir.set("s", vec3(0, -1, 0));
keys2Dir.set("q", vec3(1, 0, 0));
keys2Dir.set("e", vec3(-1, 0, 0));
keys2Dir.set("A", vec3(0, 0, 1));
keys2Dir.set("D", vec3(0, 0, -1));
keys2Dir.set("W", vec3(0, 1, 0));
keys2Dir.set("S", vec3(0, -1, 0));
keys2Dir.set("Q", vec3(1, 0, 0));
keys2Dir.set("R", vec3(-1, 0, 0));

var keysArray = [];
for (var key of keys2Dir.keys()) {
    keysArray.push(key);
}

var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 )
    ];

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];

var thetaLoc;

var rotateFlag = false;
var flag = false;
var lastX = null;
var lastY = null;

var eye = null;
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    canvas.onmousedown = function(event) {
        rotateFlag = true;
        lastX = event.clientX;
        lastY = event.clientY;
    }
    
    canvas.onmouseup = function(event) {
        rotateFlag = false;
    }
    
    canvas.onmousemove = function(event) {
        if (rotateFlag) {
            var curX = event.clientX;
            var curY = event.clientY;
            
            var deltaX = curX - lastX;
            var deltaY = curY - lastY;
            
            theta[0] += (deltaX);
            //theta[1] += (deltaY);
            theta[1] = Math.min(Math.max(theta[1]+deltaY, -90), 90);
            
            // Update lastX and lastY
            lastX = curX;
            lastY = curY;
            
            //console.log("Mouse X Y " + curX + " " + curY);
        }
    }

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    cloth = new Cloth(50, 0.5, 2);
    numVertices = cloth.indCount;
    

    //initCubes();
    //renderCubes();
    

    //thetaLoc = gl.getUniformLocation(program, "theta");

    viewerPos = vec3(0.0, 0.0, -20.0 );

    //projection = ortho(-1.2, 1.2, -1.2, 1.2, -100, 100);
    projection = perspective(60, 1, 1, 500);
    //projection = gl.frustum(-1.2, 1.2, -1.2, 1.2, -100, 100);

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    document.getElementById("AddForce").onclick = function(){
        cloth.randomForce();
    };
    
    document.getElementById("Wind").onclick = function(){
        cloth.wind();
    };
    
    // Handle mirror mode checkbox
    document.getElementById("WireFrame").onchange = function() {
        WireFrame = document.getElementById("WireFrame").checked;
    };

    /*
    document.getElementById("Resistance").onchange = function() {
        cloth.hasResist = document.getElementById("Resistance").checked;
    };
    */
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),
       flatten(specularProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),
       flatten(lightPosition) );

    gl.uniform1f(gl.getUniformLocation(program,
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));

    render();
    renderCloth();
}

var shuffle = function() {
    console.log(shuffles.length);
    if (shuffles.length == 0) return;

    var a = shuffles.pop();
    var reverse = Math.random < 0.5? true : false;

    rotateSide(a, reverse);
}



var isArrayEqual = function(a, b) {
    if (a.length != b.length) {
        return false;
    }
    for (var i=0; i<a.length; i++) {
        if (a[i] != b[i]) {
            return false;
        }
    }
    return true;
}

var renderCloth = function() {
    // position
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cloth.pos), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    cloth.updatePos();
    
    requestAnimFrame(renderCloth);
}


var render = function(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 2.0;

//    modelView = mat4();
//    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
//    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
//    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));

    var radius = 3;
    
//    eye = vec3(radius*Math.sin(radians(theta[0]))*Math.cos(radians(theta[1])),
//        radius*Math.sin(radians(theta[0]))*Math.sin(radians(theta[1])), radius*Math.cos(radians(theta[0])));

    eye = vec3(radius*Math.cos(radians(theta[0]))*Math.cos(radians(theta[1])), radius*Math.sin(radians(theta[1])), radius*Math.sin(radians(theta[0]))*Math.cos(radians(theta[1])));
    
    //console.log("Camera XYZ " + eye[0] + " " + eye[1] + " " + eye[2]);
    
    modelView = lookAt(eye, at , up);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    if (WireFrame) {
        gl.drawArrays( gl.LINES, 0, numVertices );
    }
    else {
        gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    }


    requestAnimFrame(render);
}

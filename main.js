'use strict';

import Point from './Point.js';
import Triangle from './Triangle.js';


let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.


let numPointsU = 125; // Number of points in the u direction
let numPointsV = 125; // Number of points in the v direction
let damping_coef = 1; // damping coefficient
let b = 1; // length of the straight line segment
let m = 5; // number of half-waves
let fi = Math.PI / 4;
let rMax = 1.5; // Maximum r value

let color = [0, 1, 0, 0];


function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function updateValue(elementId) {
    const range = document.getElementById(elementId);
    const valueDisplay = document.getElementById(elementId + "_value");
    valueDisplay.textContent = range.value;
}

function retrieveValuesFromInputs() {
    numPointsU  = parseInt(document.getElementById('u_points').value);
    numPointsV  = parseInt(document.getElementById('v_points').value);
    damping_coef = parseFloat(document.getElementById('damping').value);
    b = parseFloat(document.getElementById('length').value);
    m = parseInt(document.getElementById('waves').value);
    fi = deg2rad(parseInt(document.getElementById('phase').value));

    
}

function reDraw(){
    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    draw();
}

// Add event listeners to update displayed values when inputs change
document.getElementById('u_points').addEventListener('input', function() {
    updateValue('u_points');
    retrieveValuesFromInputs();
    reDraw();
});
document.getElementById('v_points').addEventListener('input', function() {
    updateValue('v_points');
    retrieveValuesFromInputs();
    reDraw();
});
document.getElementById('damping').addEventListener('input', function() {
    updateValue('damping');
    retrieveValuesFromInputs();
    reDraw();
});
document.getElementById('length').addEventListener('input', function() {
    updateValue('length');
    retrieveValuesFromInputs();
    reDraw();
});
document.getElementById('waves').addEventListener('input', function() {
    updateValue('waves');
    retrieveValuesFromInputs();
    reDraw();
});
document.getElementById('phase').addEventListener('input', function() {
    updateValue('phase');
    retrieveValuesFromInputs();
    reDraw();
});

//Initialize displayed values on page load
updateValue('u_points');
updateValue('v_points');
updateValue('damping');
updateValue('length');
updateValue('waves');
updateValue('phase');


//Constructor

// function Model(name) {
//     this.name = name;
//     this.iVertexBuffer = gl.createBuffer();
//     this.count = 0;

//     this.BufferData = function(vertices) {

//         gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
//         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

//         this.count = vertices.length/3;
//     }

//     this.Draw = function() {

//         gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
//         gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
//         gl.enableVertexAttribArray(shProgram.iAttribVertex);
   
//         gl.drawArrays(gl.LINE_STRIP, 0, this.count);
//     }
// }

function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        this.count = vertices.length / 3;

    }

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


// Draws a Surface of Revolution with Damping Circular Waves, along with a set of coordinate axes.
function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12); 
    
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );
        
    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1 );

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection );
    

    gl.uniform4fv(shProgram.iColor, color );

    surface.Draw();
}

const testButton = document.getElementById('testButton');

// Add an event listener to the button
testButton.addEventListener('click', test);

function test(){
    color = [1, 0, 0, 0];
    reDraw();
}


function CreateSurfaceData()
{
    

    const vertexList = [];

    // vertexList.push(0,0,0);
    // vertexList.push(0.5,0,0);
    // vertexList.push(0.3,0.7,0);
    
    // vertexList.push(0,0,0);
    // vertexList.push(0,0,0.5);
    // vertexList.push(0,0.7,0.3);
   


    // for (let i = 0; i < numPointsU; i++) {
    //     for (let j = 0; j < numPointsV; j++) {
    //         const u = (i * 2 * Math.PI) / numPointsU; // Full revolution
    //         const r = (j / numPointsV) * rMax;

    //         // Calculate the x, y, and z coordinates based on the parametric equations
    //         const x = r * Math.cos(u);
    //         const y = r * Math.sin(u);
    //         const z = damping_coef * Math.exp(-Math.PI * r) * Math.sin((m * Math.PI * r) / b + fi);

        
    //         vertexList.push(x, y, z);
    //     }
    // }

    
    for (let i = 0; i < numPointsU; i++) {
        for (let j = 0; j < numPointsV; j++) {
            const u1 = (i * 2 * Math.PI) / numPointsU; // Full revolution for i
            const u2 = ((i + 1) * 2 * Math.PI) / numPointsU; // Full revolution for i+1
            const v1 = (j / numPointsV) * rMax; // Height for j
            const v2 = ((j + 1) / numPointsV) * rMax; // Height for j+1
    
            
            const x1 = v1 * Math.cos(u1);
            const y1 = v1 * Math.sin(u1);
            const z1 = damping_coef * Math.exp(-Math.PI * v1) * Math.sin((m * Math.PI * v1) / b + fi);
    
            const x2 = v1 * Math.cos(u2);
            const y2 = v1 * Math.sin(u2);
            const z2 = damping_coef * Math.exp(-Math.PI * v1) * Math.sin((m * Math.PI * v1) / b + fi);
    
            const x3 = v2 * Math.cos(u1);
            const y3 = v2 * Math.sin(u1);
            const z3 = damping_coef * Math.exp(-Math.PI * v2) * Math.sin((m * Math.PI * v2) / b + fi);
    
            const x4 = v2 * Math.cos(u2);
            const y4 = v2 * Math.sin(u2);
            const z4 = damping_coef * Math.exp(-Math.PI * v2) * Math.sin((m * Math.PI * v2) / b + fi);
    
            
            vertexList.push(x1, y1, z1, x3, y3, z3, x2, y2, z2);
            vertexList.push(x2, y2, z2, x3, y3, z3, x4, y4, z4);
        }
    }


    return vertexList;

}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );
    retrieveValuesFromInputs();
    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");

    
    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
     }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

/**
 * initialization function that will be called when the page has loaded
 */
export function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

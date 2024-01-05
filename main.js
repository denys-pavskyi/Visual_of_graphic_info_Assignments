'use strict';


let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let sphereProgram;
let sphere;
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.


let numPointsU = 125; // Number of points in the u direction
let numPointsV = 125; // Number of points in the v direction
let damping_coef = 1; // damping coefficient
let b = 1; // length of the straight line segment
let m = 5; // number of half-waves
let fi = Math.PI / 4;
let rMax = 1.5; // Maximum r value
let normals = [];


let rotate_texture_value = 0.0;
let point_on_surface = {u: 0.5, v: 0.5};
let u_max = 0, v_max = 0, u_min = 0, v_min = 0, u_step = 0.1, v_step = 0.1;



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

    rotate_texture_value = parseFloat(document.getElementById('rotate_texture').value);
}

function reDraw(){
    //surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    //LoadTexture();
    surface.TextureBufferData(CreateTextureCoordinates(numPointsU,numPointsV));

    sphere = new Sphere("Sphere", sphereProgram);
    let pnt = calculatePointOnSurface(point_on_surface.u, point_on_surface.v);
    sphere.BufferData(CreateSphereSurface(pnt.x, pnt.y, pnt.z, 0.1));


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
document.getElementById('rotate_texture').addEventListener('input', function() {
    updateValue('rotate_texture');
    rotate_surface();
});

function rotate_surface(){
    rotate_texture_value = parseFloat(document.getElementById('rotate_texture').value);

    draw();
}

//Initialize displayed values on page load
updateValue('u_points');
updateValue('v_points');
updateValue('damping');
updateValue('length');
updateValue('waves');
updateValue('phase');
updateValue('rotate_texture');


//Constructor

function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.texture = gl.createTexture();

    this.countText = 0;
    this.count = 0;

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;

    }

    this.TextureBufferData = function (normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        this.countText = normals.length / 3;
    }


    this.Draw = function(projectionViewMatrix) {

        let rotation = spaceball.getViewMatrix();
        let translation = m4.translation(0, 0, 0);
        let modelMatrix = m4.multiply(translation, rotation);
        let modelViewProjection = m4.multiply(projectionViewMatrix, modelMatrix);
        gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.aTexCoord);

        gl.uniform1i(shProgram.uTexture, 0);
        gl.uniform1f(shProgram.uTextureRotation, rotate_texture_value);
        gl.enable(gl.TEXTURE_2D);
        gl.uniform1f(shProgram.iRotateValue, 0);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    this.iSolidColor = -1;
    this.iAttribVertex = -1;
    this.iModelViewProjectionMatrix = -1;

    // Texture rotation uniform
    this.uTextureRotation = -1; 
    
    // Get uniform locations
    this.uTexture = -1;


    // Get attribute location for texture coordinates
    this.aTexCoord = -1;
    

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

function Sphere(name, program){
    this.iVertexBuffer = gl.createBuffer();
    this.name = name;
    this.count = 0;

    this.program = program;

    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 3;

    }

    this.Draw = function (projectionViewMatrix) {

        let rotation = spaceball.getViewMatrix();
        let translation = m4.translation(0, 0 ,0);
        let modelMatrix = m4.multiply(translation, rotation);
        let modelViewProjection = m4.multiply(projectionViewMatrix, modelMatrix);
        this.program.Use();

        gl.uniformMatrix4fv(this.program.iModelViewProjectionMatrix, false, modelViewProjection);
        gl.uniform4fv(this.program.iSolidColor, [0.7, 0.1, 0.2, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(this.program.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.program.iAttribVertex);



        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}



// Draws a Surface of Revolution with Damping Circular Waves, along with a set of coordinate axes.
function draw() { 
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    /* Set the values of the Perspective projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12); 
    let Camera = [0,0,-10];
    const viewMatrix = m4.lookAt(Camera, [0, 0, 0], [0, 1, 0]);
    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    const projectionViewMatrix = m4.multiply(projection, m4.multiply(viewMatrix, rotateToPointZero));
    

    
    shProgram.Use();
    surface.Draw(projectionViewMatrix);

    sphereProgram.Use();
    sphere.Draw(projectionViewMatrix);
}



// Normal Facet Average

function CreateSurfaceData()
{

    const vertexList = [];
    normals = [];
    let all_nor = [];
    u_max = 0;
    v_max = 0;   
    u_min = 0;
    v_min = 0;


    for (let i = 0; i < numPointsU; i++) {
        let normals_row = [];

        for (let j = 0; j < numPointsV; j++) {
            const u1 = (i * 2 * Math.PI) / numPointsU; // Full revolution for i
            const u2 = ((i + 1) * 2 * Math.PI) / numPointsU; // Full revolution for i+1
            const v1 = (j / numPointsV) * rMax; // Height for j
            const v2 = ((j + 1) / numPointsV) * rMax; // Height for j+1
    
            //vertices
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
  

            u_max = Math.max(u_max, u1, u2);
            v_max = Math.max(v_max, v1, v2);
            u_min = Math.min(u_min, u1, u2);
            v_min = Math.min(v_min, v1, v2);
            u_step = 0.01*(u_max-u_min);
            v_step = 0.01*(v_max-v_min);
            
            //normals
            let vec21 = { x: x2-x1, y: y2-y1, z: z2-z1 };
            let vec31 = { x: x3-x1, y: y3-y1, z: z3-z1 };
            let nor1 = vec3_CrossProduct(vec21, vec31);
            vec3_Normalize(nor1);


            let vec34 = { x: x4-x3, y: y4-y3, z: z4-z3 };
            let vec24 = { x: x4-x2, y: y4-y2, z: z4-z2 };
            let nor2 = vec3_CrossProduct(vec34, vec24);
            vec3_Normalize(nor2);

            normals_row.push(nor1, nor1, nor1, nor2, nor2, nor2);

            
        }

        all_nor.push(normals_row);
        
    }

    


    for(let i = 0; i<all_nor.length;i++){
        for(let j = 0; j<all_nor[i].length; j++){
            let cnt = 0;
            let avg_nor = {x: 0, y: 0, z: 0};


            if(j>0){
                cnt++;
                avg_nor.x+=all_nor[i][j-1].x;
                avg_nor.y+=all_nor[i][j-1].y;
                avg_nor.z+=all_nor[i][j-1].z;
            }

            if(j<all_nor[i].length-1){
                cnt++;
                avg_nor.x+=all_nor[i][j+1].x;
                avg_nor.y+=all_nor[i][j+1].y;
                avg_nor.z+=all_nor[i][j+1].z;
            }

            if(i < all_nor.length-1){
                cnt++;
                avg_nor.x+=all_nor[i+1][j].x;
                avg_nor.y+=all_nor[i+1][j].y;
                avg_nor.z+=all_nor[i+1][j].z;
            }

            if(i > 0){
                cnt++;
                avg_nor.x+=all_nor[i-1][j].x;
                avg_nor.y+=all_nor[i-1][j].y;
                avg_nor.z+=all_nor[i-1][j].z;
            }

            normals.push(avg_nor.x/cnt, avg_nor.y/cnt,avg_nor.z/cnt)


        }
    }
    
    return vertexList;
}


function CreateTextureCoordinates(numPointsU, numPointsV) {
    const textureCoords = [];

    for (let i = 0; i < numPointsU; i++) {
        for (let j = 0; j < numPointsV; j++) {
            const u1 = i / (numPointsU - 1); // U coordinate
            const v1 = j / (numPointsV - 1); // V coordinate

            // Push texture coordinates for the current quad
            textureCoords.push(u1, v1);
            textureCoords.push(u1 + 1 / numPointsU, v1);
            textureCoords.push(u1, v1 + 1 / numPointsV);

            textureCoords.push(u1 + 1 / numPointsU, v1);
            textureCoords.push(u1, v1 + 1 / numPointsV);
            textureCoords.push(u1 + 1 / numPointsU, v1 + 1 / numPointsV);
        }
    }

    return textureCoords;
}

function vec3_CrossProduct(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function vec3_Normalize(vec) {
    var magnitude  = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    vec[0] /= magnitude ; vec[1] /= magnitude ; vec[2] /= magnitude ;
}



/* Initialize the WebGL context. Called from init() */
function initGL() {
    
    initGL_Surface();
    initGL_Sphere();
    gl.enable(gl.DEPTH_TEST);
}


function initGL_Sphere(){
    let prog = createProgram(gl, SphereVertexShaderSource, SphereFragmentShaderSource);

    sphereProgram = new ShaderProgram('Sphere', prog);
    sphereProgram.Use();

    sphereProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    sphereProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    sphereProgram.iSolidColor = gl.getUniformLocation(prog, "color");

    sphere = new Sphere("Sphere", sphereProgram);
    let pnt = calculatePointOnSurface(point_on_surface.u, point_on_surface.v);
    sphere.BufferData(CreateSphereSurface(pnt.x, pnt.y, pnt.z, 0.1));
}

function CreateSphereSurface(centerX, centerY, centerZ, r) {
    let sphereVertexList = [];
    let lon = -Math.PI;
    let lat = -Math.PI * 0.5;
    
    while (lon < Math.PI) {
        while (lat < Math.PI * 0.5) {
            let v1 = sphereSurfaceData(centerX, centerY, centerZ, r, lon, lat);
            sphereVertexList.push(v1.x, v1.y, v1.z);
            lat += 0.05;
        }
        lat = -Math.PI * 0.5
        lon += 0.05;
    }
    return sphereVertexList;
}

function sphereSurfaceData(centerX, centerY, centerZ, r, u, v) {
    let x = centerX + r * Math.sin(u) * Math.cos(v);
    let y = centerY + r * Math.sin(u) * Math.sin(v);
    let z = centerZ + r * Math.cos(u);
    return { x: x, y: y, z: z };
}



function initGL_Surface(){
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );
    retrieveValuesFromInputs();
    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();
    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    
    shProgram.uTexture = gl.getUniformLocation(prog, "u_texture");
    shProgram.uTextureRotation = gl.getUniformLocation(prog, "u_textureRotation");

    // Get attribute location for texture coordinates
    shProgram.aTexCoord = gl.getAttribLocation(prog, "a_texcoord");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    LoadTexture();
    surface.TextureBufferData(CreateTextureCoordinates(numPointsU,numPointsV));
    
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

window.onkeydown = (e) => {
    switch (e.keyCode) {
        case 87:
            // W key
            point_on_surface.v -= v_step;
            break;
        case 83:
            // S key
            point_on_surface.v += v_step;
            break;
        case 65:
            // A key
            point_on_surface.u += u_step;
            break;
        case 68:
            // D key
            point_on_surface.u -= u_step;
            break;
    }

    if(point_on_surface.u<u_min){
        point_on_surface.u = u_max;
    }else{
        if(point_on_surface.u>u_max){
            point_on_surface.u = u_min;
        }
    }

    point_on_surface.v = Math.max(v_min, Math.min(point_on_surface.v, v_max))

    sphere = new Sphere("Sphere", sphereProgram);
    let pnt = calculatePointOnSurface(point_on_surface.u, point_on_surface.v);
    sphere.BufferData(CreateSphereSurface(pnt.x, pnt.y, pnt.z, 0.1));
    draw();
}

function calculatePointOnSurface(u, v) {
    const x = v * Math.cos(u);
    const y = v * Math.sin(u);
    const z = damping_coef * Math.exp(-Math.PI * v) * Math.sin((m * Math.PI * v) / b + fi);

    return { x, y, z };
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.src = "https://raw.githubusercontent.com/denys-pavskyi/Visual_of_graphic_info_Assignments/CGW/texture.jpg";
    

    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw();
    }
}

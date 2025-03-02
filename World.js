// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightDir;
  uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;
  uniform vec3 u_ambientColor;
  uniform bool u_pointLight;

  void main() {

    if (u_whichTexture == 0) {
      gl_FragColor = u_FragColor;         // use color 

    } else if (u_whichTexture == -1) {    // use uv debug color
      gl_FragColor = vec4(v_UV, 1.0, 1.0);

    } else if (u_whichTexture == -2) {     // use texture 0 == grass
      gl_FragColor = texture2D(u_Sampler0, v_UV);

    } else if (u_whichTexture == -3) {    // use texture 1 == sky
      gl_FragColor = texture2D(u_Sampler1, v_UV);

    } else if (u_whichTexture == -4) {    // use texture 2 == purple flower
      gl_FragColor = texture2D(u_Sampler2, v_UV);

    } else if (u_whichTexture == -5) {    // use texture 3 == yarn
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    
    } else if (u_whichTexture == -6) {    // use texture 4 == blue flower
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    
    } else if (u_whichTexture == -7) {     // normal color
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    
    } else {                              // error, but redish
      gl_FragColor = vec4(1,.2,.2,1);
    }

    if (u_pointLight) {

      vec3 lightVector = u_lightPos-vec3(v_VertPos);
      float r=length(lightVector);

      vec3 L = normalize(lightVector);
      vec3 N = normalize(v_Normal);
      float nDotL = max(dot(N,L), 0.0);

      // Reflection
      vec3 R = reflect(-L, N);

      // eye
      vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

      //Specular
      float specular = pow(max(dot(E,R), 0.0), 64.0) * 0.8;

      vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
      vec3 ambient = vec3(gl_FragColor) * 0.2;

      ambient = ambient * u_ambientColor;
      
      if(u_lightOn) {
        if(u_whichTexture == 0) {
          gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
        } else {
          gl_FragColor = vec4(diffuse + ambient, 1.0);
        }
      }

    } else {
      float spotlight_limit = 0.94;
      vec3 lightVector = u_lightPos - vec3(v_VertPos);
      float r = length(lightVector);
      
      // calculate n dot l
      vec3 L = normalize(lightVector);
      vec3 N = normalize(v_Normal);
      float nDotL = max(dot(N, L), 0.0);
      
      // reflection
      vec3 R = reflect(-L, N);
      
      // eye
      vec3 E = u_cameraPos - vec3(v_VertPos);
      E = normalize(E);

      // spotlight code from maansilv
      vec3 diffuse = vec3(0.0, 0.0, 0.0);
      vec3 ambient = vec3(gl_FragColor) * 0.15;
      float specular = 0.0;
      float dotFromDirection = dot(normalize(lightVector), -normalize(u_lightDir));
      if (dotFromDirection >= (spotlight_limit - .1)){
        if (dotFromDirection >= spotlight_limit){
          diffuse = vec3(gl_FragColor) * nDotL;
          if (nDotL > 0.0){
            specular = pow(max(dot(E, R), 0.0), 15.0);
          }
        } else{
          diffuse = vec3(gl_FragColor) * nDotL * ((dotFromDirection - spotlight_limit + 0.1)/0.1);
          if (nDotL > 0.0){
            specular = pow(max(dot(E, R), 0.0), 15.0)* ((dotFromDirection - spotlight_limit + 0.1)/0.1);
          }
        }
        
      }
      
      if(u_lightOn) {
        if(u_whichTexture == 0) {
          gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
        } else {
          gl_FragColor = vec4(diffuse + ambient, 1.0);
        }
      }
    } 


  }`

// declaring global variables to see changes
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let a_UV;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_whichTexture;

let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;

let u_lightPos;
let u_cameraPos;
let u_lightOn;
let u_ambientColor;
let u_pointLight;


// setupWebGL() â€“ get the canvas and gl context
function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}


function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
  
    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
  
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }

    // getthe storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
      console.log('Failed to get the storage location of a_UV');
      return;
    }

    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return;
    }

    // Get the storage location of u_Modelmatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_Modelmatrix');
      return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
      console.log('Failed to get the storage location of u_GlobalRotateMatrix');
      return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
      console.log('Failed to get u_whichTexture');
      return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0'); //grass
    if (!u_Sampler0) {
      console.log('Failed to get u_Sampler0');
      return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1'); //sky
    if (!u_Sampler1) {
      console.log('Failed to get u_Sampler1');
      return false;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2'); //purple flower
    if (!u_Sampler2) {
      console.log('Failed to get u_Sampler2');
      return false;
    }

    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3'); //yarn
    if (!u_Sampler3) {
      console.log('Failed to get u_Sampler3');
      return false;
    }

    u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4'); //blue flower
    if (!u_Sampler4) {
      console.log('Failed to get u_Sampler4');
      return false;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
      console.log('Failed to get the storage location of u_ViewMatrix');
      return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
      console.log('Failed to get the storage location of u_ProjectionMatrix');
      return;
    }

    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
      console.log('Failed to get the storage location of u_lightPos');
      return;
    }

    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    if (!u_cameraPos) {
      console.log('Failed to get the storage location of u_cameraPos');
      return;
    }

    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
      console.log('Failed to get the storage location of u_lightOn');
      return;
    }

    u_ambientColor = gl.getUniformLocation(gl.program, 'u_ambientColor');
    if (!u_ambientColor) {
      console.log('Failed to get the storage location of u_ambientColor');
      return;
    }

    // Get the storage location of u_point_light
    u_pointLight = gl.getUniformLocation(gl.program, 'u_pointLight');
    if (!u_pointLight){
      console.log('Failed to get the storage location of u_pointLight');
      return -1;
    }

    // Get the storage location of u_lightDir
    u_lightDir = gl.getUniformLocation(gl.program, 'u_lightDir');
    if (!u_lightDir){
      console.log('Failed to get the storage location of u_lightDir');
      return -1;
    }

}

//Globals related to UI elems
let g_globalAngleY = 0;
let g_globalAngle = 0;
let g_headAngle = 0;
let g_bodyAngle = 0;
let g_frontLArmAngle = 0;
let g_frontRArmAngle = 0;
let g_backLLegAngle = 0;
let g_backRLegAngle = 0;
let g_tailAngle = 130;
let g_middleTailAngle = 0;
let g_tailTipAngle = 45;
let g_catXoffset = 0;
let g_catZoffset = 0;

let g_animation = false;
let time = 0;
let shift = false;

let g_normalOn=false;
let g_lightPos = [0, 1, -2];
let g_lightDir = [0, -1, 0];
let g_lightOn = true;
let g_pointLight = true;
let g_ambientColor = [1,1,1,1];

var g_camera = new Camera();

function addActionForHtmlUI() {

    document.getElementById('animationOnButton').onclick = function() {g_animation = true; };
    document.getElementById('animationOffButton').onclick = function() {g_animation = false; };

    // point v spot light
    document.getElementById('regLightButton').onclick = function(){g_pointLight = true; renderAllShapes();};
    document.getElementById('spotLightButton').onclick = function(){g_pointLight = false; renderAllShapes();};

    // normals
    document.getElementById('normalOnButton').onclick = function() {g_normalOn=true;};
    document.getElementById('normalOffButton').onclick = function() {g_normalOn=false;};

    // light on and off
    document.getElementById('lightOnButton').onclick = function() {g_lightOn=true;};
    document.getElementById('lightOffButton').onclick = function() {g_lightOn=false;};
    
    //Slider events
    document.getElementById('headSlider').addEventListener('mousemove', function () {g_headAngle = this.value; renderAllShapes();});
    document.getElementById('bodySlider').addEventListener('mousemove', function () {g_bodyAngle = this.value; renderAllShapes();});
    
    document.getElementById('frontLArmSlider').addEventListener('mousemove', function () {g_frontLArmAngle = this.value; renderAllShapes();});
    document.getElementById('frontRArmSlider').addEventListener('mousemove', function () {g_frontRArmAngle = this.value; renderAllShapes();});
    
    document.getElementById('backLLegSlider').addEventListener('mousemove', function () {g_backLLegAngle = this.value; renderAllShapes();});
    document.getElementById('backRLegSlider').addEventListener('mousemove', function () {g_backRLegAngle = this.value; renderAllShapes();});
    
    document.getElementById('tailSlider').addEventListener('mousemove', function () {g_tailAngle = this.value; renderAllShapes();});
    document.getElementById('middleTailSlider').addEventListener('mousemove', function () {g_middleTailAngle = this.value; renderAllShapes();});
    document.getElementById('tailTipSlider').addEventListener('mousemove', function () {g_tailTipAngle = this.value; renderAllShapes();});
    
    document.getElementById('angleSlider').addEventListener('mousemove', function () {g_globalAngle = this.value; renderAllShapes();});

    // ambient slider
    document.getElementById('ambientRSlider').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_ambientColor[0] = this.value/255; renderAllShapes();}}); 
    document.getElementById('ambientGSlider').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_ambientColor[1] = this.value/255; renderAllShapes();}}); 
    document.getElementById('ambientBSlider').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_ambientColor[2] = this.value/255; renderAllShapes();}});  

    // light coords slider
    document.getElementById('lightXSlider').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[0] = this.value/100; renderAllShapes();}}); 
    document.getElementById('lightYSlider').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[1] = this.value/100; renderAllShapes();}}); 
    document.getElementById('lightZSlider').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) {g_lightPos[2] = this.value/100; renderAllShapes();}});
}

function initTextures() {
  var image = new Image();
  if(!image) {
    console.log('Failed to create the image object');
    return false;
  }
  image.onload = function(){loadTexture(image); };
  image.src = 'grass.jpg';
  return true;
}

function initTextures1() {
  var image1 = new Image();
  if(!image1) {
    console.log('Failed to create the image object');
    return false;
  }
  image1.onload = function(){loadTexture1(image1); };
  image1.src = 'sky.jpg';
  return true;
}

function initTextures2() {
  var image2 = new Image();
  if(!image2) {
    console.log('Failed to create the image object');
    return false;
  }
  image2.onload = function(){loadTexture2(image2); };
  image2.src = 'flower.jpg';
  return true;
}

function initTextures3() {
  var image3 = new Image();
  if(!image3) {
    console.log('Failed to create the image object');
    return false;
  }
  image3.onload = function(){loadTexture3(image3); };
  image3.src = 'yarn.jpg';
  return true;
}

function initTextures4() {
    var image4 = new Image();
    if(!image4) {
      console.log('Failed to create the image object');
      return false;
    }
    image4.onload = function(){loadTexture4(image4); };
    image4.src = 'blue_flower.jpg';
    return true;
  }

function loadTexture(image) {
  var texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0);
  console.log('finished loadTexture0');
}

function loadTexture1(image) {
  var texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler1, 1);
  console.log('finished loadTexture1');
}

function loadTexture2(image) {
  var texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler2, 2);
  console.log('finished loadTexture2');
}

function loadTexture3(image) {
  var texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler3, 3);
  console.log('finished loadTexture3');
}

function loadTexture4(image) {
    var texture = gl.createTexture();
    if(!texture) {
      console.log('Failed to create the texture object');
      return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler4, 4);
    console.log('finished loadTexture4');
  }

function main() {

    setupWebGL();

    connectVariablesToGLSL();

    addActionForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) {if(ev.buttons == 1) { click(ev) } }; 
    document.onkeydown = keydown;

    initTextures();
    initTextures1();
    initTextures2();
    initTextures3();
    initTextures4();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    // renderAllShapes();
    requestAnimationFrame(tick);
    
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
    //save current time
    g_seconds = performance.now()/1000.0 - g_startTime;
    // console.log(g_seconds);

    // shift key animate angles
    if (shift) {
        g_headAngle = -5 + (5*Math.sin(g_seconds));
        g_bodyAngle = 10 - (5*Math.sin(g_seconds));
        g_frontLArmAngle = -9 + (5*Math.sin(g_seconds));
        g_frontRArmAngle = 11 - (5*Math.sin(g_seconds));
        g_backLLegAngle = 12 - (5*Math.sin(g_seconds));
        g_backRLegAngle = -8 + (5*Math.sin(g_seconds));
        time = time + 0.1;
        if (time >= 35) {
            time = 0;
            shift = false;
            g_animation = false;
            g_headAngle = 0;
            g_bodyAngle = 0;
            g_frontLArmAngle = 0;
            g_frontRArmAngle = 0;
            g_backLLegAngle = 0;
            g_backRLegAngle = 0;
            g_tailAngle = 130;
            g_middleTailAngle = 0;
            g_tailTipAngle = 45;
        }
    }

    //update animation angles
    updateAnimationAngles();

    //draw everything
    renderAllShapes();

    //tell browser to update again when it has time
    requestAnimationFrame(tick);
}


function click(ev, check) {
    //enable shift key
    if (ev.shiftKey) {
        shift = true;
        g_animation = true;
    }

    //extract event click and return it in WebGL coords
    let [x, y] = convertCoordinatesEventToGL(ev);

    //click to move camera angle
    g_globalAngle -= ev.movementX;
    g_globalAngleY -= ev.movementY;

    renderAllShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return ([x, y]);
}

function updateAnimationAngles() {
    if (g_animation) {
        g_tailAngle = 90 + 20*Math.sin(g_seconds);
        g_middleTailAngle = -5 + 24*Math.sin(g_seconds);
        g_tailTipAngle = 43 + 5*Math.sin(g_seconds);
    }

    g_lightPos[0] = 2 * Math.cos(.5 * g_seconds);
    g_lightPos[1] = 1 + Math.cos(g_seconds) * Math.cos(g_seconds);
    g_lightPos[2] = 2 * Math.sin(.5 * g_seconds);
}

function keydown(ev) {
  if(ev.keyCode==	65) { // a
    g_camera.eye.elements[0] -= 0.2;

  } else if(ev.keyCode == 68) { // d
    g_camera.eye.elements[0] += 0.2;
    
  } else if(ev.keyCode == 87) { // w
    g_camera.forward();

  } else if(ev.keyCode == 83) { // s
    g_camera.back();
    
  } else if(ev.keyCode == 81) { // q
    g_camera.panLeft();

  } else if(ev.keyCode == 69) { // e
    g_camera.panRight();

  } else if(ev.keyCode == 37) { // <-
    g_catZoffset += 0.2;

  } else if(ev.keyCode == 39) { // ->
    g_catZoffset -= 0.2;
    
  } else if(ev.keyCode == 38) { // ^
    g_catXoffset -= 0.2;
    
  } else if(ev.keyCode == 40) { // V
    g_catXoffset += 0.2;
    
  }

  renderAllShapes();
  console.log(ev.keyCode);
}


var g_eye = [0, 0, 3];
var g_at = [0, 0, -100];
var g_up = [0, 1, 0];

// actually draw all the shapes.
function renderAllShapes() {

    var startTime = performance.now();  

    // pass the projection matrix
    var projMat = new Matrix4();
    projMat.setPerspective(50, canvas.width / canvas.height, .1, 1000);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    // pass the view matrix
    var viewMat=new Matrix4();
    viewMat.setLookAt(
      g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
      g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
      g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // pass the matrix to u_ModelMatrix attribute
    var globalRotMat=new Matrix4().rotate(g_globalAngleY,1,0,0);
    globalRotMat.rotate(g_globalAngle, 0, 1, 0);

    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // ground
    var ground = new Cube();
    ground.color = [1,0,0,1];
    ground.textureNum = -2;
    ground.matrix.translate(0, -.75, 0);
    ground.matrix.scale(17, 0, 17);
    ground.matrix.translate(-.5, 0, -.5);
    ground.render();

    // sky
    var sky = new Cube();
    sky.color = [1,0,1,1];
    sky.textureNum = -3;
    sky.matrix.scale(17, 17, 17);
    sky.matrix.translate(-.5, -.2, -.5);
    sky.render();

    // Lighting
    gl.uniform3f(u_ambientColor, g_ambientColor[0],g_ambientColor[1], g_ambientColor[2]);

    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    gl.uniform3f(u_lightDir, g_lightDir[0], g_lightDir[1], g_lightDir[2]);

    gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);

    gl.uniform1i(u_lightOn, g_lightOn);
    gl.uniform1i(u_pointLight, g_pointLight)

    var light = new Cube();
    light.color = [2,2,0,1];
    light.textureNum = 0;
    light.matrix.translate(g_lightPos[0],g_lightPos[1],g_lightPos[2]);
    light.matrix.scale(-.1,-.1,-.1);
    light.matrix.translate(-.5,-.5,-.5);
    light.efficientRender();

    // Sphere
    var sphere = new Sphere();
    sphere.color = [0, 0, 1, 1.0];
    sphere.matrix.translate(-2, -.08, -1);
    sphere.textureNum = 0;
    if (g_normalOn) sphere.textureNum = -7;
    sphere.matrix.scale(.6,.6,.6);
    sphere.render();

    // Cube
    var cube = new Cube();
    cube.color = [1, 0, 1, 1.0];
    cube.matrix.translate(-1, -.7, 1);
    cube.textureNum = 0;
    if (g_normalOn) cube.textureNum= -7;
    cube.matrix.scale(.8,.8,.8);
    cube.efficientRender();

    var startTime = performance.now();

    // body
    var body = new Cube();
    body.color = [1, 222/255, 173/255, 1.0];
    body.matrix.rotate(g_bodyAngle, 0, 1, 0);
    var bodyMat = new Matrix4(body.matrix);
    var bodyMat2 = new Matrix4(body.matrix);
    var bodyMat3 = new Matrix4(body.matrix);
    var bodyMat4 = new Matrix4(body.matrix);
    var bodyMat5 = new Matrix4(body.matrix);
    body.matrix.translate(-0.6 + g_catXoffset, -0.5, 0.0 + g_catZoffset);
    body.matrix.scale(1.0, 0.4, 0.37);
    body.render();

    // head
    var head = new Cube();
    head.color = [1, 222/255, 173/255, 1.0];
    head.matrix.rotate(g_headAngle, 0, 1, 0);

    var headMat = new Matrix4(head.matrix);
    var headMat2 = new Matrix4(head.matrix);
    var headMat3 = new Matrix4(head.matrix);
    var headMat4 = new Matrix4(head.matrix);
    var headMat5 = new Matrix4(head.matrix);
    var headMat6 = new Matrix4(head.matrix);
    var headMat7 = new Matrix4(head.matrix);
    var headMat8 = new Matrix4(head.matrix);
    var headMat9 = new Matrix4(head.matrix);
    var headMat10 = new Matrix4(head.matrix);
    head.matrix.translate(-0.7 + g_catXoffset, -0.2, .035 + g_catZoffset);
    head.matrix.scale(0.3, 0.25, 0.3);
    head.render();

    // tail
    //joint1
    var tail1 = new Cube();
    tail1.color = [222/255, 184/255, 135/255, 1.0];
    tail1.matrix = bodyMat3;
    tail1.matrix.translate(0.4 + g_catXoffset, -0.5, 0.162 + g_catZoffset);
    tail1.matrix.rotate(-g_tailAngle, 0, 0, 1);
    var tailMat = new Matrix4(tail1.matrix);
    tail1.matrix.translate(-.22, -0.25, 0); 
    tail1.matrix.scale(0.09, 0.5, 0.09);
    tail1.render();

    // Joint 2 (middle tail segment)
    var tail2 = new Cube();
    tail2.color = [205/255, 133/255, 63/255, 1.0];
    tail2.matrix = tailMat;
    tail2.matrix.rotate(90, 0, 0, 1);
    tail2.matrix.rotate(g_middleTailAngle, 1, 0, 0);
    var tailMat2 = new Matrix4(tail2.matrix);
    tail2.matrix.translate(0.15, 0.2, 0.02); 
    tail2.matrix.scale(0.07, 0.4, 0.07);
    tail2.render();

    // Joint 3 (tail tip segment)
    var tail3 = new Cube();
    tail3.color = [59/255, 59/255, 59/255, 1.0];
    tail3.matrix = tailMat2;
    tail3.matrix.rotate(g_tailTipAngle, 0, 0, 1);
    tail3.matrix.translate(0.5, 0.2, 0.0); 
    tail3.matrix.scale(0.09, 0.3, 0.09);
    tail3.render();


    // front arms
    //left arm
    var frontLeft = new Cube();
    frontLeft.color = [222/255, 184/255, 135/255, 1.0];
    frontLeft.matrix = bodyMat;
    frontLeft.matrix.rotate(0,1, 0, 0);
    frontLeft.matrix.rotate(g_frontLArmAngle, 0, 0, 1);
    frontLeft.matrix.translate(-0.55 + g_catXoffset, -0.7, -0.01 + g_catZoffset);
    frontLeft.matrix.scale(0.15, 0.3, 0.15);
    frontLeft.render();

    //right arm
    var frontright = new Cube();
    frontright.color = [59/255, 59/255, 59/255, 1.0];
    frontright.matrix = bodyMat2;
    frontright.matrix.rotate(0,1, 0, 0);
    frontright.matrix.rotate(g_frontRArmAngle, 0, 0, 1);
    frontright.matrix.translate(-0.55 + g_catXoffset, -0.7, 0.23 + g_catZoffset);
    frontright.matrix.scale(0.15, 0.3, 0.15);
    frontright.render();

    // back legs
    //left leg
    var backLeft = new Cube();
    backLeft.color = [205/255, 133/255, 63/255, 1.0];
    backLeft.matrix = bodyMat4;
    backLeft.matrix.rotate(0,1, 0, 0);
    backLeft.matrix.rotate(g_backLLegAngle, 0, 0, 1);
    backLeft.matrix.translate(0.2 + g_catXoffset, -0.7, -0.01 + g_catZoffset);
    backLeft.matrix.scale(0.15, 0.3, 0.15);
    backLeft.render();

    //right leg
    var backRight = new Cube();
    backRight.color = [222/255, 184/255, 135/255, 1.0];
    backRight.matrix = bodyMat5;
    backRight.matrix.rotate(0,1, 0, 0);
    backRight.matrix.rotate(g_backRLegAngle, 0, 0, 1);
    backRight.matrix.translate(0.2 + g_catXoffset, -0.7, 0.23 + g_catZoffset);
    backRight.matrix.scale(0.15, 0.3, 0.15);
    backRight.render();

    // left eye
    var leftEye = new Cube();
    leftEye.color = [107/255,142/255,35/255, 1.0];
    leftEye.matrix = headMat;
    leftEye.matrix.translate(-.73 + g_catXoffset, -0.07, .08 + g_catZoffset);
    leftEye.matrix.scale(.06, .06, .06);
    leftEye.render();

    // right eye
    var rightEye = new Cube();
    rightEye.color = [107/255,142/255,35/255, 1.0];
    rightEye.matrix = headMat2;
    rightEye.matrix.translate(-.73 + g_catXoffset, -0.07, .22 + g_catZoffset);
    rightEye.matrix.scale(.06, .06, .06);
    rightEye.render();

    //ears
    //right
    var rightEar = new Cube();
    rightEar.color = [59/255, 59/255, 59/255, 1.0];
    rightEar.matrix = headMat3;
    rightEar.matrix.translate(-.55 + g_catXoffset, 0.05, .23 + g_catZoffset);
    rightEar.matrix.scale(.15, .07, .07);
    rightEar.render();

    //left
    var leftEar = new Cube();
    leftEar.color = [205/255, 133/255, 63/255, 1.0];
    leftEar.matrix = headMat4;
    leftEar.matrix.translate(-.55 + g_catXoffset, 0.05, 0.07 + g_catZoffset);
    leftEar.matrix.scale(.15, .07, .07);
    leftEar.render();

    //snout
    var snout = new Cube();
    snout.color = [222/255, 184/255, 135/255, 1.0];
    snout.matrix = headMat5;
    snout.matrix.translate(-.77 + g_catXoffset, -0.2, 0.08 + g_catZoffset);
    snout.matrix.scale(.07, .13, .2);
    snout.render();

    // nose
    var nose = new Cube();
    nose.color = [1,192/255,203/255, 1.0];
    nose.matrix = headMat6;
    nose.matrix.translate(-.78 + g_catXoffset, -0.128, 0.145 + g_catZoffset);
    nose.matrix.scale(.06, .06, .06);
    nose.render();

    //whiskers
    var whisker1 = new Cone();
    whisker1.color = [59/255, 59/255, 59/255, 1.0];
    whisker1.matrix = headMat7;
    whisker1.matrix.translate(-.74 + g_catXoffset, -0.12, -0.01 + g_catZoffset);
    whisker1.matrix.scale(.3, .3, .5);
    whisker1.render();

    var whisker2 = new Cone();
    whisker2.color = [59/255, 59/255, 59/255, 1.0];
    whisker2.matrix = headMat8;
    whisker2.matrix.translate(-.74 + g_catXoffset, -0.17, -0.01 + g_catZoffset);
    whisker2.matrix.scale(.3, .3, .5);
    whisker2.render();

    var whisker3 = new Cone();
    whisker3.color = [59/255, 59/255, 59/255, 1.0];
    whisker3.matrix = headMat9;
    whisker3.matrix.rotate(180,1, 0, 0);
    whisker3.matrix.translate(-.74 + g_catXoffset, 0.17, -0.38 - g_catZoffset);
    whisker3.matrix.scale(.3, .3, .5);
    whisker3.render();

    var whisker4 = new Cone();
    whisker4.color = [59/255, 59/255, 59/255, 1.0];
    whisker4.matrix = headMat10;
    whisker4.matrix.rotate(180,1, 0, 0);
    whisker4.matrix.translate(-.74 + g_catXoffset, 0.12, -0.38 - g_catZoffset);
    whisker4.matrix.scale(.3, .3, .5);
    whisker4.render();

    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numDot");
}

function sendTextToHTML(text, htmlID) {
    var htmlElem = document.getElementById(htmlID);
    if (!htmlElem) {
        console.log('Failed to get ' + htmlID + ' from HTML');
        return;
    }
    htmlElem.innerHTML = text;
}
/*jshint esversion: 6 */

// Scene Variables
var canvasWidth, canvasHeight;
var scene, camera, renderer, controls, loader;
var frustumSize = 1000;
var FOV = 75;

// Variables for screen resizing
var tanFOV, windowInitialHeight;

// Lighting variables
var ambientLight, directionalLight;

// The key used to change rotation mode
var SWITCH_KEY = "ControlLeft";

// The mouse wheel delta that denotes 1 unit of zoom.
var dollySpeed = 0.1 / 120;

/**
 * Enumerates mouse buttons as present in event.which
 */
var mouseButton = Object.freeze({
    LEFT: 1,
    MIDDLE: 2,
    RIGHT: 3
});

var mouse = new THREE.Vector3(0.0, 0.0, 0.0);
var mouseLast = new THREE.Vector3(0.0, 0.0, 0.0);

var isMouseHeld = false;
var whichMouse;
var isCtrlHeld = false;

///////////////////// THREE.js and Scene Initializations ///////////////////////

function init(){
    /////// Initialize the scene
    scene = new THREE.Scene();

    scene.add(new THREE.GridHelper(10, 50));
    //scene.add(new THREE.GridHelper(10, 50).rotateX(Math.PI/2));
    
    // Set up lighting
    ambientlight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientlight);

    directionlight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionlight.position.set(10, 10, 10);
    directionlight.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(directionlight);

    // Get width and height of the window and make a canvas 10 px smaller (5 px margins).
    canvasWidth = window.innerWidth - 10;
    canvasHeight = window.innerHeight- 10;

    // Create the camera
    var aspect = canvasWidth/canvasHeight;
    camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 1000);
    // Set camera at 5 units away from the origin on the Z axis.
    camera.position.set(0, 0, 3);
    // Set camera to look at origin.
    camera.lookAt(new THREE.Vector3(0,0,0));

    // Set up webgl renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasWidth, canvasHeight);
    //Clear to black
    renderer.clearColor(0x000000, 1);

    // Disable right click menu (to allow for using the right mouse button as a control).
    renderer.domElement.setAttribute('oncontextmenu', "return false;");
    // Set an identifier to the renderer in case it needs to be retrieved later.
    renderer.domElement.setAttribute('id', 'canvas');
    // Append the renderer to the html body.
    document.body.appendChild(renderer.domElement);

    /////// Build the scene
    loader = new THREE.OBJLoader();

    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };

    var onError = function( xhr ){
        console.log("Failed to load object. Will use a cube instead.");
        var cubegeo = new THREE.BoxGeometry(1, 1, 1);
        var cubemat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        var cube = new THREE.Mesh(cubegeo, cubemat);
        scene.add(cube);
    };

    loader.load(
        "assets/wt_teapot.obj",
        function(object){
            scene.add( object );

            // Center loaded object on screen (obj file has center on bottom)
            var bbox = computeBoundingBox(object);

            // Translate the object by half the height of bounding box
            scene.translateY(-(bbox.max.y - bbox.min.y)/2);
        },
        onProgress, onError
    );

    tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2 ) );
    windowInitialHeight = window.innerHeight;

    //controls = new THREE.OrbitControls(camera);
}

init();

/////////////////////////////// Mouse Position /////////////////////////////////

/**
 * Updates the mouse position in screen space.
 * @param {*} event The event that triggered the update.
 */
function updateMousePosition(event){
    mouseLast.copy(mouse);

    if(event.type == 'touchmove' || event.type == 'touchstart'){
        mouse.x = ( ( event.changedTouches[0].clientX - 5 ) / canvasWidth ) * 2 - 1;
        mouse.y = - ( ( event.changedTouches[0].clientY - 5 ) / canvasHeight ) * 2 + 1;
    }
    else{
        mouse.x = ( ( event.clientX - 5 ) / canvasWidth ) * 2 - 1;
        mouse.y = - ( ( event.clientY - 5 ) / canvasHeight ) * 2 + 1;
    }
}

/**
 * Compute the distance the mouse was moved between the last two mouse updates.
 */
function getMouseDelta(){
    var delta = new THREE.Vector3();
    delta.x = mouse.x - mouseLast.x;
    delta.y = mouse.y - mouseLast.y;

    return delta;
}

function getMouseDeltaInWorld(){
    // Get mouse delta on gl space (-1, 1) x (-1, 1)
    var mouseDelta = getMouseDelta();

    // Multiply by distance from xy plane to preserve relative position
    var delta = new THREE.Vector3(
        mouseDelta.x * camera.position.z * canvasWidth/canvasHeight,
        mouseDelta.y * camera.position.z,
        0.0
    );

    return delta;
}

/////////////////////////////// Camera Methods /////////////////////////////////


var centerAxis = new THREE.AxesHelper(1);
scene.add(centerAxis);

var center = new THREE.Vector3(0, 0, 0);


function translateCamera(distance){

    scene.translateX(distance.x);
    center.x += -distance.x;

    scene.translateY(distance.y);
    center.y += -distance.y;

    scene.translateZ(distance.z);
    center.z += -distance.z;

    centerAxis.position.set(center.x, center.y, center.z);
}

function rotateCameraAroundObject(distance){

    // Create a quaternion for horizontal rotation
    var horizontalQuaternion = new THREE.Quaternion().setFromAxisAngle(camera.up, Math.PI*distance.x);

    // Compute the axis for overhead rotation
    var centerVector = new THREE.Vector3().subVectors(camera.position, center).normalize();
    var horizontalAxis = new THREE.Vector3().crossVectors(camera.up, centerVector).normalize();

    // Create a quaternion for overhead rotation
    var verticalQuaternion = new THREE.Quaternion().setFromAxisAngle(horizontalAxis, -Math.PI*distance.y);

    // Combine the quaternions
    var quaternion = new THREE.Quaternion().multiplyQuaternions(horizontalQuaternion, verticalQuaternion);

    // Apply the quaternion to the scene
    scene.applyQuaternion(quaternion);

}

function dollyCamera(distance){

    camera.translateZ(dollySpeed * distance);

    camera.updateProjectionMatrix();
}

/////////////////////////////// Event Handlers /////////////////////////////////

function onMouseDown(event){
    isMouseHeld = true;
    whichMouse = event.which;
    console.log("Mouse button pressed ( " + whichMouse + " ).");
}

function onMouseUp(event){
    isMouseHeld = false;
    console.log("Mouse button released.");
}

function onKeyDown(event){
    if(!event.repeat){
        if(event.code == SWITCH_KEY){
            isCtrlHeld = true;
            console.log("ctrl key pressed");
        }
    }

}

function onKeyUp(event){
    if(event.code == SWITCH_KEY){
        isCtrlHeld = false;
        console.log("ctrl key released");
    }
}

function onMouseMove(event){

    updateMousePosition(event);

    if(isMouseHeld){
        var mouseDelta;

        switch (whichMouse) {
            case mouseButton.LEFT:
                mouseDelta = getMouseDeltaInWorld();
                translateCamera(mouseDelta);
                break;
            case mouseButton.RIGHT:
                mouseDelta = getMouseDelta();
                rotateCameraAroundObject(mouseDelta);
                break;
            case mouseButton.MIDDLE:
                break;
            default:
                break;
        }
    }
}

function onMouseScroll(event){

    var scrollDistance = event.wheelDelta;
    dollyCamera(scrollDistance);

}

document.addEventListener("mousedown", onMouseDown, false);
document.addEventListener("mouseup", onMouseUp, false);
document.addEventListener("mousemove", onMouseMove, false);
document.addEventListener("mousewheel", onMouseScroll, false);
document.addEventListener("keydown", onKeyDown, false);
document.addEventListener("keyup", onKeyUp, false);


///////////////////////////////// Main Loop ////////////////////////////////////

// Throttle window resize operations so they only run when a new animation frame is requested.
(function() {
    var throttle = function(type, name, obj) {
        obj = obj || window;
        var running = false;
        var func = function() {
            if (running) { return; }
            running = true;
             requestAnimationFrame(function() {
                obj.dispatchEvent(new CustomEvent(name));
                running = false;
            });
        };
        obj.addEventListener(type, func);
    };

    /* init - you can init any event */
    throttle("resize", "optimizedResize");
})();

// Optimized window resize event handler
window.addEventListener("optimizedResize", function() {
    canvasWidth = window.innerWidth - 10;
    canvasHeight = window.innerHeight - 10;

    var aspect = canvasWidth / canvasHeight;
    camera.left = -frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.aspect = aspect;

    // adjust the FOV
    camera.fov = ( 360 / Math.PI ) * Math.atan( tanFOV * ( window.innerHeight / windowInitialHeight ) );

    camera.updateProjectionMatrix();

    renderer.setSize( canvasWidth, canvasHeight );
    renderer.render( scene, camera );
});

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();
/*jshint esversion: 6 */

var rendererMargin = {width: 10, height:10};

// Scene Variables
var canvasWidth, canvasHeight;
var scene, camera, renderer, controls, loader;
var frustumSize = 1000;
var FOV = 75;
var startZ = 3;
var frameRate = 10;

// Variables for screen resizing
var tanFOV, windowInitialHeight;

// Lighting variables
var ambientLight, directionalLight;

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
    var canvas = window.getComputedStyle(document.getElementById("canvas"));
    canvasWidth = parseInt(canvas.width, 10);
    canvasHeight = parseInt(canvas.height, 10);

    // Create the camera
    var aspect = canvasWidth/canvasHeight;
    camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 1000);

    // Set up webgl renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasWidth, canvasHeight);
    //Clear to black
    renderer.clearColor(0x000000, 1);

    // Disable right click menu (to allow for using the right mouse button as a control).
    renderer.domElement.setAttribute('oncontextmenu', "return false;");
    // Set an identifier to the renderer in case it needs to be retrieved later.
    renderer.domElement.setAttribute('id', 'three-canvas');
    // Append the renderer to the html body.
    document.getElementById('canvas').appendChild(renderer.domElement);

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
        cubegeo.computeFaceNormals();
        cubegeo.computeVertexNormals();
        var cubemat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
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

    controls = new CameraController(camera, renderer.domElement);
    controls.dollyCamera(startZ);
}

init();

//////////////////////////// Animation Methods //////////////////////////////////

var keyframes = {};

function rebuildTimeline(){
    var keys = Object.keys(keyframes).sort();
    // If there is more than one keyframe set
    if (keys.length > 1){
        for (var i = 0; i < keys.length; i++){
            // If element is first in array, this is the first frame of animation.
            if(!keys[i-1]) {
                keyframes[keys[i]].prev = null;
                keyframes[keys[i]].next = keyframes[keys[i+1]];
            }
            // If element is last in array, this is the last frame of animation
            else if (!keys[i+1]) {
                keyframes[keys[i]].prev = keyframes[keys[i-1]];;
                keyframes[keys[i]].next = null;
            }
            // Otherwise, this is an ordinary frame
            else{
                keyframes[keys[i]].prev = keyframes[keys[i-1]];
                keyframes[keys[i]].next = keyframes[keys[i+1]];
            }
        }
    }
}

var currentCamera = null;

function setFrame(frame){
    // If the requested frame is a keyframe that exists in the array, set the camera to it
    if(keyframes[frame]){
        currentCamera = keyframes[frame];
    }
    // If currentCamera is set
    if (currentCamera !== null){
        // If the frame requested comes after the set frame, set to interpolated between frame and next frame
        if(frame > currentCamera.frame && currentCamera.next !== null) {
            controls.setFromInterpolateStates(
                currentCamera, 
                currentCamera.next, 
                (frame - currentCamera.frame)/(currentCamera.next.frame - currentCamera.frame));
        }
        // If the frame requested comes before the set frame, set to interpolated between frame and last frame
        else if (frame < currentCamera.frame & currentCamera.prev !== null){
            controls.setFromInterpolateStates(
                currentCamera,
                currentCamera.prev,
                (currentCamera.frame - frame)/(currentCamera.frame - currentCamera.prev.frame));
        }
        // If the requested frame is the current frame, just set to it
        else controls.setState(currentCamera);
    }
}


//////////////////////// Button Control Event Handlers //////////////////////////

function keyframeEventHandler(event){
    if (event.detail.set) {
        var state = controls.saveState();
        state.frame = event.detail.frame;
        keyframes[event.detail.frame] = state;
    }
    else {
        delete keyframes[event.detail.frame];
    }
    rebuildTimeline();
}

function sliderEventHandler(event){
    setFrame(event.detail.frame);
}

var auto_animate = false;

function toggleAnimate(checkbox){
    auto_animate = checkbox.checked;
}

function resetCamera(event){
    controls.reset(true);
    controls.dollyCamera(startZ);
    document.getElementById("anim-chbox").checked = false;
    auto_animate = false;
}

document.addEventListener("keyframe", keyframeEventHandler, false);
document.addEventListener("slider", sliderEventHandler, false);

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
    // Get width and height of the window and make a canvas 10 px smaller (5 px margins).
    var canvas = window.getComputedStyle(document.getElementById("canvas"));
    canvasWidth = parseInt(canvas.width, 10);
    canvasHeight = parseInt(canvas.height, 10);

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

var currentAnimFrame = 0;

function animate() {
    requestAnimationFrame( animate );
    if(auto_animate)
    {
        document.dispatchEvent(new CustomEvent("auto-anim", {detail: {frame: currentAnimFrame}}));
        setFrame(currentAnimFrame/frameRate);
        currentAnimFrame++;
        if(currentAnimFrame > (100*frameRate)) currentAnimFrame = 0;
    }
    else currentAnimFrame = 0;
    renderer.render( scene, camera );
}
animate();
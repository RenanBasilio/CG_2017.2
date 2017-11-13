/*jshint esversion: 6 */

var canvasWidth, canvasHeight;
var scene, camera, renderer, loader;
var frustumSize = 1000;

var ambientLight, directionalLight;

///////////////////// THREE.js and Scene Initializations ///////////////////////

function init(){
    // Initialize the scene
    scene = new THREE.Scene();
    
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
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000);
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

    // Build the scene
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
    }

    loader.load(
        "assets/wt_teapot.obj",
        function(object){
            scene.add( object );

            // Center loaded object on screen (obj file has center on bottom)
            var bbox = computeBoundingBox(object);

            // Translate the object by half the height of bounding box
            object.translateY(-(bbox.max.y - bbox.min.y)/2);
        },
        onProgress, onError
    );
}

init();

/////////////////////////////// Event Handlers /////////////////////////////////



///////////////////////////////// Main Loop ////////////////////////////////////

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();
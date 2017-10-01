
var state = Object.freeze({
    IDLE: 0,
    DRAWING: 1
});

var currState = state.IDLE;

var geometriesArray = [];
var currGeometry = null;

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 0, 200);
camera.lookAt(new THREE.Vector3(0, 0, 0));

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xfafafa, 1);

document.body.appendChild(renderer.domElement);

function getMousePosition(){
    var vector = new THREE.Vector3();
    
    vector.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5 );
    
    vector.unproject( camera );
    
    var dir = vector.sub( camera.position ).normalize();
    
    var distance = - camera.position.z / dir.z;
    
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

    return pos;
}

function onMouseDown(event){
    // Get the mouse position in canvas coordinates.
    var mouse = getMousePosition();
    
    // Switch on main state machine.
    switch (currState) {
        // If the state is IDLE (Default)
        case state.IDLE:
            // If selected an empty space
            if (true){
                // Set state to DRAWING to draw the shape with subsequent commands.
                currState = state.DRAWING;

                // Initialize a line chain geometry and set it as current.
                currGeometry = new LineChain(mouse.x, mouse.y);

                // Add the line chain to the geometries array and to the scene.
                geometriesArray.push[currGeometry];
                scene.add( currGeometry.line );
            }
            break;
        // If the state is DRAWING
        case state.DRAWING:
            // Try to add the current mouse position as a vertice to the line chain currently being edited.
            currGeometry.addVertice(mouse.x, mouse.y);
            // If the line chain is closed, convert it to a mesh and set the state back to idle.
            if(currGeometry.isClosed) {
                try {
                    var newMesh = lineChainToMesh(currGeometry);
                    scene.remove(currGeometry.line);
                    scene.add(newMesh);
                    currState = state.IDLE;
                } catch (error) {
                    console.log("Failed to create Mesh.");
                    // To-Do: Allow 'fixing' non convex polygons by undoing the last vertice with right click.
                }
            }
            break;
        default:
            break;
    }
}

function onMouseMove(event){
    var mouse = getMousePosition();
    switch (currState){
        case state.DRAWING:
            currGeometry.moveLastVertice(mouse.x, mouse.y);
            break;
        default:
            break;
    }
}

document.addEventListener( 'mousedown', onMouseDown, false ); 
document.addEventListener( 'mousemove', onMouseMove, false );

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();

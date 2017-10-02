
var state = Object.freeze({
    IDLE: 0,
    DRAWING: 1,
    MOVE_MESH: 2
});

var mouseButton = Object.freeze({
    LEFT: 1,
    MIDDLE: 2,
    RIGHT: 3
})

var currState = state.IDLE;

var currGeometry = null;

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 0, 200);
camera.lookAt(new THREE.Vector3(0, 0, 0));

var raycaster = new THREE.Raycaster();

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xfafafa, 1);

document.body.appendChild(renderer.domElement);

var mouse = new THREE.Vector2(0., 0.);
var mouseLast = new THREE.Vector2(0., 0.);

/**
 * Updates the mouse position in screen space.
 * @param {*} event The event that triggered the update.
 */
function updateMousePosition(event){
    mouseLast.x = mouse.x;
    mouseLast.y = mouse.y;
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    return mouse;
}

/**
 * Compute the distance the mouse was moved between the last two mouse updates.
 */
function getMouseDelta(){
    var delta = new THREE.Vector2();
    delta.x = mouse.x - mouseLast.x;
    delta.y = mouse.y - mouseLast.y;
    return delta;
}

/**
 * Translate screen coordinates into canvas coordinates. 
 * 
 * If a vector is provided it will be translated, otherwise the mouse position will be used.
 * @param {THREE.Vector} position Optional vector containing the position to translate to canvas coordinates.
 * @return The position of the mouse in 3D canvas coordinates.
 */
function getMousePositionOnCanvas(position = undefined){
    
    var vector = new THREE.Vector3();

    if(position === undefined){
        vector.set(mouse.x, mouse.y, 0.5 );
    }
    else{
        vector.set(position.x, position.y, 0.5 );
    }
                
    vector.unproject( camera );
    
    var dir = vector.sub( camera.position ).normalize();
    
    var distance = - camera.position.z / dir.z;
    
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

    return pos;
}

/**
 * Computes the distance the mouse was moved on canvas between the last two mouse updates.
 */
function getMouseDeltaOnCanvas(){
    var mousePosCurr = getMousePositionOnCanvas();
    var mousePosLast = getMousePositionOnCanvas(mouseLast);
    var delta = new THREE.Vector3(
        mousePosCurr.x - mousePosLast.x,
        mousePosCurr.y - mousePosLast.y,
        mousePosCurr.z - mousePosLast.z
    )
    return delta;
}

////////////////////////// Mouse Event Handlers /////////////////////////

function onMouseMove(event){
    updateMousePosition(event);
    switch (currState){
        case state.DRAWING:
            var mouseOnCanvas = getMousePositionOnCanvas();
            currGeometry.moveLastVertice(mouseOnCanvas.x, mouseOnCanvas.y);
            break;
        case state.MOVE_MESH:
            console.log(event);
            var mouseDelta = getMouseDeltaOnCanvas();
            currGeometry.translateX(mouseDelta.x);
            currGeometry.translateY(mouseDelta.y);
            break;
        default:
            break;
    }
}

function onMouseDown(event){
    // Get the mouse position in canvas coordinates.
    var mouseOnCanvas = getMousePositionOnCanvas();

    // If double click or right click event was detected
    if (event.type === "dblclick" || event.which === mouseButton.RIGHT)
    {
        // Check if double click was from idle (new geometry with only one point)
        if (currGeometry.nextIndex === 3)
        {
            // Remove mistakenly created geometry
            scene.remove(currGeometry.line);
            currGeometry.dispose();
            delete currGeometry;

        }
    }
    else{
        // Switch on main state machine.
        switch (currState) {

            // If the state is IDLE (Default)
            case state.IDLE:
                // Switch on the mouse button that was pressed.
                switch(event.which){

                    // If Left mouse button
                    case mouseButton.LEFT:

                        // Raycast mesh intersection
                        raycaster.setFromCamera( mouse, camera );
                        var intersects = raycaster.intersectObjects( scene.children );

                        // If a mesh was selected
                        if(intersects.length > 0)
                        {
                            currState = state.MOVE_MESH;
                            currGeometry = intersects[intersects.length-1].object;
                        }

                        // If selected an empty space
                        else{
                            // Set state to DRAWING to draw the shape with subsequent commands.
                            currState = state.DRAWING;

                            // Initialize a line chain geometry and set it as current.
                            currGeometry = new LineChain(mouseOnCanvas.x, mouseOnCanvas.y);

                            // Add the line chain to the geometries array and to the scene.
                            scene.add( currGeometry.line );
                        }
                        break;
                    default:
                        break;
                    }
                break;
            // If the state is DRAWING
            case state.DRAWING:
                // Try to add the current mouse position as a vertice to the line chain currently being edited.
                currGeometry.addVertice(mouseOnCanvas.x, mouseOnCanvas.y);
                // If the line chain is closed, convert it to a mesh and set the state back to idle.
                if(currGeometry.isClosed) {
                    try {
                        var newMesh = lineChainToMesh(currGeometry);
                        scene.remove(currGeometry.line);
                        currGeometry = null;
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
}

function onMouseUp(event){
    // Switch on state machine state
    switch (currState) {
        // If currently moving a mesh (hold button operation)
        case state.MOVE_MESH:
            // Deselect the mesh
            currGeometry = null;
            // Reset the state
            currState = state.IDLE;
            break;
    
        default:
            break;
    }
}

document.addEventListener( 'mousedown', onMouseDown, false ); 
document.addEventListener( 'mousemove', onMouseMove, false );
document.addEventListener( 'dblclick', onMouseDown, false );
document.addEventListener( 'mouseup', onMouseUp, false);

////////////////////////// THREE Animation Loop /////////////////////////////

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();

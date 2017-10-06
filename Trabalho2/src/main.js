/**
 * Enumerates the states of the main state machine process.
 */
var state = Object.freeze({
    IDLE: 0,
    DRAWING: 1,
    MOVE_MESH: 2
});

/**
 * Enumerates mouse buttons as presented by event.which
 */
var mouseButton = Object.freeze({
    LEFT: 1,
    MIDDLE: 2,
    RIGHT: 3
})

/**
 * The current state of the state machine.
 */
var currState = state.IDLE;

/**
 * The geometry currently selected (null if none).
 */
var currGeometry = null;

var geometries = [];

////////////////////////// THREE.js Initializations ////////////////////////////

var scene = new THREE.Scene();
scene.userData = { objectType: objType.SCENE };


var debugLine = new LineChain(window.innerHeight*2, window.innerWidth*2);
scene.add(debugLine.line);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 0, 200);
camera.lookAt(new THREE.Vector3(0, 0, 0));

var raycaster = new THREE.Raycaster();

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xfafafa, 1);

renderer.domElement.setAttribute('oncontextmenu', "return false;");
document.body.appendChild(renderer.domElement);

////////////////////////// Mouse Position Operations ///////////////////////

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


////////////////////////// Functionality Methods ////////////////////////////

/**
 * Recursive method that finds an object or any child under that is a pin located near the position.
 * @param {THREE.Object3D} element The object to analize.
 * @param {THREE.Vector3} position The position to analize.
 * @return {THREE.Object3D} The first pin found near the mouse. Undefined if none is found.
 */
function findNearPinPositionRecursive(element, position){
    // If this element is a pin && it is near the mouse, return it.
    if( element.userData.objectType === objType.PIN &&
        computeLength(position.x, position.y, element.position.x, element.position.y) < 2){
            return element;
        }
    // Else, enter recursion loop.
    else{
        // Apply the current world matrix to the position
        // position.applyMatrix4(element.matrix);

        // If this element has children
        if(element.children.length > 0){
            // Iterate through its children
            for(var i = 0; i < element.children.length; i++)
            {
                // Call method to verify if the child is a pin near the mouse.
                var result = findNearPinPositionRecursive(element.children[i], new THREE.Vector3().copy(position).applyMatrix4(element.matrix));
                // If so, return the child.
                if(result !== undefined)
                {
                    return result;
                }
            }
            // If no child is found that has a pin underneath it, return undefined.
            return undefined;
        }
        // If the element has no children, return undefined.
        else return undefined;
    }

}

/**
 * 
 * @param {*} position 
 */
function findInsideMeshRecursive(element, position){
    // Initialize array of meshes to return.
    var insideMeshes = [];

    // Apply the current world matrix to the position.
    var elementMatrixInverse = new THREE.Matrix4().getInverse(element.matrix);
    var newPosition = new THREE.Vector3().copy(position).applyMatrix4(elementMatrixInverse);

    // If this element is a polygon && the position is inside it, add it to the array
    if( element.userData.objectType === objType.POLYGON && isInside(element, newPosition)){
        console.log("Inside element!");
        insideMeshes.push(element);
    }

    // If this element has children
    if(element.children.length > 0){
        // Iterate through its children
        for(var i = 0; i < element.children.length; i++)
        {
            // For each child, call this method recursivelly.
            var result = findInsideMeshRecursive(element.children[i], newPosition);
            // If the result contains any meshes, transcribe them to the array.
            if(result.length > 0)
            {
                result.forEach(function(element) {
                    insideMeshes.push(element);
                }, this);
            }
        }
    }
    console.log(insideMeshes);

    // Return the array.
    return insideMeshes;
}

////////////////////////// Mouse Event Handlers ////////////////////////////

function onMouseMove(event){
    updateMousePosition(event);
    var mouseOnCanvas = getMousePositionOnCanvas();
    debugLine.moveLastVertice(mouseOnCanvas.x, mouseOnCanvas.y);
    switch (currState){
        case state.DRAWING:
            var mouseOnCanvas = getMousePositionOnCanvas();
            currGeometry.moveLastVertice(mouseOnCanvas.x, mouseOnCanvas.y);
            break;
        case state.MOVE_MESH:
            var mouseDelta = getMouseDeltaOnCanvas();
            currGeometry.translateX(mouseDelta.x);
            currGeometry.translateY(mouseDelta.y);
            break;
        default:
            break;
    }
}

function onMouseDown(event){
    console.log(scene);
    // Get the mouse position in canvas coordinates.
    var mouseOnCanvas = getMousePositionOnCanvas();

    // If double click or right click event was detected
    if (event.type === "dblclick" || event.which === mouseButton.RIGHT)
    {
        // Check if double click was from idle (new geometry with only one point)
        if (currGeometry === null || currGeometry.nextIndex === 3)
        {
            if(currGeometry !== null){
                // Remove mistakenly created geometry
                scene.remove(currGeometry.line);
                currGeometry.dispose();
                delete currGeometry;
                currState = state.IDLE;
            }

            // First check for pin intersections
            var pin = findNearPinPositionRecursive(scene, mouseOnCanvas);
            if (pin !== undefined)
            {
                // Remove the pin and parent the object to the scene.
                removePin(pin, scene);

                // Operation was pin removal, so return.
                return;
            }

            var intersects = findInsideMeshRecursive(scene, mouseOnCanvas);
            // If intersected only one mesh.
            if (intersects.length === 1){
                // Pin the mesh to the scene.
                var pin = pinToParent(mouseOnCanvas, scene, intersects[0]);

                // Operation was pin placement, so return.
                return;
            }
            // If intersected two or more.
            else if (intersects.length > 1){
                // Pin the first element to the second.
                var pin = pinToParent(mouseOnCanvas, intersects[0], intersects[1]);

                // Operation was pin placement, so return.
                return;
            }

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
                        //raycaster.setFromCamera( mouse, camera );
                        //var intersects = raycaster.intersectObjects( geometries );
                        var intersects = findInsideMeshRecursive(scene, mouseOnCanvas);

                        // If a mesh was selected
                        if(intersects.length > 0)
                        {
                            // Change state to move the selected mesh
                            currState = state.MOVE_MESH;
                            // Change currently selected geometry to the top (last) mesh
                            // in the list of meshes returned by the raycaster.
                            currGeometry = intersects[intersects.length-1];
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
                        geometries.push(newMesh);
                        scene.add(newMesh);
                        currState = state.IDLE;
                    } catch (error) {
                        //console.log("Failed to create Mesh.");
                        // TODO: Allow 'fixing' complex polygons by undoing the last vertice with right click.
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

// Handle resizing the window
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.render( scene, camera );
});

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();

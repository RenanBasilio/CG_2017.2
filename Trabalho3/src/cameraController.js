/*jshint esversion:6*/

// The key used to change rotation mode
// var SWITCH_KEY = "ControlLeft";

/**
 * Enumerates mouse buttons as present in event.which
 */
var mouseButton = Object.freeze({
    LEFT: 1,
    MIDDLE: 2,
    RIGHT: 3
});

var STATE = Object.freeze({
    NONE: -1,
    ORBIT: 0,
    ROTATE: 1,
    PAN: 2,
    DOLLY: 3
});

class CameraSaveState {
    /**
     * 
     * @param {THREE.Vector3} focus 
     * @param {THREE.Quaternion} rotation 
     * @param {THREE.Vector3} pan 
     * @param {Number} dolly 
     */
    constructor(focus, rotation, pan, dolly){
        this.focus = focus.clone();
        this.rotation = rotation.clone();
        this.pan = pan.clone();
        this.dolly = dolly;
    }
}

class CameraController {
    /**
     * Build a new camera controller.
     * @param {THREE.PerspectiveCamera} camera The camera to use for controlling
     */
    constructor(camera, scene, domElement){

        // Initialize Scope
        this.camera = camera;
        this.domElement = domElement;
        this.state = STATE.NONE;

        // Initialize mouse trackers
        this.mousePos = new THREE.Vector3();
        this.mouseLast = new THREE.Vector3();
        this.isWheelDeltaFixed = null;
        this.wheelDeltaLast = null;
        this.wheelDelta = 120;

        // Set initial defaults.
        this.focus = new THREE.Vector3();
        this.rotation = new THREE.Quaternion();
        this.pan = new THREE.Vector3();
        this.dolly = 0;

        // Add relevant event listeners
        domElement.addEventListener("mousedown", this.onMouseDown.bind(this), false);
        domElement.addEventListener("mouseup", this.onMouseUp.bind(this), false);
        domElement.addEventListener("mousemove", this.onMouseMove.bind(this), false);
        domElement.addEventListener("mousewheel", this.onMouseScroll.bind(this), false);

        // Debug
        this.axisHelper = new THREE.AxisHelper();
        scene.add(this.axisHelper);
        this.scene = scene;
    }

    update(){
        // Reset the camera
        this.camera.position.set(0, 0, 0);
        this.camera.up.set(0, 1, 0);
        this.camera.rotation.set(0, 0, 0, 0);

        // Apply translations to place the camera where it should be
        this.camera.translateX(this.pan.x);
        this.camera.translateY(this.pan.y);
        this.camera.translateZ(this.pan.z);

        // Apply cummulative rotations to orbit camera around its origin
        this.camera.applyQuaternion(this.rotation);
        this.camera.up.applyQuaternion(this.rotation);

        // Apply dolly translation to move the camera back from its origin
        this.camera.translateZ(this.dolly);

        this.axisHelper.position.set(this.focus.x, this.focus.y, this.focus.z);

        this.camera.lookAt(this.focus);

        // Update the projection matrix
        this.camera.updateProjectionMatrix();

        //console.log(new THREE.Vector3().subVectors(this.camera.position, this.focus).length());
    }

    /**
     * This method saves the camera's current state in a CameraSaveState struct and returns it.
     * @returns {CameraSaveState}
     */
    saveState(){
        var state = new CameraSaveState(this.focus, this.rotation, this.pan, this.dolly);
        return state;
    }

    /**
     * This method sets the camera's state from the values saved in a CameraSaveState struct and updates the view.
     * @param {CameraSaveState} state 
     */
    setState(state){
        this.focus.copy(state.focus);
        this.rotation.copy(state.rotation);
        this.pan.copy(state.pan);
        this.dolly = state.dolly;

        this.update();
    }

    //////////////////////////////// Camera Controls ////////////////////////////////

    dollyCamera(distance) {
        this.dolly += distance;

        this.update();
    }

    orbitCamera(distance) {
        
        // First save the length of the mouse delta vector
        var length = distance.length();

        // Then compute the axis. The axis of rotation is perpendicular to the mouse movement, so normalize the mouse delta vector
        var mouseUnit = new THREE.Vector3().copy(distance).normalize();

        // And set the axis that points forward
        var lookAtUnit = new THREE.Vector3(0, 0, 1);

        var axis = new THREE.Vector3().crossVectors(mouseUnit, lookAtUnit).normalize();

        var quaternion = new THREE.Quaternion().setFromAxisAngle(axis, 2* Math.PI * length);

        this.rotation.multiply(quaternion);
        
        this.update();
    }

    rotateCamera(distance) {

        // First compute the rotation angle.
        var firstVector = new THREE.Vector3().copy(this.mouseLast);
        var secondVector = new THREE.Vector3().copy(this.mousePos);
        var orientation = computeOrientation(firstVector.x, firstVector.y, secondVector.x, secondVector.y, 0, 0);
        var angle = (-1) * orientation * secondVector.angleTo(firstVector);

        // Then compute the axis
        var axis = new THREE.Vector3(0, 0, 1);

        // Build a quaternion from the calculated axis and angle
        var rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);

        // Multiply the quaternion into the global cummulative rotation.
        this.rotation.multiply(rotationQuaternion);

        this.update();
    }

    panCamera(distance) {
        // Compute panning on Y axis based on the vertical up vector.
        var yPan = new THREE.Vector3().copy(this.camera.up);
        yPan.multiplyScalar(distance.y);

        // Compute X axis for panning based on up vector and focus direction.
        var centerVector = new THREE.Vector3().subVectors(this.camera.position, this.focus).normalize();
        var horizontalAxis = new THREE.Vector3().crossVectors(this.camera.up, centerVector).normalize();

        // Compute panning on X axis based on the horizontal axis.
        var xPan = horizontalAxis.multiplyScalar(distance.x);

        // Join X and Y panning values to global cummulative vector.
        this.pan.add(xPan);
        this.pan.add(yPan);

        this.focus.add(xPan);
        this.focus.add(yPan);

        this.update();
    }

    /////////////////////////////// Mouse Position /////////////////////////////////

    /**
     * Updates the mouse position in screen space.
     * @param {*} event The event that triggered the update.
     */
    updateMousePosition(event){
        this.mouseLast.copy(this.mousePos);

        this.mousePos.x = ( ( event.clientX - 5 ) / canvasWidth ) * 2 - 1;
        this.mousePos.y = - ( ( event.clientY - 5 ) / canvasHeight ) * 2 + 1;
    }

    /**
     * Compute the distance the mouse was moved between the last two mouse updates.
     */
    getMouseDelta(){
        var delta = new THREE.Vector3();
        delta.x = this.mousePos.x - this.mouseLast.x;
        delta.y = this.mousePos.y - this.mouseLast.y;

        return delta;
    }

    /////////////////////////////// Event Handlers /////////////////////////////////

    onMouseDown(event){
        //console.log("Mouse button pressed.");
        if(event.ctrlKey){
            this.state = STATE.ROTATE;
        }
        if(event.shiftKey){
            this.state = STATE.DOLLY;
        }
        else{
            switch (event.which) {
                case mouseButton.LEFT:
                    this.state = STATE.ORBIT;
                    break;
                case mouseButton.RIGHT:
                    this.state = STATE.PAN;
                    break;
                case mouseButton.MIDDLE:
                    this.state = STATE.ROTATE;
                    break;
                default:
                    break;
            }
        }
    }

    onMouseUp(event){
        //console.log("Mouse button released.");
        this.state = STATE.NONE;
    }

    onMouseMove(event){

        this.updateMousePosition(event);
        var delta = this.getMouseDelta();

        switch (this.state) {
            case STATE.ORBIT:
                this.orbitCamera(delta);
                break;
            case STATE.PAN:
                this.panCamera(delta);
                break;
            case STATE.ROTATE:
                this.rotateCamera(delta);
                break;
            case STATE.DOLLY:
                this.dollyCamera(delta.y);
                break;
            default:
                break;
        }

    }

    onMouseScroll(event){
        // Try to decide if the mouse scrolls analogically. If the first two scroll actions have the same
        // absolute value, then there's a good chance that it doesn't.
        if (this.isWheelDeltaFixed === null){
            if (this.wheelDeltaLast === null){
                this.wheelDeltaLast = event.wheelDelta;
            }
            else if(Math.abs(this.wheelDeltaLast) === Math.abs(this.wheelDelta)){
                this.isWheelDeltaFixed = true;
                this.mouseWheelDelta = Math.abs(event.wheelDelta);
            }
            else{
                this.isWheelDeltaFixed = false;
            }
        }

        // Calculate the scroll distance
        var scrollDistance;
        // If the delta was determined to be fixed (or undefined), then the dolly distance is 10% of a unit.
        if ( this.isWheelDeltaFixed !== false) {
            scrollDistance = 0.1 * event.wheelDelta / this.wheelDelta;
        }
        // Otherwise, if the delta is high resolution, then the dolly distance is 0.1% times the distance scolled.
        else{
            scrollDistance = 0.001 * event.wheelDelta;
        }

        this.dollyCamera(scrollDistance);

    }
    
}

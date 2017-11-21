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
})

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
        this.orbitX = new THREE.Quaternion();
        this.orbitY = new THREE.Quaternion();
        this.pan = new THREE.Vector3();
        this.dolly = 3;

        // Add relevant event listeners
        domElement.addEventListener("mousedown", this.onMouseDown.bind(this), false);
        domElement.addEventListener("mouseup", this.onMouseUp.bind(this), false);
        domElement.addEventListener("mousemove", this.onMouseMove.bind(this), false);
        domElement.addEventListener("mousewheel", this.onMouseScroll.bind(this), false);

        // Debug
        this.axisHelper = new THREE.AxisHelper();
        scene.add(this.axisHelper);
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
        //this.camera.applyQuaternion(this.orbitX);
        this.camera.applyQuaternion(this.orbitY);

        // Apply cummulative rotation to rotate camera around the Z axis
        this.camera.up.applyQuaternion(this.rotation);

        // Apply dolly translation to move the camera back from its origin
        this.camera.translateZ(this.dolly);

        this.axisHelper.position.set(this.focus.x, this.focus.y, this.focus.z);

        this.camera.lookAt(this.focus);

        console.log(camera);

        // Update the projection matrix
        this.camera.updateProjectionMatrix();
    }

    //////////////////////////////// Camera Controls ////////////////////////////////

    dollyCamera(distance) {
        if(this.isWheelDeltaFixed !== false) this.dolly += 0.1 * distance / this.wheelDelta;
        else this.dolly += this.wheelDelta;

        this.update();
    }

    orbitCamera(distance) {
        // Compute the up vector
        var up = new THREE.Vector3().copy(this.camera.up);
        up.applyQuaternion(this.orbitX);
        up.applyQuaternion(this.orbitY);

        // Build a new quaternion for horizontal rotation using the up vector of the camera 
        // as the axis and 2PI*deltaX as the angle.
        var horizontalRotation = new THREE.Quaternion().setFromAxisAngle(up, Math.PI*distance.x);
        
        // Compute the X axis for overhead rotation based on the up and focus direction vectors.
        var centerVector = new THREE.Vector3().subVectors(this.camera.position, this.focus).normalize();
        var horizontalAxis = new THREE.Vector3().crossVectors(up, centerVector).normalize();

        // Build a new  quaternion for overhead rotation using the calculated axis with 
        // 2PI*deltaY as the angle.
        var overheadRotation = new THREE.Quaternion().setFromAxisAngle(horizontalAxis, Math.PI*distance.y);

        console.log(centerVector);
        console.log(camera.up);

        // Apply the rotations to the orbit rotation trackes.
        this.orbitX.multiply(horizontalRotation);
        this.orbitY.multiply(overheadRotation);
        
        this.update();
    }

    rotateCamera(distance) {
        // First compute the rotation angle.
        var firstVector = new THREE.Vector3().copy(this.mouseLast);
        var secondVector = new THREE.Vector3().addVectors(this.mouseLast, distance);
        var orientation = computeOrientation(firstVector.x, firstVector.y, secondVector.x, secondVector.y, 0, 0);
        var angle = orientation * secondVector.angleTo(firstVector);

        // Then compute the axis
        var axis = new THREE.Vector3().subVectors(this.camera.position, this.focus).normalize();

        // Build a quaternion from the calculated axis and angle
        var rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);

        // Multiply the quaternion into the global cummulative rotation.
        this.rotation.multiply(rotationQuaternion);

        console.log(this.rotation);

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
        console.log("Mouse button pressed.");
        if(event.ctrlKey){
            this.state = STATE.ROTATE;
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
                default:
                    break;
            }
        }
    }

    onMouseUp(event){
        console.log("Mouse button released.");
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
                this.mouseWheelDelta = Math.abs(event.wheelDelta)
            }
            else{
                this.isWheelDeltaFixed = false;
            }
        }

        var scrollDistance = event.wheelDelta;
        this.dollyCamera(scrollDistance);

    }
    
}

/////////////////////////////// Camera Methods /////////////////////////////////

/*
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
*/
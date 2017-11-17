/*jshint esversion: 6 */

/**
 * This method computes the bounding box of a given THREE.js Object3D tree.
 * 
 * The function traverses the Mesh tree and for each geometry computes its bounding box 
 * and updates the global bounding box of the tree using the calculated values.
 * @param {THREE.Object3D} object The Object3D tree to calculate the bounding box of.
 * @return {{max: THREE.Vector3, min: THREE.Vector3}}
 */
function computeBoundingBox(object){
        // Center object on screen
        var bbox = {
            max: new THREE.Vector3(0, 0, 0),
            min: new THREE.Vector3(0, 0, 0)};
    
        // Compute biggest bounding box by getting the maximum and minimum values of each child
        object.traverse( function(child) {
            if(child instanceof THREE.Mesh){
                child.geometry.computeBoundingBox();
                bbox.max.setX(Math.max(bbox.max.x, child.geometry.boundingBox.max.x));
                bbox.max.setY(Math.max(bbox.max.y, child.geometry.boundingBox.max.y));
                bbox.max.setZ(Math.max(bbox.max.z, child.geometry.boundingBox.max.z));
    
                bbox.min.setX(Math.min(bbox.min.x, child.geometry.boundingBox.min.x));
                bbox.min.setY(Math.min(bbox.min.y, child.geometry.boundingBox.min.y));
                bbox.min.setZ(Math.min(bbox.min.z, child.geometry.boundingBox.min.z));
            }
        });

        return bbox;
}

class RollingValue{
    constructor( minValue, maxValue, initValue = 0 )
    {
        this.value = initValue;
        this.maxValue = maxValue;
        this.minValue = minValue;
    }
    
    add( value )
    {
        this.value += value;

        var delta = 0;

        if (this.value > this.maxValue){
            delta = this.value - this.maxValue;
            this.value = this.minValue + delta;
        }
        else if (this.value < this.minValue){
            delta = this.minValue - this.value;
            this.value = this.maxValue - delta;
        }
    }

    get()
    {
        return this.value;
    }
}
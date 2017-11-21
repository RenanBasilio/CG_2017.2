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

/**
 * This method computes the orientation of three points based on the orientation test.
 * @param {*} p1x The x coordinate of the first point.
 * @param {*} p1y The y coordinate of the first point.
 * @param {*} p2x The x coordinate of the second point.
 * @param {*} p2y The y coordinate of the second point.
 * @param {*} p3x The x coordinate of the third point.
 * @param {*} p3y The y coordinate of the third point.
 * @return {Number} +1 if positive orientation, -1 if negative orientation, 0 if the points are colinear.
 */
function computeOrientation(p1x, p1y, p2x, p2y, p3x, p3y){
    var matrix = new THREE.Matrix3();
    matrix.set(  1,   1,   1, 
               p1x, p2x, p3x,
               p1y, p2y, p3y);
    var det = matrix.determinant();
    //console.log(det);
    if(det < 0) return -1;
    else if(det > 0) return 1;
    else return 0;
}


/**
 * This method computes the length of a vector given its coordinates in 2D space.
 * @param {*} x1 The x coordinate of the first point of the vector.
 * @param {*} y1 The y coordinate of the first point of the vector.
 * @param {*} x2 The x coordinate of the second point of the vector.
 * @param {*} y2 The y coordinate of the second point of the vector.
 * @return {number} The length of the vector.
 */
function computeLength(x1, y1, x2, y2){
    length = Math.sqrt(Math.pow((x2-x1), 2)+Math.pow((y2-y1), 2));
    return length;
}
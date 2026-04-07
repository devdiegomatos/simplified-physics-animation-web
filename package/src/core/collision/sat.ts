import { vec3 } from 'gl-matrix';

import type PolygonBody from '../../bodies/PolygonBody';

export default function sat(shapeA: PolygonBody, shapeB: PolygonBody) {
    const axesA = shapeA.axes();
    const axesB = shapeB.axes();
    const axes = axesA.concat(axesB);

    let overlap = Infinity;
    let smallest = vec3.create();

    for (const axis of axes) {
        const projA = shapeA.project(axis);
        const projB = shapeB.project(axis);

        const o = projA.overlaps(projB);
        if (o <= 1e-3) {
            return false;
        } else if (o < overlap) {
            overlap = o;
            smallest = axis;

            // Ensure axis points from A to B
            const centerA = shapeA.getCenter();
            const centerB = shapeB.getCenter();
            const direction = vec3.dot(
                vec3.subtract(vec3.create(), centerB, centerA),
                axis,
            );
            if (direction < 0) {
                // smallest = twgl.v3.negate(axis);
                smallest = vec3.negate(vec3.create(), axis);
            }
        }
    }

    return { normal: smallest, depth: overlap };
}

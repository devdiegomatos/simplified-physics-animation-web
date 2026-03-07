import { vec3 } from 'gl-matrix';

import type PolygonBody from '../../bodies/PolygonBody';
import { support, tripleProduct } from './utils';

const EPSILON = 1e-6;

export default function gjk(A: PolygonBody, B: PolygonBody): vec3[] | false {
    const simplex: vec3[] = [];

    // initial search direction equals to the difference of the shapes center
    const d = vec3.subtract(vec3.create(), B.getCenter(), A.getCenter());

    // get the first Minkowski Difference point
    let S = support(A, B, d)
    if (vec3.length(S) <= EPSILON) {
        return false;
    }
    simplex.push(S);

    // negate d for the next point
    vec3.negate(d, d);

    const MAX_ITERATIONS = 30;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        S = support(A, B, d);

        // make sure that the last point we added actually passed the origin
        if (vec3.dot(S, d) <= EPSILON) {
            return false;
        }

        // add a new point to the simplex because we haven't terminated yet
        simplex.push(S);

        // otherwise we need to determine if the origin is in
        // the current simplex
        if (containsOrigin(simplex, d)) {
            return simplex;
        }
    }

    return simplex;
}

function containsOrigin(simplex: vec3[], d: vec3): boolean {
    if (simplex.length == 3) {
        return triangleCase(simplex, d);
    } else if (simplex.length == 2) {
        return lineCase(simplex, d);
    }

    return false;
}

function triangleCase(simplex: vec3[], d: vec3): boolean {
    const a = simplex[simplex.length - 1];
    const b = simplex[simplex.length - 2];
    const c = simplex[simplex.length - 3];

    // compute AO (same thing as -A)
    const ao = vec3.negate(vec3.create(), a);

    // compute the edges
    const ab = vec3.subtract(vec3.create(), b, a);
    const ac = vec3.subtract(vec3.create(), c, a);

    // compute the normals
    const abPerp = tripleProduct(ac, ab, ab);
    const acPerp = tripleProduct(ab, ac, ac);

    // Check if origin is in region outside AB
    if (vec3.dot(abPerp, ao) > 0) {
        // remove point c
        simplex.splice(0, 1);
        // set the new direction to abPerp
        vec3.copy(d, abPerp);
        vec3.normalize(d, d);

        return false;
    }

    // Check if origin is in region outside AC
    if (vec3.dot(acPerp, ao) > 0) {
        // remove point b
        simplex.splice(1, 1);
        // set the new direction to acPerp
        vec3.copy(d, acPerp);
        vec3.normalize(d, d);

        return false;
    }

    // otherwise we know its in R5 so we can return true
    return true;
}

function lineCase(simplex: vec3[], d: vec3): boolean {
    // get the last point added to the simplex
    const a = simplex[simplex.length - 1];
    const b = simplex[simplex.length - 2];

    // compute AO (same thing as -A)
    const ao = vec3.negate(vec3.create(), a);
    // compute AB
    const ab = vec3.subtract(vec3.create(), b, a);
    // get the perp to AB in the direction of the origin
    const abPerp = tripleProduct(ab, ao, ab);
    if (vec3.length(abPerp) <= 1e-10) {
        // Degenerate lineCase direction, if ao is almost collinear with ab
        // fall back to ao directly.
        vec3.copy(d, ao);
    } else {
        // set the direction to abPerp
        vec3.copy(d, abPerp);
        vec3.normalize(d, d);
    }

    return false;
}

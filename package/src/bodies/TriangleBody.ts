import { vec3 } from 'gl-matrix';

import Particle from '../core/Particle';
import PolygonBody from './PolygonBody';

export default class TriangleBody extends PolygonBody {
    constructor(
        x: number,
        y: number,
        size: number,
        isStatic: boolean = false,
        restitution: number = 0.5,
    ) {
        const h = size * (Math.sqrt(3) / 2); // Height of equilateral triangle
        const particles = [
            new Particle(vec3.fromValues(x, y + (2 / 3) * h, 0), 1, isStatic),
            new Particle(
                vec3.fromValues(x - size / 2, y - (1 / 3) * h, 0),
                1,
                isStatic,
            ),
            new Particle(
                vec3.fromValues(x + size / 2, y - (1 / 3) * h, 0),
                1,
                isStatic,
            ),
        ];
        super(particles, restitution, isStatic);
    }
}

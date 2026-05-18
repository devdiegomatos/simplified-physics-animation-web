import { vec3 } from 'gl-matrix';

import Particle from '../core/Particle';
import PolygonBody from './PolygonBody';

export default class RectangleBody extends PolygonBody {
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        isStatic: boolean = false,
        restitution: number = 0.5,
    ) {
        const w2 = width / 2;
        const h2 = height / 2;

        const particles = [
            new Particle(vec3.fromValues(x - w2, y - h2, 0), 1, isStatic),
            new Particle(vec3.fromValues(x + w2, y - h2, 0), 1, isStatic),
            new Particle(vec3.fromValues(x + w2, y + h2, 0), 1, isStatic),
            new Particle(vec3.fromValues(x - w2, y + h2, 0), 1, isStatic),
        ];
        super(particles, restitution, isStatic);
    }
}

import type { vec3 } from 'gl-matrix';

import type Body from '../bodies/Body';
import type Particle from './Particle';

export default class ColliderInfo {
    public contactPoints: Particle[] = [];

    constructor(
        public bodies: Body[],
        public normal: vec3,
        public depth: number,
    ) {}
}

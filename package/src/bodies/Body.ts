import { vec3 } from 'gl-matrix';

import AABB from '../core/AABB';
import type IConstraint from '../core/constraints/IConstraint';
import type Particle from '../core/Particle';
import type PolygonBody from './PolygonBody';

export default abstract class Body {
    public readonly id: number;
    public constraintsIndices: number[] = []; // Particles indices that belongs to constraints

    // cache convex hull
    public _convexHull: PolygonBody | null = null;
    public aabb: AABB | null = null;

    private static nextId = 0;

    constructor(
        public particles: Particle[] = [],
        public constraints: IConstraint[] = [],
        public isStatic: boolean = false,
    ) {
        this.id = Body.nextId;
        Body.nextId++;
    }

    abstract triangulation(): {
        uvs: [number, number][];
        indices: number[];
    };

    public getAABB(): AABB {
        if (this.aabb) {
            return this.aabb;
        }

        let minX = Number.POSITIVE_INFINITY,
            minY = Number.POSITIVE_INFINITY,
            maxX = Number.NEGATIVE_INFINITY,
            maxY = Number.NEGATIVE_INFINITY;

        for (const particle of this.particles) {
            const x = particle.position[0];
            const y = particle.position[1];

            if (x < minX) {
                minX = x;
            }
            if (x > maxX) {
                maxX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (y > maxY) {
                maxY = y;
            }
        }

        this.aabb = new AABB(
            vec3.fromValues(minX, minY, 0),
            vec3.fromValues(maxX, maxY, 0),
        );
        return this.aabb;
    }

    abstract convexHull(): PolygonBody;
    // Compute the convex hull of the body using quickhull algorithm
    // convexHull(): PolygonBody {
    //     if (this._convexHull) {
    //         return this._convexHull;
    //     }

    //     // The convex hull is not defined by less than 3 points
    //     if (this.particles.length < 3) {
    //         // Initialize with empty particles to avoid constraints creation
    //         this._convexHull = new PolygonBody([]);
    //         this._convexHull.particles = this.particles;
    //         return this._convexHull;
    //     }

    //     const candidates: Particle[] = this.particles.slice(); // A reference copy of the particles objects

    //     // 1. Find the extreme points
    //     let pmin: Particle = this.particles[0],
    //         pmax: Particle = this.particles[0];
    //     let imin: number = 0,
    //         imax: number = 0;
    //     for (let i = 1; i < candidates.length; i++) {
    //         const particle = candidates[i];
    //         if (particle.position[0] < pmin.position[0]) {
    //             pmin = particle;
    //             imin = i;
    //         } else if (particle.position[0] > pmax.position[0]) {
    //             pmax = particle;
    //             imax = i;
    //         }
    //     }

    //     // 2. Se todos são colineares: retornar potnos ordenados ao longo da linha
    //     // ex: caso em que o corpo colapse formando uma linha
    //     let allColinear = true;
    //     for (const p of candidates) {
    //         const ab = vec3.subtract(
    //             vec3.create(),
    //             pmax.position,
    //             pmin.position,
    //         );
    //         const ap = vec3.subtract(vec3.create(), p.position, pmin.position);
    //         const cross = vec3.cross(vec3.create(), ab, ap);
    //         if (Math.abs(vec3.length(cross)) > 1e-12) {
    //             allColinear = false;
    //             break;
    //         }
    //     }
    //     if (allColinear) {
    //         // ordenar por x então y e retornar extremos
    //         const sorted = candidates
    //             .slice()
    //             .sort(
    //                 (a, b) =>
    //                     a.position[0] - b.position[0] ||
    //                     a.position[1] - b.position[1],
    //             );

    //         // retorne linha de um extremo ao outro (não repetir)
    //         this._convexHull = new PolygonBody([]);
    //         this._convexHull.particles = [sorted[0], sorted[sorted.length - 1]];
    //         return this._convexHull;
    //     }

    //     //  3. Init hull with pmin and pmax
    //     const convexHull: Particle[] = [pmin, pmax];
    //     // After the splice call the indices shift, you must remove the elements
    //     // in descending index order
    //     const maxIndex = Math.max(imin, imax);
    //     const minIndex = Math.min(imin, imax);
    //     candidates.splice(maxIndex, 1);
    //     candidates.splice(minIndex, 1);

    //     // 3. Divide the candidates into above and bellow the line
    //     const above: Particle[] = [];
    //     const bellow: Particle[] = [];
    //     for (const particle of candidates) {
    //         const d = this.distancePointToLine(pmin, pmax, particle);
    //         if (d > 0) {
    //             above.push(particle);
    //         } else {
    //             bellow.push(particle);
    //         }
    //     }
    //     this.quickhull(pmin, pmax, above, convexHull);
    //     this.quickhull(pmin, pmax, bellow, convexHull);

    //     // Initialize with empty particles to avoid constraints creation
    //     this._convexHull = new PolygonBody([]);
    //     this._convexHull.particles = convexHull;
    //     return this._convexHull;
    // }

    move(dt: vec3): void {
        for (const particle of this.particles) {
            particle.move(dt);
        }
    }

    // protected quickhull(
    //     p0: Particle,
    //     p1: Particle,
    //     candidates: Particle[],
    //     hull: Particle[],
    // ) {
    //     // 4. Find the most distance point from the line
    //     let farthestDistance = -Infinity;
    //     let farthestPoint: Particle | null = null;
    //     // let pointIndex = -1;
    //     for (let i = 0; i < candidates.length; i++) {
    //         const particle = candidates[i];
    //         const d = this.distancePointToLine(p0, p1, particle);
    //         if (d > farthestDistance) {
    //             farthestPoint = particle;
    //             // pointIndex = i;
    //         }
    //     }

    //     if (farthestPoint === null) return;

    //     const insertIndex = hull.findIndex((pt) => pt === p1);
    //     if (insertIndex >= 0) {
    //         hull.splice(insertIndex, 0, farthestPoint);
    //     }

    //     // 5. Divide the candidates from lines (p0, farthestPoint) and (p1, farthestPoint)
    //     // We can ignore the points inside the triangle formed by: p0, p1, farthestPoint
    //     // The bellows checks of farthestPoint and candidatesLength avoid the next recursive call
    //     const set1: Particle[] = [];
    //     const set2: Particle[] = [];
    //     for (const p of candidates) {
    //         if (this.distancePointToLine(p0, farthestPoint, p) > 0) {
    //             set1.push(p);
    //         } else if (this.distancePointToLine(farthestPoint, p1, p)) {
    //             set2.push(p);
    //         }
    //     }

    //     this.quickhull(p0, farthestPoint, set1, hull);
    //     this.quickhull(farthestPoint, p1, set2, hull);
    // }

    // distância perpendicular do ponto p à linha ab
    protected distancePointToLine(a: Particle, b: Particle, p: Particle) {
        // cross of (b - a) x (c - a)
        const ab = vec3.subtract(vec3.create(), b.position, a.position);
        const ap = vec3.subtract(vec3.create(), p.position, a.position);
        const cross = vec3.cross(vec3.create(), ab, ap);
        return cross[2];
    }
}

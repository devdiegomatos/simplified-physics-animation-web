import { vec3 } from 'gl-matrix';

import type Body from './bodies/Body';
import ColliderInfo from './core/ColliderInfo';
import { epa } from './core/collision/epa';
import gjk from './core/collision/gjk';
import sat from './core/collision/sat';
import SpatialHashGrid from './core/SpatialHashGrid';

export enum BroadPhaseMode {
    Naive,
    GridSpatialPartition,
}

export enum CollisionDetectionMode {
    GjkEpa,
    Sat,
}

export interface Config {
    worldBoundings: { top: [number, number]; right: [number, number] };
    BroadPhase: BroadPhaseMode;
    CollisionDetection: CollisionDetectionMode;
    gravity: vec3;
    gridSize: number;
}

export interface Metrics {
    particlesCount: number[];
    constraintsCount: number[];
    collisionsTest: number[];
    trueCollisions: number[];
    broadphaseTime: number[];
    narrowphaseTime: number[];
    deltatime: number[];
}

export default class Engine {
    public gravity: vec3;

    public bodies: Body[] = [];
    public contactPairs: [Body, Body][] = [];
    public collidersInfo: ColliderInfo[] = [];

    public metrics: Metrics = {
        particlesCount: [],
        constraintsCount: [],
        collisionsTest: [],
        trueCollisions: [],
        broadphaseTime: [],
        narrowphaseTime: [],
        deltatime: [],
    };
    public isPaused: boolean = false;
    public pauseOnCollision: boolean = false;
    public skip: boolean = false;

    protected spatialHashGrid: SpatialHashGrid | undefined;
    protected NUM_ITERATIONS: number = 3;

    constructor(public config: Config) {
        if (config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
            this.spatialHashGrid = new SpatialHashGrid(config.gridSize);
        }

        this.gravity = config.gravity;
    }

    step(dt: number) {
        if (this.isPaused) {
            return;
        }

        const dtStart = performance.now();

        this.metrics.collisionsTest.push(0);
        this.metrics.trueCollisions.push(0);
        this.contactPairs.length = 0;
        this.collidersInfo.length = 0;

        if (this.config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
            this.spatialHashGrid?.clear();
        }

        let sumParticles = 0,
            sumConstraints = 0;
        for (const body of this.bodies) {
            sumParticles += body.particles.length;
            sumConstraints += body.constraints.length;

            // Invalidate caches
            body.aabb = null;
            body._convexHull = null;

            this.integrate(body, dt);

            if (this.config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
                this.spatialHashGrid?.insert(body);
            }
        }
        this.metrics.particlesCount.push(sumParticles);
        this.metrics.constraintsCount.push(sumConstraints);

        let start = performance.now();
        if (this.config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
            this.broadPhase_GridSpatialPartition();
        } else {
            this.broadPhase_Naive();
        }
        let end = performance.now();
        this.metrics.broadphaseTime.push(end - start);

        start = performance.now();
        if (this.config.CollisionDetection == CollisionDetectionMode.Sat) {
            this.narrowPhase_SAT();
        } else if (
            this.config.CollisionDetection == CollisionDetectionMode.GjkEpa
        ) {
            this.narrowPhase_GJK();
        }
        end = performance.now();
        this.metrics.narrowphaseTime.push(end - start);

        this.resolveCollisions();

        for (const body of this.bodies) {
            this.satisfyConstraints(body);
        }

        this.skip = false;

        this.metrics.deltatime.push(performance.now() - dtStart);
    }

    /**
     * Jakobson's particle phsyics through verlet integration
     * @param body
     * @returns
     */
    integrate(body: Body, dt: number) {
        for (const particle of body.particles) {
            if (particle.isStatic) continue;

            const velocity = vec3.subtract(
                vec3.create(),
                particle.position,
                particle.oldPosition,
            );
            vec3.copy(particle.oldPosition, particle.position);

            // const drag = vec3.fromValues(
            //     -10 * velocity[0],
            //     -10 * velocity[1],
            //     0,
            // );
            // const acc = vec3.add(vec3.create(), drag, this.gravity);
            const acc = vec3.clone(this.gravity);
            vec3.scale(acc, acc, dt * dt);

            // pos = pos + velocity + acc
            vec3.add(particle.position, particle.position, velocity);
            vec3.add(particle.position, particle.position, acc);
        }
    }

    /**
     * Jakobson's constraints solver
     * @param body
     * @returns
     */
    satisfyConstraints(body: Body) {
        for (let i = 0; i < this.NUM_ITERATIONS; i++) {
            for (const particle of body.particles) {
                const x = Math.max(
                    Math.min(
                        particle.position[0],
                        this.config.worldBoundings.right[0],
                    ),
                    this.config.worldBoundings.top[0],
                );
                const y = Math.max(
                    Math.min(
                        particle.position[1],
                        this.config.worldBoundings.right[1],
                    ),
                    this.config.worldBoundings.top[1],
                );
                vec3.set(particle.position, x, y, 0);
            }

            for (const constraint of body.constraints) {
                constraint.relax();
            }
        }
    }

    public broadPhase_GridSpatialPartition() {
        if (this.spatialHashGrid === undefined) return;

        const seen = new Set<string>();
        const orderedCells = this.spatialHashGrid.cells.sort(
            (a, b) => a[0] - b[0],
        );
        for (let i = 0; i < orderedCells.length - 1; i++) {
            const cellA = orderedCells[i];

            for (let j = i + 1; j < orderedCells.length; j++) {
                const cellB = orderedCells[j];

                if (cellA[0] !== cellB[0]) break;

                const idA = cellA[1].id;
                const idB = cellB[1].id;
                const keyPair = idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
                if (idA === idB || seen.has(keyPair)) continue;

                seen.add(keyPair);

                this.metrics.collisionsTest[
                    this.metrics.collisionsTest.length - 1
                ]++;
                if (cellA[1].getAABB().intersects(cellB[1].getAABB())) {
                    this.contactPairs.push([cellA[1], cellB[1]]);
                }
            }
        }
    }

    public broadPhase_Naive() {
        for (let i = 0; i < this.bodies.length - 1; i++) {
            const bodyA = this.bodies[i];

            for (let j = i + 1; j < this.bodies.length; j++) {
                const bodyB = this.bodies[j];

                const boundingBoxA = bodyA.getAABB();
                const boundingBoxB = bodyB.getAABB();

                this.metrics.collisionsTest[
                    this.metrics.collisionsTest.length - 1
                ]++;
                if (boundingBoxA.intersects(boundingBoxB)) {
                    this.contactPairs.push([bodyA, bodyB]);
                }
            }
        }
    }

    public narrowPhase_SAT() {
        for (const pair of this.contactPairs) {
            const bodyA = pair[0];
            const bodyB = pair[1];

            const convexHullA = bodyA.convexHull();
            const convexHullB = bodyB.convexHull();

            // The direction of the separation plane goes from A to B
            // So the separation required for A is in the oppositive direction
            const hit = sat(convexHullA, convexHullB);
            if (hit) {
                this.metrics.trueCollisions[
                    this.metrics.trueCollisions.length - 1
                ]++;

                const colliderA = new ColliderInfo(
                    bodyA,
                    vec3.negate(vec3.create(), hit.normal),
                    hit.depth,
                );
                const colliderB = new ColliderInfo(
                    bodyB,
                    hit.normal,
                    hit.depth,
                );
                this.collidersInfo.push(colliderA, colliderB);
            }
        }
    }

    public narrowPhase_GJK() {
        for (const pair of this.contactPairs) {
            const bodyA = pair[0];
            const bodyB = pair[1];

            const convexHullA = bodyA.convexHull();
            const convexHullB = bodyB.convexHull();

            // The direction of the separation plane goes from A to B!
            // So the separation required for A is in the oppositive direction
            const hit = gjk(convexHullA, convexHullB);
            if (hit) {
                this.metrics.trueCollisions[
                    this.metrics.trueCollisions.length - 1
                ]++;

                const mvp = epa(convexHullA, convexHullB, hit);
                const colliderA = new ColliderInfo(
                    bodyA,
                    vec3.negate(vec3.create(), mvp.normal),
                    mvp.depth,
                );
                const colliderB = new ColliderInfo(
                    bodyB,
                    mvp.normal,
                    mvp.depth,
                );
                this.collidersInfo.push(colliderA, colliderB);
            }
        }
    }

    public resolveCollisions() {
        for (const c of this.collidersInfo) {
            // The separation direction is pointing away from the colliding points
            // We should look for the contact edges on the oppositive direction
            const convexHull = c.body.convexHull();
            const edge = convexHull.getFarthestEdgeInDirection(
                vec3.negate(vec3.create(), c.normal),
            );
            c.contactPoints = edge.filter((p) => p.isStatic === false);
            // c.contactPoints = edge;

            if (this.pauseOnCollision && this.skip === false) {
                this.isPaused = true;
                // Should not resolve collision, just pause the simulation
                // however you need to calculate all the contact points for
                // rendering debug
                continue;
            }

            for (const particle of c.contactPoints) {
                if (particle.isStatic) {
                    continue;
                }

                const correction = vec3.scale(
                    vec3.create(),
                    c.normal,
                    c.depth / c.contactPoints.length,
                );
                vec3.scale(correction, correction, 1 / particle.mass);

                particle.move(correction);
            }
        }
    }

    public addBody(body: Body) {
        this.bodies.push(body);
    }
}

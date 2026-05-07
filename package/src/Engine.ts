import { vec3 } from 'gl-matrix';

import type Body from './bodies/Body';
import { epa } from './core/collision/epa';
import gjk from './core/collision/gjk';
import sat from './core/collision/sat';
import SpatialHashGrid from './core/SpatialHashGrid';
import ContactManifold from './core/ContactManifold';
import CollisionSolver from './core/collision/CollisionSolver';
import type { IConstraint, Particle } from './core';

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
    integrationTime: number[];
    relaxationTime: number[];
    separationTime: number[];
    broadphaseTime: number[];
    narrowphaseTime: number[];
    gridClearTime: number[];
    gridInitTime: number[];
    gridSortTime: number[];
    deltatime: number[];
}

export default class Engine {
    public gravity: vec3;

    public bodies: Body[] = [];
    public particles: Particle[] = [];
    public constraints: IConstraint[] = [];
    
    public contactPairs: [Body, Body][] = [];
    public contactManifolds: ContactManifold[] = [];

    public metrics: Metrics = {
        particlesCount: [],
        constraintsCount: [],
        collisionsTest: [],
        trueCollisions: [],
        integrationTime: [],
        relaxationTime: [],
        separationTime: [],
        broadphaseTime: [],
        narrowphaseTime: [],
        gridClearTime: [],
        gridInitTime: [],
        gridSortTime: [],
        deltatime: [],
    };
    public isPaused: boolean = false;
    public pauseOnCollision: boolean = false;
    public skip: boolean = false;

    protected spatialHashGrid: SpatialHashGrid | undefined;
    protected NUM_ITERATIONS: number = 5;

    constructor(public config: Config) {
        // Inicializa a estrutura de broad phase quando o modo com grade esta ativo.
        if (config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
            this.spatialHashGrid = new SpatialHashGrid(
                config.worldBoundings.right[1] / config.gridSize,
                config.gridSize,
            );
        }

        // Gravidade global aplicada na etapa de integracao.
        this.gravity = config.gravity;
    }

    step(dt: number) {
        // 1) Interrompe o frame se a simulacao estiver pausada.
        if (this.isPaused) {
            return;
        }

        // Marca o inicio do frame para medir o tempo total.
        const dtStart = performance.now();

        // 2) Limpa dados temporarios do frame anterior.
        this.contactPairs.length = 0;
        // this.collidersInfo.length = 0;
        this.contactManifolds.length = 0;

        // 3) Prepara a grade espacial para receber os corpos atualizados.
        if (this.config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
            const start = performance.now();
            this.spatialHashGrid?.clear();
            const end = performance.now();
            this.metrics.gridClearTime.push(end - start);
        }

        // Acumuladores de metricas deste frame.
        let integrationTime = 0,
            gridInitTime = 0;

        // 4) Atualiza todos os corpos (integracao) e popula a grade quando habilitada.
        // for (const body of this.bodies) {
        //     sumParticles += body.particles.length;
        //     sumConstraints += body.constraints.length;

        //     // Invalida caches geometricos, pois as particulas podem ter se movido.
        //     body.aabb = null;
        //     body._convexHull = null;

        //     const start = performance.now();
        //     this.integrate(body, dt);
        //     const end = performance.now();
        //     integrationTime += end - start;

        //     // Indexa o corpo na grade para reduzir pares testados no broad phase.
        //     if (this.config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
        //         const start = performance.now();
        //         this.spatialHashGrid?.insert(body);
        //         const end = performance.now();
        //         gridInitTime += end - start;
        //     }
        // }
        this.integrate(dt);
        for (const body of this.bodies) {
            body.aabb = null;
            body._convexHull = null;

            // Indexa o corpo na grade para reduzir pares testados no broad phase.
            if (this.config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
                const start = performance.now();
                this.spatialHashGrid?.insert(body);
                const end = performance.now();
                gridInitTime += end - start;
            }
        }

        // 5) Registra metricas de estado e custo da etapa de integracao.
        // this.metrics.particlesCount.push(sumParticles);
        // this.metrics.constraintsCount.push(sumConstraints);
        this.metrics.particlesCount.push(this.particles.length);
        this.metrics.constraintsCount.push(this.constraints.length);
        this.metrics.integrationTime.push(integrationTime);
        this.metrics.gridInitTime.push(gridInitTime);

        // Inicializa os contadores de colisao deste frame.
        this.metrics.collisionsTest.push(0);
        this.metrics.trueCollisions.push(0);

        // 6) Detecta colisao:
        // - Broad phase: gera pares candidatos (com grade).
        // - Narrow phase: confirma interseccao e cria infos de colisao.
        if (this.config.BroadPhase == BroadPhaseMode.GridSpatialPartition) {
            let start = performance.now();
            this.broadPhase_GridSpatialPartition();
            let end = performance.now();
            this.metrics.broadphaseTime.push(end - start);

            start = performance.now();
            for (const p of this.contactPairs) {
                // SAT ou GJK/EPA conforme configuracao global.
                if (
                    this.config.CollisionDetection == CollisionDetectionMode.Sat
                ) {
                    this.narrowPhase_SAT(p);
                } else if (
                    this.config.CollisionDetection ==
                    CollisionDetectionMode.GjkEpa
                ) {
                    this.narrowPhase_GJK(p);
                }
            }
            end = performance.now();
            this.metrics.narrowphaseTime.push(end - start);
        } else {
            // Modo naive: testa todos os pares de corpos (O(n^2)).
            const start = performance.now();
            for (let i = 0; i < this.bodies.length; i++) {
                const bodyA = this.bodies[i];
                for (let j = i + 1; j < this.bodies.length; j++) {
                    const bodyB = this.bodies[j];

                    if (bodyA.id === bodyB.id) continue;

                    // Perform narrow phase collision detection
                    this.metrics.collisionsTest[
                        this.metrics.collisionsTest.length - 1
                    ]++;
                    if (
                        this.config.CollisionDetection ==
                        CollisionDetectionMode.Sat
                    ) {
                        this.narrowPhase_SAT([bodyA, bodyB]);
                    } else if (
                        this.config.CollisionDetection ==
                        CollisionDetectionMode.GjkEpa
                    ) {
                        this.narrowPhase_GJK([bodyA, bodyB]);
                    }
                }
            }
            const end = performance.now();
            this.metrics.narrowphaseTime.push(end - start);
        }

        let start = performance.now();
        // 7) Resolve penetracoes movendo particulas nos pontos de contato.
        this.resolveCollisions();
        let end = performance.now();
        this.metrics.separationTime.push(end - start);

        start = performance.now();
        // 8) Relaxa constraints para estabilizar a malha/forma dos corpos.
        this.satisfyConstraints();
        end = performance.now();
        this.metrics.relaxationTime.push(end - start);

        // 9) Libera flag de pausa por colisao e fecha as metricas do frame.
        this.skip = false;
        const dtEnd = performance.now();
        this.metrics.deltatime.push(dtEnd - dtStart);
    }

    /**
     * Jakobson's particle physics through verlet integration
     * @param body
     * @returns
     */
    integrate(dt: number) {
        // Verlet: x(t+dt) = x(t) + (x(t)-x(t-dt)) + a*dt^2
        for (const particle of this.particles) {
            if (particle.isStatic) continue;

            const velocity = vec3.subtract(
                vec3.create(),
                particle.position,
                particle.oldPosition,
            );
            vec3.copy(particle.oldPosition, particle.position);

            const acc = vec3.clone(this.gravity);
            vec3.scale(acc, acc, dt * dt);

            vec3.add(particle.position, particle.position, velocity);
            vec3.add(particle.position, particle.position, acc);
        }
    }

    /**
     * Jakobson's constraints solver
     * @param body
     * @returns
     */
    satisfyConstraints() {
        for (let i = 0; i < this.NUM_ITERATIONS; i++) {
            // Primeiro, aplica limites de mundo para evitar fuga da simulacao.
            for (const particle of this.particles) {
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

            // Depois, relaxa as restricoes internas do corpo.
            for (const constraint of this.constraints) {
                constraint.relax();
            }
        }
    }

    public broadPhase_GridSpatialPartition() {
        if (this.spatialHashGrid === undefined) return;

        const seen = new Set<number>();
        // Ordena celulas por hash para agrupar corpos que compartilham a mesma celula.
        const start = performance.now();
        const orderedCells = this.spatialHashGrid.cells.sort(
            (a, b) => a[0] - b[0],
        );
        const end = performance.now();
        this.metrics.gridSortTime.push(end - start);

        // Gera pares unicos por celula e filtra por interseccao de AABB.
        for (let i = 0; i < orderedCells.length - 1; i++) {
            const cellA = orderedCells[i];
            for (let j = i + 1; j < orderedCells.length; j++) {
                const cellB = orderedCells[j];

                if (cellA[0] !== cellB[0]) break;

                const idA = cellA[1].id;
                const idB = cellB[1].id;
                if (idA === idB) continue;

                const keyPair =
                    idA < idB
                        ? idA + idB * this.bodies.length
                        : idB + idA * this.bodies.length;
                if (seen.has(keyPair)) continue;

                seen.add(keyPair);

                this.metrics.collisionsTest[
                    this.metrics.collisionsTest.length - 1
                ]++;
                // Apenas pares com AABB sobreposto vao para o narrow phase.
                if (cellA[1].getAABB().intersects(cellB[1].getAABB())) {
                    this.contactPairs.push([cellA[1], cellB[1]]);
                }
            }
        }
    }

    public narrowPhase_SAT(pair: [Body, Body]) {
        const bodyA = pair[0];
        const bodyB = pair[1];

        const convexHullA = bodyA.convexHull();
        const convexHullB = bodyB.convexHull();

        const hit = sat(convexHullA, convexHullB);
        if (hit) {
            this.metrics.trueCollisions[
                this.metrics.trueCollisions.length - 1
            ]++;

            this.contactManifolds.push(
                new ContactManifold(
                    convexHullA,
                    convexHullB,
                    hit.normal,
                    hit.depth,
                ),
            );
        }
    }

    public narrowPhase_GJK(pair: [Body, Body]) {
        const bodyA = pair[0];
        const bodyB = pair[1];

        const convexHullA = bodyA.convexHull();
        const convexHullB = bodyB.convexHull();

        const hit = gjk(convexHullA, convexHullB);
        if (hit) {
            this.metrics.trueCollisions[
                this.metrics.trueCollisions.length - 1
            ]++;

            const mtv = epa(convexHullA, convexHullB, hit);
            this.contactManifolds.push(
                new ContactManifold(
                    convexHullA,
                    convexHullB,
                    mtv.normal,
                    mtv.depth,
                ),
            );
        }
    }

    public resolveCollisions() {
        // Para cada colisao confirmada, calcula os pontos de contato e corrige posicoes.

        for (const c of this.contactManifolds) {
            const contact = c.getContactPoints();
            // this.isPaused = true;

            const refEdge = contact.points[0];
            const incEdge = contact.points[1];
            if (refEdge.length == 2) {
                if (incEdge.length == 1) {
                    // console.log('Vértice vs Aresta');
                    const { cA, cB, t } = CollisionSolver.resolveVertexEdge(
                        incEdge[0].position, // A
                        refEdge[0].position, // B
                        refEdge[1].position, // B
                        contact.isFlipped
                            ? vec3.negate(vec3.create(), c.normal)
                            : c.normal,
                        c.depth,
                        refEdge[0].isStatic ? Infinity : refEdge[0].mass,
                        incEdge[0].isStatic ? Infinity : incEdge[0].mass,
                    );

                    incEdge[0].move(cA);
                    refEdge[0].move(vec3.scale(vec3.create(), cB, 1 - t));
                    refEdge[1].move(vec3.scale(vec3.create(), cB, t));
                } else if (incEdge.length == 2) {
                    // console.log('Aresta vs Aresta');
                } else {
                    console.log(
                        'Unexpected contact points configuration',
                        contact.points,
                    );
                }
            } else {
                console.log(
                    'Unexpected contact points configuration',
                    contact.points,
                );
            }
        }
    }

    public addBody(body: Body) {
        for (const p of body.particles) this.particles.push(p);
        for (const c of body.constraints) this.constraints.push(c);
        
        this.bodies.push(body);
    }
}

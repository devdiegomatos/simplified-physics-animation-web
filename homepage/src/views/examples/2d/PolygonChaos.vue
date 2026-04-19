<style>
canvas {
    border-radius: 12px;
    width: 100% !important;
    height: 100% !important;
}
</style>

<template>
    <div style="max-width: 1000px" class="mx-auto space-y-4">
        <div>
            <h1 class="text-3xl"><strong>Polygon Chaos</strong></h1>
            <p>Polygons vs Polygons demo</p>
        </div>

        <div class="w-full flex flex-col md:flex-row gap-6">
            <div class="md:w-2/3" ref="sketchContainer"></div>
            <div class="md:w-1/3 border border-slate-200 rounded p-4 space-y-2">
                <div class="flex justify-between">
                    <p>FPS</p>
                    <p>{{ fps }}</p>
                </div>
                <div class="flex justify-between">
                    <label for="totalEntities">Entities</label>
                    <input
                        id="totalEntities"
                        class="border border-slate-200 rounded text-right"
                        type="number"
                        step="1"
                        v-model="totalEntities"
                        :disabled="hasStarted"
                        @change="OnTotalEntitiesChange"
                    />
                </div>
                <div class="flex justify-between">
                    <p>Particles</p>
                    <p>{{ getParticlesCount() }}</p>
                </div>
                <div class="flex justify-between">
                    <p>Constraints</p>
                    <p>{{ getConstraintsCount() }}</p>
                </div>
                <div class="flex justify-between">
                    <p>Collision Tests</p>
                    <p>{{ getCollisionsCount() }}</p>
                </div>

                <hr class="my-4 border-slate-200" />
                <div class="flex justify-between">
                    <label for="threaded">Threaded Mode</label>
                    <input id="threaded" name="threaded" type="checkbox" v-model="threaded" />
                </div>

                <div class="flex justify-between">
                    <label for="broadPhaseMode">Broad Phase</label>
                    <select style="max-width: 100px" name="broadPhaseMode" id="broadPhaseMode" v-model="broadPhase" class="border border-slate-200 rounded">
                        <option value="0">Naive</option>
                        <option value="1">Grid Spatial Partition</option>
                    </select>
                </div>

                <div class="flex justify-between">
                    <label for="collisionDetectionMode">Collision Detection</label>
                    <select
                        style="max-width: 100px"
                        name="collisionDetectionMode"
                        id="collisionDetectionMode"
                        v-model="collisionDetection"
                        class="border border-slate-200 rounded"
                    >
                        <option value="0">GJK/EPA</option>
                        <option value="1">Sat</option>
                    </select>
                </div>

                <div class="flex flex-wrap justify-between mt-4">
                    <button class="w-full px-4 py-2 border rounded" @click="start" :disabled="hasStarted">Start</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { vec2, vec3 } from 'gl-matrix';
import { onBeforeUnmount, ref } from 'vue';
import p5 from 'p5';
import { PolygonBody, type Body, TriangleBody, RectangleBody } from '@devdiegomatos/liso-engine/bodies';
import { BroadPhaseMode, CollisionDetectionMode, Engine } from '@devdiegomatos/liso-engine';
import { createEngineWorker, type MainToWorkerMessage, type WorkerToMainMessage, type ObjectBuilderArgs, ObjectType } from '@devdiegomatos/liso-engine/worker';
import { PoissonDiscSampling } from '@devdiegomatos/liso-engine'
import Scene from '@/scenes/Scene';
import type IScene from '@/scenes/IScene';
import SceneThreaded from '@/scenes/SceneThreaded';

// Component States
let hasStarted = false,
    threaded = false;
let totalEntities = 100;
let broadPhase: BroadPhaseMode = BroadPhaseMode.GridSpatialPartition;
let collisionDetection: CollisionDetectionMode = CollisionDetectionMode.GjkEpa;
const fps = ref(0);

// Main thread mode variables
const worldBoundings = 600;
const gridArea = worldBoundings ** 2;
const gridSize = Math.sqrt(gridArea / (totalEntities * Math.PI));
const poissonSamp = new PoissonDiscSampling(gridSize, vec2.fromValues(worldBoundings, worldBoundings))
let scene: IScene | null = null;

// Threaded mode variables
let worker: Worker | null = null;

// P5 variables
const sketchContainer = ref<HTMLDivElement | null>(null);
let sketchInstance: p5 | null = null;

function start() {
    if (!sketchContainer.value || hasStarted) return;

    hasStarted = true;

    if (sketchInstance === null) {
        const sketch = (p: p5) => {
            p.setup = () => setup(p);
            p.draw = () => loop(p);
        };

        sketchInstance = new p5(sketch);
    }

    if (threaded) {
        worker = createEngineWorker();
        worker.addEventListener('message', OnWorkerEvent);
    }
}

async function setup(p: p5) {
    if (sketchContainer.value === null) return;

    p.createCanvas(worldBoundings, worldBoundings).parent(sketchContainer.value);

    const points = poissonSamp.GeneratePoints()

    if (threaded && worker) {
        scene = new SceneThreaded();

        const objs: ObjectBuilderArgs[] = [];
        for (let i = 0; i < totalEntities; i++) {
            const x = Math.random() * worldBoundings;
            const y = Math.random() * worldBoundings;

            const type = Math.random();
            const isStatic = Math.random() < 0.2 ? true : false;
            const size = gridSize;
            let obj: ObjectBuilderArgs;
            if (type <= 0.25) {
                obj = { type: ObjectType.Triangle, x, y, size, isStatic };
            } else if (type <= 0.5) {
                obj = { type: ObjectType.Rectangle, x, y, width: size, height: size / 2, isStatic };
            } else if (type <= 0.75) {
                obj = { type: ObjectType.Polygon, x, y, size, k: 5, isStatic };
            } else {
                obj = { type: ObjectType.Polygon, x, y, size, k: 6, isStatic };
            }
            objs.push(obj);
        }

        const msg: MainToWorkerMessage = {
            type: 'start',
            config: {
                worldBoundings: {
                    top: [0, 0],
                    right: [worldBoundings, worldBoundings],
                },
                BroadPhase: broadPhase,
                CollisionDetection: collisionDetection,
                gravity: vec3.fromValues(0, 98, 0),
                gridSize,
            },
        };
        worker.postMessage(msg);
    } else {
        scene = new Scene(
            new Engine({
                worldBoundings: {
                    top: [0, 0],
                    right: [worldBoundings, worldBoundings],
                },
                BroadPhase: broadPhase,
                CollisionDetection: collisionDetection,
                gravity: vec3.fromValues(0, 98, 0),
                gridSize,
            }),
        );

        for (let i = 0; i < totalEntities; i++) {
            const point = points[i];
            const x = point[0];
            const y = point[1];

            const type = Math.random();
            const isStatic = Math.random() < 0.2 ? true : false;
            const size = gridSize;
            let body: Body;
            if (type <= 0.25) {
                body = new TriangleBody(x, y, size, isStatic);
            } else if (type <= 0.5) {
                body = new RectangleBody(x, y, size, size / 2, isStatic);
            } else if (type <= 0.75) {
                body = PolygonBody.PolygonBuilder(x, y, size, 5, isStatic);
            } else {
                body = PolygonBody.PolygonBuilder(x, y, size, 6, isStatic);
            }

            scene.add(body);
        }

        // for (let i = 0; i < totalEntities; i++) {
        //     const x = Math.random() * worldBoundings;
        //     const y = Math.random() * worldBoundings;

        //     const type = Math.random();
        //     const isStatic = Math.random() < 0.2 ? true : false;
        //     const size = gridSize;
        //     let body: Body;
        //     if (type <= 0.25) {
        //         body = new TriangleBody(x, y, size, isStatic);
        //     } else if (type <= 0.5) {
        //         body = new RectangleBody(x, y, size, size / 2, isStatic);
        //     } else if (type <= 0.75) {
        //         body = PolygonBody.PolygonBuilder(x, y, size, 5, isStatic);
        //     } else {
        //         body = PolygonBody.PolygonBuilder(x, y, size, 6, isStatic);
        //     }

        //     scene.add(body);
        // }
    }
}

function loop(p: p5) {
    if (!scene) return;

    p.background('#ffffff');

    // Draw grid
    p.push();
    p.stroke('#e0e0e0');
    p.strokeWeight(1);

    // linhas verticais
    for (let x = 0; x <= p.width; x += gridSize) {
        p.line(x + 0.5, 0, x + 0.5, p.height); // 0.5 corrige artefatos de subpixel
    }

    // linhas horizontais
    for (let y = 0; y <= p.height; y += gridSize) {
        p.line(0, y + 0.5, p.width, y + 0.5);
    }

    p.pop();

    fps.value = Math.round(p.frameRate());

    scene.step(p.deltaTime / 1000);
    scene.render(p);
}

onBeforeUnmount(() => {
    console.log('Clean up');

    if (sketchInstance) {
        sketchInstance.remove();
        sketchInstance = null;
    }

    if (worker) {
        worker.removeEventListener('message', OnWorkerEvent);
        worker.terminate();
        worker = null;
    }
});

function getParticlesCount() {
    if (!scene) {
        return 0;
    }

    return scene.getParticlesCount();
}

function getConstraintsCount() {
    if (!scene) {
        return 0;
    }

    return scene.getConstraintsCount();
}

function getCollisionsCount() {
    if (!scene) {
        return 0;
    }

    return scene.getCollisionsCount();
}

function OnTotalEntitiesChange() {
    gridSize = Math.sqrt(gridArea / (totalEntities * 3));
}

function OnWorkerEvent(e: MessageEvent<WorkerToMainMessage>) {
    if (!scene || !(scene instanceof SceneThreaded)) return;

    const msg = e.data;
    if (msg.type === 'simulation_state') {
        scene.simulation_state = msg.state;
    }
}
</script>

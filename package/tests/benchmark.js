import { performance } from 'node:perf_hooks';

import { vec3 } from 'gl-matrix';
import seedrandom from 'seedrandom';

import {
    BroadPhaseMode,
    CollisionDetectionMode,
    Engine,
} from '../dist/index.js';
import * as utils from './utils.js';

const testCases = [
    {
        worldBoundings: 1000,
        broadPhaseMode: BroadPhaseMode.Naive,
        collisionDetection: CollisionDetectionMode.Sat,
    },
    {
        worldBoundings: 1000,
        broadPhaseMode: BroadPhaseMode.GridSpatialPartition,
        collisionDetection: CollisionDetectionMode.Sat,
    },
    {
        worldBoundings: 1000,
        broadPhaseMode: BroadPhaseMode.Naive,
        collisionDetection: CollisionDetectionMode.GjkEpa,
    },
    {
        worldBoundings: 1000,
        broadPhaseMode: BroadPhaseMode.GridSpatialPartition,
        collisionDetection: CollisionDetectionMode.GjkEpa,
    },
];

function buildTestName(test) {
    let result = '';
    if (test.broadPhaseMode === BroadPhaseMode.Naive) {
        result += 'Naive BroadPhase';
    } else if (test.broadPhaseMode === BroadPhaseMode.GridSpatialPartition) {
        result += 'Grid Spatial Partition BroadPhase';
    }

    if (test.collisionDetection === CollisionDetectionMode.Sat) {
        result += ' + SAT Collision Detection';
    } else if (test.collisionDetection === CollisionDetectionMode.GjkEpa) {
        result += ' + GJK-EPA Collision Detection';
    }

    return result;
}

function intersectionTest(testCase, objects) {
    const gridArea = testCase.worldBoundings ** 2;
    // const cellSize = Math.sqrt(gridArea / (objects * 5));
    const cellSize = Math.sqrt(gridArea / (objects * Math.PI));

    const engine = new Engine({
        worldBoundings: {
            top: [0, 0],
            right: [testCase.worldBoundings, testCase.worldBoundings],
        },
        BroadPhase: testCase.broadPhaseMode,
        CollisionDetection: testCase.collisionDetection,
        gravity: vec3.fromValues(0, 98, 0),
        gridSize: cellSize + Math.random() * 5,
    });

    const bodies = utils.generateBodies(
        objects,
        testCase.worldBoundings,
        cellSize,
    );
    for (const body of bodies) {
        engine.addBody(body);
    }

    for (let i = 0; i < 60 * 3; i++) {
        engine.step(1 / 60);
    }

    let filename = 'collision-test';
    if (testCase.broadPhaseMode === BroadPhaseMode.Naive) {
        filename += '-naive-mode';
    } else if (
        testCase.broadPhaseMode === BroadPhaseMode.GridSpatialPartition
    ) {
        filename += '-grid-mode';
    }

    if (testCase.collisionDetection === CollisionDetectionMode.Sat) {
        filename += '-sat';
    } else if (testCase.collisionDetection === CollisionDetectionMode.GjkEpa) {
        filename += '-gjk-epa';
    }

    const now = new Date();
    filename += `-${objects}-objects-${now.toISOString()}`;

    utils.exportCSV(engine.metrics, filename);
}

function benchmark(test, objects) {
    let name = buildTestName(test);
    console.log(`[benchmark] ${name} - ${objects} objetos`);

    seedrandom('10000', { global: true });
    const start = performance.now();

    intersectionTest(test, objects);

    const end = performance.now();
    const total = end - start;

    console.log(`- tempo total: ${total.toFixed(3)} ms`);
}

function main() {
    console.log('Iniciando benchmark\n');

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        for (let objects = 100; objects <= 1000; objects += 100) {
            benchmark(test, objects);
        }
    }

    console.log('Todos os testes finalizaram com sucesso.');
}
main();

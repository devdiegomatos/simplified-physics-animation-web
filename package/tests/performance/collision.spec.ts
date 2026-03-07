import { vec3 } from 'gl-matrix';
import { test } from 'vitest';
import seedrandom from 'seedrandom';

import Engine, {
    BroadPhaseMode,
    CollisionDetectionMode,
} from '../../src/Engine';
import * as utils from '../utils';

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

test('Collision detection – load experiment', () => {
    for (let i = 0; i < testCases.length; i++) {
        seedrandom('1000', { global: true });

        const testCase = testCases[i];

        for (let objects = 1000; objects < 10_000; objects += 5000) {
            const gridArea = testCase.worldBoundings ** 2;
            const gridSize = Math.sqrt(gridArea / (objects * 5));

            const engine = new Engine({
                worldBoundings: {
                    top: [0, 0],
                    right: [
                        testCase.worldBoundings,
                        testCase.worldBoundings,
                    ],
                },
                BroadPhase: testCase.broadPhaseMode,
                CollisionDetection: testCase.collisionDetection,
                gravity: vec3.fromValues(0, 98, 0),
                gridSize,
            });

            const bodies = utils.generateBodies(
                objects,
                testCase.worldBoundings,
                gridSize,
            );
            for (const body of bodies) {
                engine.addBody(body);
            }

            for (let i = 0; i < 60 * 3; i++) {
                engine.step(1 / 60);
            }

            const now = new Date();
            let filename = 'collision-test';
            if (testCase.broadPhaseMode === BroadPhaseMode.Naive) {
                filename += '-naive-mode';
            } else if (
                testCase.broadPhaseMode ===
                BroadPhaseMode.GridSpatialPartition
            ) {
                filename += '-grid-mode';
            }

            if (testCase.collisionDetection === CollisionDetectionMode.Sat) {
                filename += '-sat';
            } else if (
                testCase.collisionDetection ===
                CollisionDetectionMode.GjkEpa
            ) {
                filename += '-gjk-epa';
            }
            filename += `-${objects}-objects-${now.toISOString()}`;

            utils.exportCSV(engine.metrics, filename);
        }
    }
});

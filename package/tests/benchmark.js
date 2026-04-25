import { vec3 } from 'gl-matrix';
import seedrandom from 'seedrandom';

import {
    BroadPhaseMode,
    CollisionDetectionMode,
    Engine,
} from '../dist/index.js';
import * as utils from './utils.js';

const isDigitsOnly = (str) => /^\d+$/.test(str);

function parseArg(name, fallback) {
    const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
    if (!arg) {
        return fallback;
    }

    const param = arg.split('=')[1];
    if (!param) {
        return fallback;
    }

    if (isDigitsOnly(param)) {
        return parseInt(param);
    }
    
    return param
}

function benchmark(testCase, objects) {
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

    for (let i = 0; i < 180; i++) {
        engine.step(1 / 60);
    }

    return engine.metrics;
}

const broadphase = parseArg('broadphase');
const narrowphase = parseArg('narrowphase');
const objs = parseArg('objects');

const testCase = {
    worldBoundings: 1000,
    broadPhaseMode:
        broadphase === 'naive'
            ? BroadPhaseMode.Naive
            : BroadPhaseMode.GridSpatialPartition,
    collisionDetection:
        narrowphase === 'sat'
            ? CollisionDetectionMode.Sat
            : CollisionDetectionMode.GjkEpa,
};

seedrandom('10000', { global: true });
const metrics = benchmark(testCase, objs);

let keys = [];
Object.keys(metrics).forEach((key) => keys.push(key));

const rowsCount = metrics[keys[0]].length;
let rows = '';
for (let i = 0; i < rowsCount; i++) {
    let row = '';
    for (const key of keys) {
        const value = metrics[key][i];
        if (!value) {
            row += '0,';
            continue;
        }
        row += `${metrics[key][i]},`;
    }
    rows += row.slice(0, -1) + '\n';
}

const header = keys.join(',') + '\n';
process.stdout.write(header + rows);

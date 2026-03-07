import { existsSync, mkdirSync, writeFileSync } from 'fs';

import type Body from '../src/bodies/Body';
import PolygonBody from '../src/bodies/PolygonBody';
import RectangleBody from '../src/bodies/RectangleBody';
import TriangleBody from '../src/bodies/TriangleBody';
import type { Metrics } from '../src/Engine';

export function generateBodies(
    count: number,
    worldDimensions: number,
    size: number,
) {
    const bodies: Body[] = [];

    for (let i = 0; i < count; i++) {
        const x = Math.random() * worldDimensions;
        const y = Math.random() * worldDimensions;
        if (i == 0) console.log(x,y)

        const type = Math.random();
        const isStatic = Math.random() < 0.2 ? true : false;
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

        bodies.push(body);
    }

    return bodies;
}

export function exportCSV(metrics: Metrics, name: string) {
    const dir = 'tests/results';
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const header =
        'particles,constraints,collisions_test,true_collisions,broadphase_time,narrowphase_time\n';
    let rows = '';
    const rowsCount = metrics.particlesCount.length;
    for (let i = 0; i < rowsCount; i++) {
        rows += `${metrics.particlesCount[i]},${metrics.constraintsCount[i]},${metrics.collisionsTest[i]},${metrics.trueCollisions[i]},${metrics.broadphaseTime[i]},${metrics.narrowphaseTime[i]}\n`;
    }

    writeFileSync(`${dir}/${name}.csv`, header + rows);
}

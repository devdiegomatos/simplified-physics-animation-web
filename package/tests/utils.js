import { existsSync, mkdirSync, write, writeFileSync } from 'fs';
import { vec2 } from 'gl-matrix';

import { PolygonBody, RectangleBody, TriangleBody } from '../dist/bodies.js';
import { PoissonDiscSampling } from '../dist/index.js';

export function generateBodies(count, worldDimensions, size) {
    const poissonSamp = new PoissonDiscSampling(
        size,
        vec2.fromValues(worldDimensions, worldDimensions),
    );
    const points = poissonSamp.GeneratePoints();

    const bodies = [];

    for (let i = 0; i < count; i++) {
        const point = points[i];
        const x = point[0];
        const y = point[1];

        const type = Math.random();
        const isStatic = Math.random() < 0.2 ? true : false;
        let body;
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

export function exportCSV(metrics, name) {
    const dir = 'tests/results';
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

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
    writeFileSync(`${dir}/${name}.csv`, header + rows);
}

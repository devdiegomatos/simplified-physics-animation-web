import type { vec3 } from 'gl-matrix';

import type { Body } from '@/bodies';

import type AABB from './AABB';

export default class SpatialHashGrid {
    public cells: [number, Body][] = [];

    constructor(protected ncol: number, protected cellSize: number) {}

    insert(body: Body) {
        const aabb = body.getAABB();
        for (const position of this.cellsForAABB(aabb)) {
            const key = this.getCellKey(position);
            this.cells.push([key, body]);
        }
    }

    // A simple hash function to get the cell ID
    getCellKey(cellPosition: vec3): number {
        return cellPosition[0] + cellPosition[1] * this.ncol;
    }

    clear() {
        this.cells.length = 0;
    }

    protected *cellsForAABB(aabb: AABB) {
        const gx0 = Math.floor(aabb.min[0] / this.cellSize);
        const gy0 = Math.floor(aabb.min[1] / this.cellSize);
        const gx1 = Math.floor(aabb.max[0] / this.cellSize);
        const gy1 = Math.floor(aabb.max[1] / this.cellSize);

        for (let gy = gy0; gy <= gy1; gy++) {
            for (let gx = gx0; gx <= gx1; gx++) {
                yield [gx, gy];
            }
        }
    }
}

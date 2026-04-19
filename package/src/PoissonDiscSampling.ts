import { vec2 } from 'gl-matrix';

function getRandomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export default class PoissonDiscSampling {
    public cellSize: number;
    protected grid: number[];
    protected rows: number;
    protected cols: number;

    public constructor(
        protected radius: number,
        protected sampleRegionSize: vec2,
        protected numSamplesBeforeRejection: number = 30,
    ) {
        this.cellSize = radius / Math.sqrt(2);
        this.cols = Math.floor(sampleRegionSize[0] / this.cellSize);
        this.rows = Math.floor(sampleRegionSize[1] / this.cellSize);

        this.grid = [];
        for (let i = 0; i < this.rows * this.cols; i++) {
            this.grid.push(-1);
        }
    }

    GeneratePoints(): vec2[] {
        const points: vec2[] = [];
        const active: vec2[] = [];

        const startPos = vec2.scale(vec2.create(), this.sampleRegionSize, 0.5);
        const startCell = vec2.fromValues(
            Math.floor(startPos[0] / this.cellSize),
            Math.floor(startPos[1] / this.cellSize),
        );

        active.push(startPos);
        points.push(startPos);
        this.grid[startCell[0] + startCell[1] * this.cols] = 0;

        while (active.length > 0) {
            const spawnIndex = Math.floor(Math.random() * active.length);
            const spawnCenter = active[spawnIndex];
            let accepted = false;

            for (let i = 0; i < this.numSamplesBeforeRejection; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dir = vec2.fromValues(Math.cos(angle), Math.sin(angle));
                const mag = getRandomInRange(this.radius, this.radius * 2);
                vec2.scale(dir, dir, mag);
                const candidate = vec2.add(vec2.create(), spawnCenter, dir);

                if (this.IsValid(candidate, points)) {
                    points.push(candidate);
                    active.push(candidate);
                    const cellCoords = [
                        Math.floor(candidate[0] / this.cellSize),
                        Math.floor(candidate[1] / this.cellSize),
                    ];
                    this.grid[cellCoords[0] + cellCoords[1] * this.cols] =
                        points.length - 1;
                    accepted = true;
                    break;
                }
            }

            if (accepted === false) {
                active.splice(spawnIndex, 1);
            }
        }

        return points;
    }

    protected IsValid(candidate: vec2, points: vec2[]): boolean {
        const cellX = Math.floor(candidate[0] / this.cellSize);
        const cellY = Math.floor(candidate[1] / this.cellSize);

        // fora da região → rejeita
        if (
            cellX < 0 ||
            cellX >= this.cols ||
            cellY < 0 ||
            cellY >= this.rows
        ) {
            return false;
        }

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nx = cellX + i;
                const ny = cellY + j;

                if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                    const index = nx + ny * this.cols;
                    const neighboorIdx = this.grid[index];

                    if (neighboorIdx !== -1) {
                        const neighboor = points[neighboorIdx];
                        const dist = vec2.sqrDist(candidate, neighboor);

                        if (dist < this.radius ** 2) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }
}

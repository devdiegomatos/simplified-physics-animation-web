import { type Body } from '@devdiegomatos/liso-engine/bodies';
import { Engine } from '@devdiegomatos/liso-engine';
import type IScene from './IScene';
import type p5 from 'p5';
import type { SimulationState } from '@devdiegomatos/liso-engine/worker';

export default class SceneThreaded implements IScene {
    public simulation_state: SimulationState = {
        objects: [],
    };
    constructor() {}

    step(dt: number) {}

    render(p: p5) {
        // Batch draw all constraints as lines
        p.strokeWeight(1);
        p.beginShape(p.LINES);
        for (const obj of this.simulation_state.objects) {
            if (obj.isStatic) {
                p.stroke(255, 0, 0);
            } else {
                p.stroke(0, 0, 0);
            }
            for (const ci of obj.constraintsIndices) {
                const x0 = obj.particles[ci * 2];
                const y0 = obj.particles[ci * 2 + 1];
                p.vertex(x0, y0);
            }
        }
        p.endShape();

        // Batch draw all constraints of static particles in red
        p.stroke(255, 0, 0);
        p.strokeWeight(1);
        p.beginShape(p.LINES);
        for (const obj of this.simulation_state.objects) {
            if (obj.isStatic === false) {
                continue;
            }
            for (const ci of obj.constraintsIndices) {
                const x0 = obj.particles[ci * 2];
                const y0 = obj.particles[ci * 2 + 1];
                p.vertex(x0, y0);
            }
        }
        p.endShape();
    }

    add(body: Body) {
        // this.engine?.addBody(body);
        // this.entities.push(body);
    }

    getParticlesCount(): number {
        return 0
        // return this.simulation_state.particlesCount;
    }

    getCollisionsCount(): number {
        return 0
        // return this.simulation_state.collisionsTests;
    }

    getConstraintsCount(): number {
        return 0
        // return this.simulation_state.constraintsCount;
    }

    togglePause(): void {
        // TODO
    }
}

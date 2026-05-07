import { type Body } from '@devdiegomatos/liso-engine/bodies';
import { Engine } from '@devdiegomatos/liso-engine';
import type IScene from './IScene';
import type p5 from 'p5';
import type { SimulationState } from '@devdiegomatos/liso-engine/worker';

export default class SceneThreaded implements IScene {
    public simulation_state: SimulationState = {
        objects: [],
        collidersInfo: [],
        particlesCount: 0,
        constraintsCount: 0,
        collisionsTests: 0,
    };
    constructor() {}

    step(dt: number) {}

    render(p: p5) {
        // Batch draw all constraints as lines
        p.stroke(0, 0, 0);
        p.strokeWeight(1);
        p.beginShape(p.LINES);
        for (const obj of this.simulation_state.objects) {
            if (obj.isStatic) {
                continue;
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

        // Batch draw all convex hull in blue
        p.stroke(150, 200, 255);
        p.strokeWeight(1);
        p.beginShape(p.LINES);
        for (const colliderInfo of this.simulation_state.collidersInfo) {
            // convex hull layout: x0, y0, x1, y1, x2, y2, ...
            const totalParticles = colliderInfo.convexHull.length / 2;
            for (let i = 0; i < totalParticles; i++) {
                const x0 = colliderInfo.convexHull[i * 2];
                const y0 = colliderInfo.convexHull[i * 2 + 1];
                p.vertex(x0, y0);

                const j = (i + 1) * 2; // next particle indice
                const x1 = colliderInfo.convexHull[j % colliderInfo.convexHull.length];
                const y1 = colliderInfo.convexHull[(j + 1) % colliderInfo.convexHull.length];
                p.vertex(x1, y1);
            }
        }
        p.endShape();

        // Batch draw all contact points in red
        p.stroke(255, 0, 0);
        p.strokeWeight(2);
        p.beginShape(p.POINTS);
        for (const colliderInfo of this.simulation_state.collidersInfo) {
            // Draw the contact points
            for (let i = 0; i < colliderInfo.contactPoints.length; i += 2) {
                const x0 = colliderInfo.contactPoints[i];
                const y0 = colliderInfo.contactPoints[i + 1];
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
        return this.simulation_state.particlesCount;
    }

    getCollisionsCount(): number {
        return this.simulation_state.collisionsTests;
    }

    getConstraintsCount(): number {
        return this.simulation_state.constraintsCount;
    }

    togglePause(): void {
        // TODO
    }
}

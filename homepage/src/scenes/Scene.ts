import { type Body } from '@devdiegomatos/liso-engine/bodies';
import { Engine } from '@devdiegomatos/liso-engine';
import p5 from 'p5';
import type IScene from './IScene';

export default class Scene implements IScene {
    protected entities: Body[] = [];

    constructor(protected engine: Engine) {}

    step(dt: number) {
        this.engine.step(dt);
    }

    render(p: p5) {
        p.stroke(0, 0, 0);
        p.strokeWeight(1);
        p.beginShape(p.LINES);
        for (const entity of this.entities) {
            if (entity.isStatic) {
                continue
            } 
            for (const constraint of entity.constraints) {
                p.vertex(constraint.p0.position[0], constraint.p0.position[1]);
                p.vertex(constraint.p1.position[0], constraint.p1.position[1]);
            }
        }
        p.endShape();

        p.stroke(255, 0, 0);
        p.strokeWeight(1);
        p.beginShape(p.LINES);
        for (const entity of this.entities) {
            if (entity.isStatic === false) {
                continue
            } 
            for (const constraint of entity.constraints) {
                p.vertex(constraint.p0.position[0], constraint.p0.position[1]);
                p.vertex(constraint.p1.position[0], constraint.p1.position[1]);
            }
        }
        p.endShape();
    }

    add(body: Body) {
        this.engine?.addBody(body);
        this.entities.push(body);
    }

    getParticlesCount(): number {
        return this.engine.metrics.particlesCount[this.engine.metrics.particlesCount.length - 1];
    }

    getCollisionsCount(): number {
        return this.engine.metrics.collisionsTest[this.engine.metrics.collisionsTest.length - 1];
    }

    getConstraintsCount(): number {
        return this.engine.metrics.constraintsCount[this.engine.metrics.constraintsCount.length - 1];
    }

    togglePause() {
        this.engine.isPaused = !this.engine.isPaused;
    }
}

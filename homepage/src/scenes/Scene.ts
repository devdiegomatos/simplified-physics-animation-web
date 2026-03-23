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
        // Batch draw all constraints as lines
        p.stroke(0, 0, 0);
        p.strokeWeight(1);
        p.beginShape(p.LINES);
        for (const entity of this.entities) {
            for (const constraint of entity.constraints) {
                p.vertex(constraint.p0.position[0], constraint.p0.position[1]);
                p.vertex(constraint.p1.position[0], constraint.p1.position[1]);
            }
        }
        p.endShape();

        // Batch draw all convex hull in blue
        // p.stroke(150, 200, 255);
        // p.strokeWeight(1);
        // p.beginShape(p.LINES);
        // for (const colliderInfo of this.engine.collidersInfo) {
        //     const body = colliderInfo.body;
        //     const convexHull = body.convexHull();

        //     for (let i = 0; i < convexHull.particles.length; i++) {
        //         const v1 = convexHull.particles[i];
        //         const v2 = convexHull.particles[(i + 1) % convexHull.particles.length];
        //         p.vertex(v1.position[0], v1.position[1]);
        //         p.vertex(v2.position[0], v2.position[1]);
        //     }
        // }
        // p.endShape();

        // Batch draw all contact points in red
        // p.stroke(255, 0, 0);
        // p.strokeWeight(2);
        // p.beginShape(p.POINTS);
        // for (const colliderInfo of this.engine.collidersInfo) {
        //     // Draw the contact points and normal direction
        //     for (const particle of colliderInfo.contactPoints) {
        //         p.vertex(particle.position[0], particle.position[1]);
        //     }
        // }
        // p.endShape();

        // Batch draw all separation normals in red
        // p.stroke(255, 0, 0);
        // p.strokeWeight(1);
        // p.beginShape(p.LINES);
        // for (const colliderInfo of this.engine.collidersInfo) {
        //     for (const particle of colliderInfo.contactPoints) {
        //         const delta = vec3.scale(vec3.create(), colliderInfo.normal, 5);
        //         const p2 = vec3.add(vec3.create(), particle.position, delta);
        //         p.vertex(particle.position[0], particle.position[1]);
        //         p.vertex(p2[0], p2[1]);
        //     }
        // }
        // p.endShape();
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
}

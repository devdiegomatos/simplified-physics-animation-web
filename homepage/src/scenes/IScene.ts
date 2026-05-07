import { type Body } from '@devdiegomatos/liso-engine/bodies';
import p5 from 'p5';

export default interface IScene {
    step(dt: number): void;
    render(p: p5): void;
    add(body: Body): void;
    getParticlesCount(): number;
    getCollisionsCount(): number;
    getConstraintsCount(): number;
    togglePause(): void;
}

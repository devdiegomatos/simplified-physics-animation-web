import { vec3 } from 'gl-matrix';

import {
    type Body,
    PolygonBody,
    RectangleBody,
    TrellisBody,
    TriangleBody,
} from '../bodies';
import Engine from '../Engine';
import {
    type MainToWorkerMessage,
    type ObjectBuilderArgs,
    ObjectType,
    type PhysicsCollidersInfo,
    type PhysicsObjectState,
    type SimulationState,
} from './types';

let engine: Engine;
let lastTime: number = 0,
    simulationInterval: number | null = null;
const FIXED_DT = 1 / 60,
    MS_PER_STEP = FIXED_DT * 1000; // Executar a simulação 60 vezes por segundo
let isRunning: boolean = false;

function step() {
    if (isRunning === false) {
        return;
    }

    let elapsed = performance.now() - lastTime;

    // 1. Avance o mundo da física
    while (elapsed >= MS_PER_STEP) {
        engine.step(FIXED_DT);

        elapsed -= MS_PER_STEP;
        lastTime += MS_PER_STEP;
    }

    // 2.1 Extraia os dados de posição dos corpos
    const objectsState: PhysicsObjectState[] = [];
    for (const body of engine.bodies) {
        const particles = [];
        for (const p of body.particles) {
            particles.push(p.position[0], p.position[1]);
        }

        objectsState.push({
            particles,
            constraintsIndices: body.constraintsIndices,
            isStatic: body.particles[0].isStatic,
        });
    }

    // 2.2 Extraia os dados de colisão da simulação
    const collidersInfo: PhysicsCollidersInfo[] = [];
    // for (const colliderInfo of engine.collidersInfo) {
    //     const convexHull = colliderInfo.body.convexHull();
    //     const hull = [];
    //     for (const p_hull of convexHull.particles) {
    //         hull.push(p_hull.position[0], p_hull.position[1]);
    //     }

    //     const contactPoints = [];
    //     for (const p of colliderInfo.contactPoints) {
    //         contactPoints.push(p.position[0], p.position[1]);
    //     }

    //     collidersInfo.push({
    //         convexHull: hull,
    //         contactPoints,
    //     });
    // }

    // 3. Empacote o estado
    const state: SimulationState = {
        objects: objectsState,
        collidersInfo,
        particlesCount:
            engine.metrics.particlesCount[
                engine.metrics.particlesCount.length - 1
            ],
        constraintsCount:
            engine.metrics.constraintsCount[
                engine.metrics.particlesCount.length - 1
            ],
        collisionsTests:
            engine.metrics.collisionsTest[
                engine.metrics.collisionsTest.length - 1
            ],
    };

    // 4. Envie o estado para a Main Thread
    self.postMessage({ type: 'simulation_state', state });

    // schedule next iteration with minimal delay
    self.setTimeout(step, 0);
}

self.addEventListener('message', (e: MessageEvent<MainToWorkerMessage>) => {
    const msg = e.data;

    if (msg.type === 'start') {
        console.log('[Worker] Iniciando simulação...');

        engine = new Engine(msg.config);
        if (msg.objects) {
            for (const obj of msg.objects) {
                engine.addBody(MakeBody(obj));
            }
        }

        if (simulationInterval) {
            clearInterval(simulationInterval);
        }

        isRunning = true;
        lastTime = performance.now();
        simulationInterval = self.setTimeout(step, 0);
    } else if (msg.type === 'add_object') {
        console.log('[Worker] Add object');
        engine.addBody(MakeBody(msg.obj));
    }
});

function MakeBody(obj: ObjectBuilderArgs): Body {
    let result: Body;

    switch (obj.type) {
        case ObjectType.Triangle:
            result = new TriangleBody(
                obj.x,
                obj.y,
                obj.size || 40,
                obj.isStatic,
            );
            break;
        case ObjectType.Rectangle:
            result = new RectangleBody(
                obj.x,
                obj.y,
                obj.width || 40,
                obj.height || 40,
                obj.isStatic,
            );
            break;
        case ObjectType.Polygon:
            result = PolygonBody.PolygonBuilder(
                obj.x,
                obj.y,
                obj.size || 40,
                obj.k || 5,
                obj.isStatic || false,
            );
            break;
        case ObjectType.Trellis:
            result = new TrellisBody(
                vec3.fromValues(obj.x, obj.y, 0),
                vec3.fromValues(obj.width || 40, obj.height || 40, 0),
                obj.nx || 4,
                obj.ny || 4,
                obj.reinforce || false,
            );
            break;
        default:
            throw 'Unsuported body type';
            break;
    }

    return result;
}

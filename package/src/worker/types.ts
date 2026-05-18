import type { Config } from '../Engine';

export enum ObjectType {
    Triangle,
    Rectangle,
    Polygon,
    Trellis,
}

// Representa o estado de um único objeto na simulação
export interface ObjectBuilderArgs {
    type: ObjectType;
    x: number;
    y: number;
    isStatic?: boolean;
    size?: number;
    width?: number;
    height?: number;
    k?: number;
    nx?: number;
    ny?: number;
    reinforce?: boolean;
}

export interface PhysicsObjectState {
    particles: number[]; // x1, y1
    constraintsIndices: number[]; // particles indices
    isStatic: boolean;
}

export interface PhysicsCollidersInfo {
    convexHull: number[];
    contactPoints: number[];
}

// Representa o estado completo da simulação a ser enviado para a Main Thread
export interface SimulationState {
    objects: PhysicsObjectState[];
}

// Mensagens que a Main Thread pode enviar para o Worker
export type MainToWorkerMessage =
    | { type: 'start'; config: Config; objects?: ObjectBuilderArgs[] } // `any` para simplificar, idealmente um tipo definido
    | { type: 'add_object'; obj: ObjectBuilderArgs };

// Mensagens que o Worker pode enviar para a Main Thread
export type WorkerToMainMessage =
    | { type: 'simulation_state'; state: SimulationState }
    | { type: 'ready' };

import planck from 'planck';
import seedrandom from 'seedrandom';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const Vec2 = planck.Vec2;

// ======================
// CONFIGURAÇÃO
// ======================
const CONFIG = {
    simulationSteps: 180,
    timeStep: 1 / 60,
    velocityIterations: 8,
    positionIterations: 3,
    worldSize: 1_000,
    maxPolygonVertices: 6,
};

// ======================
// FUNÇÕES AUXILIARES
// ======================

// Gera polígono convexo aleatório
function createRandomConvexPolygon(radius = 1, vertices = 4) {
    const pts = [];

    for (let i = 0; i < vertices; i++) {
        const angle = (i / vertices) * Math.PI * 2;
        // const r = radius * (0.5 + Math.random() * 0.5);

        pts.push(Vec2(radius * Math.cos(angle), radius * Math.sin(angle)));
    }

    return pts;
}

// Cria parede (caixa)
function createBoundary(world) {
    const size = CONFIG.worldSize;

    const ground = world.createBody();

    ground.createFixture(planck.Edge(Vec2(-size, -size), Vec2(size, -size)));
    ground.createFixture(planck.Edge(Vec2(size, -size), Vec2(size, size)));
    ground.createFixture(planck.Edge(Vec2(size, size), Vec2(-size, size)));
    ground.createFixture(planck.Edge(Vec2(-size, size), Vec2(-size, -size)));
}

// Cria obstáculos estáticos
function createObstacles(world, size) {
    const body = world.createBody({
        position: Vec2((Math.random() - 0.5) * CONFIG.worldSize, Math.random() * CONFIG.worldSize),
    });

    body.createFixture(planck.Box(size, size));
}

// Cria corpos dinâmicos convexos
function createDynamicBodies(world, size = 1) {
    const body = world.createBody({
        type: 'dynamic',
        position: Vec2(
            (Math.random() - 0.5) * CONFIG.worldSize,
            Math.random() * CONFIG.worldSize,
        ),
        linearDamping: 0.1,
        angularDamping: 0.1,
    });

    const vertices = Math.floor(
        3 + Math.random() * (CONFIG.maxPolygonVertices - 2),
    );

    const shape = planck.Polygon(createRandomConvexPolygon(size, vertices));

    body.createFixture(shape, {
        density: 1.0,
        friction: 0.3,
        restitution: 0.2,
    });
}

function exportCSV(metrics, name) {
    const dir = 'tests/results/box2d';

    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    const header = 'collisions,dt\n';
    let rows = '';
    for (let i = 0; i < metrics.rowsCount; i++) {
        rows += `${metrics.collisionTests[i]},${metrics.dt[i]}\n`;
    }

    writeFileSync(`${dir}/${name}.csv`, header + rows);
}

// ======================
// BENCHMARK
// ======================
function benchmark(objects) {
    console.log(`[benchmark] ${objects} objetos`);

    seedrandom('10000', { global: true });
    const start = performance.now();

    // ======================
    // SIMULAÇÃO
    // ======================
    const world = new planck.World({
        gravity: Vec2(0, -10),
    });
    
    createBoundary(world);

    const gridArea = CONFIG.worldSize ** 2;
    const size = Math.sqrt(gridArea / (objects * 5));
    for (let i = 0; i < objects; i++) {
        if (Math.random() < 0.1) {
            createObstacles(world, size);
        } else {
            createDynamicBodies(world, size);
        }
    }

    const metrics = {
        collisionTests: [],
        dt: [],
        rowsCount: CONFIG.simulationSteps
    };
    for (let step = 0; step < CONFIG.simulationSteps; step++) {
        const dtStart = performance.now();
        world.step(
            CONFIG.timeStep,
            CONFIG.velocityIterations,
            CONFIG.positionIterations,
        );
        const dt = performance.now() - dtStart;
        metrics.dt.push(dt);

        // Contar contatos ativos
        let collisionTests = 0;
        for (let c = world.getContactList(); c; c = c.getNext()) {
            if (c.isTouching()) collisionTests++;
        }
        metrics.collisionTests.push(collisionTests);
    }

    const end = performance.now();
    const total = end - start;

    exportCSV(metrics, `box2d-${objects}-objects-${new Date().toISOString()}`);

    console.log(`- tempo total: ${total.toFixed(3)} ms`);
}

function main() {
    console.log('Iniciando benchmark\n');

    for (let objects = 100; objects <= 2000; objects += 10) {
        benchmark(objects);
    }

    console.log('Todos os testes finalizaram com sucesso.');
}
main();

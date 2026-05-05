import type { PolygonBody } from '@/bodies';
import { vec3 } from 'gl-matrix';
import type Particle from './Particle';

export default class ContactManifold {
    constructor(
        public polygonA: PolygonBody,
        public polygonB: PolygonBody,
        public normal: vec3,
        public depth: number,
    ) {}

    // =========================
    // API principal
    // =========================
    public getContactPoints() {
        // 1. Encontrar vértices extremos
        const vAIdx = this.getSupportVertex(
            this.polygonA.particles,
            this.normal,
        );
        const vBIdx = this.getSupportVertex(
            this.polygonB.particles,
            vec3.negate(vec3.create(), this.normal),
        );

        // 2. Obter arestas adjacentes
        const edgeA = this.getBestEdge(
            this.polygonA.particles,
            vAIdx,
            this.normal,
        );
        const edgeB = this.getBestEdge(
            this.polygonB.particles,
            vBIdx,
            vec3.negate(vec3.create(), this.normal),
        );

        // 3. Classificar referência/incidente
        const refData = this.selectReferenceEdge(edgeA, edgeB, this.normal);

        // 4. Selecionar vértices candidatos via suporte
        const contacts = this.computeContactVertices(
            refData.reference,
            refData.incident,
            this.normal,
        );

        return {
            points: contacts,
            isFlipped: refData.isFlipped,
        };
    }

    // =========================
    // Suporte
    // =========================
    protected getSupportVertex(polygon: Particle[], dir: vec3) {
        let best = 0;
        let bestDot = vec3.dot(polygon[best].position, dir);

        for (let i = 1; i < polygon.length; i++) {
            const d = vec3.dot(polygon[i].position, dir);
            if (d > bestDot) {
                bestDot = d;
                best = i;
            }
        }
        return best;
    }

    // =========================
    // Seleção de aresta
    // =========================
    protected getBestEdge(polygon: Particle[], index: number, normal: vec3) {
        const vertex = polygon[index];

        const prev = polygon[(index - 1 + polygon.length) % polygon.length];
        const next = polygon[(index + 1) % polygon.length];

        const edge1 = vec3.normalize(
            vec3.create(),
            vec3.subtract(vec3.create(), vertex.position, prev.position),
        );
        const edge2 = vec3.normalize(
            vec3.create(),
            vec3.subtract(vec3.create(), next.position, vertex.position),
        );

        const dot1 = Math.abs(vec3.dot(edge1, normal));
        const dot2 = Math.abs(vec3.dot(edge2, normal));

        // maior ângulo com a normal => menor dot
        if (dot1 < dot2) {
            return { v1: prev, v2: vertex };
        } else {
            return { v1: vertex, v2: next };
        }
    }

    // =========================
    // Referência vs incidente
    // =========================
    protected selectReferenceEdge(
        edgeA: { v1: Particle; v2: Particle },
        edgeB: { v1: Particle; v2: Particle },
        normal: vec3,
    ) {
        const dirA = vec3.normalize(
            vec3.create(),
            vec3.subtract(vec3.create(), edgeA.v2.position, edgeA.v1.position),
        );
        const dirB = vec3.normalize(
            vec3.create(),
            vec3.subtract(vec3.create(), edgeB.v2.position, edgeB.v1.position),
        );

        const dotA = Math.abs(vec3.dot(dirA, normal));
        const dotB = Math.abs(vec3.dot(dirB, normal));

        // maior ângulo com a normal => referência
        if (dotA < dotB) {
            return {
                incident: edgeB,
                reference: edgeA,
                isFlipped: true,
            };
        } else {
            return {
                incident: edgeA,
                reference: edgeB,
                isFlipped: false,
            };
        }
    }

    // =========================
    // Cálculo dos pontos de contato
    // =========================
    protected computeContactVertices(
        refEdge: { v1: Particle; v2: Particle },
        incEdge: { v1: Particle; v2: Particle },
        normal: vec3,
    ) {
        const contacts = [];

        const result = [];
        let maxDot = -Infinity;
        for (let p of [incEdge.v1, incEdge.v2]) {
            const d = vec3.dot(p.position, normal);
            if (d > maxDot) maxDot = d;
        }

        for (let p of [incEdge.v1, incEdge.v2]) {
            const d = vec3.dot(p.position, normal);
            if (Math.abs(d - maxDot) < 1e-6) result.push(p);
        }

        contacts.push([refEdge.v1, refEdge.v2]);
        contacts.push(result);
        return contacts;
    }
}

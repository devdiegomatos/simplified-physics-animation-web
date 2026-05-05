import { vec3 } from 'gl-matrix';

export default class CollisionSolver {
    // ==========================================
    // Resolução vértice–aresta (caso geral)
    // ==========================================
    static resolveVertexEdge(
        p: vec3, // vértice de A
        r: vec3, s: vec3, // aresta de B
        n: vec3, // normal unitária (A -> B)
        d: number, // profundidade
        mA = 1,
        mB = 1,
    ) {
        // =============================
        // Correção global
        // =============================
        const c = vec3.scale(vec3.create(), n, d);

        const wA = mA === Infinity ? 0 : 1 / mA;
        const wB = mB === Infinity ? 0 : 1 / mB;
        const wSum = wA + wB || 1;

        const cA = vec3.scale(vec3.create(), c, -wB / wSum);
        const cB = vec3.scale(vec3.create(), c, wA / wSum);

        // =============================
        // Projeção para obter w e t
        // =============================
        const t = this.projectPointOnSegment(p, r, s);

        return {
            cA,
            cB,
            t,
        };

        // // =============================
        // // Atualização do vértice p
        // // =============================
        // const pNew = vec3.add(vec3.create(), p, cA);

        // // =============================
        // // Distribuição na aresta (baricentrica)
        // // vértice mais próximo de w move mais
        // // =============================
        // const rNew = vec3.add(
        //     vec3.create(),
        //     r,
        //     vec3.scale(vec3.create(), cB, 1 - t),
        // );
        // const sNew = vec3.add(
        //     vec3.create(),
        //     s,
        //     vec3.scale(vec3.create(), cB, t),
        // );

        // // =============================
        // // Novo ponto de contato (consistência)
        // // =============================
        // const wNew = vec3.add(vec3.create(), w, cB);

        // return {
        //     p: pNew,
        //     r: rNew,
        //     s: sNew,
        //     contact: wNew,
        //     t,
        // };
    }

    // ==================================================
    // Caso aresta–aresta (modelado via ponto de penetração)
    // ==================================================
    // static resolveEdgeEdge({
    //     p,       // vértice representativo de A (ou feature reduzida)
    //     r, s,    // aresta de B
    //     n,
    //     d,
    //     mA,
    //     mB
    // }) {
    //     // Mesma lógica do vértice–aresta
    //     // (como definido no modelo teórico)

    //     return this.resolveVertexEdge({ p, r, s, n, d, mA, mB });
    // }

    // ==========================================
    // Projeção de ponto em segmento (cálculo de w)
    // ==========================================
    static projectPointOnSegment(p: vec3, r: vec3, s: vec3) {
        const rs = vec3.sub(vec3.create(), s, r);
        const pr = vec3.sub(vec3.create(), p, r);

        const lenSq = vec3.sqrLen(rs);
        let t = vec3.dot(pr, rs) / lenSq;
        t = this.clamp(t, 0, 1);
        if (t < 0 || t > 1) {
            console.log(t)
        }
        
        return t
    }

    static clamp(value: number, min: number, max: number) {
        return Math.max(min, Math.min(max, value));
    }
}

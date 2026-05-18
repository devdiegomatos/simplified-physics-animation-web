<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <!-- Hero Section -->
    <section>
        <div class="container mx-auto px-6 max-w-5xl">
            <div class="max-w-3xl">
                <p
                    class="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-4"
                >
                    Trabalho de Conclusão de Curso
                </p>

                <h1
                    class="text-5xl font-extrabold text-gray-900 leading-tight mb-6"
                >
                    Animação Física Simplificada na Web
                </h1>

                <p class="text-xl text-gray-600 leading-relaxed mb-6">
                    Um sistema de animação física em tempo real para aplicações
                    Web, baseado no método de Jakobsen (2001), com foco em
                    estabilidade, desempenho e visualização interativa
                    diretamente no navegador.
                </p>

                <p class="text-gray-600 leading-relaxed mb-10">
                    O projeto demonstra como técnicas leves de simulação podem
                    produzir movimentos coerentes e visualmente naturais mesmo
                    em ambientes com recursos limitados, tornando-se adequado
                    para fins didáticos, acadêmicos e experimentais.
                </p>

                <!-- CTA Buttons -->
                <div class="flex flex-wrap gap-4">
                    <a
                        href="https://github.com/devdiegomatos/simplified-physics-animation-web"
                        target="_blank"
                        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-black transition shadow-lg hover:shadow-xl"
                    >
                        <span>Ver código no GitHub</span>
                    </a>

                    <a
                        href="https://github.com/devdiegomatos/simplified-physics-animation-web/blob/main/final-paper/main.pdf"
                        target="_blank"
                        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                    >
                        <span>Leia o texto completo</span>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Demos -->
    <section id="demos" class="py-24">
        <div class="container mx-auto px-6 max-w-6xl">
            <div class="mb-12">
                <h2 class="text-3xl font-bold text-gray-900 mb-3">
                    Experimentos Interativos
                </h2>

                <p class="text-gray-600">
                    Explore algumas das simulações desenvolvidas durante o
                    trabalho.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Polygon Chaos -->
                <RouterLink
                    to="/demos/polygon-chaos"
                    class="group p-8 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-2xl transition"
                >

                    <h3
                        class="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition"
                    >
                        Caos de Polígonos
                    </h3>

                    <p class="text-gray-600 mb-4">
                        Simulação de colisões, restrições e estabilidade entre
                        múltiplos corpos rígidos convexos.
                    </p>

                    <span
                        class="text-blue-600 font-medium group-hover:underline"
                    >
                        Executar experimento →
                    </span>
                </RouterLink>

                <!-- Cloth -->
                <RouterLink
                    to="/demos/cloth-trelis"
                    class="group p-8 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-2xl transition"
                >

                    <h3
                        class="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition"
                    >
                        Tecidos e Treliças
                    </h3>

                    <p class="text-gray-600 mb-4">
                        Demonstração de sistemas baseados em partículas e
                        restrições aplicados à simulação de tecidos deformáveis.
                    </p>

                    <span
                        class="text-blue-600 font-medium group-hover:underline"
                    >
                        Executar experimento →
                    </span>
                </RouterLink>
            </div>
        </div>
    </section>
</template>
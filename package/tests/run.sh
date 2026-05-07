#!/bin/bash

for bp in naive grid
do
    for np in sat gjk
    do
        for i in {100..1000..100}
        do
            echo "[benchmark] $bp mode + $np collision detection - $i objects"

            OUTPUT="results/mylib/$bp-$np-$i-objects.csv"
            node benchmark.js  --broadphase=$bp --narrowphase=$np --objects=$i >> $OUTPUT

            echo "Finished"
        done
    done
done

for i in {100..1000..100}
do
    echo "[benchmark] box2d - $i objects"

    OUTPUT="results/box2d/box2d-$i-objects.csv"
    node benchmark_box2d.js --objects=$i >> $OUTPUT

    echo "Finished"
done

echo "Benchmark finalizado"

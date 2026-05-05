#!/bin/bash

for bp in naive grid
do
    for np in sat gjk
    do
        for i in {100..1000..100}
        do
            echo "[benchmark] $bp mode + $np collision detection - $i objects"

            OUTPUT="results/$bp-$np-$i-objects.csv"
            node benchmark.js  --broadphase=$bp --narrowphase=$np --objects=$i >> $OUTPUT

            echo "Finished"
        done
    done
done

echo "Benchmark finalizado"
#!/bin/sh
for dir in ./*
do
  if [ -d "$dir" ]
  then
  echo "Running gnuplot in $dir"
  (cd $dir && gnuplot ../plot.p)
  fi
done

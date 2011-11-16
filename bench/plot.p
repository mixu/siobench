# output as png image
set terminal png

# save file to "out.png"
set output "out.png"

# graph title
set title "siobench"

# nicer aspect ratio for image size
set size 1,0.7

# y-axis grid
set grid y

# x-axis label
set xlabel "clients"

# y-axis label
set ylabel "CPU usage"

plot "out.dat" using 3:2 smooth sbezier with lines title "clients"


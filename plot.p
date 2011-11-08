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
set xlabel "request"

# y-axis label
set ylabel "total time (ms)"

# plot data from "out.dat" using column 6 with smooth sbezier lines
# and title of "nodejs" for the given data
# plot "out.dat" using 2 smooth sbezier with lines title "connect",
# plot "out.dat" using 3 smooth sbezier with lines title "wait", \
# "out.dat" using 4 smooth sbezier with lines title "work", \
# "out.dat" using 5 smooth sbezier with lines title "disconnect", \
# "out.dat" using 6 smooth sbezier with lines title "total"

plot "out.dat" using 6 smooth sbezier with lines title "total"


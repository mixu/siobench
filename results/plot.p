# output as png image to cpu.png
set terminal png
set output "cpu.png"

# graph title
set title "siobench CPU"

# aspect ratio for image size
set size 1,0.9

# y-axis grid
set grid y

# x-axis label
set xlabel "clients"

# y-axis label
set ylabel "CPU usage"

plot "out.dat" using 3:2 smooth sbezier with lines title "clients"


# output as png image
set terminal png
set output "cputime.png"

# graph title
set title "siobench CPU"

# aspect ratio for image size
set size 1,0.9

# y-axis grid
set grid y

# x-axis label
set xlabel "clients"

# y-axis label
set ylabel "CPU time (milliseconds)"

plot "out.dat" using 3:($5)/(1000) smooth sbezier with lines title "usertime", \
     "out.dat" using 3:($6)/(1000) smooth sbezier with lines title "systime", \
     "out.dat" using 3:($5+$6)/(1000) smooth sbezier with lines title "total"


# output as png image
set terminal png
set output "mem.png"

# graph title
set title "siobench mem"

# aspect ratio for image size
set size 1,0.9

# y-axis grid
set grid y

# x-axis label
set xlabel "clients"

# y-axis label
set ylabel "resident set size (Mb)"

plot "out.dat" using 3:($7)/(1024 * 1024) smooth sbezier with lines title "clients"


# output as png image
set terminal png
set output "heap.png"

# graph title
set title "siobench mem"

# aspect ratio for image size
set size 1,0.9

# y-axis grid
set grid y

# x-axis label
set xlabel "clients"

# y-axis label
set ylabel "heap (Mb)"

plot "out.dat" using 3:($10)/(1024 * 1024) smooth sbezier with lines title "heapUsed", \
     "out.dat" using 3:($9)/(1024 * 1024) smooth sbezier with lines title "heapTotal";



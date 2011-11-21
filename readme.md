
# A benchmarking suite for Node pubsub servers

The benchmark is rather simple. Clients connect one at a time, and a new client is only allowed to connect when the previous one is connected. When the server has used up 5000 milliseconds of CPU time, the benchmark is stopped. Every second, every connected client sends a single message which is echoed back by the server.

See a writeup with graphs at:

In more detail, the benchmark:

- Runs a single server and a number of client processes which generate load.
- Client processes are launched sequentially by the benchmark runner when the client process hits a particular level of CPU usage.
- The number of clients, memory usage and CPU statistics are logged on the server side on each client connect.
- The benchmark uses the native getrusage and gettimeofday functions via a Node native extension (which I forked from Dav Glass's node-getrusage) to get somewhat more accurate (microsecond) information about CPU usage and elapsed time.
- CPU usage is logged on the server process only (e.g. getrusage(RUSAGE_SELF)), not the clients. In addition to the code being benchmarked, the server process only runs a small piece of IPC code.
- The output is written to disk after the benchmark is over in a gnuplot-compatible format, which is where the graphs come from.


Running:

  node siobench.js [env]

Before running:

- Go to each folder in ./bench/*/ and run npm install to get the dependencies for that benchmark.
- Raise the hard file limit in either: /etc/limits.conf or /etc/security/limits.conf to around 32000
- Make sure you have sufficient CPU cores to generate load. For example, I was unable to generate enough load for the pure tcp server with 4 cores. When this happens, you system slows down and the number of connections no longer increases quickly.
- You might want to do a netstat -a | grep 'TIME_WAIT' | wc -l and wait a bit if the number is high before running the next benchmark. I seem to get unexplained connection failures otherwise.

Notes:

- Can't, for the life of me, get XHR polling to work on with Socket.io when running natively on Node. This is probably a bug in the xmlhttprequest module, since after five connections the whole thing stalls, and the versions used are 0.2.1 for socket.io 0.6.17 and 0.2.2 for socket.io 0.8.7. The only way to make it run is to spam client processes, and only do 3 connects per process. Ugly.

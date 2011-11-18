
Running:

  node siobench.js [env]

Before running:

- Go to each folder in ./bench/*/ and run npm install to get the dependencies for that benchmark.
- Raise the hard file limit in either: /etc/limits.conf or /etc/security/limits.conf to around 32000
- Make sure you have sufficient CPU cores to generate load. For example, I was unable to generate enough load for the pure tcp server with 4 cores. When this happens, you system slows down and the number of connections no longer increases quickly.
- You might want to do a netstat -a | grep 'TIME_WAIT' | wc -l and wait a bit if the number is high before running the next benchmark. I seem to get unexplained connection failures otherwise.

Notes:

- Can't, for the life of me, get XHR polling to work on with Socket.io when running natively on Node. This is probably a bug in the xmlhttprequest module, since after five connections the whole thing stalls, and the versions used are 0.2.1 for socket.io 0.6.17 and 0.2.2 for socket.io 0.8.7.

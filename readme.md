
Todo:

- Limit bench runtime by total CPU time, not by peak usage
- Recheck precision on getrusage

Running:

  node siobench.js [env]

Before running:

- Go to each folder in ./bench/*/ and run npm install to get the dependencies for that benchmark.
- Raise the hard file limit in either: /etc/limits.conf or /etc/security/limits.conf to around 32000
- Make sure you have sufficient CPU cores to generate load. For example, I was unable to generate enough load for the pure tcp server with 4 cores. When this happens, you system slows down and the number of connections no longer increases quickly.


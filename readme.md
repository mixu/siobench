
Notes:

- You need to raise the hard file limit in either: /etc/limits.conf or /etc/security/limits.conf Recommended limit is > 20,000.
- You need a lot of CPU cores to generate load. For example, I was unable to generate enough load for the pure tcp server with 4 cores. When this happens, you system slows down and the number of connections no longer increases quickly


    sudo renice -n -19 -p


Todo

  - Memory usage tracking (server side) vs concurrent clients


Structure

  - siobench.js is the runner
  - lib/cpu.js should provide CPU usage for all processes
  - lib/benchlog.js
  - bench/socket.io/0.6.17/server.js notifies benchlog on fixed events
  - bench/socket.io/0.6.17/client.js provides a client that can be instantiated and that emits events

Messages

  - From runner to client:
    - ramp: keep adding more clients
    - stop: stop
  - From client to runner:
    - clients: total number of clients started
    - saturated: CPU usage over 80%

Logging will be done by the server.

Todo

  - CPU usage tracking (server side) vs concurrent clients
  - Memory usage tracking (server side) vs concurrent clients


ps -p PID -o pid,%cpu,%mem,time,command
ps -C node -o pid,%cpu,%mem,time,command

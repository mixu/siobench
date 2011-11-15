
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
  - From runner to server:
    - exit: write the log and exit

Logging will be done by the server.


Actually:

  - Runner starts server and client
  - Client polls server load and own load
  - When the client reaches it's max load, it stops listening to the server and launches another client
  - Clients have a "stop permanently" mode that is triggered at 40% CPU
  - When the server reaches it's max load, it informs the current client to stop
  - The server "stop" is at 80% CPU



Todo

  - CPU usage tracking (server side) vs concurrent clients
  - Memory usage tracking (server side) vs concurrent clients


ps -p PID -o pid,%cpu,%mem,time,command
ps -C node -o pid,%cpu,%mem,time,command

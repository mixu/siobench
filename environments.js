module.exports = {
  '0.6.17': {
    server: './bench/sio0617/server.js',
    client: './bench/sio0617/client.js',
    out: './results/sio0617/'
  },
  '0.6.17_poll': {
    server: './bench/sio0617/server.js',
    client: './bench/sio0617/client_poll.js',
    out: './results/sio0617poll/'
  },
  '0.7.11': {
    server: './bench/sio0711/server.js',
    client: './bench/sio0711/client.js',
    out: './results/sio0711/'
  },
  '0.8.7': {
    server: './bench/sio087/server.js',
    client: './bench/sio087/client.js',
    out: './results/sio087/'
  },
  '0.8.7_poll': {
    server: './bench/sio087/server.js',
    client: './bench/sio087/client_poll.js',
    out: './results/sio087poll/'
  },
  'tcp': {
    server: './bench/tcp/server_tcp.js',
    client: './bench/tcp/client_tcp.js',
    out: './results/tcp/'
  }
};

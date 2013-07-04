process.on('uncaughtException', function(err) {
    console.log(err);
    process.exit(-1);
});

var noop = function () {},
    http = {
        request: noop,
        Agent: noop
    },
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits,
    number_of_iterations = 1000,
    num_nodes = 144;


// --------------------------------------------------------------------------------------------------
// -------------------------- Fake Endpoint ---------------------------------------------------------
// --------------------------------------------------------------------------------------------------
function FakeEndpoint(protocol, ip, port, options) {
    this.ip = ip;
    this.port = port;
    this.healthy = true;
    this.name = this.ip + ':' + this.port;
    this.keepAlive = true;
    this.agent = {
        sockets: {}
    };
    this.agent.sockets[this.name] = [];
    this.pending = 0;
}
inherits(FakeEndpoint, EventEmitter);
FakeEndpoint.prototype.ready = function() {
    return this.healthy &&
        (this.keepAlive ? (this.connected() > this.pending) : this.pending === 0);
};
FakeEndpoint.prototype.connected = function() {
    return this.agent.sockets[this.name] && this.agent.sockets[this.name].length;
};

// --------------------------------------------------------------------------------------------------
// -------------------------- Fake Request Set ------------------------------------------------------
// --------------------------------------------------------------------------------------------------
function FakeRequestSet() {}
FakeRequestSet.request = function () {
};

// --------------------------------------------------------------------------------------------------
// -------------------------- Utilities -------------------------------------------------------------
// --------------------------------------------------------------------------------------------------
function create_nodes(num) {
    var n = [];
    for (var i = 0; i < num; i++) {
        n.push('127.0.0.1:' + (8000 + i));
    }
    return n;
}

function print_node(node) {
    console.log(node.port + ' : ' + node.healthy);
}

function test_node(unlucky) {
    var chosen_node, i, found = 0;
    for (i = 0; i < number_of_iterations; i++) {
        chosen_node = p.get_node();
        if (chosen_node.port === unlucky.port) {
            found++;
        }
    }
    console.log('Found unlucky node %d times out of %d iterations', found, number_of_iterations);
}

// --------------------------------------------------------------------------------------------------
// ---------------------- Start Tests!!!!!!!!!!!!! --------------------------------------------------
// --------------------------------------------------------------------------------------------------

var Pool = require("../lib/pool")(inherits, EventEmitter, FakeEndpoint, FakeRequestSet);

p = new Pool(http, create_nodes(num_nodes));

// set a node to unhealthy to simulate bs100
var unlucky = p.nodes[num_nodes / 2];
console.log('unlucky node is: ' + unlucky.port);
unlucky.healthy = false; // set to unhealthy
unlucky.agent.sockets[unlucky.name].push({}); // add some available sockets
console.log('before....');
test_node(unlucky);
console.log('after....');
unlucky.healthy = true;
test_node(unlucky);


# topological

Topological is a framework for building stream processing topologies, inspired by decades old dataflow processing patterns and more modern platforms like Apache Storm. These platforms were built in a world where they had to also had to stand up a distributed cluster in addition to the data processing topology.

In contrast, Topological is built from the ground up to be cloud native, leveraging Kubernetes to deploy, scale, and isolate processing. Its simplicity and low overhead makes it equally applicable for small task queue processing as well as large scale data pipelines with dozens of stages.

Likewise, Topological strives for developer simplicity as well. For the most part, Developers only concern themselves with writing message processing logic.  The framework handles the rest including connections to common pieces of infrastructure like message brokers and queues that are typically used to interconnnect stages of a data pipeline.

Finally, Topological aims to make deploying and operating data pipelines easy as well. Topological's tooling automatically generates the Helm deployment templates to deploy and scale your topology into a Kubernetes cluster from a logical description of the topology. Topological also provides Prometheus counters and metrics endpoints out of the box, making it easy to monitor the operation of the pipeline in production.

## A Simple First Pipeline

Let's look at a simple example to see how Topological works. Let's say that we have a very simple data pipeline that processees a stream of numbers between 0 and 100 and keeps a running tally of the split between how many are greater and less than 50.

This sample is [available on GitHub](https://github.com/timfpark/topological-sample) and has no infrastructure dependencies - so that you can run it locally.

We first define a Connection, which typically is a connection to a message broker, queue, or other real data source, but to keep this simple, we'll use a connection that emits messages periodically based on a random number generator that looks like this:

```
class RandomNumberConnection extends Connection {
    stream(callback) {
        setInterval(() => {
            return callback(null, {
                body: Math.random() * this.config.scaleFactor
            });
        }, 1);
    }
}
```

The Connection class in Topological is very simple.  It essentially defines an interface for enqueuing and streaming messages that all connections into and out of a node.  We only stream messages here, and, in this case, emit a random number every millisecond to the downstream processor.

The processor we use to count numbers is equally simple:

```
const { Processor } = require('topological');

class CountProcessor extends Processor {
    start(callback) {
        this.bins = [];
        for(let idx=0; idx < 10; idx += 1) {
            this.bins[idx] = 0;
        }
        return callback();
    }

    process(message, callback) {
        let number = message.body;
        let bin = Math.floor(number / 10.0);

        this.bins[bin] += 1;
        this.output([{
            bins: this.bins
        }], callback);
    }
}
```

Essentially we set up a set of ten bins in the start method, which is called when the processor is started, and then as each message is received by the process method, we increment the bin that it belongs to. Finally, the process message passes the current bin state onwards to its outputs. Note that the processor doesn't have any knowledge of how it receives receives messages or to what is connected to downstream. This seperation encourages a clean seperation of concerns and makes it easier to swap out connections with different implementations when necessary.

Instead, processors and connections are connected together loosely by a pipeline that looks like this:

```
let countProcessor = new CountProcessor({
    id: 'countProcessor'
});

let countToPrintConnection = new DirectConnection({
    id: 'countToPrintConnection'
});

let randomNumberConnection = new RandomNumberConnection({
    id: 'randomNumberConnection',
    config: {
        scaleFactor: 100
    }
});

let printProcessor = new PrintProcessor({
    id: 'printProcessor',
    config: {
        printInterval: 1000
    }
});

let topology = new Topology({
    id: 'topology',
    nodes: [
        new Node({
            id: 'count',
            inputs: [randomNumberConnection],
            processor: countProcessor,
            outputs: [countToPrintConnection]
        }),
        new Node({
            id: 'print',
            inputs: [countToPrintConnection],
            processor: printProcessor,
            outputs: []
        })
    ]
});

topology.start();

```

Essentially, this instantiates all of the processors and connections, then defines the topology for how they all connect together and flow, and then starts it.  Under the covers, topological starts all the connections, streaming messages from them into processors, and from processors to output to connections.  We can see this by running the solution:

```
$ npm install
$ npm start

Thu Jan 11 2018 16:11:56 GMT-0800 (PST) -----------> total: 1000
0-9: 113
10-19: 101
20-29: 103
30-39: 107
40-49: 114
50-59: 93
60-69: 82
70-79: 99
80-89: 93
90-99: 95

Thu Jan 11 2018 16:11:57 GMT-0800 (PST) -----------> total: 2000
0-9: 212
10-19: 214
20-29: 198
30-39: 205
40-49: 216
50-59: 186
60-69: 186
70-79: 201
80-89: 191
90-99: 191
```

## Pipeline and Deployment Generation

Most developers using Topological won't actually write the pipeline.js code we saw in the simple example, but instead, they will write a pipeline definition that Topological will use to automatically build both the pipeline implementation and the templates for deploying it into Kubernetes.

For this example, let's pretend we run a bus system and want to build a data pipeline to ingest our fleet's location in real time, make arrival predictions for each stop in its schedule, and notify smartphone users with the latest estimate. One potential data pipeline that implements this looks architecturally like this:

![Bus Location Pipeline](./docs/location-pipeline.png)

In topological, we define this pipeline using a topology definition that looks like this:

{
    "name": "location-pipeline",
    "connections":[{
        "id": "locations",
        "type": "kafka",
        "config": {
            "id": "locations",
            "keyField": "busId",
            "topic": "locations",
        }
    }, {
        "id": "estimatedArrivals",
        "type": "kafka",
        "config": {
            "id": "locations",
            "keyField": "busId",
            "topic": "estimatedArrivals",
        }
    }],
    "nodes": [{
        "id": "writeLocation",
        "inputs": ["locations"],
        "processor": {
            "platform": "node.js",
            "file": "./processors/writeLocation.js"
        },
        "outputs": []
    }, {
        "id": "predictArrivals",
        "inputs": ["locations"],
        "processor": {
            "platform": "node.js",
            "file": "./processors/predictArrivals.js"
        },
        "outputs": ["estimatedArrivals"]
    }, {
        "id": "notifyArrivals",
        "inputs": ["estimatedArrivals"],
        "processor": {
            "platform": "node.js",
            "file": "./processors/notifyArrivals.js"
        },
        "outputs": []
    }]
}

This definition is essentially a JSON respresentation of the underlying graph of processors and connections for the data pipeline that is described in the diagram above.  We combine that with a seperate deployment definition that looks like this:

{
    "target": "kubernetes",
    "connections": [{
        "id": "locations",
        "config": {
            "endpoint": "kafka-zookeeper.kafka.svc.cluster.local:2181"
        },
        "id": "estimatedArrivals",
        "config": {
            "endpoint": "kafka-zookeeper.kafka.svc.cluster.local:2181"
        }
    }],
    "nodes": [{
        "id": "writeLocation",
        "scale: 4
    }, {
        "id": "predictArrivals",
        "scale": 8
    }, {
        "id": "notifyArrivals",
        "scale": 8
    }]
}

Seperating deployment from topology details allows us to both extract the environment (dev vs. staging vs. production) and the deployment target (Kubernetes vs. Serverless) from the topology definition. Topological can then take these definitions and produces Helm Kubernentes deployment templates with just one command:

```
$ npm install -g topological-cli
$ topo build location-topology.json location-prod.json
```

and which can be deployed with a single additional command:

```
$ cd build/prod
$ ./deploy-pipeline
```
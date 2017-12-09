# topologic

Topologic is a cloud native framework for building real time processing graphs on Kubernetes.

The best way to understand how it works is with an example. Let's say you were running a bus system and wanted to provide bus location and stop arrival information. We want to log the bus' current location in a database, fetch the current route timetable for this bus, predict its estimated time of arrival at its remaining stops given this timetable, and emit a message to notify all of our waiting passengers with the current location of the bus and its expected time of arrival.

Looking at this as a graph it would look like this

            ------------------------- Locations -------------------
            V (location)              V (location)                V (location)
            writeLocation       fetchBusTimetable                 notifyLocation
                                      V (location, timetable)
                                predictArrivals
                                      V (timetable, arrivals)
                                notifyArrivals

We express this graph in topologic like this:

```
let locations = new KafkaConnection({
    topic: 'locations'
});

let timeTableConnector = new InProcessConnection();
let arrivalsConnector = new InProcessConnection();

let topology = new Topology([
    new Vertex({
        inputs: [locations],
        processor: writeLocation,
    }),

    new Vertex({
        inputs: [locations],
        processor: fetchBusTimetable,
        outputs: [timeTableConnector]
    }),
    new Vertex({
        inputs: [timeTableConnector],
        processor: predictArrivals,
        outputs: [arrivalsConnector]
    }),
    new Vertex({
        inputs: [locations],
        processor: notifyArrivals
    })

    new Vertex({
        inputs: [locations],
        processor: notifyLocation
    })
]);
```

connection handles pressure - vertex should check for pressure indicator before taking on new work.

You did not need to build the logic for scaling all of the processing pods, nor all of the queueing and dequeuing logic for your location messages, nor code to monitor your pipeline.  Topologic provides all of that for you out of the box.
node-venter
=========

A simple pub/sub class with support for scopes and namespaces.

Venter extends Node's [EventEmitter] class.

**Scopes**

Scopes mean you can create different instances of Venter so they have seperate pub/sub channels and life-cycle

**Namespaces**

Namespaces mean you can subscribe to the same event multiple times from the same method with the same handler(callback). Additionally, namespaces allow you to unregister from one event while leaving other handlers in place.

These come in handy when you have an event you'd like to listen to with one callback and the code registering the handler is part of more than one flow. the different flows may happen or not within the lifetime of your application. Without namespaces it will be difficult implementing this and have the listeners registered and unregistered appropriately.

API
----

### Venter

* **getScope()** 

    Return the scope the venter was initialized with.


* **addListener(type, listener, [namespace])**
> Alias: on

    Adds a listener to the end of the listeners array for the specified event.

* **emit(type, [p1,p2,...]**
> Alias: trigger

    Execute each of the listeners in order with the supplied arguments.
    if a namespace is registered for the provided type, listeners that were registered with or without a namespace will be executed.
     
* **removeListener(type, listener, [namespace])**
> Alias: off

    Remove a listener from the listener array for the specified event. Caution: changes array indices in the listener array behind the listener.
    if a namespace is provided, only the listener that was registered with the same namespace will be removed.


* **removeAllListeners(type, [namespace])**

    Removes all listeners, or those of the specified event. It's not a good idea to remove listeners that were added elsewhere in the code, especially when it's on an emitter that you didn't create (e.g. sockets or file streams).
    if a namespace is provided, only the listeners that were registered with the same namespace will be removed.
     
* **hasListener(type, [namespace])**

    Returns true if a listener was registered for the provided type.
    if a namespace is provided, will only return true if a listener was registered with that namespace.

* ##### for the rest of the API, see the node documentation ([EventEmitter]) 


 
### Registrar

* **get(scope)**

    creates a new venter instance in the provided scope or returns an existing one if one already created.

* **remove(scope)**

    removes a venter (and its listeners) for the provided scope.


Examples
----


**Example #1 - Simple**

```javascript
var Venter = require("venter");

var testVenter = Venter.get("my-test-scope");

testVenter.on("some_event", function(){console.log("hello");}); //on=addListener

testVenter.emit("some_event"); 

//prints 'hello' to console
```

**Example #2 - With Namespace**

```javascript
var fileVenter = require("venter").get("files");

function updateFile(file){

  //update the file
  
  fileVenter.trigger("file_event", file); //trigger=emit
}

function onFileUpdate(viewName, fileData){
    console.log("something happened with the file: ", fileData);
    
    //update the relevant view
}

function getFilesFromDir(viewName, dir_name, filter){
    
    if (!fileVenter.hasListener("file_event", fileName)){
        //registers to 'file_event' with the filter as the namespace 
        fileVenter.addListener("file_event", onFileUpdate.bind(null, viewName), filter); 
    }
    
    //return files from dir based on filter
}

getFilesFromDir("main-view", "dir1", "*.jpg"); //called from view a
getFilesFromDir("list-view", "dir1", "*.gif"); //called from view b

updateFile("dir1/vaction.jpg");
updateFile("dir1/dancing_kitty.gif");
```

[EventEmitter]:http://nodejs.org/api/events.html#events_class_events_eventemitter

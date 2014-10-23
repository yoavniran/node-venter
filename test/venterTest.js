var Venter = require("venter"),
    assert = require("assert");

function test1() {

    var scope = "test1";
    var testVenter = Venter.get(scope);
    var ns1 = "ns1", ns2 = "ns2";
    var eventName = "test-event", fakeEventName = "fake-event";
    var ctr = 0;

    function handler1(data) {
        console.log("***event handler ns1 called", data);
        ctr += 1;
    }

    function handler2(data) {
        console.log("***event handler ns2 called", data);
        ctr += 1;
    }

    function handler22(data) {
        console.log("***event handler ns2-2 called", data);
        ctr += 1;
    }

    function handlerNoNs(data) {
        console.log("***event handler no ns called", data);
        ctr += 1;
    }

    function registerHandlers() {

        console.log("registering callbacks with namespace");

        testVenter.on(eventName, handler1, ns1);
        testVenter.on(eventName, handler2, ns2);
        testVenter.on(eventName, handler22, ns2);
        testVenter.on(eventName, handlerNoNs);

        testVenter.on(fakeEventName, handler1,ns1);

        testVenter.on("bla-event", function () {
            assert.fail(null, null, "shouldnt get here!!!");
        });
    }

    registerHandlers();

    assert.ok(testVenter.hasListener(eventName));
    assert.ok(testVenter.hasListener(eventName, ns1));
    assert.ok(testVenter.hasListener(eventName, ns2));

    testVenter.emit(eventName, {message: "hello"});
    assert.equal(ctr, 4);

    testVenter.removeListener(eventName, handlerNoNs);

    testVenter.trigger(eventName, {message: "hello2"});
    assert.equal(ctr, 7);

    testVenter.off(eventName, handler2, ns2);

    testVenter.emit(eventName, {message: "hello3"});
    assert.equal(ctr, 9); //, "only two handlers should be called");

    testVenter.removeAllListeners(eventName, true);
    testVenter.trigger(eventName);
    assert.equal(ctr, 9); //, "no handler should be called");

    registerHandlers();

    testVenter.removeAllListeners(eventName, "non-existing-ns");

    assert.ok(testVenter.hasListener(eventName, ns1));
    assert.ok(testVenter.hasListener(eventName, ns2));

    testVenter.trigger(eventName, {message: "hello4"});
    assert.equal(ctr, 13); //, "4 handlers should be called");

    testVenter.removeAllListeners(eventName);

    testVenter.emit(eventName, {message: "hello5"});
    assert.equal(ctr, 16); //, "3 handlers should be called");

    testVenter.removeAllListeners(eventName, ns2);

    testVenter.emit(eventName, {message: "hello6"});
    assert.equal(ctr, 17); //, "1 handler should be called");

    testVenter.removeAllListeners(eventName, ns1);

    testVenter.emit(eventName, {message: "hello7"});
    assert.equal(ctr, 17); //, "no handler should be called");

    registerHandlers();

    testVenter.emit(eventName, {message: "hello8"});
    assert.equal(ctr, 21); //, "4 handlers should be called");

    testVenter.removeAllListeners();
    testVenter.emit(eventName, {message: "hello9"});
    assert.equal(ctr, 21); //, "no handler should be called");

    registerHandlers();

    testVenter.removeAllListeners(fakeEventName, ns1);

    testVenter.trigger(eventName, {message: "hello10"});
    assert.equal(ctr, 25); //, "4 handlers should be called");

    Venter.remove(scope);
    testVenter.emit(eventName, {message: "hello11"});
    assert.equal(ctr, 25); //, "no handler should be called");

    console.log("--------------------- venter types ns: ", testVenter._typesNs);
    console.log("--------------------- venter events: ", testVenter._events);
}

test1();
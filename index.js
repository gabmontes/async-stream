/**
 * Call the callback only once.
 *
 * Only the first call will trigger the callback. Subsequent calls are just
 * ignored.
 *
 * @param {function} callback to be called only once.
 */
function callOnce(callback) {

    var called = false;
    
    return function () {
        if (!called) {
            called = true;
            callback.apply(this, arguments);
        }
    };
}

/**
 * Converts a stream into one that supports asyncronous functions.
 *
 * The stream must be in flowing mode as only "data", "end" and "error" events
 * are considered. The listeners must be:
 *
 * event "data"  > function(data, callback) where callback is function(err)
 * event "end"   > function(callback) where callback is function()
 * event "error" > function(err, callback) where callback is function(err)
 *
 * @param {stream} underlying stream of data.
 * @param {function} callback as function(err) to be executed when all data was 
 *                   processed. This function may receive an error object.
 * @returns {stream} the origina stream for chaining.
 */
function convertToAsyncStream(stream, callback) {

    var is_done = false,
        pending = 0,
        asyncCallback = callOnce(callback),
        stramOn = stream.on;

    stream.on = function (event, listener) {
        switch (event) {
            case "data":
                stramOn.call(this, event, function (data) {
                    ++pending;
                    listener(data, function (err) {
                        --pending;
                        if (err || is_done && !pending) {
                            asyncCallback(err);
                        }
                    });
                });
                break;
            case "end":
                stramOn.call(this, event, function () {
                    is_done = true;
                    listener(function () {
                        if (!pending) {
                            asyncCallback();
                        }
                    });
                });
                break;
            case "error":
                stramOn.call(this, event, function (err) {
                    listener(err, asyncCallback);
                });
                break;
        }
    };

    return stream;
}

// export conversion function
module.exports = convertToAsyncStream;

// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// ----------------------------------------------------------------------------

/// <reference path="..\Generated\MobileServices.DevIntellisense.js" />

// Declare JSHint globals
/*global WinJS:false, Windows:false, $__fileVersion__:false, $__version__:false */

// Redefine "require" to support loading of "node" modules.
var __originalRequire__ = require;
function customRequire(name) {
    // attempt load from original require
    try {
        return __originalRequire__(name);
    }
    catch (e) {
        // try node's require
        return module.require(name);
    }
}

require = customRequire;

var _ = require('Extensions');
var Validate = require('Validate');
var Promises = require('Promises');
var Resources = require('Resources');
var inMemorySettingStore = {};
var XMLHttpRequest = require("XMLHttpRequest").XMLHttpRequest;

exports.async = function async(func) {
    /// <summary>
    /// Wrap a function that takes a callback into platform specific async
    /// operation (i.e., keep using callbacks or switch to promises).
    /// </summary>
    /// <param name="func" type="Function">
    /// An async function with a callback as its last parameter 
    /// </param>
    /// <returns type="Function">
    /// Function that when invoked will return a Promises.Promise.
    /// </returns>

    return function () {
        // Capture the context of the original call
        var that = this;
        var args = arguments;

        // Create a new promise that will wrap the async call
        return new Promises.Promise(function (complete, error) {

            // Add a callback to the args which will call the appropriate
            // promise handlers
            var callback = function (err) {
                if (_.isNull(err)) {
                    // Call complete with all the args except for err
                    complete.apply(null, Array.prototype.slice.call(arguments, 1));
                } else {
                    error(err);
                }
            };
            Array.prototype.push.call(args, callback);

            try {
                // Invoke the async method which will in turn invoke our callback
                // which will in turn invoke the promise's handlers
                func.apply(that, args);
            } catch (ex) {
                // Thread any immediate errors like parameter validation
                // through the the callback
                callback(_.createError(ex));
            }
        });
    };
};

exports.addToMobileServicesClientNamespace = function (declarations) {
    /// <summary>
    /// Define a collection of declarations in the Mobile Services Client namespace.
    /// </summary>
    /// <param name="declarations" type="Object">
    /// Object consisting of names and values to define in the namespace.
    /// </param>

    // First ensure our 'WindowsAzure' namespace exists
    var namespaceObject = global.WindowsAzure = global.WindowsAzure || {};

    // Now add each of the declarations to the namespace
    for (var key in declarations) {
        if (declarations.hasOwnProperty(key)) {
            namespaceObject[key] = declarations[key];
        }
    }
};

exports.readSetting = function readSetting(name) {
    /// <summary>
    /// Read a setting from a global configuration store.
    /// </summary>
    /// <param name="name" type="String">
    /// Name of the setting to read.
    /// </param>
    /// <returns type="String" mayBeNull="true">
    /// The value of the setting or null if not set.
    /// </returns>

    return inMemorySettingStore[name];
};

exports.writeSetting = function writeSetting(name, value) {
    /// <summary>
    /// Write a setting to a global configuration store.
    /// </summary>
    /// <param name="name" type="String">
    /// Name of the setting to write.
    /// </param>
    /// <param name="value" type="String" mayBeNull="true">
    /// The value of the setting.
    /// </returns>

    inMemorySettingStore[name] = value;
};

exports.webRequest = function (request, callback) {
    /// <summary>
    /// Make a web request.
    /// </summary>
    /// <param name="request" type="Object">
    /// Object describing the request (in the WinJS.xhr format).
    /// </param>
    /// <param name="callback" type="Function">
    /// The callback to execute when the request completes.
    /// </param>

    var headers = request.headers || {},
        url = request.url.replace(/#.*$/, ""), // Strip hash part of URL for consistency across browsers
        httpMethod = request.type ? request.type.toUpperCase() : "GET",
        xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            callback(null, xhr);
        }
    };

    xhr.open(httpMethod, url);

    for (var key in headers) {
        if (request.headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, request.headers[key]);
        }
    }

    xhr.send(request.data);
};

exports.login = function (startUri, endUri, callback) {
    /// <summary>
    /// Log a user into a Mobile Services application by launching a
    /// browser-based control that will allow the user to enter their credentials
    /// with a given provider.
    /// </summary>
    /// <param name="startUri" type="string">
    /// The absolute URI to which the login control should first navigate to in order to
    /// start the login process flow.
    /// </param>
    /// <param name="endUri" type="string" mayBeNull="true">
    /// The absolute URI that indicates login is complete. Once the login control navigates
    /// to this URI, it will execute the callback.
    /// </param>
    /// <param name="callback" type="Function" mayBeNull="true">
    /// The callback to execute when the login completes: callback(error, endUri).
    /// </param>

    throw "Not implemented.";
};

exports.getOperatingSystemInfo = function () {
    var os = require("os");
    return {
        name: os.platform(),
        version: os.release(),
        architecture: os.arch()
    };
};

exports.getSdkInfo = function () {
    return {
        language: "Node",
        fileVersion: $__fileVersion__
    };
};

exports.getUserAgent = function () {
    // The User-Agent header can not be set in WinJS
    return null;
};

exports.toJson = function (value) {
    /// <summary>
    /// Convert an object into JSON format.
    /// </summary>
    /// <param name="value" type="Object">The value to convert.</param>
    /// <returns type="String">The value as JSON.</returns>

    // We're wrapping this so we can hook the process and perform custom JSON
    // conversions.  Note that we don't have to add a special hook to correctly
    // serialize dates in ISO8061 because JSON.stringify does that by defualt.
    // TODO: Convert geolocations once they're supported
    // TODO: Expose the ability for developers to convert custom types
    return JSON.stringify(value);
};

exports.tryParseIsoDateString = function (text) {
    /// <summary>
    /// Try to parse an ISO date string.
    /// </summary>
    /// <param name="text" type="String">The text to parse.</param>
    /// <returns type="Date">The parsed Date or null.</returns>

    Validate.isString(text);

    // Check against a lenient regex
    if (/^(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})(\.(\d{3}))?Z$/.test(text)) {
        // Try and parse - it will return NaN if invalid
        var ticks = Date.parse(text);
        if (!isNaN(ticks)) {
            // Convert to a regular Date
            return new Date(ticks);
        }
    }

    // Return null if not found
    return null;
};

exports.getResourceString = function (resourceName) {
    // For now, we'll just always use English
    return Resources["en-US"][resourceName];
};

exports.allowPlatformToMutateOriginal = function (original, updated) {
    // For the Web/HTML client, we don't modify the original object.
    return updated;
};

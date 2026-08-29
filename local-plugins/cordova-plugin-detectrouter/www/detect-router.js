var exec = require('cordova/exec');

module.exports = {
    // Resolves with the hotspot/AP IPv4 (phone hosts a hotspot) or the WiFi
    // router gateway IPv4 (phone is a client on a router network), or the error
    // callback when neither can be found. Mirrors the Kotlin detectRouterIp().
    detectRouterIp: function (success, error) {
        exec(success, error, 'DetectRouter', 'detectRouterIp', []);
    }
};

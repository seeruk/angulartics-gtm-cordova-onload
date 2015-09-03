/**
 * This file is part of the angulartics-gtm-cordova-onload package.
 *
 * @package angulartics-gtm-cordova-onload
 * @since   2015
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @ngdoc overview
 * @name seeruk.angulartics.google.tagmanager.cordova
 * @description
 * Enables analytics support for Google Tag Manager (http://google.com/tagmanager)
 * for Cordova plugin Tag Manager (http://plugins.cordova.io/#/package/com.jareddickson.cordova.tag-manager)
 */
angular.module("seeruk.angulartics.google.tagmanager.cordova", [
    "angulartics"
])
    .provider("googleTagManagerCordova", function() {
        "use strict";

        var GoogleTagManagerCordova = function($q, $log, ready, debug, trackingId, period) {
            var deferred = $q.defer();
            var deviceReady = false;

            document.addEventListener("deviceReady", function() {
                deviceReady = true;
                deferred.resolve();
            }, false);

            document.addEventListener("pause", function() {
                var analytics = window.plugins && window.plugins.TagManager;
                if (analytics) {
                    analytics.dispatch(success, failure);
                }
            }, false);

            // iOS only
            document.addEventListener("resign", function() {
                var analytics = window.plugins && window.plugins.TagManager;
                if (analytics) {
                    analytics.dispatch(success, failure);
                }
            }, false);

            setTimeout(function() {
                if (!deviceReady) {
                    deferred.resolve();
                }
            }, 3000);

            function success() {
                if (debug) {
                    $log.info(arguments);
                }
            }

            function failure(err) {
                if (debug) {
                    $log.error(err);
                }
            }

            this.init = function() {
                return deferred.promise.then(function() {
                    var analytics = window.plugins && window.plugins.TagManager;
                    if (analytics) {
                        analytics.init(function onInit() {
                            ready(analytics, success, failure);
                        }, failure, trackingId, period || 30);
                    } else if (debug) {
                        $log.error("Google Tag Manager for Cordova is not available");
                    }
                });
            };
        };

        return {
            $get: function($injector) {
                return $injector.instantiate(GoogleTagManagerCordova, {
                    ready: this._ready || angular.noop,
                    debug: this.debug,
                    trackingId: this.trackingId,
                    period: this.period
                });
            },
            ready: function(fn) {
                this._ready = fn;
            }
        };
    })
    .config(function($analyticsProvider, googleTagManagerCordovaProvider) {
        googleTagManagerCordovaProvider.ready(function(analytics, success, failure) {
            $analyticsProvider.registerPageTrack(function(path) {
                var username = googleTagManagerCordovaProvider.username;

                if (username) {
                    analytics.trackPage(success, failure, path, username);
                } else {
                    analytics.trackPage(success, failure, path);
                }
            });

            $analyticsProvider.registerEventTrack(function(action, properties) {
                var username = googleTagManagerCordovaProvider.username;

                if (username) {
                    analytics.trackEvent(
                        success, failure, properties.category, action,
                        properties.label, properties.value, username
                    );
                } else {
                    analytics.trackEvent(
                        success, failure, properties.category, action,
                        properties.label, properties.value
                    );
                }
            });

            // Track the page we're on when the module loads
            analytics.trackPage(success, failure, window.location.hash.slice(1));
        });

        $analyticsProvider.registerSetUsername(function(username) {
            googleTagManagerCordovaProvider.username = username;
        });
    })
    .run(function(googleTagManagerCordova) {
        googleTagManagerCordova.init();
    });

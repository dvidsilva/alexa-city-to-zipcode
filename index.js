var Alexa = require('alexa-sdk');
var request = require('request-promise');
var _ = require('lodash');



var getLatLongForCity = function(city) {
    var options = {
        uri: 'http://maps.googleapis.com/maps/api/geocode/json?address=' + city, // + san+francisco
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true,
    }
    return request(options).then(function (data) {
        return _.get(data, 'results[0].geometry.location');
    });
}

var getZipCode = function (loc) {
    var options = {
        uri: 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + loc,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true, 
    };
    return request(options).then(function (data) {
        var addressComponents = _.get(data, 'results[0].address_components');
        if (!addressComponents || addressComponents.length < 1) {
            return;
        }
        for (var i = 0; i < addressComponents.length; i++) {
            if (addressComponents[i].types[0] === 'postal_code') {
                return addressComponents[i].long_name;
            }
        }
    }).catch(function (err) {
        return err;
    });
}

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    // alexa.appId = 'amzn1.ask.skill.70b34aa6-487e-4716-897a-2a65a5d2ea6c';

    // alexa.dynamoDBTableName = 'zemanimUserData';

    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('MyIntent');
    },

    'MyIntent': function () {
        var self = this;
        var intentObj = this.event.request.intent;
        if (!intentObj || !intentObj.slots.City) {
            // return self.emit(':ask', 'What city are you located on?, you can also say: Zemanim set my city to San Francisco.');
            return self.emit(':tell', 'What city are you located on?, you can say Zemanim set my city to San Francisco.');
        }
        var city = intentObj.slots.City.value;
        return getLatLongForCity(city.replace(' ', '+')).then(function (loc) {
            if (!loc || !loc.lat) {
                return self.emit(':tell', 'Couldn\'t find the city ' + city);
            }
            return getZipCode(loc.lat + ',' + loc.lng).then(function (zipCode) {
                return self.emit(':tell', 'The zipCode for ' + city + ' is ' + '<say-as interpret-as="spell-out">' + zipCode +'</say-as>');
            });
        });
    }
};

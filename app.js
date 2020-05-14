const ibmiotf = require('ibmiotf');
const fetch = require('node-fetch');
const config = require('config');
const telematics = require('./data/telematics.json');
const device = require('./config/device.json');
const {uniqueNamesGenerator, adjectives, colors, animals} = require('unique-names-generator');

let delayData = (delay, owner) => {
  return (data, index) => {
    setTimeout(() => {
      data.owner = owner;
      deviceClient.publish('event', 'json', data);
    }, index * 1000);
  };
};

let deviceClient = new ibmiotf.IotfDevice(device);

deviceClient.log.setLevel('debug');

deviceClient.connect();

deviceClient.on('connect', () => {
  let tripName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    separator: ' ',
    length: 3
  });

  fetch(`${config.get('url')}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: config.get('email'),
      password: config.get('password')
    })
  })
      .then((response) => {
        response
            .json()
            .then(({token}) => {
              fetch(`${config.get('url')}/api/trip/create`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token,
                },
                body: JSON.stringify({
                  name: tripName
                })
              })
                  .then((response) => {
                    response
                        .json()
                        .then(({trip}) => {
                          telematics
                              .filter((data) => {
                                return data.owner === 10;  // Change value for another sample data from telematics.json [from 0 to 50]
                              })
                              .forEach(delayData(1000, trip._id));
                        });
                  });
            });
      });
});

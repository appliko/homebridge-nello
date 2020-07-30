const request = require('request');

function getGrantFormParameters(platform) {
  if (!platform.config.clientId) {
    platform.log('No clientId for nello.io provided.');
    return false;
  }

  switch (platform.config.authType) {
    case 'password':
      if (!platform.config.username || !platform.config.password) {
        platform.log('No username and/or password for nello.io provided.');
        return false;
      }
      return {
        grant_type: 'password',
        client_id: platform.config.clientId,
        username: platform.config.username,
        password: platform.config.password,
      };

    case 'client':
      if (!platform.config.clientSecret) {
        platform.log('No clientSecret for nello.io provided.');
        return false;
      }
      return {
        grant_type: 'client_credentials',
        client_id: platform.config.clientId,
        client_secret: platform.config.clientSecret,
      };

    default:
      platform.log('Invalid authType for nello.io provided.');
      return false;
  }
}

module.exports = function (callback) {
  const platform = this;

  // Validates the configuration
  if (!platform.config.authUri) {
    platform.log('No Authentication URI for nello.io provided.');
    return callback(false);
  }

  const grantFormParameters = getGrantFormParameters(platform);

  if (!grantFormParameters) {
    return callback(false);
  }

  // Sends the login request to the API
  platform.log('Signing in.');
  platform.token = null;
  platform.locations = [];

  request({
    uri: `${platform.config.authUri}/oauth/token/`,
    method: 'POST',
    json: true,
    form: grantFormParameters,
  }, (error, response, body) => {
    // Checks if the API returned a positive result
    if (error || response.statusCode != 200 || !body || !body.access_token) {
      if (error) {
        platform.log(`Error while signing in. Error: ${error}`);
      } else if (response.statusCode != 200) {
        platform.log(`Error while signing in. Status Code: ${response.statusCode}`);
      } else if (!body || !body.access_token) {
        platform.log(`Error while signing in. Could not get access token from response: ${JSON.stringify(body)}`);
      }
      platform.signOut();
      return callback(false);
    }

    // Stores the token information
    platform.token = body;
    platform.log('Signed in.');
    return callback(true);
  });
};

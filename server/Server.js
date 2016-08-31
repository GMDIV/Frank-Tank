/*

 ___  _ _  ___  ___  ___  ___   ___  _ _  ___  _ __ _  ___  ___
| . \| | || . >| . >| __>| . \ | . \| | ||  _>| / /| || __>/ __>
|   /| ' || . \| . \| _> |   / | | || ' || <__|  \ | || _> \__ \
|_\_\`___'|___/|___/|___>|_\_\ |___/`___'`___/|_\_\|_||___><___/

Todo: Get shit done

!!!!!!! USE AirBnB ESLinter TO MATCH CODE STYLING !!!!!!!

*/

/*
  *************************
  Include required packages
  *************************
*/

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const babelify = require('babelify');
const browserify = require('browserify-middleware');
const db = require('./db');

const app = express();

const serverUrl = process.env.PORT || 8000;

const serverMessage = `Listening on port: ${serverUrl}`;

/*
  *****************************************************
  Dummy objects to simulate PostgreSQL server structure
  *****************************************************
*/

// background image url: https://i.ytimg.com/vi/shTUk4WNWVU/maxresdefault.jpg

/*
const channels = [
  { id: 1, name: 'land', background: path.join(__dirname, '../assets/land_background.jpg') },
];

const users = [
  { id: 1, name: 'Joe' },
  { id: 2, name: 'Frank' },
  { id: 3, name: 'Rob' },
  { id: 4, name: 'Ryan' },
  { id: 5, name: 'Gilbert' },
];

const videos = [
  { id: 1, url: 'OMflBAXJJKc', channel_id: 1 },
  { id: 2, url: 'x76VEPXYaI0', channel_id: 1 },
  { id: 3, url: 'evj6y2xZCnM', channel_id: 1 },
];

const likes = [
  { id: 1, start: 43, stop: 48, video_id: 1, users: [1, 2, 4] },
  { id: 2, start: 74, stop: 82, video_id: 1, users: [2, 3, 4] },
  { id: 3, start: 38, stop: 42, video_id: 2, users: [1, 3, 4] },
  { id: 4, start: 70, stop: 90, video_id: 3, users: [2, 5] },
];


  // *********************************************************
  // Completed channel object should look something like this:
  // *********************************************************


const dummyObj = {
  channel_id: 1,
  channel_name: 'land',
  background: path.join(__dirname, '../assets/land_background.jpg'),
  videos: [{
    url: 'OMflBAXJJKc',
    time_based_likes: [{
      id: 1,
      start: 43,
      stop: 48,
      video_id: 1,
      users: [1, 2, 4],
    }, {
      id: 2,
      start: 74,
      stop: 82,
      video_id: 1,
      users: [2, 3, 4],
    }],
  }, {
    url: 'x76VEPXYaI0',
    time_based_likes: [{
      id: 3,
      start: 38,
      stop: 42,
      video_id: 2,
      users: [1, 3, 4],
    }],
  }, {
    url: 'evj6y2xZCnM',
    time_based_likes: [{
      id: 4,
      start: 70,
      stop: 73,
      video_id: 3,
      users: [2, 5],
    }],
  }],
};
*/

/*
  ****************
  Middleware calls
  ****************
*/

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../assets')));

/*
  *******************
  ROUTING STARTS HERE
  *******************
*/

/*
  *******************************************
  Browserify and Babelify all files for React
  *******************************************
*/

app.get('/app-bundle.js',
  browserify(path.join(__dirname, '../client/main.js'), {
    transform: [[babelify, { presets: ['es2015', 'react'] }]],
  })
);

/*
  ***********************************************************************
  Initializes interface.

  Response object:  Index.html file
  ***********************************************************************
*/

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/Index.html'));
});

/*
  ***********************************************************************
  Responds to requests for specific channel.

  Videos are searched for by the following criteria
    - prepended with "extreme"
    - sorted by # of views, maybe randomized?

  GET:
    Response object:
      {
        id: current channel id,
        channel_name: current channel name,
        background: background image url or asset,
        videos: array of video objects:
          {
            url: youtube url id,
            time_based_likes: array of time-based like objects:
              {
                id: current time-based like id,
                start_time: like start time (in seconds),
                stop_time: like stop time (in seconds),
                video_id: current video id,
                users: array of user ids that have like this video
              }
          }
      }
  ***********************************************************************
*/

app.get('/channel/:id', (req, res) => {
  // Build channel object for response
  db.getChannelById(req.params.id)
  .then(channelResObj => {
    res.send(channelResObj);
  });
});

/*
  ***********************************************************************
  Responds to requests for time-based likes information

  GET:
    Response object: array of all time-based likes:
      {
        id: current time-based like id,
        start: like start time (in seconds from beginning of video),
        stop: like stop time (in seconds from beginning of video),
        video_id: current video id,
        likes: array of user ids that have like this video
      }
  ***********************************************************************
*/

app.get('/channel/:id/likes', (req, res) => {
  db.getLikesByChannel(req.params.id).then((likesArray) => {
    res.send(likesArray);
  });
});

/*
  ***********************************************************************
  Responds to requests to create time-based likes on user click.

  Validation implemented to prevent duplication.

  POST:
    Request object (from client):
      {
        start: like start time (in seconds from beginning of video),
        stop: like stop time (in seconds from beginning of video),
        user_id: current user id
        video_id: current video id
        channel_id: current channel id
      }

    Response object:
      {
        id: current time-based like id,
        start: like start time (in seconds from beginning of video),
        stop: like stop time (in seconds from beginning of video),
        video_id: current video id,
        channel_id: current channel id,
        likes: array of user ids that have like this video
      }
  ***********************************************************************
*/

app.post('/likes/create', (req, res) => {
  db.createLike(req.body)
  .then(newLike => {
    res.send(newLike);
  });
});

/*
  ***********************************************************************
  Responds to requests to update time-based likes on user click.

  Validation implemented to prevent duplication.

  POST:
    Request object (from client):
      {
        user_id: current user id,
        like_id: current time-based like id
      }

    Response object:
      {
        id: current time-based like id,
        users: array containing all user ids that have liked (no repeats)
      }
  ***********************************************************************
*/

app.post('/likes/update', (req, res) => {
  db.updateLike(req.body)
  .then(newLike => {
    res.send(newLike);
  });
});

/*
  *******************************************************************
  Spin up server on either NODE environmental variable or 8000(local)
  *******************************************************************
*/

app.listen(serverUrl);
console.log(serverMessage);


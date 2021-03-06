/*
      THE DATABASE SPIDER

               (
                )
               (
        /\  .-"""-.  /\
       //\\/  ,,,  \//\\
       |/\| ,;;;;;, |/\|
       //\\\;-"""-;///\\
      //  \/   .   \/  \\
     (| ,-_| \ | / |_-, |)
       //`__\.-.-./__`\\
      // /.-(() ())-.\ \\
     (\ |)   '---'   (| /)
      ` (|           |) `
        \)           (/

          HSK HSK HSK
        GIMME THE DATAZ

Using PostgreSQL.  Minimal installation instructions:

# Using Homebrew from terminal:

  -brew update
  -brew install postgresql
  -brew services start postgres
  -createdb greenfield_vplayer

# Not using Homebrew:

  -install Homebrew
  -see above

# Don't want to use Homebrew

  -good luck with that

Some background URLs for the default channel:
  Kill the PacMan    : https://i.imgur.com/fa7mUp8.jpg
  Portal             : https://i.imgur.com/gx9XCkA.jpg
  Circuits(current)  : https://i.imgur.com/PmqssGZ.jpg

*/

const _ = require('underscore');
const config = require('../knexfile');

const env = 'development';
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'ec2-50-17-237-148.compute-1.amazonaws.com',
    user: 'gmltxtufrgzihh',
    password: 'YEo-u1_EL2bJbAzgo-lwHcYEu4',
    database: 'd924kkqud63c96',
    ssl: true
  }
}); 

knex.migrate.latest([config]);

/*
  Welcome to
   ___  _ _  _ _   _ _ _  _  ___  _ _   ___  ___  ___  __ __  _  ___  ___  ___  _
  | __>| | || \ | | | | || ||_ _|| | | | . \| . \| . ||  \  \| |/ __>| __>/ __>| |
  | _> | ' ||   | | | | || | | | |   | |  _/|   /| | ||     || |\__ \| _> \__ \|_/
  |_|  `___'|_\_| |__/_/ |_| |_| |_|_| |_|  |_\_\`___'|_|_|_||_|<___/|___><___/<_>

*/

/*
  ***********************************************************************

  Returns an array of all the video objects for a particular channel

  ***********************************************************************
*/


knex.getVideosByChannel = (channelId) =>
  knex('videos').where('channel_id', channelId)
  .then(videos => {
    const videosArray = videos;
    videos.forEach((video, index) => {
      videosArray[index].time_based_likes = [];
    });
    return videosArray;
  });

/*
  ***********************************************************************

  Returns an array of user id's that have liked a particular time-based
  like.

  ***********************************************************************
*/

knex.getUserLikesArray = (likeId) =>
  knex.select('user_id').from('likes_by_user').where('likes_id', likeId)
  .then(userLikes => userLikes.map(element => element.user_id));

/*
  ********************************************************
  Returns an array of videos a particular userId has liked
  ********************************************************
*/

knex.getVideosByUser = (userId) => 
  knex.getLikesByUser(userId)
  .then(likes => {
    return Promise.all(
      likes.map(like => 
      knex('videos').where('id', like.video_id)
      )
    )
    .then( e => e.map(x => {
      let obj = x[0];
      //obj.time_based_likes = [{id: obj.id, start_time : 36, stop_time: 56, users: [userId], video_id: obj.id}];
      return obj;
    }))
    .then(function(videos){
      return videos.map(vid => {
        vid.time_based_likes = likes.filter(lk => lk.video_id === vid.id)
        return vid;
      } )
    })
  })

/*
  **********************************************
  Returns an array of likes by a particular userId
  **********************************************
*/

knex.getLikesByUser = (userId) =>
  knex.select('likes_id').from('likes_by_user').where('user_id', userId)
  .then(function(likeIds){
    var promises = [];
    likeIds.map(like=>{
      promises.push(
        knex('likes').where('id', like.likes_id)
        .then(function(result){ //result is an array with one like object
          return result[0];
        })
      )
    })
    return Promise.all(promises)
  })
//get the ALL the likes in one video 
  // knex.getLikesByVideo = (videoId) =>
  //   knex.select("likes_id").from('likes_by_video').where('video_id', videoId)
  //     .then(function(allLikes){
  //       return allLikes.length //returns amount of likes of the video

  //       })


  //     })
knex.getTotalLikesByVideoId = (videoId) =>
    knex.select('id').from('likes').where('video_id', videoId)
      .then(function(allLikes){
        // console.log("ALL LIKES IN DATABASE", allLikes, allLikes.length);
        return allLikes.length
      })
/*
  ***********************************************************************

  Returns an array of all time-based likes objects for all channels.

  ***********************************************************************
*/

knex.getAllLikes = () => {
  let likesArray = [];

  return knex('likes')
  .then(likes => {
    likesArray = likes;
    return Promise.all(likesArray.map(like => knex.getUserLikesArray(like.id)));
  })
  .then(userIds => {
    const tempArray = likesArray;
    tempArray.forEach((like, index) => {
      likesArray[index].users = userIds[index];
    });
    return likesArray;
  });
};

/*
  ***********************************************************************

  Returns an array of all time-based likes objects for a particular
  channel.

  ***********************************************************************
*/

knex.getLikesByChannel = (channelId) => {
  let likesArray = [];

  return knex('likes').where('channel_id', channelId)
  .then((likes) => {
    likesArray = likes;
    return Promise.all(likes.map(like => knex.getUserLikesArray(like.id)));
  })
  .then(userIds => {
    const tempArray = likesArray;
    tempArray.forEach((like, index) => {
      likesArray[index].users = userIds[index];
    });
    return likesArray;
  });
};

/*
  *******************************************************
  Returns all comments associated with a particular like
  *******************************************************
*/

knex.getCommentsByLike = (likeId) => {
  return knex('comments').where('like_id', likeId)
  .then(function(commentsByLike){
    return Promise.all(commentsByLike.map(comment =>
      knex('users').where('id', comment.user_id)
      .then(function(user){
        console.log("User: ", user);
        comment.username = user[0].name
        return comment;
      })))
     .then(commsByLike => commsByLike.reduce((flattened, byLike) => flattened.concat(byLike), []))
  })
}

/*
  *******************************************************
  Returns all comments associated with a particular video
  *******************************************************
*/

knex.getCommentsByVideo = (videoId) => {
  return knex('likes').where('video_id', videoId)
  .then(likes => {
    console.log("In getCommentsByVideo, likes: ", likes);
    return Promise.all(likes.map(like =>
      knex.getCommentsByLike(like.id)
    ))
    .then(commentsByLike =>
      commentsByLike.reduce((flattened, byLike) => flattened.concat(byLike), []))
  })
}

/*
  ***************************
  Creates a comment in the db
  ***************************
*/

knex.createComment = (commentObj) => {
  return knex('comments').insert(commentObj)
  .then(newId => {
    commentObj.dbId = newId;
    return commentObj;
  })
}

/*
  ***********************************************************************

  Return a channel object for the default channel.  All video objects are
  obtained from the database, shuffled, and the top nine are placed in
  the 'videos' array of the channel object.

  ***********************************************************************
*/

knex.getDefaultChannel = () => {
  const channelResObj = {
    id: 0,
    name: 'default',
    background: 'https://i.imgur.com/PmqssGZ.jpg',
  };

  let likesArray = [];
  let videosArray = [];

  return knex.getAllLikes()
  .then(likes => {
    likesArray = likes;
    return knex('videos');
  })
  .then(videos => {
    videosArray = videos;
    videos.forEach((video, index) => {
      videosArray[index].time_based_likes = []
        .concat(likesArray.filter(like => like.video_id === video.id));
    });
    channelResObj.videos = _.shuffle(videosArray).slice(0, 9);
    return channelResObj;
  });
};

/*
  ***********************************************************************

  Returns a channel object for a specified channel.

  ***********************************************************************
*/

knex.getChannelById = (channelId) => {
  let channelResObj = {};
  let likesArray = [];
  let videosArray = [];

  // Build channel object by channel id
  return knex.getLikesByChannel(channelId)
  .then(likes => {
    likesArray = likes;
    return knex.getVideosByChannel(channelId);
  })
  .then(videos => {
    videosArray = videos;
    videos.forEach((video, index) => {
      videosArray[index].time_based_likes = video.time_based_likes
      .concat(likesArray.filter(e => e.video_id === video.id));
    });
    return knex('channels').where('id', channelId);
  })
  .then(channel => {
    channelResObj = channel[0];
    channelResObj.videos = videosArray;
    return channelResObj;
  });
};

/*
  ***********************************************************************

  Adds an array of videos returned by the YouTube search performed by the
  server to the database. Returns an array of video objects for addition
  to the currently playing channel.

  ***********************************************************************
*/

knex.addVideos = (videosArray, channelId) => {
  let successMessage = '';
  let videos = [];

  return Promise.all(
    videosArray.map(video => knex('videos').where('url', video.id.videoId))
  )
  .then(videosInDB => {
    videos = videosArray
      .filter((video, index) => !videosInDB[index].length)
      .map(video => ({ url: video.id.videoId, channel_id: channelId }));
    if (!videos.length) {
      const errMessage = 'No videos added! Refine search parameters';
      throw errMessage;
    } else {
      successMessage = (`${videos.length} ${videos.length === 1 ? 'video' : 'videos'} added!`);
      return Promise.all(
        videos.map(video => knex('videos').insert(video))
      );
    }
  })
  .then(() => {
    console.log(successMessage);
    return Promise.all(videos.map(video => knex('videos').where('url', video.url)));
  })
  .then(array => array.map(element => element[0]))
  .catch(error => error);
};

/*
  ***********************************************************************

  Adds a new time-based like to the database and returns the new time-
  based like object for addition to the current video.

  ***********************************************************************
*/

knex.createLike = (like) => {
  const likeObj = {
    start_time: like.start_time,
    stop_time: like.stop_time,
    video_id: like.video_id,
    channel_id: like.channel_id,
  };

  const userId = like.user_id;

  return knex('likes').where(likeObj)
  .then(data => {
    if (data.length) {
      likeObj.id = data[0].id;
      throw knex.getUserLikesArray(data[0].id);
    } else {
      return likeObj;
    }
  })
  .then(newLike => knex('likes').insert(newLike))
  .then(() => knex.select('id').from('likes').where(likeObj))
  .then(id => {
    likeObj.id = id[0].id;
    likeObj.users = [userId];
    //likeObj.video-id?? could this just be done here??? 
    return knex('likes_by_user').insert({ user_id: userId, likes_id: id[0].id });
  })
  .then(() => likeObj)
  .catch((userIdArray) =>
    userIdArray.then(idArray => {
      likeObj.users = idArray;
      return likeObj;
    })
  );
};

/*
  ***********************************************************************

  Updates the likes_by_user database with a pairing of the current time-
  based like id and the current user id. Returns the id of the updated
  time-based like and an updated array of user ids that have liked it.

  ***********************************************************************
*/

knex.updateLike = (obj) =>
  knex('likes_by_user').where(obj)
  .then(queryData => {
    if (queryData.length) {
      throw knex.getUserLikesArray(queryData[0].likes_id);
    } else {
      return knex('likes_by_user').insert(obj);
    }
  })
  .then(() => knex.getUserLikesArray(obj.likes_id))
  .then(userIdArray => ({ id: obj.likes_id, users: userIdArray }))
  .catch(userIdArray =>
    userIdArray.then(idArray => ({ id: obj.likes_id, users: idArray })));

/*
  ***********************************************************************

  Initializes the database with dummy information

  ***********************************************************************
*/

knex.initDB = () => Promise.all([
  knex('channels').insert([
    { id: 1, name: 'land', background: 'https://i.ytimg.com/vi/shTUk4WNWVU/maxresdefault.jpg' },
    { id: 2, name: 'sea', background: 'https://upload.wikimedia.org/wikipedia/commons/5/53/GabrielMedina-001.jpg' },
    { id: 3, name: 'air', background: 'https://i.ytimg.com/vi/apYEQlGlUAY/maxresdefault.jpg' },
  ]),
  knex('users').insert([
    { name: 'Joe' },
    { name: 'Frank' },
    { name: 'Rob' },
    { name: 'Ryan' },
    { name: 'Gilbert' },
  ]),
  knex('videos').insert([
    { url: 'OMflBAXJJKc', channel_id: 1 },
    { url: 'x76VEPXYaI0', channel_id: 1 },
    { url: 'evj6y2xZCnM', channel_id: 1 },
    { url: '5XpU5M0ZCKM', channel_id: 2 },
    { url: '-hfKtUT4ISs', channel_id: 2 },
    { url: 'JYYsAxC0Dic', channel_id: 2 },
    { url: 'rbFvzRsDBN4', channel_id: 3 },
    { url: '-C_jPcUkVrM', channel_id: 3 },
    { url: 'FHtvDA0W34I', channel_id: 3 },
  ]),
  knex('likes').insert([
    { start_time: 43, stop_time: 48, video_id: 1, channel_id: 1 },
    { start_time: 74, stop_time: 82, video_id: 1, channel_id: 1 },
    { start_time: 38, stop_time: 42, video_id: 2, channel_id: 1 },
    { start_time: 70, stop_time: 90, video_id: 3, channel_id: 1 },
    { start_time: 29, stop_time: 52, video_id: 4, channel_id: 2 },
    { start_time: 80, stop_time: 98, video_id: 4, channel_id: 2 },
    { start_time: 147, stop_time: 157, video_id: 5, channel_id: 2 },
    { start_time: 11, stop_time: 34, video_id: 6, channel_id: 2 },
    { start_time: 20, stop_time: 38, video_id: 7, channel_id: 3 },
    { start_time: 52, stop_time: 80, video_id: 7, channel_id: 3 },
    { start_time: 170, stop_time: 194, video_id: 7, channel_id: 3 },
    { start_time: 95, stop_time: 116, video_id: 8, channel_id: 3 },
    { start_time: 47, stop_time: 64, video_id: 9, channel_id: 3 },
  ]),
  knex('likes_by_user').insert([
    { user_id: 1, likes_id: 1 },
    { user_id: 2, likes_id: 1 },
    { user_id: 4, likes_id: 1 },
    { user_id: 2, likes_id: 2 },
    { user_id: 3, likes_id: 2 },
    { user_id: 4, likes_id: 2 },
    { user_id: 1, likes_id: 3 },
    { user_id: 3, likes_id: 3 },
    { user_id: 4, likes_id: 3 },
    { user_id: 2, likes_id: 4 },
    { user_id: 5, likes_id: 4 },
    { user_id: 1, likes_id: 5 },
    { user_id: 3, likes_id: 5 },
    { user_id: 4, likes_id: 5 },
    { user_id: 2, likes_id: 6 },
    { user_id: 4, likes_id: 6 },
    { user_id: 5, likes_id: 6 },
    { user_id: 1, likes_id: 7 },
    { user_id: 2, likes_id: 7 },
    { user_id: 2, likes_id: 8 },
    { user_id: 4, likes_id: 8 },
    { user_id: 5, likes_id: 8 },
    { user_id: 1, likes_id: 9 },
    { user_id: 2, likes_id: 9 },
    { user_id: 2, likes_id: 10 },
    { user_id: 3, likes_id: 10 },
    { user_id: 4, likes_id: 10 },
    { user_id: 2, likes_id: 11 },
    { user_id: 5, likes_id: 11 },
    { user_id: 2, likes_id: 12 },
    { user_id: 3, likes_id: 12 },
    { user_id: 4, likes_id: 12 },
    { user_id: 5, likes_id: 12 },
    { user_id: 2, likes_id: 13 },
    { user_id: 3, likes_id: 13 },
    { user_id: 4, likes_id: 13 },
  ]),
]);

/*
  ***********************************************************************

  Clears all information from the database and resets id counters to 0.

  ***********************************************************************
*/

knex.clear = () => Promise.all([
  knex('channels').truncate(),
  knex('users').truncate(),
  knex('videos').truncate(),
  knex('likes').truncate(),
  knex('likes_by_user').truncate(),
  knex('ignores').truncate(),
]);

/*
  ***********************************************************************

  Resets the database to dummy values.

  ***********************************************************************
*/

knex.runInitDB = () =>
  knex.clear()
  .then(() => knex.initDB())
  .then(() => 'Database initialized!');

/*
  ***********************************************************************
  creates or finds user
  ***********************************************************************
*/
knex.followSomeone = function(myId, theirId){
  return knex.select('*').from('following').where({user_id_follower: myId, user_id_followee: theirId})
      .then(function(results){
        if(!results.length){
          return knex('following').insert({user_id_follower: myId, user_id_followee: theirId})
            .then(function(result){
              return result;
              console.log('entered in the following table');
        })
          
        }
        else{
          console.log('already following');
        }
      });
}

knex.findOrCreate = function(profile){
  return knex('users').where('id', profile.id)
  .then(function(user){
    if(user.length){ //user should be an array
      return user[0];
    }else{
      return knex('users').insert({name: profile.displayName, id: profile.id})
      .then(function(id){
        return {name: profile.displayName, id: profile.id}
      })
    }
  })  
}

/*
  ***********************************************************************
  finds the user
  ***********************************************************************
*/
knex.findUser = function(id){
  return knex('users').where('id', id)
  .then(function(user){
    return user[0];
  })
  .catch(function(err){
    console.error('user does noe exist in db: ', err);
  })
};

knex.findAllUsers = function(){
  // console.log('LALALALALALALALA');
  return knex.select('*').from('users')
    .then(function(allUsers){
      console.log('DB FIND ALL USERS', allUsers)
      return allUsers;
    })
    .catch(function(err){
      console.log('failed to get all users: ', err);
    })
}

knex.findAllFollowers = function(currUserId){
  return knex.select('user_id_followee').from('following').where('user_id_follower', currUserId)
    .then(function(followeesIds){
      var promises = [];
        followeesIds.map(like=>{
          promises.push(
            knex.select('*').from('users').where('id',like.user_id_followee)
              .then(function(results){
                console.log('IM RESULTS', results);
                return results
              })
            )
        })
      return Promise.all(promises)
             .then(function(followers){
              return followers.map(f=>f[0]);
             })
    })
    .catch(function(err){
      console.log('failed to get all users: ', err);
    })
}
knex.unfollow= function(myId, theirId){
  return knex.delete('*').from('following').where({'user_id_follower': myId, 'user_id_followee': theirId})
    .then(function(results){
      console.log("following removed from database")
    })
}

knex.areFollowing = function(myId, theirId){
  return knex.select('*').from('following').where({'user_id_follower': myId, 'user_id_followee': theirId})
    .then(function(result){
      return result;
    })
}

module.exports = knex;

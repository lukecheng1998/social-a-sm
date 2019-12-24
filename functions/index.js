const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const FBAuth = require('./util/fbAuth');



// Your web app's Firebase configuration


// const firebase = require('firebase');
// firebase.initializeApp(config);

const db = admin.firestore();
//routing screams to screams.js
const {getAllScreams, 
    postOneScream, 
    getScream, 
    commentOnScream
} = require('./handlers/screams');
const {
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser
} = require('./handlers/users');
//Gets the posts
//Scream routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
//TODO: delete scream
//TODO: like a scream
//TODO: unliking a scream
//TODO: comment on scream
app.post('/scream/:screamId/comment', FBAuth, commentOnScream)
//User routes
//Signup route
app.get('/user', FBAuth, getAuthenticatedUser);
app.post('/signup', signup);
//login route
app.post('/login', login);
app.post('/user', FBAuth, addUserDetails);
app.post('/user/image', FBAuth, uploadImage);





//Have to export our changes for express
//i.e. https://baseurl.com/url/...
exports.api = functions.https.onRequest(app);
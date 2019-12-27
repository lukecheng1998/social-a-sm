const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const FBAuth = require('./util/fbAuth');



// Your web app's Firebase configuration


// const firebase = require('firebase');
// firebase.initializeApp(config);

const db = require('./util/admin');
//routing screams to screams.js
const {getAllScreams, 
    postOneScream, 
    getScream, 
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream
} = require('./handlers/screams');
const {
    signup, 
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
} = require('./handlers/users');
//Gets the posts
//Scream routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
//delete scream
app.delete('/scream/:screamId', FBAuth, deleteScream);
//like a scream
app.get('/scream/:screamId/like',FBAuth, likeScream);
//unliking a scream
app.get('/scream/:screamId/unlike',FBAuth, unlikeScream);
//comment on scream
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
//User routes
//Signup route
app.get('/user', FBAuth, getAuthenticatedUser);
app.post('/signup', signup);
//login route
app.post('/login', login);
app.post('/user', FBAuth, addUserDetails);
app.post('/user/image', FBAuth, uploadImage);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);


//Have to export our changes for express
//i.e. https://baseurl.com/url/...
exports.api = functions.https.onRequest(app);
exports.createNotificationOnLike = functions
//.region('us-central1')
.firestore.document('/likes/{id}')
.onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`)
    .get()
    .then((doc) => {
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                screamId: doc.id
            });
        }
    })
    .then(() => {
        return;
    })
    .catch((err) => {
        console.error(err);
        return;
    });
});
exports.deleteNotificationOnUnLike = functions
//.region('us-central1')
.firestore.document('likes/{id}')
.onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .then(() => {
        return;
    })
    .catch(err => {
        console.error(err);
        return;
    });
});
exports.createNotificationOnComment = functions
//.region('us-central1')
.firestore.document('comments/{id}')
.onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc => {
        if(doc.exists){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'comment',
                read: false,
                screamId: doc.id
            });
        }
    })
    .then(() => {
        return;
    })
    .catch(err => {
        console.error(err);
        return;
    });
});

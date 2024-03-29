const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const FBAuth = require('./util/fbAuth');
const cors = require('cors');
app.use(cors());


// Your web app's Firebase configuration


// const firebase = require('firebase');
// firebase.initializeApp(config);

const { db } = require('./util/admin');
//routing screams to screams.js
const {getAllScreams, 
    postOneScream, 
    getScream, 
    commentOnScream,
    likeScream,
    unlikeScream,
    deleteScream,
    sendAChat,
    getAllChats
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

app.post('/chats', FBAuth, sendAChat);
app.get('/chats', FBAuth, getAllChats);
//Have to export our changes for express
//i.e. https://baseurl.com/url/...
exports.api = functions.https.onRequest(app);
exports.createNotificationOnLike = functions
//.region('us-central1')
.firestore.document('likes/{id}')
.onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`)
    .get()
    .then((doc ) => {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
    .catch((err) => {
        console.error(err);
    });
});
exports.deleteNotificationOnUnLike = functions
//.region('us-central1')
.firestore.document('likes/{id}')
.onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .catch(err => {
        console.error(err);
        return;
    });
});
exports.createNotificationOnComment = functions
//.region('us-central1')
.firestore.document('comments/{id}')
.onCreate((snapshot) => {
    return db.doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc => {
        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
    .catch(err => {
        console.error(err);
        return;
    });
});

exports.onUserImageChange = functions.firestore.document('/users/{userId}')
.onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if(change.before.data().imageUrl !== change.after.data().imageUrl){
        const batch = db.batch();
        return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
            .then((data) => {
            data.forEach(doc => {
                const scream = db.doc(`/screams/${doc.id}`);
                batch.update(scream, {userImage: change.after.data().imageUrl});
            })
            return batch.commit();
        })
    }
})

exports.onScreamDelete = functions.firestore.document('/screams/{screamId}')
.onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db.collection('comments')
    .where('screamId', '==', screamId).get()
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/comments/${doc.id}`));
        })
        return db.collection('likes').where('screamId', '==', screamId);
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/likes/${doc.id}`));
        })
        return db.collection('notifications').where('screamId', '==', screamId);
    })
    .then(data => {
        data.forEach(doc => {
            batch.delete(db.doc(`/notifications/${doc.id}`));
        })
        return batch.commit();
    })
    .catch(err => console.error(err));
})
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
admin.initializeApp();



// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDfmZZ_67XHjyg0weyHVLBsm-MuhTOpcz4",
    authDomain: "social-a-f3a70.firebaseapp.com",
    databaseURL: "https://social-a-f3a70.firebaseio.com",
    projectId: "social-a-f3a70",
    storageBucket: "social-a-f3a70.appspot.com",
    messagingSenderId: "980869541447",
    appId: "1:980869541447:web:f9809297bd1c4b6e5e4b62",
    measurementId: "G-C7QJ4SXFR0"
  };

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();
//Gets the posts
app.get('/screams', (req, res) => {
    db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let screams = [];
        data.forEach((doc) => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });
        return res.json(screams);
    })
    .catch((err) => console.error(err));
});
//writes to posts
app.post('/scream', (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };
    db
    .collection('screams')
    .add(newScream)
    .then(doc => {
        res.json({message: `document ${doc.id} created successfully`});
    })
    .catch(err => {
        res.status(500).json({error: 'something went wrong'});
        console.log(err);
    })
});

//Signup route
let token, userId;
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };
    //TODO validate data

    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exists){
            //hopefully reroute this
            return res.status(400).json({handle: 'user already exists'});
        }else{
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then(data => {
        //How to return access token
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then(idToken => {
        token = idToken;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
        return res.status(201).json({token});
    })
    .catch(err => {
        console.error(err);
        if(err.code === 'auth/email-already-in-use'){
            return res.status(400).json({email: 'Email is already in use'})
        }else{
            return res.status(500).json({error: err.code});
        }
        
    })
})


//Have to export our changes for express
//i.e. https://baseurl.com/url/...
exports.api = functions.https.onRequest(app);
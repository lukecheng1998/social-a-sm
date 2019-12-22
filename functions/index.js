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
//Helper function for posting a scream
const FBAuth = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    }else{
        console.error('No token found');
        return res.status(403).json({error: 'Unauthorized'});
    }
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        req.user = decodedToken;
        console.log(decodedToken);
        return db.collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
        req.user.handle = data.docs[0].data().handle;
        return next();
    })
    .catch(err => {
        console.error('Error while verifying token ', err);
        return res.status(403).json(err);
    })
}
//Posts a scream
app.post('/scream', FBAuth, (req, res) => {
    if(req.body.body.trim() === ''){
        return res.status(400).json({body: 'Body must not be empty'});
    }
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
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

//Helper function for verification
const isEmpty = (string) => {
    if(string.trim() === ''){
        return true;
    }else{
        return false;
    }
}
const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)){
        return true;
    }else{
        return false;
    }
}
//Signup route
let token, userId;
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };
    let errors = {};
    if(isEmpty(newUser.email)){
        errors.email = 'Must not be empty'
    }else if(!isEmail(newUser.email)){
        errors.email = 'Email must be a valid email address'
    }
    if(isEmpty(newUser.password)){
        errors.password = 'Must not be empty'
    }
    if(newUser.password !== newUser.confirmPassword){
        errors.confirmPassword = 'Passwords must match'
    }
    if(isEmpty(newUser.handle)){
        errors.handle = 'Must not be empty'
    }
    //TODO validate data
    if(Object.keys(errors).length > 0){
        return res.status(400).json(errors);
    }


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
        
    });
});

//login route
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };
    let errors = {};
    if(isEmpty(user.email)){
        errors.email = 'Must not be empty'
    }
    if(isEmpty(user.password)){
        errors.password = 'Must not be empty'
    }
    if(Object.keys(errors).length > 0){
        return res.status(400).json(errors);
    }
    //actually login if no errors
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
        return data.user.getIdToken();
    })
    .then(token => {
        return res.json({token});
    })
    .catch(err => {
        console.error(err);
        if(err.code === 'auth/wrong-password'){
            return res.status(403).json({general: 'Wrong credentials, please try again'});
        }else{
            return res.status(500).json({error: err.code});
        }
        
    })
})

//Have to export our changes for express
//i.e. https://baseurl.com/url/...
exports.api = functions.https.onRequest(app);
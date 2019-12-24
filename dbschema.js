//Reference for database structure. Never used in real code
let db = {
    users: [
        {
        userId: 'e39aj32n9ggls3902ke',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2019-12-23T21:21:57.0000',
        //Extra credentials that are optional
        imageUrl: 'image/imageTitle',
        website: 'https://somewebsite.com',
        location: 'San Francisco, USA'
        }
    ],
    screams: [
        {
            userHandle: 'user',
            body: 'scream body',
            createdAt: '2019-03-15T23:53:0224',
            likeCount: 5,
            commentCount: 2
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'asdhgjasdfkwler2kdjfh',
            body: 'Hello World',
            createdAt: '2019-03-15T23:53:02.0000'
        }
    ],
    notifications :[
        {
            recipient: 'user',
            sender: 'johnn',
            read: 'true | false',
            screamId: 'fhewu3023nfasd02f',
            type: 'like | comment',
            createdAt: '2019-03-15T10:59:52.798Z'
        }
    ]
};
const userDetails = {
    credentials: {
        userId: '32N3KLJFOISADFS93JKLD',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2019-12-23T23:43:33.0000',
        bio: 'Hello World',
        webiste: 'https://userwebsite.com',
        location: 'San Francisco, USA'
    },
    likes: [
        {
            userHandle: 'user',
            screamId: 'DJ3iodjwejlh23'
        },
        {
            userHandle: 'user',
            screamId: '3IOdfjdfjhwelsdf'
        }
    ]
        

};
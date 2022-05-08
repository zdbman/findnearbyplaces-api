//Dependencies
const express = require('express');
const cors = require('cors');
//const { customers } = require('./temporarily_store/customers');
const { store } = require('./data_access/store');
const { response } = require('express');
const { password } = require('pg/lib/defaults');
const { request } = require('express');
const res = require('express/lib/response');
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local');
//const fileUpload = require('express-fileupload');
let userID;
const application = express();
const port = process.env.PORT || 4003;
//let frontendUrl = 'http://localhost:3000';
let frontendUrl = 'https://zdbman.github.io/';

//middlewares
//application.use(cors());
application.use(cors({
    origin: frontendUrl,
    credentials: true
}));
application.use(express.json());


application.use((request, response, next) => {
    console.log(`request url: ${request.url}`);
    console.log(`request method: ${request.method}`);
    //only for development.  Remove the next two line when you deploy your final version.
    console.log(`request body:`);
    console.log(request.body);
    next();
});

passport.use(
    new LocalStrategy({ usernameField: 'email' }, function verify(username, password, cb) {
        store.login(username, password)
            .then(x => {
                if (x.valid) {
                    userID = x.user.id;
                    return cb(null, x.user);
                } else {
                    return cb(null, false, { message: 'Incorrect username or password.' });
                }
            })
            .catch(e => {
                console.log(e);
                cb('Somethign went wrong!');
            });

    }));

application.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: 'sessions.db', dir: './sessions' })
}));
application.use(passport.authenticate('session'));

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

//Methods
application.get('/', (request, response) => {
    response.status(200).json({ done: true, message: "Done" });
});

application.get('/search/', (request, response) => {
    let search_term = request.body.search_term;
    let user_location = request.body.user_location;
    let radius_filter = request.body.radius_filtr;
    let maximum_results_to_return = request.body.maximum_results_to_return;
    let category_filter = request.body.category_filter;
    let sort = request.body.sort;

    store.search(search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort)
        .then(x => response.status(200).json({ done: true, message: "" }))
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "The customer was not added due to an error." });
        });
});

application.post('/register', (request, response) => {
    let email = request.body.email;
    let password = request.body.password;
    //console.log(name, email, password);
    store.customer(email, password)
        .then(x => response.status(200).json({ done: true, message: "Customer Registration Successful" }))
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "The customer was not added due to an error." });
        });
});

/*application.post('/login-old', (request, response) => {
    let email = request.body.email;
    let password = request.body.password;
    store.login(email, password)
    .then(x => {
        if(x.valid){
            response.status(200).json({done: true, message: 'Login Successful'});
        }else{
            response.status(401).json({done: false, message: x.message});
        }
    })
    .catch(e => {
        console.log(e);
        response.status(500).json({done: false, message: 'Login Error'});
    });
});*/

application.post('/login', passport.authenticate('local', {
    successRedirect: '/login/succeeded',
    failureRedirect: '/login/failed'
}));

application.get('/login/succeeded', (request, response) => {
    response.status(200).json({ done: true, message: "Customer login successful" });
});

application.get('/login/failed', (request, response) => {
    response.status(401).json({ done: false, message: "Invalid Credentials" });
});


application.get('/search:search_term/:user_location/:radius_filter/:maximum_results_to_return/:category_filter/:sort', (request, response) => {
    let search_term = request.params.search_term;
    let user_location = request.params.user_location;
    let radius_filter = request.params.radius_filter;
    let maximum_results_to_return = request.params.maximum_results_to_return;
    let category_filter = request.params.category_filter;
    let sort = request.params.sort;

    store.place(search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort)
        .then(x => {
            response.status(200).json({ done: true, result: x });
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Something went wrong" });
        });
});

application.post('/posts', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: "Please sign in first." })
    } else {
        let name = request.body.name;
        let category = request.body.cat;
        let latitude = request.body.lat;
        let longitude = request.body.lon;
        let description = request.body.des;
        let customer = userID;
        console.log(customer);
        store.place(name, category, latitude, longitude, description, customer)
            .then(x => {
                response.status(200).json({ done: true, result: x.id, message: "Place Posted Successfully" });
            })
            .catch(e => {
                console.log(e);
                response.status(500).json({ done: false, message: 'Something went wrong' });
            });
    }
});

application.get('/restphoto/:id', (request, response) => {
    let id = request.params.id;
    store.getRestaurantPhoto(id)
        .then(x => {
            response.status(200).json({ done: true, result: x.result, message: x.message });
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: 'Something went wrong' });
        })
});

application.get('/place', (request, response) => {
    store.getLocation()
        .then(x => {
            if (x.done) {
                response.status(200).json({ done: true, result: x.result, message: x.message });
            } else {
                return { done: false, message: x.message };
            }
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: 'Something went wrong' })
        });
});

application.get('/restaurant/:id', (request, response) => {
    let loc_id = request.params.id;
    store.getRestaurant(loc_id)
        .then(x => {
            response.status(200).json({ done: x.found, result: x });
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Something went wrong" });
        });
});

application.get(`/restaurant/:id/reviews`, (request, response) => {
    let loc_id = request.params.id;
    store.getReviews(loc_id)
        .then(x => {
            response.status(200).json({ done: x.done, result: x.result });
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Something went wrong" });
        });

});

application.post('/category', (request, response) => {
    let name = request.body.name;
    store.category(name)
        .then(x => {
            response.status(200).json({ done: true, message: "Category Posted Successfully" });
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Category Failed to Post" })
        })
});

application.post('/photo', (request, response) => {
    let photo = request.body.photo;
    let place_id = request.body.place_id;
    let review_id = request.body.review_id;
    store.photo(photo, place_id, review_id)
        .then(x => {
            response.status(200).json({ done: true, message: 'test' });
        })
        .catch(e => {
            response.status(500).json({ done: false, message: 'Something went wrong' });
        })
});

application.post('/review', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: "Please sign in first." })
    } else {
        let place_id = request.body.place_id;
        let comment = request.body.comment;
        let rating = request.body.rating;
        let customer_id = userID;
        //console.log("test " + userID);
        store.review(place_id, comment, rating, customer_id)
            .then(x => {
                response.status(200).json({ done: true, id: x.id, message: x.message });
            })
            .catch(e => {
                response.status(500).json({ done: false, message: 'Something went wrong' });
            });
    }
});

application.put('/review', (request, response) => {
    let review_id = request.body.review_id;
    let comment = request.body.comment;
    let rating = request.body.rating;
    store.reviewUpdate(review_id, comment, rating)
        .then(x => {
            response.status(200).json({ done: true, message: 'Review Updated Successfully' });
        })
        .catch(e => {
            response.status(500).json({ done: false, message: 'Something went wrong' });
        });
});

application.put('/place/:place_id', (request, response) => {
    let place_id = request.params.place_id;
    let name = request.body.name;
    let category_id = request.body.category_id;
    let latitude = request.body.latitude;
    let longitude = request.body.longitude;
    let description = request.body.description;

    store.placeUpdate(place_id, name, category_id, latitude, longitude, description)
        .then(x => {
            response.status(200).json({ done: true, message: "Place Change Successful" });
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Change Failed" })
        });
});

application.delete('/place/:place_id', (request, response) => {
    let place_id = request.params.place_id;
    store.placeDelete(place_id)
        .then(x => {
            response.status(200).json({ done: true, message: "Place Successfully Deleted" })
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Deletion Failed" });
        });
});

application.delete('/review/:review_id', (request, response) => {
    let review_id = request.params.review_id;
    store.reviewDelete(review_id)
        .then(x => {
            response.status(200).json({ done: true, message: "Review Successfully Deleted" })
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Deletion Failed" });
        });
});

application.delete('/photo/:photo_id', (request, response) => {
    let photo_id = request.params.photo_id;
    store.photoDelete(photo_id)
        .then(x => {
            response.status(200).json({ done: true, message: "Photo Successfully Deleted" })
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Deletion Failed" });
        });
});

application.post('/logout', function (request, response) {
    request.logout();
    response.json({ done: true, message: 'The customer signed out successfully.' });
});

application.listen(port, () => {
    console.log(`Listening to the port ${port}`);
});
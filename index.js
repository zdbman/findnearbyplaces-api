//Dependencies
const express = require('express');
const cors = require('cors');
//const { customers } = require('./temporarily_store/customers');
const { store } = require('./data_access/store');
const { response } = require('express');
const { password } = require('pg/lib/defaults');

const application = express();
const port = process.env.PORT || 4003;

//middlewares
application.use(cors());
application.use(express.json());

//Methods
application.get('/', (request, response) => {
    response.status(200).json({ done: true, message: "Done" });
});

/*application.get('/search', (request, response) => {
    let search_term = request.body.search_term;
    let user_location = request.body.user_location;
    let radius_filtr = request.body.radius_filtr;
    let maximum_results_to_return = request.body.maximum_results_to_return;
    let category_filter = request.body.category_filter;

    store.addCustomer(name, email, radius_filter)
        .then(x => response.status(200).json({ done: true, message: "Customer Registration Successful" }))
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "The customer was not added due to an error." });
        });
});*/

application.post('/register', (request, response) => {
    let email = request.body.email;
    let password = request.body.password;
    //console.log(name, email, password);
    store.register(email, password)
        .then(x => response.status(200).json({ done: true, message: "Customer Registration Successful" }))
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "The customer was not added due to an error." });
        });
});

application.post('/login', (request, response) => {
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
});

application.listen(port, () => {
    console.log(`Listening to the port ${port}`);
});
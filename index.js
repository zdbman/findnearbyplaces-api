//Dependencies
const express = require('express');
const cors = require('cors');
const { customers } = require('./temporarily_store/customers');
const { store } = require('./data_access/store');

const application = express();
const port = process.env.PORT || 4003;

//middlewares
application.use(cors());
application.use(express.json());

//Methods
application.get('/', (request, response) => {
    response.status(200).json({done: true, message: "Done"});
});

application.post('/register', (request, response) => {
    let name = request.body.name;
    let email = request.body.email;
    let password = request.body.password;
    store.addCustomer(name, email, password)
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
            if (x.valid) {
                response.status(200).json({ done: true, message: "Customer login successful" });
            } else {
                response.status(401).json({ done: false, message: x.message });
            }
        })
        .catch(e => {
            console.log(e);
            response.status(500).json({ done: false, message: "Something went wrong." });
        });
});

application.listen(port, () => {
    console.log(`Listening to the port ${port}`);
});
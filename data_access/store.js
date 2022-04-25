const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString =
    `postgres://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`;


console.log("Connection:", connectionString);

const connection = {
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: { rejectUnauthorized: false }
}
const pool = new Pool(connection);

//console.log("Pool:", pool);

let store = {
    register: (email, password) => {
        //console.log(name, email, password);
        const hash = bcrypt.hashSync(password, 10);
        return pool.query('insert into yelp.customer (email, password) values ($1, $2)', [email, hash]);
    },

    login: (email, password) => {
        return pool.query('select email, password from yelp.customer where email = $1', [email])
            .then(x => {
                if (x.rows.length == 1) {
                    let valid = bcrypt.compareSync(password, x.rows[0].password);
                    if (valid) {
                        return { valid: true };
                    } else {
                        return { valid: false, message: "Credentials not valid." }
                    }
                } else {
                    return { valid: false, message: "Email not found." }
                }
            });
    },

    place: (name, category_id, latitude, longitude, description) => {
        return pool.query('insert into yelp.loc (name, category_id, latitude, longitude, description) values($1, $2, $3, $4, $5)', [name, category_id, latitude, longitude, description]);
    },
}

module.exports = { store }
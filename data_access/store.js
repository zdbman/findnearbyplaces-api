const bcrypt = require('bcrypt');
const { is } = require('express/lib/request');
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
    customer: (email, password) => {
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
        return pool.query('insert into yelp.loc (name, latitude, longitude, description, category_id) values($1, $2, $3, $4, $5)', [name, latitude, longitude, description, category_id]);
    },

    getPlaceId: (name, category_id, latitude, longitude, description) => {
        return pool.query('select id from yelp.loc where (name=$1) and (latitude=$2) and (longitude=$3) and (description=$4) and (category_id=$5) order by id desc limit 1', [name, latitude, longitude, description, category_id])
        .then(x => {
            if(x.rows.length > 0){
                return { done: true, id: x.rows, message: "ID Found" };
            }else{
                return { done: false, message: 'No ID' };
            }
        });
    },

    category: (name) => {
        return pool.query('insert into yelp.category (name) values ($1)', [name.toLowerCase()]);
    },

    photo: (photo, place_id, review_id) => {
        let sqlQuery;
        if(place_id == null){
            sqlQuery = 'insert into yelp.place_photo ()'
        }
    },

    placeUpdate: (place_id, name, category_id) => {
        console.log(place_id, name, category_id);
        let sqlQuery = 'update yelp.loc set';
        let lst = []
        if(name){
            sqlQuery += ' name=$2';
            if(category_id){
                sqlQuery += ',';
            }
        }
        if(category_id){
            sqlQuery += ' category_id=$3';
        }

        sqlQuery += ' where id = $1'
        return pool.query(sqlQuery, [place_id, name, category_id]);
    },

    placeDelete: (place_id) => {
        return pool.query('delete from yelp.loc where id=$1', [place_id]);
    },

    reviewDelete: (review_id) => {
        return pool.query('delete from yelp.reviews where id=$1', [review_id]);
    },

    reviewDelete: (photo_id) => {
        return pool.query('delete from yelp.photo where id=$1', [photo_id]);
    }
}

module.exports = { store }
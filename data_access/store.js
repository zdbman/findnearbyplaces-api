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
        return pool.query('select id, email, password from yelp.customer where email = $1', [email])
            .then(x => {
                if (x.rows.length == 1) {
                    let valid = bcrypt.compareSync(password, x.rows[0].password);
                    if (valid) {
                        return { valid: true, user: {id: x.rows[0].id, username: x.rows[0].email} };
                    } else {
                        return { valid: false, message: "Credentials not valid." }
                    }
                } else {
                    return { valid: false, message: "Email not found." }
                }
            });
    },

    getLocation: () => {
        return pool.query('select * from yelp.loc')
        .then(x => {
            if(x.rows.length > 0){
                return { done: true, result: x.rows, message: "Restaurants Found!" };
            }else{
                return { done: false, message: 'No Restaurants' };
            }
        });
    },

    /*search: (search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort) =>{
        let sqlQuery;
        function getDistance(latitude1, longitude1, latitude2, longitude2){   
            let y = latitude2 - latitude1;    
            let x = longitude2 - longitude1;        
            return Math.sqrt(x * x + y * y);   
        }
        /*let lst = [];
        if(search_term){
            sqlQuery = "select * from yelp.loc where name like '%$1%'";
            lst.push(search_term);
        }
        else if(user_location){
            sqlQuery = "select * from yelp.loc where name like '%$1%'";
            lst.push(search_term);
        }

        else if(maximum_results_to_return){
            sqlQuery = "select * from yelp.loc limit $1";
            lst.push(maximum_results_to_return);
        }
        else if(category_filter){
            sqlQuery = "select l.* from yelp.category c join yelp.loc l on c.id = l.category_id where lower(c.name) = lower($1);";
            lst.push(category_filter);
        }
        console.log('test');
        let radius = user_location;
        return pool.query("select * from yelp.loc where name like '%$1%' OR ", [search_term, ])
        .then(x => {
            return {done: true, result: x.rows}
        });
        sqlQuery = "select * from yelp.loc inner join yelp.category on yelp.category.id  = yelp.loc.category_id where lower(yelp.loc.name) like lower(%$1%) or lower(yelp.category.name) like '%$1%'";
        return pool.query(sqlQuery, [search_term])
        .then(x => {
            return {done: true, result: x.rows}
        })
        .catch(e => {
            console.log(e);
            return {done: false, message: 'Could not search'}
        });
    },*/

    place: (name, category_id, latitude, longitude, description, customer_id) => {
        return pool.query('insert into yelp.loc (name, latitude, longitude, description, category_id, customer_id) values($1, $2, $3, $4, $5, $6) returning id', [name, latitude, longitude, description, category_id, customer_id])
        .then(x => {
            return {done: true, id: x.rows[0].id, message: "ID Found"}
        })
    },

    category: (name) => {
        return pool.query('insert into yelp.category (name) values ($1)', [name.toLowerCase()]);
    },

    review: (place_id, comment, rating, customer_id) => {
        console.log(place_id, customer_id, comment, rating);
        return pool.query('insert into yelp.reviews (location_id, customer_id, text, rating) values($1, $2, $3, $4) returning id', [place_id, customer_id, comment, rating])
        .then(x => {
            return {done: true, id: x.rows[0].id, message: 'Review Posted Successfully'}
        });
    },

    reviewUpdate: (review_id, comment, rating) => {
        let sqlQuery = 'update yelp.reviews set';
        let lst = []
        let index = 1;
        let values = [];
        if(comment){
            lst.push(' text=$' + index);
            index++;
            values.push(comment);
        }
        if(rating){
            lst.push(' rating=$' + index);
            index++;
            values.push(rating);
        }
        sqlQuery += lst.join(', ');
        sqlQuery += 'where id = $' + index;
        values.push(review_id);
        return pool.query(sqlQuery, values);
    },

    photo: (photo, place_id, review_id) => {
        let sqlQuery;
        if(review_id == null){
            sqlQuery = 'insert into yelp.place_photo (location_id, photo_id) values ($1, $2)';
        }else{
            sqlQuery = 'insert into yelp.review_photo (review_id, photo_id) values ($1, $2)';
        }
        //return pool.query(sqlQuery, []);
    },

    placeUpdate: (place_id, name, category_id, latitude, longitude, description) => {
        console.log(place_id, name, category_id, latitude, longitude, description);
        let sqlQuery = 'update yelp.loc set';
        let lst = []
        let index = 1;
        let values = [];
        if(name){
            lst.push(' name=$' + index);
            index++;
            values.push(name);
        }
        if(category_id){
            lst.push(' category_id=$' + index);
            index++;
            values.push(category_id);
        }
        if(latitude){
            lst.push(' latitude=$' + index);
            index++;
            values.push(latitude);
        }
        if(longitude){
            lst.push(' longitude=$' + index);
            index++;
            values.push(longitude);
        }
        if(description){
            lst.push(' description=$' + index);
            index++;
            values.push(description);
        }
        sqlQuery += lst.join(', ');
        sqlQuery += 'where id = $' + index;
        values.push(place_id);
        return pool.query(sqlQuery, values);
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
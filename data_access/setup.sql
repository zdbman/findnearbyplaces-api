create schema if not exists yelp;

drop table if exists yelp.place_photo;
drop table if exists yelp.review_photo;
drop table if exists yelp.reviews;
drop table if exists yelp.loc;
drop table if exists yelp.category;
drop table if exists yelp.customer;
drop table if exists yelp.photo;

create table yelp.category
(
	id bigserial primary key,
	name varchar(30)
);

create table yelp.customer
(
	id bigserial primary key,
	email varchar(256) not null unique,
	password varchar(100) not null
);

create table yelp.loc
(
	id bigserial primary key unique,
	name varchar(256) not null,
	latitude varchar(100) not null,
	longitude varchar(100) not null,
	description varchar(512) not null,
	category_id int references yelp.category(id),
	customer_id int references yelp.customer(id)
);

create table yelp.reviews
(
	id bigserial primary key,
	location_id int references yelp.loc(id),
	customer_id int references yelp.customer(id),
	text varchar(512) not null,
	rating varchar(2) not null
);

create table yelp.photo
(
	id bigserial primary key,
	file varchar(400) not null
);

create table yelp.place_photo
(
	location_id int references yelp.loc(id),
	photo_id int references yelp.photo(id)
);

create table yelp.review_photo
(
	review_id int references yelp.reviews(id),
	photo_id int references yelp.photo(id)
);
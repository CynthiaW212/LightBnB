const properties = require("./json/properties.json");
const users = require("./json/users.json");

const {Pool} = require('pg');

const pool = new Pool({
  user:'labber',
  password: '123',
  host:'localhost',
  database:'lightbnb'
});

const getAllProperties = (options, limit = 10) => {
  
  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night * 100));
    queryString += `AND properties.cost_per_night >= $${queryParams.length} `;
  }
  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night * 100));
    queryString += `AND properties.cost_per_night <= $${queryParams.length} `;
  }
  
  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    queryString += `AND properties.owner_id = $${queryParams.length} `;
  }

  queryString += `
  GROUP BY properties.id`;
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length}
  `;

  console.log(queryString, queryParams);

  return pool
    .query(queryString,queryParams)
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err);
      return err.message;
    });
};

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithEmail = function (email) {
//   let resolvedUser = null;
//   for (const userId in users) {
//     const user = users[userId];
//     if (user.email.toLowerCase() === email.toLowerCase()) {
//       resolvedUser = user;
//     }
//   }
//   return Promise.resolve(resolvedUser);
// };
const getUserWithEmail = function(email) {
  const queryString = `SELECT id, name, email, password FROM users WHERE email = $1`;
  return pool
    .query(queryString,[email.toLowerCase()])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return err.message;
    });
};
/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithId = function (id) {
//   return Promise.resolve(users[id]);
// };
const getUserWithId = function(id) {
  const queryString = `SELECT id, name, email, password FROM users WHERE id = $1`;
  return pool
    .query(queryString,[id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return err.message;
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// const addUser = function (user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// };
const addUser = function(user) {
  const queryString = `INSERT INTO users(name, email, password) VALUES($1,$2,   '$2a$10$FB/BOAVhpuLvpOREQVmvmezD4ED/.JBIDRh70tGevYzYzQgFId2u.') RETURNING *`;
  return pool
    .query(queryString,[user.name, user.email])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return err.message;
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guestId, limit = 10) {
  // return getAllProperties(null, 2);
  const queryString = `SELECT reservations.*, properties.*
                      FROM reservations
                      JOIN properties ON properties.id = property_id
                      JOIN property_reviews ON reservations.id = reservation_id
                      WHERE reservations.guest_id = $1
                      GROUP BY properties.id,reservations.id
                      ORDER BY reservations.start_date
                      LIMIT $2`;
  return pool
    .query(queryString,[guestId, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err);
      return err.message;
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
// const getAllProperties = function (options, limit = 10) {
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   return Promise.resolve(limitedProperties);
// };

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};

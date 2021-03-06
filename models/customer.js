"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /* search a user, first name only returns first match,
     full name responds more accurate  */
  static async search(name) {

    let nameObj = name.split(" ")
    let results;

    if(nameObj.length < 2){
      results = await db.query(
        `SELECT id,
          first_name, 
          last_name,
          phone,
          notes
        FROM customers  
        WHERE first_name = $1 `,
         [nameObj[0]])
    } else {

      results = await db.query(
      `SELECT id,
        first_name, 
        last_name,
        phone,
        notes
      FROM customers  
      WHERE first_name = $1 AND last_name = $2`,
       [nameObj[0], nameObj[1]])
    }

    const customer = results.rows[0];
    console.log("CUSTOMER QUERY RESP ===>",  customer)
    
    if (customer === undefined) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** search DB for top 10 customers with most reservations */
  static async getTopCustomers() {
    console.log("IN THE TOP CUSTOMER FUNCTION");
    const results = await db.query(
      `SELECT customers.id, customers.first_name, customers.last_name, count(reservations.customer_id) as COUNT 
      FROM customers 
      JOIN reservations ON customers.id=reservations.customer_id 
      GROUP BY (customers.id, customers.first_name, customers.last_name) 
      ORDER BY COUNT DESC
      LIMIT 10;
      `);
    console.log("results method are ---->", results);
    const customers = await Promise.all(results.rows.map(c => Customer.get(c.id)));
    return await customers;
  }

  /** Gets a customers full name */
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
}

module.exports = Customer;

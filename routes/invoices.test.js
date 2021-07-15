process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async function () {
  await db.query(`
   DROP TABLE IF EXISTS companies cascade;
   DROP TABLE IF EXISTS invoices cascade;
   
   CREATE TABLE companies (
       code text PRIMARY KEY,
       name text NOT NULL UNIQUE,
       description text
   );
   
   CREATE TABLE invoices (
       id serial PRIMARY KEY,
       comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
       amt float NOT NULL,
       paid boolean DEFAULT false NOT NULL,
       add_date date DEFAULT CURRENT_DATE NOT NULL,
       paid_date date,
       CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
   );
   
   INSERT INTO companies
     VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
            ('ibm', 'IBM', 'Big blue.');
   
   INSERT INTO invoices (comp_Code, amt, paid, paid_date)
     VALUES ('apple', 100, false, null),
            ('apple', 200, false, null),
            ('apple', 300, true, '2018-01-01'),
            ('ibm', 400, false, null);`);
});

afterEach(async () => {
  await db.query(`DELETE FROM invoices`);
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get a list of invoices", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [
        {
          id: 1,
          comp_code: "apple",
        },
        {
          id: 2,
          comp_code: "apple",
        },
        {
          id: 3,
          comp_code: "apple",
        },
        {
          id: 4,
          comp_code: "ibm",
        },
      ],
    });
  });
});

describe("GET /invoices/:code", () => {
  test("Gets a single invoice", async () => {
    const res = await request(app).get(`/invoices/1`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        id: 1,
        comp_code: "apple",
        amt: 100,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Creates a new invoice", async () => {
    let newInvoice = {
      comp_code: "ibm",
      amt: 2,
    };
    const res = await request(app).post("/invoices").send(newInvoice);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        comp_code: "ibm",
        amt: 2,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });
});

describe("PUT /invoices/:id", () => {
  test("Updates amount or paid status", async () => {
    const res = await request(app)
      .put(`/invoices/1`)
      .send({ amt: 200, paid: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        comp_code: "apple",
        amt: 200,
        paid: true,
        add_date: expect.any(String),
        paid_date: expect.any(String),
      },
    });
  });
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).put("/invoices/788888").send({ amt: 200 });
    expect(res.statusCode).toBe(404);
  });
  test("Responds with 500 for no amount in request", async () => {
    const res = await request(app).put(`/invoices/1`).send({});
    expect(res.statusCode).toBe(500);
  });
});
describe("DELETE /invoices/:CODE", () => {
  test("Deletes an invoice", async () => {
    const res = await request(app).delete(`/invoices/1`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ msg: "Invoice was deleted" });
  });
});

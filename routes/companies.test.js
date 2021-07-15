process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('npr', 'National Public Radio', 'non-profit radio station') RETURNING  code, name, description`
  );
  testCompany = result.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list with one company", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const res = await request(app).get(`/companies/npr`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "npr",
        description: "non-profit radio station",
        industries: [],
        invoices: [],
        name: "National Public Radio",
      },
    });
  });
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/limitedtoo`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Creates a single company", async () => {
    let company = { name: "Google", description: "a company" };
    const res = await request(app).post("/companies").send(company);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: { code: "google", name: "Google", description: "a company" },
    });
  });
});

describe("PUT /companies/:code", () => {
  test("Updates a single company", async () => {
    const res = await request(app)
      .put(`/companies/npr`)
      .send({ name: "NPRR", description: "radio and stuff" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: "npr",
        name: "NPRR",
        description: "radio and stuff",
      },
    });
  });
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app)
      .put(`/companies/qwerty`)
      .send({ description: "radio and stuff" });
    expect(res.statusCode).toBe(404);
  });
});
describe("DELETE /companies/:CODE", () => {
  test("Deletes a single company", async () => {
    const res = await request(app).delete(`/companies/npr`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ msg: "Company was deleted" });
  });
});

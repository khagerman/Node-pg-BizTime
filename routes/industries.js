const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code FROM industries`);

    let industries = {};
    for (let row of results.rows) {
      let { code } = row;

      const industry = await db.query(
        `SELECT industries.code, companies.name FROM industries JOIN companies_industries
        ON industries.code =industry_code JOIN companies ON companies.code = company_code WHERE company_code = ${code}`
      );
      const companies = results.rows.map((c) => c.name);
      industries[industry].companies = companies;
    }
    return res.json(industry);
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { industry } = req.body;
    let code = slugify(industry, { lower: true });
    const results = await db.query(
      "INSERT INTO companies (code, industry) VALUES ($1, $2) RETURNING  code, industry",
      [code, industry]
    );
    return res.status(201).json({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;

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
        `SELECT company_code FROM companies_industries WHERE industry_code = '${code}'`
      );
      const companies = industry.rows.map((c) => c.company_code);
      industries[code] = companies;
    }
    return res.json(industries);
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

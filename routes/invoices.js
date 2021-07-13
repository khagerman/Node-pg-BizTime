const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query("SELECT * FROM invoices WHERE id = $1", [
      id,
    ]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id of ${id}`, 404);
    }
    return res.send({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt, paid, add_date, paid_date } = req.body;
    const results = await db.query(
      "INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) VALUES ($1, $2, $3, $4, $5) RETURNING  comp_code, amt, paid, add_date, paid_date",
      [comp_code, amt, paid, add_date, paid_date]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  const paidStatus = await db.query(`SELECT paid FROM invoices WHERE id = $1,
        [id]`);

  try {
    const { id } = req.params;
    const { amt, paid } = req.body;
    let paidDate;
    const paidStatus = await db.query(`SELECT paid FROM invoices WHERE id = $1,
        [id]`);
    const paidStatusDate = paidStatus.rows[0].paid_date;
    if (paidStatusDate == null && paid == true) {
      paidDate = new Date();
    } else if (paidStatusDate == null && paid == false) {
      paidDate == null;
    } else {
      paidDate = paidStatusDate;
    }
    const results = await db.query(
      "UPDATE invoices SET amt=$2, paid=$3, paid_date=$4 WHERE id=$1 RETURNING comp_code, amt, paid, add_date, paid_date",
      [id, amt, paid, paidDate]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update invoice with id of ${id}`, 404);
    }
    return res.send({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const results = db.query("DELETE FROM invoices WHERE id= $1", [
      req.params.id,
    ]);
    return res.send({ msg: "Invoice was deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;

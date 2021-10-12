const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();
const db = require('../db');
const slugify = require('slugify');

router.get('/', async(req, res, next) => {
    try {
        const results = await db.query(
            `SELECT i.code, i.industry, b.comp_code 
            FROM industries AS i
            LEFT JOIN business AS b on i.code = b.ind_code`
        );
        return res.json({ industries: results.rows });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async(req, res, next) => {
    try {
        let { industry } = req.body;
        let code = slugify(industry, { lower: true, trim: true });

        const results = await db.query(
            `INSERT INTO industries (code, industry) 
             VALUES ($1, $2)
             RETURNING code, industry`, [code, industry]
        );

        return res.status(201).json({ industry: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

router.post('/:code', async(req, res, next) => {
    try {
        let code = req.params.code;
        let { company } = req.body;

        const industryResult = await db.query(
            `SELECT code, industry
            FROM industries
            WHERE code =$1`, [code]
        );
        if (industryResult.rows.length === 0) {
            return next(new ExpressError('Industry not found', 404));
        }

        const results = await db.query(
            `INSERT INTO business (comp_code, ind_code) 
             VALUES (
                 (SELECT code FROM companies WHERE name =$1 ),$2)
             RETURNING comp_code, ind_code`, [company, code]
        );

        return res.status(201).json({ business: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;
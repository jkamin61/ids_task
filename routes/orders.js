const express = require('express');
const {fetchOrders} = require('../services/ordersService');
const {parse} = require('json2csv');
const pool = require('../db/ordersPg');

const router = express.Router();

router.get('/fetch', async (req, res) => {
    try {
        await fetchOrders();
        res.json({success: true, message: 'Orders fetched and saved to DB.'});
    } catch (error) {
        res.status(500).json({error: 'Failed fetching orders'});
    }
});

router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    try {
        const result = await pool.query(`SELECT *
                                         FROM orders
                                         ORDER BY order_date DESC LIMIT $1
                                         OFFSET $2`, [limit, offset]);
        res.json({
            success: true,
            status: 200,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Internal server error'});
    }
});

router.get('/csv', async (req, res) => {
    try {
        const {minWorth, maxWorth} = req.query;
        const result = await pool.query('SELECT * FROM orders');
        let orders = result.rows;

        if (minWorth) orders = orders.filter(o => o.order_worth >= parseFloat(minWorth));
        if (maxWorth) orders = orders.filter(o => o.order_worth <= parseFloat(maxWorth));

        const csv = parse(orders, {fields: ['order_id', 'order_worth', 'products']});
        res.status(200)
            .header('Content-Type', 'text/csv')
            .attachment('orders.csv')
            .send(csv);
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 500,
            message: 'Failed to export CSV file. Please try again later.'
        });
    }
});

router.get('/:orderId', async (req, res) => {
    try {
        const {rows} = await pool.query('SELECT * FROM orders WHERE order_id = $1', [req.params.orderId]);
        if (rows.length === 0) {
            return res.status(404).json({success: false, message: 'Order not found'});
        }
        res.json({success: true, data: rows[0]});
    } catch (error) {
        console.error('Error handling request:\n', error.message);
        res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
});

module.exports = router;
const express = require('express');
const { fetchOrders } = require('../services/ordersService');
const { parse } = require('json2csv');

const router = express.Router();

router.get('/csv', async (req, res) => {
    try {
        let filteredOrders = await fetchOrders();
        const {minWorth, maxWorth} = req.query;
        if (minWorth) filteredOrders = filteredOrders.filter(o => o.orderWorth >= parseFloat(minWorth));
        if (maxWorth) filteredOrders = filteredOrders.filter(o => o.orderWorth <= parseFloat(maxWorth));

        const csv = parse(filteredOrders, {fields: ['orderID', 'orderWorth', 'products']});
        res.header('Content-Type', 'text/csv');
        res.attachment('orders.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error handling request:\n', error.message);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

router.get('/:orderId', async (req, res) => {
    try {
        const orders = await fetchOrders();
        const order = orders.find(o => o.orderID === req.params.orderId);

        if (!order) {
            console.log("Could not find order:", req.params.orderId);
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Order not found",
                orderID: req.params.orderId
            });
        }
        res.json({
            success: true,
            status: 200,
            data: order
        });
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

const axios = require('axios');
const pool = require('../db/ordersPg.js');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const fetchOrders = async () => {
    let orders = [];
    let pageNumber = 6;
    const pageSize = 100;

    while (true) {
        const response = await axios.get(API_URL, {
            headers: {
                'X-API-KEY': API_KEY,
                'Accept': 'application/json'
            },
            params: {pageNumber, pageSize}
        });

        if (!response.data || !response.data.Results || response.data.Results.length === 0) {
            break;
        }

        orders = response.data.Results.map(order => ({
            orderID: order.orderId,
            products: JSON.stringify(
                order.orderDetails.productsResults.map(product => ({
                    productID: product.productId,
                    quantity: product.productQuantity
                }))
            ),
            orderWorth: order.orderDetails.payments.orderBaseCurrency.orderProductsCost || 0,
            orderDate: order.orderDetails.orderAddDate || new Date().toISOString()
        }));

        pageNumber++;
    }
    await saveOrdersToDB(orders);

};


const saveOrdersToDB = async (orders) => {
    if (orders.length === 0) {
        return;
    }

    for (let order of orders) {
        try {
            await pool.query(
                `INSERT INTO orders (order_id, products, order_worth, order_date)
                 VALUES ($1, $2, $3, $4)`,
                [order.orderID, JSON.stringify(order.products), order.orderWorth, order.orderDate]
            );
        } catch (error) {
            console.error(error.message);
        }
    }
};

setInterval(fetchOrders, 24 * 60 * 60 * 1000);

module.exports = {fetchOrders};
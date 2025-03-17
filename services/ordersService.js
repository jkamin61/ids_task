const axios = require('axios');
const pool = require('../db/ordersPg.js');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const fetchOrders = async (fromDate = null) => {
    let resultsPage = 0;
    const resultsLimit = 100;
    let hasMoreData = true;

    if (!fromDate) {
        const { rows } = await pool.query('SELECT MAX(order_date) as max_date FROM orders');
        if (rows[0].max_date) {
            fromDate = rows[0].max_date.toISOString().split('T')[0];
        }
    }

    try {
        while (hasMoreData) {
            const response = await axios.post(
                API_URL,
                {
                    params: {
                        resultsPage: resultsPage,
                        resultsLimit: resultsLimit,
                        ...(fromDate && { fromDate: fromDate })
                    }
                },
                {
                    headers: {
                        'X-API-KEY': API_KEY,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data) throw new Error("No response from external API")

            if (response.data.Error) throw new Error(`API business error: ${JSON.stringify(response.data.Error)}`)

            if (!response.data || !response.data.Results || response.data.Results.length === 0) {
                hasMoreData = false;
                break;
            }

            const orders = response.data.Results.map(order => ({
                orderID: order.orderId,
                products: order.orderDetails.productsResults.map(product => ({
                    productID: product.productId,
                    quantity: product.productQuantity
                })),
                orderWorth: order.orderDetails.payments.orderBaseCurrency.orderProductsCost || 0,
                orderDate: order.orderDetails.orderAddDate || new Date().toISOString()
            }));

            await saveOrdersToDB(orders);

            if (response.data.Results.length < resultsLimit) {
                hasMoreData = false;
            } else {
                resultsPage++;
            }
        }
    } catch (error) {
        if (error.response) {
            console.error(`HTTP Error [${error.response.status}]: ${error.response.statusText}`);
        } else if (error.request) {
            console.error('No response received from API:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
};

const saveOrdersToDB = async (orders) => {
    if (orders.length === 0) {
        return;
    }
    for (let order of orders) {
        try {
            await pool.query(
                `INSERT INTO orders (order_id, products, order_worth, order_date)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (order_id) DO NOTHING;`,
                [
                    order.orderID,
                    JSON.stringify(order.products),
                    order.orderWorth,
                    order.orderDate
                ]
            );
        } catch (error) {
            console.error(`DB Insert error:`, error.message);
        }
    }
};

setInterval(fetchOrders, 24 * 60 * 60 * 1000);

module.exports = {fetchOrders};

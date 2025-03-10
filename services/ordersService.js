const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

let ordersCache = [];

const fetchOrders = async () => {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                'X-API-KEY': API_KEY,
                'Accept': 'application/json'
            },
            params: {
                page: 1
            }
        });

        if (!response.data || !response.data.Results) {
            throw new Error("No data in response");
        }

        const orders = response.data.Results.map(order => ({
            orderID: order.orderId,
            products: order.orderDetails.productsResults.map(product => ({
                productID: product.productId,
                quantity: product.productQuantity
            })),
            orderWorth: order.orderDetails.payments.orderBaseCurrency.orderProductsCost || 0
        }));
        ordersCache = orders;
        return orders;
    } catch (error) {
        console.error('Error while fetching orders:', error.message);
    }
};

fetchOrders();
setInterval(fetchOrders, 24 * 60 * 60 * 1000);

module.exports = { fetchOrders };

const express = require('express');
const axios = require('axios');
const basicAuth = require('express-basic-auth');
const { parse } = require('json2csv');

const app = express();
const port = 3000;

const API_KEY = 'YXBwbGljYXRpb24xNjpYeHI1K0MrNVRaOXBaY2lEcnpiQzBETUZROUxrRzFFYXZuMkx2L0RHRXZRdXNkcmF5R0Y3ZnhDMW1nejlmVmZP';
const API_URL = 'https://zooart6.iai-shop.com/api/admin/v5/orders/orders';

let orders = [];

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

        console.log("Orders:", JSON.stringify(orders, null, 2));

        return orders;

    } catch (error) {
        console.error('Error while fetching orders:', error.message);
    }
};

fetchOrders();
setInterval(fetchOrders, 24 * 60 * 60 * 1000);

app.use(basicAuth({
    users: { 'admin': 'admin123' },
    challenge: true,
}));

app.get('/orders/csv', (req, res) => {
    let filteredOrders = orders;
    const { minWorth, maxWorth } = req.query;
    if (minWorth) filteredOrders = filteredOrders.filter(o => o.orderWorth >= parseFloat(minWorth));
    if (maxWorth) filteredOrders = filteredOrders.filter(o => o.orderWorth <= parseFloat(maxWorth));

    const csv = parse(filteredOrders, { fields: ['orderID', 'orderWorth', 'products'] });
    res.header('Content-Type', 'text/csv');
    res.attachment('orders.csv');
    res.send(csv);
});

app.get('/orders/:orderId', async (req, res) => {
    try {
        // Jeśli `orders` jest puste, wymuś pobranie danych
        if (orders.length === 0) {
            console.log("Brak zamówień - pobieram nowe dane...");
            await fetchOrders();  // Czekamy na pobranie zamówień
        }

        // Logujemy dostępne ID zamówień do debugowania
        console.log("Dostępne zamówienia:", orders.map(o => o.orderID));
        console.log("Szukane orderID:", req.params.orderId);

        // Wyszukujemy zamówienie
        const order = orders.find(o => o.orderID.toString().trim() === req.params.orderId.trim());

        // Jeśli zamówienia nie znaleziono, zwracamy błąd 404
        if (!order) {
            console.log("Nie znaleziono zamówienia:", req.params.orderId);
            return res.status(404).json({ error: 'Order not found' });
        }

        // Zwracamy znalezione zamówienie
        res.json(order);
    } catch (error) {
        console.error('Błąd obsługi zamówienia:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

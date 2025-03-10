require('dotenv').config();
const express = require('express');
const basicAuth = require('express-basic-auth');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3300;

app.use(basicAuth({
    users: { [process.env.AUTH_LOGIN]: process.env.AUTH_PASS },
    challenge: true,
    unauthorizedResponse: () => ({
        success: false,
        status: 401,
        message: "Unauthorized: Invalid credentials"
    })
}));

app.use('/orders', ordersRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

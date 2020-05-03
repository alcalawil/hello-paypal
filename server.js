const paypal = require("@paypal/checkout-server-sdk");
const express = require("express");
const path = require("path");
const app = express();
require("dotenv").config();

const SUCCESS_URL = process.env.SUCCESS_URL;
const ERROR_URL = process.env.ERROR_URL;
const SERVER_PORT = Number(process.env.SERVER_PORT || 5000);
const CLIENT_ID = process.env.CLIENT_ID;
const SECRET = process.env.SECRET;

let environment = new paypal.core.SandboxEnvironment(CLIENT_ID, SECRET);
let client = new paypal.core.PayPalHttpClient(environment);

// set public directory to serve static html files
app.use("/", express.static(path.join(__dirname, "public")));
app.use(express.json());
// redirect to store when user hits http://localhost:3000
app.get("/", (req, res) => {
  res.redirect("/index.html");
});

// start payment process
app.post("/buy", async (req, res) => {
  console.log("Buy called");
  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "5.00",
        },
      },
    ],
  });

  let order;
  try {
    order = await client.execute(request);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
  console.log("Order created");
  console.log(order);
  res.status(200).json({
    orderID: order.result.id,
  });
});

// success page
app.post("/capture", async (req, res) => {
  console.log(req.body);
  // 2a. Get the order ID from the request body
  const orderID = req.body.orderID;

  // 3. Call PayPal to capture the order
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client.execute(request);

    // 4. Save the capture ID to your database. Implement logic to save capture to your database for future reference.
    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    // await database.saveCaptureID(captureID);
    console.log("Details", capture.result);
    console.log("CAPTUREDDDDD", captureID);
    res.json({
      payerName: capture.result.payer.name.given_name,
    });
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

// error page
app.get("/err", (req, res) => {
  console.log(req.query);
  res.redirect("/error.html");
});

// app listens on 3000 port
app.listen(SERVER_PORT, () => {
  console.log(`app listening on ${SERVER_PORT} `);
});

// helper functions
const createPay = (payment) => {
  return new Promise((resolve, reject) => {
    paypal.payment.create(payment, (err, payment) => {
      if (err) {
        return reject(err);
      }
      resolve(payment);
    });
  });
};

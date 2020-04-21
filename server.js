const paypal = require("paypal-rest-sdk");
const express = require("express");
const path = require("path");
const app = express();
require("dotenv").config();

const SUCCESS_URL = process.env.SUCCESS_URL;
const ERROR_URL = process.env.ERROR_URL;
const SERVER_PORT = Number(process.env.SERVER_PORT || 5000);
const CLIENT_ID = process.env.CLIENT_ID;
const SECRET = process.env.SECRET;

// configure paypal with the credentials you got when you created your paypal app
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: CLIENT_ID, // please provide your client id here
  client_secret: SECRET, // provide your client secret here
});

// set public directory to serve static html files
app.use("/", express.static(path.join(__dirname, "public")));

// redirect to store when user hits http://localhost:3000
app.get("/", (req, res) => {
  res.redirect("/index.html");
});

// start payment process
app.get("/buy", (req, res) => {
  // create payment object
  const payment = {
    intent: "authorize",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: SUCCESS_URL,
      cancel_url: ERROR_URL,
    },
    transactions: [
      {
        amount: {
          total: 39.0,
          currency: "USD",
        },
        description: " a book on mean stack ",
      },
    ],
  };

  // call the create Pay method
  createPay(payment)
    .then((transaction) => {
      var id = transaction.id;
      var links = transaction.links;
      var counter = links.length;
      while (counter--) {
        if (links[counter].method == "REDIRECT") {
          // redirect to paypal where user approves the transaction
          return res.redirect(links[counter].href);
        }
      }
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/error.html");
    });
});

// success page
app.get("/success", (req, res) => {
  console.log(req.query);
  res.redirect("/success.html");
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

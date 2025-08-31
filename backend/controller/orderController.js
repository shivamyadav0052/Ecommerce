// controllers/orderController.js
import Order from "../model/orderModel.js";
import User from "../model/userModel.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const currency = "INR";

// Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// -----------------------------------------------------
// COD ORDER
// -----------------------------------------------------
export const placeOrder = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.userId;

    const orderData = {
      items,
      amount,
      userId,
      address,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new Order(orderData);
    await newOrder.save();

    await User.findByIdAndUpdate(userId, { cartData: {} });

    return res.status(201).json({ message: "Order Placed (COD)" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Order Place error" });
  }
};

// -----------------------------------------------------
// CREATE RAZORPAY ORDER
// -----------------------------------------------------
export const placeOrderRazorpay = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.userId;

    const orderData = {
      items,
      amount,
      userId,
      address,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new Order(orderData);
    await newOrder.save();

    const options = {
      amount: amount * 100, // paise
      currency,
      receipt: newOrder._id.toString(),
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID, // frontend needs only key_id
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// -----------------------------------------------------
// VERIFY RAZORPAY PAYMENT
// -----------------------------------------------------
export const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // signature verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Get order receipt ID (mongo _id)
      const razorpayOrder = await razorpayInstance.orders.fetch(razorpay_order_id);
      const mongoOrderId = razorpayOrder.receipt;

      await Order.findByIdAndUpdate(mongoOrderId, { payment: true });
      await User.findByIdAndUpdate(req.userId, { cartData: {} });

      return res.status(200).json({ success: true, message: "Payment Verified" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// -----------------------------------------------------
// USER ORDERS
// -----------------------------------------------------
export const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({ userId });
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "userOrders error" });
  }
};

// -----------------------------------------------------
// ADMIN - ALL ORDERS
// -----------------------------------------------------
export const allOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "adminAllOrders error" });
  }
};

// -----------------------------------------------------
// ADMIN - UPDATE STATUS
// -----------------------------------------------------
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await Order.findByIdAndUpdate(orderId, { status });
    return res.status(201).json({ message: "Status Updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

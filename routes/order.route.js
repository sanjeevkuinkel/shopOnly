import {
  addToCArt,
  checkout,
  getCart,
  removeCart,
} from "../services/order.service";

const router = express.Router();
router.post("/cart/add", addToCArt);
router.post("/cart/remove", removeCart);
router.get("/cart/:userId", getCart);
router.post("/checkout", checkout);

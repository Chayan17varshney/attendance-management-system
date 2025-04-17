import empress from "express";
const reportRoute = empress.Router();
import axios from "axios";
import jwtAuthAdmin from "../../middleware/jwt.admin.middleware.js";

reportRoute.all("/*", jwtAuthAdmin, async (req, res) => {
  try {
    const targetUrl = "http://localhost:3000" + req.path;
    //  + req.path.replace("/proxy", "");
    // console.log(targetUrl);

    const options = {
      method: req.method,
      url: targetUrl,
      params: req.query, // Forward query parameters
      data: req.body, // Forward body data
      headers: {
        ...req.headers, // Forward headers (optional)
        host: undefined, // Remove host to avoid conflicts
      },
    };

    const response = await axios(options);
    // console.log(response);

    res.status(response.status).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});
export default reportRoute;

import { RateLimiterMemory } from "rate-limiter-flexible";
const opts = {
  points: 5, // 5 points
  duration: 1, // Per second
};
const rateLimiter = new RateLimiterMemory(opts);

const rateLimiterMiddleware = (req, res, next) => {
  // console.log(req.headers["x-forwarded-for"]);
  // console.log(req.headers);

  const userId = req.userId;
  // console.log(req.ip);
  // Consume 1 point for each action
  rateLimiter
    .consume(req.headers["x-forwarded-for"]) // or req.ip
    .then((rateLimiterRes) => {
      //   console.log(rateLimiterRes);
      next();
    })
    .catch((rejRes) => {
      // console.log(rejRes);
      //   console.log("hello");
      res.status(429).send({ message: "Too Many Requests" });
    });
};

export default rateLimiterMiddleware;

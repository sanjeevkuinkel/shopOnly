import swaggerJsdoc from "swagger-jsdoc";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My RESTful API",
      version: "1.0.0",
      description: "API documentation for my Node.js RESTful API",
    },
    servers: [
      {
        url: "http://localhost:3000", // Update with your server URL
        description: "Local server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to your API routes
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec };

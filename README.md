# eCommerce Cart

## Description

A Node.js RESTful API for an eCommerce cart system. This project provides endpoints to manage products, users, and shopping cart functionalities.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Steps

1. Clone the repository:git clone https://github.com/sanjeevkuinkel/ecommerce-cart.git

2. Navigate to the project directory:cd ecommerce-cart
3. Install dependencies:npm install

## Usage

To start the server, run:node server.js
The API will be available at `http://localhost:3000` (or the port specified in your `server.js`).

## API Endpoints

### Products

- **GET** `/api/products` - Retrieve all products.
- **POST** `/api/products` - Add a new product.
- **GET** `/api/products/:id` - Retrieve a product by ID.
- **PUT** `/api/products/:id` - Update a product by ID.
- **DELETE** `/api/products/:id` - Delete a product by ID.

### Users

- **GET** `/api/users` - Retrieve all users.
- **POST** `/api/users` - Register a new user.
- **GET** `/api/users/:id` - Retrieve user details by ID.

### Cart

- **GET** `/api/cart/:userId` - Retrieve the shopping cart for a specific user.
- **POST** `/api/cart/:userId` - Add an item to the user's cart.
- **DELETE** `/api/cart/:userId/:itemId` - Remove an item from the user's cart.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeatureName`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeatureName`).
5. Open a pull request.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

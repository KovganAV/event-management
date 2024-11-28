# Event Management Application

This Event Management Application is a microservices-based system designed to streamline user authentication and user data search. The project follows a modular approach, with each microservice handling a specific function, ensuring scalability and maintainability.

---

## Microservices

### 1. User Authentication Service (`user-auth-service`)
Handles user authentication and authorization, including login, registration, and token generation.

- **Features**:
  - User registration and login.
  - Password hashing with `bcryptjs`.
  - JWT-based authentication.
  - API documentation via Swagger.

- **Default Port**: `3000`

---

### 2. User Search Service (`user-search-service`)
Enables searching for user data based on user attributes like names.

- **Features**:
  - Fetch all users.
  - Search users by name.
  - Swagger API documentation.

- **Default Port**: `3001`

---

## Prerequisites

Before running the application, ensure the following tools are installed:

- **Node.js** (version 18+)
- **npm** (Node Package Manager)

---

## Installation

Clone the repository:
```bash
git clone <repository-url>
cd event-management

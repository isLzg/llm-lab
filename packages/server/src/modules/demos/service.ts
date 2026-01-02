import { DemosModel } from "./model";

// Service handle business logic, decoupled from Elysia controller
export const DemosService = {
  // Get all users
  getUsers(): typeof DemosModel.users.static {
    return [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
    ];
  },

  // Get user by ID
  getUserById(id: string): typeof DemosModel.user.static {
    const userId = Number(id);
    return {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
    };
  },

  // Create user
  createUser(
    body: typeof DemosModel.createUserBody.static
  ): typeof DemosModel.user.static {
    return {
      id: Date.now(),
      ...body,
    };
  },

  // Update user
  updateUser(
    id: string,
    body: typeof DemosModel.updateUserBody.static
  ): typeof DemosModel.user.static {
    return {
      id: Number(id),
      ...body,
    };
  },
};

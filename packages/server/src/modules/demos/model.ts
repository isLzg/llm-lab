import { t } from "elysia";

// Model define the data structure and validation for the request and response
export const DemosModel = {
  // GET /demos/:id params
  getUserByIdParams: t.Object({
    id: t.String(),
  }),

  // POST /demos body
  createUserBody: t.Object({
    name: t.String(),
    email: t.String(),
  }),

  // PUT /demos/:id params
  updateUserParams: t.Object({
    id: t.String(),
  }),

  // PUT /demos/:id body
  updateUserBody: t.Object({
    name: t.String(),
    email: t.String(),
  }),

  // Response types
  user: t.Object({
    id: t.Number(),
    name: t.String(),
    email: t.String(),
  }),

  get users() {
    return t.Array(this.user);
  },
};

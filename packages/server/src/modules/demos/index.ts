import { Elysia } from "elysia";
import { DemosService } from "./service";
import { DemosModel } from "./model";

// Controller handle HTTP related eg. routing, request validation
export const demos = new Elysia({ prefix: "/demos" })
  .get("/", () => {
    return DemosService.getUsers();
  })
  .get(
    "/:id",
    ({ params }) => {
      return DemosService.getUserById(params.id);
    },
    {
      params: DemosModel.getUserByIdParams,
    }
  )
  .post(
    "/",
    ({ body }) => {
      return DemosService.createUser(body);
    },
    {
      body: DemosModel.createUserBody,
    }
  )
  .put(
    "/:id",
    ({ params, body }) => {
      return DemosService.updateUser(params.id, body);
    },
    {
      params: DemosModel.updateUserParams,
      body: DemosModel.updateUserBody,
    }
  );


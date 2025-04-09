import axios from "axios";
import { server } from "./server";

export const axios_instance = axios.create({
  baseURL: server(),
});

import { axios_instance } from "../../utils/axios_instance";

interface type {
  id: number;
  name: string;
}

export default async function readDoTypes(name: string = "") {
  try {
    return await axios_instance.post<type[]>("/dotypes/read", { name });
  } catch (error) {
    throw new Error("Ошибка при получении типов документов");
  }
}

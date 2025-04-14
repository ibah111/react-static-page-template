import { axios_instance } from "../../utils/axios_instance";

interface UploadInput {
  do_type_name: string;
  r_portfolio_id: number;
  include_type: string;
  upload: boolean;
}

export function upload(data: UploadInput) {
  try {
    return axios_instance.post("/migrate/upload", data);
  } catch (error) {
    console.log(error);
  }
}

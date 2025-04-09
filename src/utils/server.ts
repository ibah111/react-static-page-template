import { NODE } from "../constants/node";

const octet = NODE === "prod" ? "apps.usb.ru" : "127.0.0.1";
const server_url = `http://${octet}:4070/`;

export const server = (): string => {
  const full_url = `${server_url}`;
  console.log(full_url);
  return full_url;
};

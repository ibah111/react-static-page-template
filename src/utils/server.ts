import { NODE } from "../constants/node";

const server_url = "http://localhost:"
  .replace("http", NODE === "prod" ? "http" : "https")
  .replace("localhost", NODE === "prod" ? "apps.usb.ru" : "localhost");
const server_port = "4070";

export const server = (): string => {
  const full_url = `${server_url}${server_port}`;
  console.log(full_url);
  return full_url;
};

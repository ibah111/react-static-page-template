const octet = "apps.usb.ru";
const server_url = `https://${octet}:4070/`;

export const server = (): string => {
  const full_url = `${server_url}`;
  console.log(full_url);
  return full_url;
};

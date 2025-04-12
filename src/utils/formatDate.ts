import typeReturn from "./typeReturn";

export default function formatDate(value: any) {
  if (typeReturn(value) === "date") {
    return new Date(value).toLocaleString();
  }
  return value;
}

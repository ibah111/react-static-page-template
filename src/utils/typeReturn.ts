import { GridColType } from "@mui/x-data-grid";

export default function typeReturn(value: string): GridColType | undefined {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
  const isIsoStr = isoRegex.test(value);
  if (isIsoStr) {
    return "date";
  } else {
    const type = typeof value;
    return type as GridColType;
  }
}

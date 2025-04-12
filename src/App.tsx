import { useState } from "react";
import React from "react";
import getPortfolio, { PortfolioResponse } from "./api/path/getPortfolio";
import { Container, Typography, TextField, Box } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface Column {
  id: keyof PortfolioResponse;
  label: string;
  minWidth: number;
}

function App() {
  const [count, setCount] = useState(0);
  const [portfolio_name, setPortfolioName] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioResponse[]>([]);

  const createColumns = (
    data: PortfolioResponse[]
  ): GridColDef<PortfolioResponse>[] => {
    if (data.length === 0) return [];

    // Получаем все уникальные ключи из первого объекта
    const keys = Object.keys(data[0]) as Array<keyof PortfolioResponse>;

    // Создаем столбцы на основе ключей
    return keys.map((key) => ({
      field: key,
      headerName: String(key)
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      minWidth: 170,
      flex: 1,
    }));
  };

  const formatCellValue = (value: any): string => {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  React.useEffect(() => {
    getPortfolio<PortfolioResponse>({
      portfolio_name,
    }).then((res) => {
      if (res) {
        setPortfolio(res);
      }
      console.log(portfolio);
    });
  }, []);

  const columns = createColumns(portfolio);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Портфолио
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Название портфолио"
            value={portfolio_name}
            onChange={(e) => setPortfolioName(e.target.value)}
          />
          <Box sx={{ height: 600, width: "100%" }}>
            <DataGrid
              columns={columns}
              rows={portfolio}
              sx={{
                "& .MuiDataGrid-cell": {
                  borderColor: "rgba(224, 224, 224, 1)",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default App;

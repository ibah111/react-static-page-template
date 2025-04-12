import { useState, useEffect, useCallback } from "react";
import React from "react";
import getPortfolio, { PortfolioResponse } from "./api/path/getPortfolio";
import { Container, Typography, TextField, Box } from "@mui/material";
import { DataGrid, GridColDef, GridColType } from "@mui/x-data-grid";

function App() {
  const [portfolio, setPortfolio] = useState<PortfolioResponse[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const getColumnType = (value: any): GridColType | undefined => {
    if (value === null || value === undefined) return undefined;

    // Проверяем, является ли значение датой
    if (value instanceof Date) return "date";

    // Проверяем строку на формат даты (YYYY-MM-DD или DD.MM.YYYY)
    if (typeof value === "string") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\.\d{2}\.\d{4}$/;
      if (dateRegex.test(value)) return "date";
    }

    return "string";
  };

  const calculateColumnWidth = (
    data: PortfolioResponse[],
    key: keyof PortfolioResponse
  ): number => {
    // Минимальная ширина для заголовка
    const headerWidth =
      String(key)
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ").length * 8; // Примерно 8px на символ

    // Находим максимальную длину значения в колонке
    const maxContentWidth = Math.max(
      ...data.map((item) => {
        const value = item[key];
        if (value === null || value === undefined) return 0;
        return String(value).length * 8; // Примерно 8px на символ
      })
    );

    // Добавляем отступы (примерно 32px)
    const padding = 32;

    // Возвращаем максимальную ширину из заголовка и содержимого + отступы
    return Math.max(headerWidth, maxContentWidth) + padding;
  };

  const createColumns = (
    data: PortfolioResponse[]
  ): GridColDef<PortfolioResponse>[] => {
    if (data.length === 0) return [];

    // Получаем все уникальные ключи из первого объекта
    const keys = Object.keys(data[0]) as Array<keyof PortfolioResponse>;

    // Создаем столбцы на основе ключей
    return keys.map((key) => {
      const firstValue = data[0][key];
      const type = getColumnType(firstValue);
      const width = calculateColumnWidth(data, key);

      return {
        field: key,
        headerName: String(key)
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        minWidth: Math.min(width, 400), // Максимальная ширина 400px
        width: width,
        flex: 1,
        ...(type && { type }),
      };
    });
  };

  const fetchPortfolio = useCallback(async (name: string) => {
    const res = await getPortfolio<PortfolioResponse>({
      portfolio_name: name,
    });
    if (res) {
      setPortfolio(res);
    }
  }, []);

  // Эффект для debounce поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPortfolio(searchValue);
    }, 500); // Задержка 500мс

    return () => clearTimeout(timer);
  }, [searchValue, fetchPortfolio]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

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
            value={searchValue}
            onChange={handleSearchChange}
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

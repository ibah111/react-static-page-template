import {
  Typography,
  Dialog,
  DialogTitle,
  DialogProps,
  DialogContent,
  Button,
  DialogActions,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  TextField,
  Divider,
  Checkbox,
  Tooltip,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  FormControlLabel,
} from "@mui/material";
import React from "react";
import readDoTypes from "../../../api/dotypes/read";
import { upload as uploadApi } from "../../../api/migrate/upload";

interface LawType {
  id: number;
  name: string;
}

interface uploadFormProps extends DialogProps {
  portfolio_id: number;
  open: boolean;
  onClose: () => void;
}
const law_types: LawType[] = [
  {
    id: 1,
    name: "Судебная работа",
  },
  {
    id: 2,
    name: "Исполнительное производство",
  },
];
export default function UploadForm({
  open,
  onClose,
  portfolio_id,
}: uploadFormProps) {
  const [types, setTypes] = React.useState<string[]>([]);
  const [type, setType] = React.useState<string | null>(null);
  const [upload, setUpload] = React.useState<boolean>(false);
  const [select, setSelect] = React.useState<string>("1");
  const handleClick = async () => {
    await uploadApi({
      do_type_name: type || "",
      r_portfolio_id: portfolio_id,
      include_type: Number(select),
      upload: upload,
    });
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelect(value);
    console.log("value", typeof value, value);
  };

  React.useEffect(() => {
    readDoTypes().then((res) => {
      setTypes(res.data.map((type) => type.name));
    });
  }, []);
  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>Загрузка портфолио {portfolio_id}</DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={4} md={4}>
              <Autocomplete
                value={type}
                onChange={(_, newValue) => setType(newValue)}
                options={types}
                fullWidth
                renderInput={(params) => (
                  <TextField {...params} label="Тип" variant="outlined" />
                )}
              />
            </Grid>
            <Grid item xs={4} md={4}>
              <FormControl fullWidth>
                <InputLabel>Тип</InputLabel>
                <Select
                  fullWidth
                  variant="outlined"
                  label="Тип"
                  value={select}
                  onChange={handleSelectChange}
                >
                  {law_types.map((law_type) => (
                    <MenuItem key={law_type.id} value={law_type.id}>
                      {law_type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2} md={4}>
              <Tooltip title="Сделать операцию с загрузкой документов">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={upload}
                      onChange={(event) => setUpload(event.target.checked)}
                    />
                  }
                  label="Загрузить"
                />
              </Tooltip>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Grid container spacing={2}>
            <Grid item xs={10} md={10}>
              <Typography variant="body1">
                Values: {upload} {type || ""}{" "}
              </Typography>
            </Grid>
            <Grid
              item
              xs={2}
              md={2}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button onClick={handleClick} variant="contained">
                Загрузить
              </Button>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </>
  );
}

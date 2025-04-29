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

export default function UploadForm({
  open,
  onClose,
  portfolio_id,
}: uploadFormProps) {
  const [types, setTypes] = React.useState<string[]>([]);
  const [type, setType] = React.useState<string>("");
  const [upload, setUpload] = React.useState<boolean>(false);
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
  const [selected_law_type, setSelectedLawType] = React.useState<LawType>(
    law_types[0]
  );

  const handleClick = async () => {
    await uploadApi({
      do_type_name: type,
      r_portfolio_id: portfolio_id,
      include_type: "all",
      upload: upload,
    });
  };

  React.useEffect(() => {
    readDoTypes().then((res) => {
      setTypes(res.data.map((type) => type.name));
    });
  }, []);
  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>
          <Typography variant="h6">
            Загрузка портфолио {portfolio_id}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2} xs={12} md={12}>
            <Grid item xs={4} md={4}>
              <Autocomplete
                value={type}
                onChange={(_, newValue) => setType(newValue || "")}
                options={types}
                fullWidth
                renderInput={(params) => (
                  <TextField {...params} label="Тип" variant="outlined" />
                )}
              />
            </Grid>
            <Grid item xs={4} md={4}>
              <Tooltip title="Сделать операцию с загрузкой документов">
                <Checkbox
                  value={upload}
                  onChange={(_, newValue) => setUpload(newValue)}
                />
              </Tooltip>
            </Grid>
            <Grid item xs={4} md={4}>
              <FormControl fullWidth>
                <InputLabel>Тип</InputLabel>
                <Select
                  fullWidth
                  variant="outlined"
                  label="Тип"
                  value={selected_law_type.name}
                  onChange={(_, newValue) => {
                    // @ts-ignore
                    const value = newValue.props;
                    console.log("value", value);
                    setSelectedLawType(value.value);
                  }}
                >
                  {law_types.map((law_type) => (
                    <MenuItem value={law_type.id}>{law_type.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClick}>Загрузить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

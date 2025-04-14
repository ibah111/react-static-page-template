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
} from "@mui/material";
import React from "react";
import readDoTypes from "../../../api/dotypes/read";
import { PortfolioResponse } from "../../../api/path/getPortfolio";
import upload from "../../../api/migrate/upload";

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
  const handleClick = () => {
    upload({
      do_type_name: type,
      r_portfolio_id: portfolio_id,
      include_type: "all",
      upload: true,
    });
  };

  React.useEffect(() => {
    readDoTypes().then((res) => {
      setTypes(res.data.map((type) => type.name));
    });
  }, []);
  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>
          <Typography variant="h6">
            Загрузка портфолио {portfolio_id}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                fullWidth
              >
                {types.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClick}>Загрузить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

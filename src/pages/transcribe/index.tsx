import { Typography, Paper } from "@mui/material";

export default function TranscribePage() {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Транскрибация видео в текст
      </Typography>
      <Typography variant="body1" paragraph>
        Ператащите файл или выберите файл, далее нажмите кнопку "Транскрибация".
      </Typography>
    </Paper>
  );
}

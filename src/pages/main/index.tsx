import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { Home, TextFields, AudioFile, SmartToy } from "@mui/icons-material";

export default function Main() {
  const features = [
    {
      icon: <Home color="primary" sx={{ fontSize: 40 }} />,
      title: "Главная страница",
      description: "Добро пожаловать в приложение с навигацией"
    },
    {
      icon: <TextFields color="secondary" sx={{ fontSize: 40 }} />,
      title: "Транскрибация + AI",
      description: "Полная транскрибация с AI резюме"
    },
    {
      icon: <AudioFile color="success" sx={{ fontSize: 40 }} />,
      title: "Только транскрибация",
      description: "Простая транскрибация без AI обработки"
    },
    {
      icon: <SmartToy color="info" sx={{ fontSize: 40 }} />,
      title: "Только AI",
      description: "AI обработка готового текста"
    }
  ];

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        Добро пожаловать!
      </Typography>

      <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
        Это главная страница вашего приложения для работы с транскрибацией и AI. Используйте левую панель навигации для перехода между страницами.
      </Typography>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} lg={3} key={index}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

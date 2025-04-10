import { useState } from "react";
import "./App.css";
import React from "react";
import getPortfolio, { PortfolioResponse } from "./api/path/getPortfolio";

function App() {
  const [count, setCount] = useState(0);
  const [portfolio_name, setPortfolioName] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioResponse[]>([]);
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
  return <></>;
}

export default App;

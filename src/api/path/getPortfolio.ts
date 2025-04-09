import { axios_instance } from "../../utils/axios_instance";

interface PortfolioInput {
  portfolio_name: string;
}

export interface PortfolioResponse {
  id: number;
  parent_id: number;
  name: string;
  sign_date: Date | null;
  end_date: Date | null;
  success_coeff: string | null;
  group_index: number | null;
  r_formula_id: number | null;
  dsc: string | null;
  contract_info: string | null;
  id$: number | null;
  r_package_id: number | null;
  status: number;
  code: number;
  typ: number;
  debt_typ: number;
  code2: number;
  r_calc_rule_id: number | null;
  real_load_dt: Date | null;
  r_com_rule_id: number | null;
  prior: number | null;
  provided_legal: number | null;
  sector: number | null;
  grade: number | null;
  contract_typ: number | null;
  aggressive_plan: number | null;
  objective_plan: number | null;
  purchase_price: number | null;
  forecast: number | null;
  auto_fix_period: number | null;
  auto_user_id: number | null;
  sale_price: number | null;
}

export default async function getPortfolio<PortfolioResponse>(
  data: PortfolioInput
) {
  try {
    const request = await axios_instance.post<PortfolioResponse[]>(
      "/path/portfolio",
      data
    );
    return request.data;
  } catch (error) {
    console.log(error);
  }
}

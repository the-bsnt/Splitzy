import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";
const API_URL = `${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`;

//SIGN UP
export const createUser = async (data) => {
  const response = await axios.post(API_URL, data);
  return { data: response.data, status: response.status };
};

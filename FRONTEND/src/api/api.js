import axios from "axios";

  const Token = localStorage.getItem("Token");
  const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
  Authorization: `Bearer ${Token}`
  }});

export default api;

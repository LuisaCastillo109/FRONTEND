import axios from "axios";


  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const Token = localStorage.getItem("Token");
  const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
  Authorization: `Bearer ${Token}`
  }});

export default api;

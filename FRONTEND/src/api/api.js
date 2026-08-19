import axios from "axios";

const Token = localStorage.getItem("Token");

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

if (Token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${Token}`;
}

export default api;

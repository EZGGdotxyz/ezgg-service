import axios from "axios";

const apiClient = axios.create({
  // baseURL: "https://apiv2.catfoodworks.com",
  // baseURL: "https://api.catfoodworks.com",
  baseURL: "http://localhost:3001",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加Privy认证
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("privy:token");
  if (token) {
    const t = JSON.parse(token);
    config.headers.Authorization = `Bearer ${t}`;
  }
  const idToken = localStorage.getItem("privy:id_token");
  if (idToken) {
    const t = JSON.parse(idToken);
    config.headers["privy-id-token"] = `${t}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;

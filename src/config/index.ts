import dotenv from "dotenv";
dotenv.config();

const PORT: number = parseInt(process.env.PORT || "5000", 10);
const ACCESS_TOKEN_SECRET: number = parseInt(process.env.ACCESS_TOKEN_SECRET);

export { PORT, ACCESS_TOKEN_SECRET };

import { serve } from "bun";
import pino from "pino";



export const logger = pino({
    level: process.env.NODE_ENV === "production"
      ? "info"
      : "debug",
   });
   
   
serve({
  port: 3000,
  hostname: "0.0.0.0",
  fetch(req) {
    return new Response("Hello World");
  },
});
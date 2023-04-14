import express from "express";
import morgan from "morgan";
import cors from "cors";
import { CatchAll, Error, HealthCheck } from "./middleware";
import { UseDatabase } from "../database/database";
import { webRouter } from "./router";

(async () => {
  const { DBConnect, DBDisconnect } = UseDatabase();
  try {
    await DBConnect();
    const webServer = express();

    webServer.use([
      express.json(),
      express.urlencoded({ extended: false }),
      morgan("dev"),
      cors(),
    ]);

    webServer.get("/health", HealthCheck);

    webServer.use("/api/v1", webRouter);

    webServer.use("*", CatchAll);

    webServer.use(Error);

    webServer.listen(8080, () =>
      console.log(`Webserver started listening on http://localhost:8080/api/v1`)
    );
  } catch (error) {
    await DBDisconnect();
    console.log(error);
    process.exit(0);
  }
})();

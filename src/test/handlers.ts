import { http, HttpResponse } from "msw";
import guardianSearch from "./fixtures/guardian/search.json";
import newsApiEverything from "./fixtures/newsapi/everything.json";
import newsApiTopHeadlines from "./fixtures/newsapi/top-headlines.json";
import nytArticleSearch from "./fixtures/nyt/articlesearch.json";

// Default handlers for every proxied route, shared by tests and dev mock mode.
// Tests override them with `server.use(...)` for error cases.
export const handlers = [
  http.get("/api/guardian/search", () => HttpResponse.json(guardianSearch)),
  http.get("/api/nyt/articlesearch.json", () =>
    HttpResponse.json(nytArticleSearch),
  ),
  http.get("/api/newsapi/everything", () =>
    HttpResponse.json(newsApiEverything),
  ),
  http.get("/api/newsapi/top-headlines", () =>
    HttpResponse.json(newsApiTopHeadlines),
  ),
];

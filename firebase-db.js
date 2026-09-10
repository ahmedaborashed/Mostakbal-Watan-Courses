// firebase-db.js - Backwards compatibility bridge delegating to src/core/firebase.js
import app, { db } from "./src/core/firebase.js";

export { db, app };
export default app;
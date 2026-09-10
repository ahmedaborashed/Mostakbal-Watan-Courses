// firebase.js - Backwards compatibility bridge delegating to src/core/firebase.js
import app, { auth } from "./src/core/firebase.js";

export { auth, app };
export default app;
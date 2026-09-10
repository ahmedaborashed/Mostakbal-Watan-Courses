// src/app/app.js
import { bootstrapApp } from "./bootstrap.js";
import { Router } from "./router.js";
import { appStore } from "../core/store.js";
import { AuthController } from "../features/auth/auth.controller.js";

// Execute initial theme/preferences setup
bootstrapApp();

export { bootstrapApp, Router, appStore, AuthController };

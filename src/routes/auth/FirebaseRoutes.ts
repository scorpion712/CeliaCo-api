import { Router } from "express";
import { FirebaseAuthController } from "../../controllers/FirebaseAuthController";

const router = Router();

router.post("/firebase-login", FirebaseAuthController.firebaseLogin);
router.post("/firebase-verify", FirebaseAuthController.verify);

export default router;
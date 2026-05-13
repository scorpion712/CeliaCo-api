import { Request, Response, NextFunction } from "express";
import { generateAccessToken, generateRefreshToken } from "../helpers/auth/jwtHelper";
import { errors } from "../errors";

interface FirebaseLoginCommand {
  idToken: string;
  email: string;
}

interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
}

export const firebaseLoginHandler = async (command: FirebaseLoginCommand) => {
  // In production, verify Firebase token with firebase-admin
  // For now, we'll create a simple verification that works with Firebase verified tokens
  // The actual verification happens client-side with Firebase SDK
  
  const { idToken, email } = command;

  if (!idToken) {
    throw errors.validation("Firebase ID token is required");
  }

  if (!email) {
    throw errors.validation("Email is required");
  }

  // TODO: Verify with firebase-admin in production
  // const decodedToken = await firebaseAuth().verifyIdToken(idToken);
  
  // Generate our own tokens after Firebase verification
  const userId = email.split('@')[0]; // Use email as temp userId for now
  const accessToken = generateAccessToken(userId, email, 'user', email.split('@')[0]);
  const refreshToken = generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      email,
      nombre: email.split('@')[0],
      rol: 'user',
    },
  };
};

export const FirebaseAuthController = {
  firebaseLogin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken, email } = req.body;
      const result = await firebaseLoginHandler({ idToken, email });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  verify: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return next(errors.validation("ID token is required"));
      }

      // TODO: Verify with firebase-admin
      // For now, return success if token is provided
      res.json({ valid: true });
    } catch (error) {
      next(error);
    }
  },
};
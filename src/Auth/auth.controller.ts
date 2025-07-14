import { Request, Response } from "express";
import {
  createUserService,
  getUserByEmailService,
  verifyUserService,
  userLoginService
} from "../Auth/auth.services";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../mailer/mailer";

export const createUserController = async (req: Request, res: Response) => {
  try {
    const user = req.body;

    // 1. Check if user already exists
    const existingUser = await getUserByEmailService(user.Email);
    if (existingUser) {
      res.status(409).json({ error: "Email already in use" }); // 409 = Conflict
      return;
    }

    // 2. Hash password and generate code
    const hashedPassword = bcrypt.hashSync(user.Password, 10);
    user.Password = hashedPassword;

    const verificationCode = Math.floor(3800 + Math.random() * 8888).toString();
    user.verificationCode = verificationCode;
    user.isVerified = false;

    // 3. Create user
    const result = await createUserService(user);
    if (!result) {
       res.status(400).json({ message: "User not created" });
       return;
    }

    // 4. Send verification email
    try {
      await sendEmail(
        user.Email,
        "Verify your account",
        `Hi ${user.Last_name}, your code is: ${verificationCode}`,
        `<div><h2>Hello ${user.Last_name},</h2><p>Your code is: <strong>${verificationCode}</strong></p></div>`
      );
    } catch (err) {
      console.error("Email sending failed:", err);
    }

    // 5. Success response
     res.status(201).json({ message: "User created. Verification code sent to email." });
     return;

  } catch (err: any) {
     res.status(500).json({ error: err.message });
     return;
  }
};


export const verifyUserController = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  if (!email || !code) {
  res.status(400).json({ error: "Email and code are required" });
  return;
}


  try {
    const user = await getUserByEmailService(email);
    if (!user)  res.status(404).json({ message: "User not found" });

    if (user.verificationCode === code) {
      await verifyUserService(email);
      await sendEmail(
        email,
        "Account Verified",
        `Hi ${user.Last_name}, your account is now verified.`,
        `<p>You're now verified. You may log in.</p>`
      );
       res.status(200).json({ message: "User verified successfully" });
    }

     res.status(400).json({ message: "Invalid verification code" });
  } catch (err: any) {
     res.status(500).json({ error: err.message });
  }
  return;
};

export const loginUserController = async (req: Request, res: Response) => {
  try {
    const { email, Password } = req.body;
    if (!email || !Password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const user = await userLoginService(email);
    if (!user){
    res.status(404).json({ message: "User not found" });
    return;
    }
  
    if (!user.isVerified){
       res.status(403).json({ message: "Account not verified" });
       return;
    }

    const match = bcrypt.compareSync(Password, user.Password);
    if (!match) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const payload = {
      user_id: user.user_id,
      first_name: user.First_name,
      last_name: user.Last_name,
      role: user.Role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 1 day
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!);
     res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        first_name: user.First_name,
        last_name: user.Last_name,
        email: user.Email,
        role: user.Role
      }
      
    });
    
  } catch (err: any) {
     res.status(500).json({ error: err.message });
  }
};
